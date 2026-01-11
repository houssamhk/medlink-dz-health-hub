import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, 
  User, Maximize2, Minimize2, RotateCcw,
  MessageSquare, Settings
} from 'lucide-react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { cn } from '@/lib/utils';

interface VideoCallProps {
  sessionId: string;
  userId: string;
  remoteName: string;
  isDoctor: boolean;
  isCaller: boolean;
  onEndCall: (notes?: string) => void;
}

const VideoCall = ({ 
  sessionId, 
  userId, 
  remoteName, 
  isDoctor,
  isCaller,
  onEndCall 
}: VideoCallProps) => {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const {
    localStream,
    remoteStream,
    connectionState,
    isConnecting,
    startCall,
    joinCall,
    endCall,
    toggleVideo,
    toggleAudio
  } = useWebRTC({
    sessionId,
    userId,
    onRemoteStream: (stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    }
  });

  // Start or join call on mount
  useEffect(() => {
    if (isCaller) {
      startCall();
    } else {
      joinCall();
    }
  }, [isCaller, startCall, joinCall]);

  // Attach local stream to video element
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (connectionState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [connectionState]);

  const handleToggleVideo = () => {
    const newState = !videoEnabled;
    setVideoEnabled(newState);
    toggleVideo(newState);
  };

  const handleToggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    toggleAudio(newState);
  };

  const handleEndCall = () => {
    endCall();
    onEndCall(isDoctor ? notes : undefined);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionBadge = () => {
    const states: Record<RTCPeerConnectionState, { label: string; className: string }> = {
      new: { label: 'جاري التحضير...', className: 'bg-yellow-500' },
      connecting: { label: 'جاري الاتصال...', className: 'bg-blue-500' },
      connected: { label: 'متصل', className: 'bg-green-500' },
      disconnected: { label: 'انقطع الاتصال', className: 'bg-orange-500' },
      failed: { label: 'فشل الاتصال', className: 'bg-red-500' },
      closed: { label: 'مغلق', className: 'bg-gray-500' }
    };
    const state = states[connectionState] || states.new;
    return <Badge className={state.className}>{state.label}</Badge>;
  };

  return (
    <div 
      ref={containerRef}
      className="h-screen flex flex-col bg-gray-900"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getConnectionBadge()}
            {connectionState === 'connected' && (
              <span className="text-white text-sm">{formatDuration(callDuration)}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 /> : <Maximize2 />}
            </Button>
          </div>
        </div>
      </div>

      {/* Video area */}
      <div className="flex-1 relative">
        {/* Remote video (main) */}
        <div className="absolute inset-0">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-32 h-32 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4 animate-pulse">
                  <User className="w-16 h-16" />
                </div>
                <h2 className="text-xl font-medium mb-2">{remoteName}</h2>
                <p className="text-gray-400">
                  {isConnecting ? 'جاري الاتصال...' : 'في انتظار الاتصال...'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (PIP) */}
        <div 
          className={cn(
            "absolute bottom-24 right-4 w-40 h-28 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20",
            "transition-all duration-300 hover:scale-105"
          )}
        >
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-cover",
                !videoEnabled && "hidden"
              )}
            />
          ) : null}
          {!videoEnabled && (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-8 h-8 text-gray-500" />
            </div>
          )}
        </div>

        {/* Doctor notes panel */}
        {isDoctor && showNotes && (
          <div className="absolute bottom-24 left-4 w-80 bg-black/80 backdrop-blur rounded-xl p-4 border border-white/10">
            <h4 className="text-white text-sm font-medium mb-2">ملاحظات الجلسة</h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="اكتب ملاحظاتك هنا..."
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 resize-none"
              rows={4}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-center gap-3">
          {/* Video toggle */}
          <Button
            variant={videoEnabled ? 'secondary' : 'destructive'}
            size="icon"
            className="rounded-full w-14 h-14 shadow-lg"
            onClick={handleToggleVideo}
          >
            {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>
          
          {/* Audio toggle */}
          <Button
            variant={audioEnabled ? 'secondary' : 'destructive'}
            size="icon"
            className="rounded-full w-14 h-14 shadow-lg"
            onClick={handleToggleAudio}
          >
            {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          {/* End call */}
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full w-16 h-16 shadow-lg"
            onClick={handleEndCall}
          >
            <PhoneOff className="w-7 h-7" />
          </Button>

          {/* Doctor notes toggle */}
          {isDoctor && (
            <Button
              variant={showNotes ? 'default' : 'secondary'}
              size="icon"
              className="rounded-full w-14 h-14 shadow-lg"
              onClick={() => setShowNotes(!showNotes)}
            >
              <MessageSquare className="w-6 h-6" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
