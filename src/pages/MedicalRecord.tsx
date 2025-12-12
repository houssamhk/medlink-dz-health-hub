import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Calendar, Clock, User, Stethoscope, 
  AlertTriangle, CheckCircle, Loader2, FlaskConical,
  CalendarCheck, MessageSquare
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Navigate } from 'react-router-dom';

interface MedicalRecordItem {
  id: string;
  title: string;
  record_type: string;
  created_at: string;
  review_status: string;
  urgency_level: string | null;
  ai_analysis: string | null;
  ai_recommendations: string[] | null;
  assigned_doctor_id: string | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  doctors: {
    id: string;
    clinic_name: string;
    profiles: {
      full_name: string;
    };
    specialties: {
      name_ar: string;
    };
  };
}

interface DoctorEvaluation {
  id: string;
  created_at: string;
  urgency_level: string;
  diagnosis: string | null;
  recommendations: string[] | null;
  notes: string | null;
  medical_record_id: string;
}

const MedicalRecord = () => {
  const { user, loading } = useAuth();
  const [records, setRecords] = useState<MedicalRecordItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [evaluations, setEvaluations] = useState<DoctorEvaluation[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoadingData(true);
    
    // جلب جميع البيانات بالتوازي
    const [recordsRes, appointmentsRes, evaluationsRes] = await Promise.all([
      supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false }),
      
      supabase
        .from('appointments')
        .select(`
          *,
          doctors (
            id,
            clinic_name,
            user_id,
            specialty_id
          )
        `)
        .eq('patient_id', user?.id)
        .order('appointment_date', { ascending: false }),
      
      supabase
        .from('doctor_evaluations')
        .select('*')
        .in('medical_record_id', (await supabase
          .from('medical_records')
          .select('id')
          .eq('patient_id', user?.id)).data?.map(r => r.id) || [])
        .order('created_at', { ascending: false })
    ]);

    if (recordsRes.data) {
      setRecords(recordsRes.data);
    }

    if (appointmentsRes.data) {
      // جلب بيانات الأطباء والتخصصات
      const doctorUserIds = appointmentsRes.data.map(a => a.doctors?.user_id).filter(Boolean);
      const specialtyIds = appointmentsRes.data.map(a => a.doctors?.specialty_id).filter(Boolean);

      const [profilesRes, specialtiesRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name').in('id', doctorUserIds),
        supabase.from('specialties').select('id, name_ar').in('id', specialtyIds)
      ]);

      const enrichedAppointments = appointmentsRes.data.map(apt => ({
        ...apt,
        doctors: {
          ...apt.doctors,
          profiles: profilesRes.data?.find(p => p.id === apt.doctors?.user_id) || { full_name: 'طبيب' },
          specialties: specialtiesRes.data?.find(s => s.id === apt.doctors?.specialty_id) || { name_ar: 'عام' }
        }
      }));

      setAppointments(enrichedAppointments as Appointment[]);
    }

    if (evaluationsRes.data) {
      setEvaluations(evaluationsRes.data);
    }

    setLoadingData(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">قيد الانتظار</Badge>;
      case 'in_review':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">قيد المراجعة</Badge>;
      case 'reviewed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">تمت المراجعة</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (level: string | null) => {
    if (!level) return null;
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">حرج</Badge>;
      case 'urgent':
        return <Badge className="bg-orange-500">عاجل</Badge>;
      case 'moderate':
        return <Badge className="bg-yellow-500">متوسط</Badge>;
      default:
        return <Badge className="bg-green-500">عادي</Badge>;
    }
  };

  const getAppointmentStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500">مؤكد</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">قيد الانتظار</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">ملغي</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">مكتمل</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8" dir="rtl">
        <div className="max-w-5xl mx-auto pt-20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">ملفي الطبي الشامل</h1>
            <p className="text-muted-foreground">جميع سجلاتك الطبية والتحاليل والمواعيد في مكان واحد</p>
          </div>

          {loadingData ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="records" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="records" className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" />
                  التحاليل ({records.length})
                </TabsTrigger>
                <TabsTrigger value="appointments" className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4" />
                  المواعيد ({appointments.length})
                </TabsTrigger>
                <TabsTrigger value="evaluations" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  تقييمات الأطباء ({evaluations.length})
                </TabsTrigger>
              </TabsList>

              {/* التحاليل والسجلات الطبية */}
              <TabsContent value="records" className="space-y-4">
                {records.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">لا توجد سجلات طبية</h3>
                      <p className="text-muted-foreground">ابدأ برفع تحاليلك الطبية للحصول على تقييم</p>
                    </CardContent>
                  </Card>
                ) : (
                  records.map((record) => {
                    const evaluation = evaluations.find(e => e.medical_record_id === record.id);
                    return (
                      <Card key={record.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <FlaskConical className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{record.title}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(record.created_at).toLocaleDateString('ar-DZ')}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getUrgencyBadge(record.urgency_level)}
                              {getStatusBadge(record.review_status)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {record.review_status === 'pending' && (
                            <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                              <Clock className="h-5 w-5" />
                              <span>في انتظار مراجعة الطبيب</span>
                            </div>
                          )}
                          {record.review_status === 'in_review' && (
                            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                              <Stethoscope className="h-5 w-5" />
                              <span>جاري المراجعة من طبيب مختص</span>
                            </div>
                          )}
                          {evaluation && (
                            <div className="space-y-3 mt-4 border-t pt-4">
                              <h4 className="font-semibold flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                تقييم الطبيب
                              </h4>
                              {evaluation.diagnosis && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">التشخيص:</p>
                                  <p className="text-foreground">{evaluation.diagnosis}</p>
                                </div>
                              )}
                              {evaluation.recommendations && evaluation.recommendations.length > 0 && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">التوصيات:</p>
                                  <ul className="list-disc list-inside space-y-1">
                                    {evaluation.recommendations.map((rec, idx) => (
                                      <li key={idx} className="text-foreground">{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {evaluation.notes && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-1">ملاحظات:</p>
                                  <p className="text-foreground">{evaluation.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              {/* المواعيد */}
              <TabsContent value="appointments" className="space-y-4">
                {appointments.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">لا توجد مواعيد</h3>
                      <p className="text-muted-foreground">احجز موعدك الأول مع أحد أطبائنا</p>
                    </CardContent>
                  </Card>
                ) : (
                  appointments.map((apt) => (
                    <Card key={apt.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-full">
                              <Stethoscope className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                د. {apt.doctors?.profiles?.full_name || 'طبيب'}
                              </h3>
                              <p className="text-muted-foreground">
                                {apt.doctors?.specialties?.name_ar || 'عام'}
                              </p>
                              {apt.reason && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  السبب: {apt.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2 text-foreground mb-2">
                              <Calendar className="h-4 w-4" />
                              {new Date(apt.appointment_date).toLocaleDateString('ar-DZ')}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground mb-2">
                              <Clock className="h-4 w-4" />
                              {apt.appointment_time}
                            </div>
                            {getAppointmentStatusBadge(apt.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* تقييمات الأطباء */}
              <TabsContent value="evaluations" className="space-y-4">
                {evaluations.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">لا توجد تقييمات بعد</h3>
                      <p className="text-muted-foreground">ستظهر هنا تقييمات الأطباء لتحاليلك</p>
                    </CardContent>
                  </Card>
                ) : (
                  evaluations.map((evaluation) => (
                    <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">تقييم طبي</CardTitle>
                              <CardDescription>
                                {new Date(evaluation.created_at).toLocaleDateString('ar-DZ')}
                              </CardDescription>
                            </div>
                          </div>
                          {getUrgencyBadge(evaluation.urgency_level)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {evaluation.diagnosis && (
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">التشخيص</h4>
                            <p className="text-foreground">{evaluation.diagnosis}</p>
                          </div>
                        )}
                        {evaluation.recommendations && evaluation.recommendations.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">التوصيات</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {evaluation.recommendations.map((rec, idx) => (
                                <li key={idx}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {evaluation.notes && (
                          <div>
                            <h4 className="font-medium text-sm text-muted-foreground mb-1">ملاحظات</h4>
                            <p className="text-foreground">{evaluation.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
};

export default MedicalRecord;