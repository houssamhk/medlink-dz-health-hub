import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
  Loader2, Calendar, Clock, User, MessageSquare, Settings
} from 'lucide-react';

interface TelemedicineSession {
  id: string;
  appointment_id: string | null;
  doctor_id: string;
  patient_id: string;
  status: string;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  doctors?: {
    clinic_name: string;
    profiles?: { full_name: string };
    specialties?: { name_ar: string };
  };
  patient_profile?: { full_name: string };
}

const Telemedicine = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const [sessions, setSessions] = useState<TelemedicineSession[]>([]);
  const [activeSession, setActiveSession] = useState<TelemedicineSession | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [isDoctor, setIsDoctor] = useState(false);
  const [doctorInfo, setDoctorInfo] = useState<{ id: string } | null>(null);
  
  // Video call controls
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [callActive, setCallActive] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) {
      checkDoctorStatus();
      fetchSessions();
    }
  }, [user]);

  const checkDoctorStatus = async () => {
    const { data } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user?.id)
      .single();
    
    if (data) {
      setIsDoctor(true);
      setDoctorInfo(data);
    }
  };

  const fetchSessions = async () => {
    // Fetch sessions where user is patient or doctor
    const { data: patientSessions } = await supabase
      .from('telemedicine_sessions')
      .select('*')
      .eq('patient_id', user?.id)
      .order('scheduled_at', { ascending: false });

    let doctorSessions: any[] = [];
    if (doctorInfo) {
      const { data } = await supabase
        .from('telemedicine_sessions')
        .select('*')
        .eq('doctor_id', doctorInfo.id)
        .order('scheduled_at', { ascending: false });
      doctorSessions = data || [];
    }

    const allSessions = [...(patientSessions || []), ...doctorSessions];
    
    // Enrich with doctor/patient info
    const enrichedSessions = await Promise.all(allSessions.map(async (session) => {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('clinic_name, specialties(name_ar)')
        .eq('id', session.doctor_id)
        .single();

      const { data: doctorProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', (await supabase.from('doctors').select('user_id').eq('id', session.doctor_id).single()).data?.user_id)
        .single();

      const { data: patientProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.patient_id)
        .single();

      return {
        ...session,
        doctors: { ...doctor, profiles: doctorProfile },
        patient_profile: patientProfile
      };
    }));

    setSessions(enrichedSessions);
    setLoadingSessions(false);
  };

  const startCall = async (session: TelemedicineSession) => {
    setActiveSession(session);
    setCallActive(true);
    
    await supabase
      .from('telemedicine_sessions')
      .update({ 
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', session.id);

    toast({ title: "تم بدء الجلسة", description: "جاري الاتصال..." });
  };

  const endCall = async () => {
    if (!activeSession) return;

    await supabase
      .from('telemedicine_sessions')
      .update({ 
        status: 'completed',
        ended_at: new Date().toISOString(),
        notes: notes
      })
      .eq('id', activeSession.id);

    setCallActive(false);
    setActiveSession(null);
    setNotes('');
    fetchSessions();
    toast({ title: "تم إنهاء الجلسة" });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-blue-500',
      in_progress: 'bg-green-500',
      completed: 'bg-gray-500',
      cancelled: 'bg-red-500',
    };
    const labels: Record<string, string> = {
      scheduled: 'مجدولة',
      in_progress: 'جارية',
      completed: 'مكتملة',
      cancelled: 'ملغاة',
    };
    return <Badge className={styles[status] || 'bg-gray-500'}>{labels[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Active call view
  if (callActive && activeSession) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-screen flex flex-col">
          {/* Video area */}
          <div className="flex-1 bg-gray-900 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-32 h-32 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <User className="w-16 h-16" />
                </div>
                <h2 className="text-xl font-medium">
                  {isDoctor ? activeSession.patient_profile?.full_name : activeSession.doctors?.profiles?.full_name}
                </h2>
                <p className="text-gray-400">جاري الاتصال...</p>
              </div>
            </div>
            
            {/* Self view */}
            <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg flex items-center justify-center">
              {videoEnabled ? (
                <User className="w-8 h-8 text-gray-500" />
              ) : (
                <VideoOff className="w-8 h-8 text-red-500" />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-background border-t p-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={videoEnabled ? 'secondary' : 'destructive'}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={() => setVideoEnabled(!videoEnabled)}
              >
                {videoEnabled ? <Video /> : <VideoOff />}
              </Button>
              
              <Button
                variant={audioEnabled ? 'secondary' : 'destructive'}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={() => setAudioEnabled(!audioEnabled)}
              >
                {audioEnabled ? <Mic /> : <MicOff />}
              </Button>
              
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full w-14 h-14"
                onClick={endCall}
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </div>

            {/* Doctor notes */}
            {isDoctor && (
              <div className="mt-4 max-w-md mx-auto">
                <Textarea
                  placeholder="ملاحظات الجلسة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24" dir="rtl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">الطب عن بعد</h1>
          <p className="text-muted-foreground">استشارات طبية عبر الفيديو</p>
        </div>

        {loadingSessions ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد جلسات</h3>
              <p className="text-muted-foreground mb-4">لم تقم بحجز أي جلسة طب عن بعد بعد</p>
              <Button onClick={() => window.location.href = '/doctors'}>
                ابحث عن طبيب
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">
                      {isDoctor ? session.patient_profile?.full_name : session.doctors?.profiles?.full_name}
                    </CardTitle>
                    {getStatusBadge(session.status)}
                  </div>
                  <CardDescription>
                    {session.doctors?.specialties?.name_ar}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(session.scheduled_at).toLocaleDateString('ar-DZ')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(session.scheduled_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  
                  {session.status === 'scheduled' && (
                    <Button className="w-full" onClick={() => startCall(session)}>
                      <Video className="h-4 w-4 ml-2" />
                      بدء الجلسة
                    </Button>
                  )}
                  
                  {session.status === 'completed' && session.notes && (
                    <div className="bg-muted p-3 rounded-lg text-sm">
                      <p className="font-medium mb-1">ملاحظات الطبيب:</p>
                      <p className="text-muted-foreground">{session.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Telemedicine;
