import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import VideoCall from '@/components/VideoCall';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Video, Loader2, Calendar, Clock, User, Phone
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
  const [callActive, setCallActive] = useState(false);
  const [isCaller, setIsCaller] = useState(false);

  useEffect(() => {
    if (user) {
      checkDoctorStatus();
    }
  }, [user]);

  useEffect(() => {
    if (user && (doctorInfo !== null || !isDoctor)) {
      fetchSessions();
    }
  }, [user, doctorInfo, isDoctor]);

  // Auto-join if session ID is in URL
  useEffect(() => {
    if (sessionId && sessions.length > 0) {
      const session = sessions.find(s => s.id === sessionId);
      if (session && session.status === 'scheduled') {
        handleJoinCall(session);
      }
    }
  }, [sessionId, sessions]);

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
    setLoadingSessions(true);
    
    // Fetch sessions where user is patient
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

    // Combine and deduplicate
    const allSessionsMap = new Map();
    [...(patientSessions || []), ...doctorSessions].forEach(s => {
      allSessionsMap.set(s.id, s);
    });
    const allSessions = Array.from(allSessionsMap.values());
    
    // Enrich with doctor/patient info
    const enrichedSessions = await Promise.all(allSessions.map(async (session) => {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('clinic_name, user_id, specialties(name_ar)')
        .eq('id', session.doctor_id)
        .single();

      let doctorProfile = null;
      if (doctor?.user_id) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', doctor.user_id)
          .single();
        doctorProfile = data;
      }

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

  const handleStartCall = async (session: TelemedicineSession) => {
    // Request permissions first
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (error) {
      toast({
        title: "مطلوب إذن الكاميرا والميكروفون",
        description: "يرجى السماح بالوصول للكاميرا والميكروفون لبدء المكالمة",
        variant: "destructive"
      });
      return;
    }

    setActiveSession(session);
    setIsCaller(true);
    setCallActive(true);
    
    await supabase
      .from('telemedicine_sessions')
      .update({ 
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', session.id);

    toast({ title: "تم بدء الجلسة", description: "جاري الاتصال بالطرف الآخر..." });
  };

  const handleJoinCall = async (session: TelemedicineSession) => {
    // Request permissions first
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (error) {
      toast({
        title: "مطلوب إذن الكاميرا والميكروفون",
        description: "يرجى السماح بالوصول للكاميرا والميكروفون للانضمام للمكالمة",
        variant: "destructive"
      });
      return;
    }

    setActiveSession(session);
    setIsCaller(false);
    setCallActive(true);
  };

  const handleEndCall = async (notes?: string) => {
    if (!activeSession) return;

    await supabase
      .from('telemedicine_sessions')
      .update({ 
        status: 'completed',
        ended_at: new Date().toISOString(),
        ...(notes && { notes })
      })
      .eq('id', activeSession.id);

    setCallActive(false);
    setActiveSession(null);
    fetchSessions();
    toast({ title: "تم إنهاء الجلسة بنجاح" });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: 'bg-blue-500',
      in_progress: 'bg-green-500 animate-pulse',
      completed: 'bg-gray-500',
      cancelled: 'bg-red-500',
    };
    const labels: Record<string, string> = {
      scheduled: 'مجدولة',
      in_progress: 'جارية الآن',
      completed: 'مكتملة',
      cancelled: 'ملغاة',
    };
    return <Badge className={styles[status] || 'bg-gray-500'}>{labels[status] || status}</Badge>;
  };

  const canStartCall = (session: TelemedicineSession) => {
    if (session.status !== 'scheduled') return false;
    const scheduledTime = new Date(session.scheduled_at);
    const now = new Date();
    const diffMinutes = (scheduledTime.getTime() - now.getTime()) / (1000 * 60);
    // Allow starting 15 minutes before scheduled time
    return diffMinutes <= 15;
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

  // Active call view with WebRTC
  if (callActive && activeSession) {
    const remoteName = isDoctor 
      ? activeSession.patient_profile?.full_name || 'المريض'
      : activeSession.doctors?.profiles?.full_name || 'الطبيب';

    return (
      <VideoCall
        sessionId={activeSession.id}
        userId={user.id}
        remoteName={remoteName}
        isDoctor={isDoctor}
        isCaller={isCaller}
        onEndCall={handleEndCall}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24" dir="rtl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">الطب عن بعد</h1>
          <p className="text-muted-foreground">استشارات طبية عبر الفيديو بتقنية WebRTC</p>
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
          <div className="space-y-6">
            {/* Active/Upcoming Sessions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">الجلسات القادمة</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions
                  .filter(s => s.status === 'scheduled' || s.status === 'in_progress')
                  .map((session) => (
                    <Card key={session.id} className={session.status === 'in_progress' ? 'border-green-500 border-2' : ''}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {isDoctor ? session.patient_profile?.full_name : session.doctors?.profiles?.full_name}
                              </CardTitle>
                              <CardDescription>
                                {session.doctors?.specialties?.name_ar}
                              </CardDescription>
                            </div>
                          </div>
                          {getStatusBadge(session.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(session.scheduled_at).toLocaleDateString('ar-DZ')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(session.scheduled_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        
                        {session.status === 'in_progress' ? (
                          <Button className="w-full" variant="default" onClick={() => handleJoinCall(session)}>
                            <Phone className="h-4 w-4 ml-2" />
                            انضم للمكالمة
                          </Button>
                        ) : canStartCall(session) ? (
                          <Button className="w-full" onClick={() => handleStartCall(session)}>
                            <Video className="h-4 w-4 ml-2" />
                            بدء الجلسة
                          </Button>
                        ) : (
                          <Button className="w-full" variant="outline" disabled>
                            <Clock className="h-4 w-4 ml-2" />
                            متاحة قبل 15 دقيقة من الموعد
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
              
              {sessions.filter(s => s.status === 'scheduled' || s.status === 'in_progress').length === 0 && (
                <p className="text-muted-foreground text-center py-8">لا توجد جلسات قادمة</p>
              )}
            </div>

            {/* Completed Sessions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">الجلسات المكتملة</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions
                  .filter(s => s.status === 'completed')
                  .slice(0, 6)
                  .map((session) => (
                    <Card key={session.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">
                            {isDoctor ? session.patient_profile?.full_name : session.doctors?.profiles?.full_name}
                          </CardTitle>
                          {getStatusBadge(session.status)}
                        </div>
                        <CardDescription>
                          {new Date(session.scheduled_at).toLocaleDateString('ar-DZ')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {session.notes && (
                          <div className="bg-muted p-3 rounded-lg text-sm">
                            <p className="font-medium mb-1">ملاحظات الطبيب:</p>
                            <p className="text-muted-foreground">{session.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
              
              {sessions.filter(s => s.status === 'completed').length === 0 && (
                <p className="text-muted-foreground text-center py-8">لا توجد جلسات مكتملة</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Telemedicine;
