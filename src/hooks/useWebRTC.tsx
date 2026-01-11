import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WebRTCConfig {
  sessionId: string;
  userId: string;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: any;
  sender_id: string;
  session_id: string;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export const useWebRTC = ({ sessionId, userId, onRemoteStream, onConnectionStateChange }: WebRTCConfig) => {
  const { toast } = useToast();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initialize media stream
  const initializeMedia = useCallback(async (video: boolean = true, audio: boolean = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: video ? { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false, 
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
        } : false 
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "خطأ في الوصول للكاميرا",
        description: "يرجى السماح بالوصول للكاميرا والميكروفون",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  // Create peer connection
  const createPeerConnection = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    
    // Add local tracks to connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });
    
    // Handle remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      setRemoteStream(remoteStream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      
      onRemoteStream?.(remoteStream);
    };
    
    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await sendSignalingMessage({
          type: 'ice-candidate',
          payload: event.candidate.toJSON(),
          sender_id: userId,
          session_id: sessionId
        });
      }
    };
    
    // Connection state changes
    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      onConnectionStateChange?.(pc.connectionState);
      
      if (pc.connectionState === 'connected') {
        setIsConnecting(false);
        toast({ title: "تم الاتصال بنجاح", description: "أنت الآن متصل بالمكالمة" });
      } else if (pc.connectionState === 'failed') {
        toast({ title: "فشل الاتصال", description: "حدث خطأ في الاتصال", variant: "destructive" });
      }
    };
    
    peerConnectionRef.current = pc;
    return pc;
  }, [userId, sessionId, onRemoteStream, onConnectionStateChange, toast]);

  // Send signaling message via Supabase Realtime
  const sendSignalingMessage = async (message: SignalingMessage) => {
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'signaling',
        payload: message
      });
    }
  };

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    if (message.sender_id === userId) return;
    
    const pc = peerConnectionRef.current;
    if (!pc) return;
    
    try {
      switch (message.type) {
        case 'offer':
          await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignalingMessage({
            type: 'answer',
            payload: answer,
            sender_id: userId,
            session_id: sessionId
          });
          // Process pending candidates
          for (const candidate of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidatesRef.current = [];
          break;
          
        case 'answer':
          await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
          // Process pending candidates
          for (const candidate of pendingCandidatesRef.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidatesRef.current = [];
          break;
          
        case 'ice-candidate':
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(message.payload));
          } else {
            pendingCandidatesRef.current.push(message.payload);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }, [userId, sessionId]);

  // Start call (caller)
  const startCall = useCallback(async () => {
    setIsConnecting(true);
    
    try {
      const stream = await initializeMedia();
      const pc = createPeerConnection(stream);
      
      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      await sendSignalingMessage({
        type: 'offer',
        payload: offer,
        sender_id: userId,
        session_id: sessionId
      });
      
    } catch (error) {
      setIsConnecting(false);
      console.error('Error starting call:', error);
    }
  }, [initializeMedia, createPeerConnection, userId, sessionId]);

  // Join call (callee)
  const joinCall = useCallback(async () => {
    setIsConnecting(true);
    
    try {
      const stream = await initializeMedia();
      createPeerConnection(stream);
    } catch (error) {
      setIsConnecting(false);
      console.error('Error joining call:', error);
    }
  }, [initializeMedia, createPeerConnection]);

  // End call
  const endCall = useCallback(() => {
    // Stop all tracks
    localStream?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    
    // Close peer connection
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    
    // Unsubscribe from channel
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    
    // Reset state
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState('new');
    setIsConnecting(false);
  }, [localStream, remoteStream]);

  // Toggle video
  const toggleVideo = useCallback((enabled: boolean) => {
    localStream?.getVideoTracks().forEach(track => {
      track.enabled = enabled;
    });
  }, [localStream]);

  // Toggle audio
  const toggleAudio = useCallback((enabled: boolean) => {
    localStream?.getAudioTracks().forEach(track => {
      track.enabled = enabled;
    });
  }, [localStream]);

  // Setup Supabase Realtime channel for signaling
  useEffect(() => {
    const channel = supabase.channel(`webrtc-${sessionId}`)
      .on('broadcast', { event: 'signaling' }, ({ payload }) => {
        handleSignalingMessage(payload as SignalingMessage);
      })
      .subscribe();
    
    channelRef.current = channel;
    
    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, handleSignalingMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return {
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    connectionState,
    isConnecting,
    startCall,
    joinCall,
    endCall,
    toggleVideo,
    toggleAudio,
    initializeMedia
  };
};
