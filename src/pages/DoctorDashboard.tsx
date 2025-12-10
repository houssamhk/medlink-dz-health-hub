import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, AlertTriangle, CheckCircle, Clock, User, Calendar, Loader2, Send } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Navigate } from 'react-router-dom';

interface MedicalRecord {
  id: string;
  title: string;
  record_type: string;
  created_at: string;
  review_status: string;
  patient_id: string;
  file_url: string | null;
  data: any;
  profiles?: {
    full_name: string;
    date_of_birth: string;
    gender: string;
  };
}

interface DoctorInfo {
  id: string;
  specialty_id: string;
}

const DoctorDashboard = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [doctorInfo, setDoctorInfo] = useState<DoctorInfo | null>(null);
  const [pendingRecords, setPendingRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [evaluation, setEvaluation] = useState({
    urgency_level: '',
    diagnosis: '',
    recommendations: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDoctorInfo();
    }
  }, [user]);

  useEffect(() => {
    if (doctorInfo) {
      fetchPendingRecords();
    }
  }, [doctorInfo]);

  const fetchDoctorInfo = async () => {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, specialty_id')
      .eq('user_id', user?.id)
      .single();

    if (data) {
      setDoctorInfo(data);
    } else {
      console.error('Doctor not found:', error);
    }
  };

  const fetchPendingRecords = async () => {
    setLoadingRecords(true);
    
    // جلب التحاليل المعينة لهذا الطبيب أو الغير معينة
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('record_type', 'lab_result')
      .in('review_status', ['pending', 'in_review'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching records:', error);
    } else {
      // جلب بيانات المرضى منفصلة
      const patientIds = [...new Set((data || []).map(r => r.patient_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, date_of_birth, gender')
        .in('id', patientIds);

      const recordsWithProfiles = (data || []).map(record => ({
        ...record,
        profiles: profilesData?.find(p => p.id === record.patient_id)
      }));
      
      setPendingRecords(recordsWithProfiles as MedicalRecord[]);
    }
    setLoadingRecords(false);
  };

  const claimRecord = async (recordId: string) => {
    const { error } = await supabase
      .from('medical_records')
      .update({ 
        assigned_doctor_id: doctorInfo?.id,
        review_status: 'in_review'
      })
      .eq('id', recordId);

    if (error) {
      toast({
        title: "خطأ",
        description: "لم نتمكن من تعيين الملف",
        variant: "destructive",
      });
    } else {
      fetchPendingRecords();
      toast({
        title: "تم",
        description: "تم تعيين الملف لك للمراجعة",
      });
    }
  };

  const submitEvaluation = async () => {
    if (!selectedRecord || !evaluation.urgency_level || !evaluation.diagnosis) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // إنشاء التقييم
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

      // تحديث حالة السجل
      const { error: updateError } = await supabase
        .from('medical_records')
        .update({ 
          review_status: 'reviewed',
          urgency_level: evaluation.urgency_level
        })
        .eq('id', selectedRecord.id);

      if (updateError) throw updateError;

      toast({
        title: "تم بنجاح",
        description: "تم حفظ التقييم وإشعار المريض",
      });

      setSelectedRecord(null);
      setEvaluation({ urgency_level: '', diagnosis: '', recommendations: '', notes: '' });
      fetchPendingRecords();

    } catch (error: any) {
      console.error('Error submitting evaluation:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء حفظ التقييم",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getUrgencyBadge = (level: string) => {
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

  if (!doctorInfo) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8" dir="rtl">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
              <p className="text-muted-foreground">هذه الصفحة للأطباء فقط</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">لوحة تحكم الطبيب</h1>
          <p className="text-muted-foreground">مراجعة وتقييم تحاليل المرضى</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* قائمة التحاليل */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  التحاليل المعلقة
                </CardTitle>
                <CardDescription>{pendingRecords.length} تحليل بانتظار المراجعة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                {loadingRecords ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : pendingRecords.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>لا توجد تحاليل معلقة</p>
                  </div>
                ) : (
                  pendingRecords.map((record) => (
                    <div
                      key={record.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRecord?.id === record.id 
                          ? 'border-primary bg-primary/5' 
                          : 'hover:border-primary/50'
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
                        <span>{(record as any).profiles?.full_name || 'مريض'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(record.created_at).toLocaleDateString('ar-DZ')}</span>
                      </div>
                      {record.review_status === 'pending' && (
                        <Button 
                          size="sm" 
                          className="mt-2 w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            claimRecord(record.id);
                          }}
                        >
                          <Clock className="h-4 w-4 ml-2" />
                          استلام للمراجعة
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* نموذج التقييم */}
          <div className="lg:col-span-2">
            {selectedRecord ? (
              <Card>
                <CardHeader>
                  <CardTitle>تقييم التحليل</CardTitle>
                  <CardDescription>
                    المريض: {(selectedRecord as any).profiles?.full_name || 'غير معروف'} | 
                    التاريخ: {new Date(selectedRecord.created_at).toLocaleDateString('ar-DZ')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* عرض بيانات التحليل */}
                  {selectedRecord.file_url && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">صورة التحليل:</h3>
                      <img 
                        src={selectedRecord.file_url} 
                        alt="Lab Result" 
                        className="max-h-64 rounded-lg"
                      />
                    </div>
                  )}

                  {selectedRecord.data && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-2">بيانات التحليل:</h3>
                      <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                        {JSON.stringify(selectedRecord.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* نموذج التقييم */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">مستوى الإلحاح *</label>
                      <Select
                        value={evaluation.urgency_level}
                        onValueChange={(v) => setEvaluation({...evaluation, urgency_level: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر مستوى الإلحاح" />
                        </SelectTrigger>
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
                        placeholder="اكتب تشخيصك للحالة بناءً على نتائج التحليل..."
                        value={evaluation.diagnosis}
                        onChange={(e) => setEvaluation({...evaluation, diagnosis: e.target.value})}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">التوصيات (كل توصية في سطر)</label>
                      <Textarea
                        placeholder="التوصية الأولى&#10;التوصية الثانية&#10;..."
                        value={evaluation.recommendations}
                        onChange={(e) => setEvaluation({...evaluation, recommendations: e.target.value})}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">ملاحظات إضافية</label>
                      <Textarea
                        placeholder="أي ملاحظات إضافية للمريض..."
                        value={evaluation.notes}
                        onChange={(e) => setEvaluation({...evaluation, notes: e.target.value})}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        className="flex-1" 
                        onClick={submitEvaluation}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4 ml-2" />
                        )}
                        إرسال التقييم
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSelectedRecord(null);
                          setEvaluation({ urgency_level: '', diagnosis: '', recommendations: '', notes: '' });
                        }}
                      >
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
                  <h3 className="text-lg font-medium mb-2">اختر تحليلاً للمراجعة</h3>
                  <p className="text-muted-foreground">اضغط على أي تحليل من القائمة لبدء التقييم</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;
