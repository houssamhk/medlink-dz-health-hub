import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, AlertTriangle, CheckCircle, Clock, User, Calendar, 
  Loader2, Send, Inbox, History, UserCircle, Video, MessageSquare,
  Bell, Stethoscope, FlaskConical, Play, Users
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Navigate, Link } from 'react-router-dom';

interface MedicalRecord {
  id: string;
  title: string;
  record_type: string;
  created_at: string;
  review_status: string;
  urgency_level: string | null;
  patient_id: string;
  file_url: string | null;
  description: string | null;
  data: any;
  profiles?: {
    full_name: string;
    date_of_birth: string;
    gender: string;
    phone: string;
  };
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  is_telemedicine: boolean;
  reason: string | null;
  patient_id: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
}

interface DoctorInfo {
  id: string;
  specialty_id: string;
  telemedicine_enabled: boolean;
}

const DoctorDashboard = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [pendingRecords, setPendingRecords] = useState<MedicalRecord[]>([]);
  const [reviewedRecords, setReviewedRecords] = useState<MedicalRecord[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [evaluation, setEvaluation] = useState({
    urgency_level: '',
    diagnosis: '',
    recommendations: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (user) {
      fetchDoctorInfo();
    }
  }, [user]);

  useEffect(() => {
    if (doctorInfo) {
      fetchAllData();
      setupRealtimeSubscription();
    }
  }, [doctorInfo]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('doctor-records')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'medical_records',
          filter: `assigned_doctor_id=eq.${doctorInfo?.id}`
        },
        (payload) => {
          toast({
            title: "ملف جديد",
            description: "تم استلام ملف جديد للمراجعة",
          });
          fetchAllData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchDoctorInfo = async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, specialty_id, telemedicine_enabled')
      .eq('user_id', user?.id)
      .single();

    if (data) {
      setDoctorInfo(data);
    } else {
      console.error('Doctor not found:', error);
    }
  };

  const fetchAllData = async () => {
    setLoadingRecords(true);
    const today = new Date().toISOString().split('T')[0];
    
    const [pendingRes, reviewedRes, appointmentsRes, notificationsRes] = await Promise.all([
      // Pending medical records
      supabase
        .from('medical_records')
        .select('*')
        .eq('record_type', 'lab_result')
        .eq('assigned_doctor_id', doctorInfo?.id)
        .in('review_status', ['pending', 'in_review'])
        .order('created_at', { ascending: false }),
      
      // Reviewed records
      supabase
        .from('medical_records')
        .select('*')
        .eq('record_type', 'lab_result')
        .eq('assigned_doctor_id', doctorInfo?.id)
        .eq('review_status', 'reviewed')
        .order('created_at', { ascending: false })
        .limit(20),

      // Today's appointments
      supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', doctorInfo?.id)
        .eq('appointment_date', today)
        .in('status', ['pending', 'confirmed'])
        .order('appointment_time', { ascending: true }),

      // Unread notifications
      supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user?.id)
        .eq('is_read', false)
    ]);

    // Fetch patient profiles
    const allRecords = [...(pendingRes.data || []), ...(reviewedRes.data || [])];
    const patientIds = [...new Set([
      ...allRecords.map(r => r.patient_id),
      ...(appointmentsRes.data || []).map(a => a.patient_id)
    ])];
    
    if (patientIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, date_of_birth, gender, phone')
        .in('id', patientIds);

      const enrichRecords = (records: any[]) => records.map(record => ({
        ...record,
        profiles: profilesData?.find(p => p.id === record.patient_id)
      }));

      const enrichAppointments = (appointments: any[]) => appointments.map(apt => ({
        ...apt,
        profiles: profilesData?.find(p => p.id === apt.patient_id)
      }));

      setPendingRecords(enrichRecords(pendingRes.data || []));
      setReviewedRecords(enrichRecords(reviewedRes.data || []));
      setTodayAppointments(enrichAppointments(appointmentsRes.data || []));
    } else {
      setPendingRecords([]);
      setReviewedRecords([]);
      setTodayAppointments([]);
    }

    setUnreadMessages(notificationsRes.data?.length || 0);
    setLoadingRecords(false);
  };

  const claimRecord = async (recordId: string) => {
    const { error } = await supabase
      .from('medical_records')
      .update({ review_status: 'in_review' })
      .eq('id', recordId);

    if (error) {
      toast({ title: "خطأ", description: "لم نتمكن من تعيين الملف", variant: "destructive" });
    } else {
      fetchAllData();
      toast({ title: "تم", description: "تم تعيين الملف للمراجعة" });
    }
  };

  const submitEvaluation = async () => {
    if (!selectedRecord || !evaluation.urgency_level || !evaluation.diagnosis) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      const { error: evalError } = await supabase
        .from('doctor_evaluations')
        .insert({
          doctor_id: doctorInfo?.id,
          medical_record_id: selectedRecord.id,
          urgency_level: evaluation.urgency_level,
          diagnosis: evaluation.diagnosis,
          recommendations: evaluation.recommendations.split('\n').filter(r => r.trim()),
          notes: evaluation.notes
        });

      if (evalError) throw evalError;

      const { error: updateError } = await supabase
        .from('medical_records')
        .update({ review_status: 'reviewed', urgency_level: evaluation.urgency_level })
        .eq('id', selectedRecord.id);

      if (updateError) throw updateError;

      toast({ title: "تم بنجاح", description: "تم حفظ التقييم وسيتم إشعار المريض" });
      setSelectedRecord(null);
      setEvaluation({ urgency_level: '', diagnosis: '', recommendations: '', notes: '' });
      fetchAllData();
    } catch (error: any) {
      console.error('Error submitting evaluation:', error);
      toast({ title: "خطأ", description: error.message || "حدث خطأ", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const startConsultation = async (appointment: Appointment) => {
    const now = new Date();
    const appointmentTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const diff = (appointmentTime.getTime() - now.getTime()) / (1000 * 60);
    
    if (diff > 15) {
      toast({ title: "انتظر", description: "لا يمكن بدء الاستشارة قبل 15 دقيقة من الموعد", variant: "destructive" });
      return;
    }

    // إنشاء جلسة طب عن بعد
    const { data: session, error } = await supabase
      .from('telemedicine_sessions')
      .insert({
        appointment_id: appointment.id,
        doctor_id: doctorInfo?.id,
        patient_id: appointment.patient_id,
        scheduled_at: `${appointment.appointment_date}T${appointment.appointment_time}`,
        status: 'scheduled'
      })
      .select('id')
      .single();

    if (error) {
      toast({ title: "خطأ", description: "فشل إنشاء الجلسة", variant: "destructive" });
      return;
    }
    
    // الانتقال لصفحة الطب عن بعد
    window.location.href = `/telemedicine?session=${session.id}`;
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'critical': return <Badge variant="destructive">حرج</Badge>;
      case 'urgent': return <Badge className="bg-orange-500">عاجل</Badge>;
      case 'moderate': return <Badge className="bg-yellow-500">متوسط</Badge>;
      default: return <Badge className="bg-green-500">عادي</Badge>;
    }
  };

  const isAppointmentStartable = (appointment: Appointment) => {
    const now = new Date();
    const appointmentTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
    const diff = (appointmentTime.getTime() - now.getTime()) / (1000 * 60);
    return diff <= 15 && diff >= -60;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!doctorInfo) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8" dir="rtl">
          <Card className="mt-20">
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
              <p className="text-muted-foreground mb-4">هذه الصفحة للأطباء فقط</p>
              <Link to="/dashboard"><Button>العودة للوحة التحكم</Button></Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8" dir="rtl">
        <div className="pt-20">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">مركز التحكم الطبي</h1>
              <p className="text-muted-foreground">إدارة المواعيد والملفات الطبية</p>
            </div>
            <Link to="/doctor-profile">
              <Button variant="outline">تعديل الملف الشخصي</Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
              <CardContent className="py-4 flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayAppointments.length}</p>
                  <p className="text-muted-foreground text-sm">مرضى اليوم</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
              <CardContent className="py-4 flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-full">
                  <FlaskConical className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingRecords.length}</p>
                  <p className="text-muted-foreground text-sm">تحاليل معلقة</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
              <CardContent className="py-4 flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Bell className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadMessages}</p>
                  <p className="text-muted-foreground text-sm">رسائل غير مقروءة</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
              <CardContent className="py-4 flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reviewedRecords.length}</p>
                  <p className="text-muted-foreground text-sm">ملفات مراجعة</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                نظرة عامة
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                جدول اليوم
              </TabsTrigger>
              <TabsTrigger value="lab-review" className="flex items-center gap-2">
                <FlaskConical className="h-4 w-4" />
                مراجعة التحاليل ({pendingRecords.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                السجل
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Today's Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      جدول اليوم
                    </CardTitle>
                    <CardDescription>المواعيد المجدولة لليوم</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {todayAppointments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>لا توجد مواعيد اليوم</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {todayAppointments.slice(0, 5).map((apt) => (
                          <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${apt.is_telemedicine ? 'bg-purple-100' : 'bg-blue-100'}`}>
                                {apt.is_telemedicine ? <Video className="h-4 w-4 text-purple-600" /> : <User className="h-4 w-4 text-blue-600" />}
                              </div>
                              <div>
                                <p className="font-medium">{apt.profiles?.full_name || 'مريض'}</p>
                                <p className="text-sm text-muted-foreground">{apt.appointment_time}</p>
                              </div>
                            </div>
                            {apt.is_telemedicine && (
                              <Button 
                                size="sm" 
                                onClick={() => startConsultation(apt)}
                                disabled={!isAppointmentStartable(apt)}
                                className={isAppointmentStartable(apt) ? 'bg-green-600 hover:bg-green-700' : ''}
                              >
                                <Play className="h-4 w-4 ml-1" />
                                بدء
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Pending Lab Results */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FlaskConical className="h-5 w-5" />
                      تحاليل تنتظر المراجعة
                    </CardTitle>
                    <CardDescription>ملفات طبية تحتاج تقييمك</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingRecords.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p>لا توجد ملفات معلقة</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingRecords.slice(0, 5).map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 cursor-pointer" onClick={() => { setActiveTab('lab-review'); setSelectedRecord(record); }}>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-yellow-100 rounded-full">
                                <FileText className="h-4 w-4 text-yellow-600" />
                              </div>
                              <div>
                                <p className="font-medium">{record.title}</p>
                                <p className="text-sm text-muted-foreground">{record.profiles?.full_name || 'مريض'}</p>
                              </div>
                            </div>
                            <Badge variant={record.review_status === 'in_review' ? 'secondary' : 'outline'}>
                              {record.review_status === 'in_review' ? 'قيد المراجعة' : 'جديد'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    استشارات اليوم
                  </CardTitle>
                  <CardDescription>الاستشارات عن بعد والمواعيد الحضورية</CardDescription>
                </CardHeader>
                <CardContent>
                  {todayAppointments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">لا توجد مواعيد لليوم</h3>
                      <p>ستظهر هنا المواعيد المحجوزة من قبل المرضى</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {todayAppointments.map((apt) => (
                        <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${apt.is_telemedicine ? 'bg-purple-100' : 'bg-blue-100'}`}>
                              {apt.is_telemedicine ? <Video className="h-6 w-6 text-purple-600" /> : <User className="h-6 w-6 text-blue-600" />}
                            </div>
                            <div>
                              <h3 className="font-semibold">{apt.profiles?.full_name || 'مريض'}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {apt.appointment_time}
                                </span>
                                {apt.profiles?.phone && (
                                  <span dir="ltr">{apt.profiles.phone}</span>
                                )}
                              </div>
                              {apt.reason && <p className="text-sm mt-1">{apt.reason}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={apt.is_telemedicine ? 'default' : 'secondary'}>
                              {apt.is_telemedicine ? 'عن بعد' : 'حضوري'}
                            </Badge>
                            {apt.is_telemedicine && (
                              <Button 
                                onClick={() => startConsultation(apt)}
                                disabled={!isAppointmentStartable(apt)}
                                className={isAppointmentStartable(apt) ? 'bg-green-600 hover:bg-green-700' : ''}
                              >
                                <Play className="h-4 w-4 ml-2" />
                                بدء الاستشارة
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lab Review Tab */}
            <TabsContent value="lab-review">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Inbox className="h-5 w-5" />
                        الملفات المعلقة
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                      {loadingRecords ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : pendingRecords.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                          <p>لا توجد ملفات معلقة</p>
                        </div>
                      ) : (
                        pendingRecords.map((record) => (
                          <div
                            key={record.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedRecord?.id === record.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedRecord(record)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-medium">{record.title}</h3>
                              <Badge variant={record.review_status === 'in_review' ? 'secondary' : 'outline'}>
                                {record.review_status === 'in_review' ? 'قيد المراجعة' : 'جديد'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>{record.profiles?.full_name || 'مريض'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(record.created_at).toLocaleDateString('ar-DZ')}</span>
                            </div>
                            {record.review_status === 'pending' && (
                              <Button 
                                size="sm" 
                                className="mt-2 w-full"
                                onClick={(e) => { e.stopPropagation(); claimRecord(record.id); }}
                              >
                                <Clock className="h-4 w-4 ml-2" />
                                بدء المراجعة
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="lg:col-span-2">
                  {selectedRecord ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>تقييم الملف</CardTitle>
                        <CardDescription>
                          المريض: {selectedRecord.profiles?.full_name || 'غير معروف'} | 
                          التاريخ: {new Date(selectedRecord.created_at).toLocaleDateString('ar-DZ')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="bg-muted p-4 rounded-lg">
                          <h4 className="font-medium mb-2">معلومات المريض</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <span>الاسم: {selectedRecord.profiles?.full_name || 'غير معروف'}</span>
                            <span>الجنس: {selectedRecord.profiles?.gender || 'غير محدد'}</span>
                            <span>الهاتف: {selectedRecord.profiles?.phone || 'غير متوفر'}</span>
                            <span>تاريخ الميلاد: {selectedRecord.profiles?.date_of_birth || 'غير متوفر'}</span>
                          </div>
                        </div>

                        {selectedRecord.file_url && (
                          <div className="border rounded-lg p-4">
                            <h3 className="font-medium mb-2">صورة التحليل:</h3>
                            <img src={selectedRecord.file_url} alt="Lab Result" className="max-h-64 rounded-lg" />
                          </div>
                        )}

                        {selectedRecord.description && (
                          <div className="border rounded-lg p-4">
                            <h3 className="font-medium mb-2">ملاحظات المريض:</h3>
                            <p className="text-muted-foreground">{selectedRecord.description}</p>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">مستوى الإلحاح *</label>
                            <Select value={evaluation.urgency_level} onValueChange={(v) => setEvaluation({...evaluation, urgency_level: v})}>
                              <SelectTrigger><SelectValue placeholder="اختر مستوى الإلحاح" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">عادي - لا يستدعي قلق</SelectItem>
                                <SelectItem value="moderate">متوسط - يحتاج متابعة</SelectItem>
                                <SelectItem value="urgent">عاجل - راجع خلال 24 ساعة</SelectItem>
                                <SelectItem value="critical">حرج - تدخل فوري!</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">التشخيص *</label>
                            <Textarea
                              placeholder="اكتب تشخيصك للحالة..."
                              value={evaluation.diagnosis}
                              onChange={(e) => setEvaluation({...evaluation, diagnosis: e.target.value})}
                              className="min-h-[100px]"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">التوصيات</label>
                            <Textarea
                              placeholder="التوصية الأولى&#10;التوصية الثانية&#10;..."
                              value={evaluation.recommendations}
                              onChange={(e) => setEvaluation({...evaluation, recommendations: e.target.value})}
                              className="min-h-[100px]"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">ملاحظات للمريض</label>
                            <Textarea
                              placeholder="أي ملاحظات إضافية..."
                              value={evaluation.notes}
                              onChange={(e) => setEvaluation({...evaluation, notes: e.target.value})}
                            />
                          </div>

                          <div className="flex gap-3">
                            <Button className="flex-1" onClick={submitEvaluation} disabled={submitting}>
                              {submitting ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Send className="h-4 w-4 ml-2" />}
                              إرسال التقييم للمريض
                            </Button>
                            <Button variant="outline" onClick={() => { setSelectedRecord(null); setEvaluation({ urgency_level: '', diagnosis: '', recommendations: '', notes: '' }); }}>
                              إلغاء
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-16 text-center">
                        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">اختر ملفاً للمراجعة</h3>
                        <p className="text-muted-foreground">اضغط على أي ملف من القائمة لبدء التقييم</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <div className="space-y-4">
                {reviewedRecords.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium">لا توجد ملفات سابقة</h3>
                    </CardContent>
                  </Card>
                ) : (
                  reviewedRecords.map((record) => (
                    <Card key={record.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-full">
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{record.title}</h3>
                              <p className="text-sm text-muted-foreground">المريض: {record.profiles?.full_name || 'مريض'}</p>
                              <p className="text-sm text-muted-foreground">{new Date(record.created_at).toLocaleDateString('ar-DZ')}</p>
                            </div>
                          </div>
                          {record.urgency_level && getUrgencyBadge(record.urgency_level)}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;