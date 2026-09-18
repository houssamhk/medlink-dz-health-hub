import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, Camera, Stethoscope, Star, MapPin, 
  Loader2, Send, FileText, CheckCircle, Clock,
  Eye, ArrowLeft
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Navigate, Link } from 'react-router-dom';

interface Doctor {
  id: string;
  clinic_name: string;
  wilaya: string;
  rating: number;
  consultation_price: number;
  user_id: string;
  specialty_id: string;
  profiles?: { full_name: string };
  specialties?: { name_ar: string };
}

interface MyFile {
  id: string;
  title: string;
  record_type: string;
  created_at: string;
  review_status: string;
  assigned_doctor_id: string | null;
  doctor_name?: string;
}

const SendToDoctor = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [myFiles, setMyFiles] = useState<MyFile[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'send' | 'track'>('send');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoadingData(true);
    
    // جلب الأطباء والملفات بالتوازي
    const [doctorsRes, filesRes] = await Promise.all([
      supabase
        .from('doctors')
        .select('id, clinic_name, wilaya, rating, consultation_price, user_id, specialty_id')
        .eq('is_available', true),
      
      supabase
        .from('medical_records')
        .select('id, title, record_type, created_at, review_status, assigned_doctor_id')
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false })
    ]);

    if (doctorsRes.data) {
      // جلب أسماء الأطباء والتخصصات
      const userIds = doctorsRes.data.map(d => d.user_id);
      const specialtyIds = [...new Set(doctorsRes.data.map(d => d.specialty_id).filter(Boolean))];
      
      const [profilesRes, specialtiesRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name').in('id', userIds),
        supabase.from('specialties').select('id, name_ar').in('id', specialtyIds)
      ]);

      const enrichedDoctors = doctorsRes.data.map(doc => ({
        ...doc,
        profiles: profilesRes.data?.find(p => p.id === doc.user_id),
        specialties: specialtiesRes.data?.find(s => s.id === doc.specialty_id)
      }));

      setDoctors(enrichedDoctors as Doctor[]);
    }

    if (filesRes.data) {
      // جلب أسماء الأطباء المعينين
      const doctorIds = filesRes.data.map(f => f.assigned_doctor_id).filter(Boolean);
      
      if (doctorIds.length > 0) {
        const { data: assignedDoctors } = await supabase
          .from('doctors')
          .select('id, user_id')
          .in('id', doctorIds);
        
        if (assignedDoctors) {
          const userIds = assignedDoctors.map(d => d.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          const filesWithDoctors = filesRes.data.map(file => {
            const doctor = assignedDoctors.find(d => d.id === file.assigned_doctor_id);
            const profile = profiles?.find(p => p.id === doctor?.user_id);
            return {
              ...file,
              doctor_name: profile?.full_name || null
            };
          });
          
          setMyFiles(filesWithDoctors);
        } else {
          setMyFiles(filesRes.data);
        }
      } else {
        setMyFiles(filesRes.data);
      }
    }

    setLoadingData(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSendToDoctor = async () => {
    if (!selectedDoctor || !selectedFile || !title.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار طبيب ورفع ملف وإدخال عنوان",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // رفع الملف للتخزين
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('medical-files')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // الحصول على رابط الملف
      const { data: urlData } = supabase.storage
        .from('medical-files')
        .getPublicUrl(fileName);

      // إنشاء سجل طبي مع تعيين الطبيب
      const { error: recordError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: user?.id,
          title: title,
          record_type: 'lab_result',
          file_url: urlData.publicUrl,
          description: notes,
          assigned_doctor_id: selectedDoctor,
          review_status: 'pending',
        });

      if (recordError) throw recordError;

      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال ملفك للطبيب المختار. سيتم إشعارك عند المراجعة.",
      });

      // إعادة تعيين النموذج
      setSelectedFile(null);
      setPreviewUrl(null);
      setTitle('');
      setNotes('');
      setSelectedDoctor('');
      
      // تحديث قائمة الملفات
      fetchData();
      setActiveTab('track');

    } catch (error: any) {
      console.error('Error sending file:', error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء إرسال الملف",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 ml-1" />
            في الانتظار
          </Badge>
        );
      case 'in_review':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Eye className="h-3 w-3 ml-1" />
            قيد المراجعة
          </Badge>
        );
      case 'reviewed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 ml-1" />
            تم الرد
          </Badge>
        );
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
        <div className="max-w-4xl mx-auto pt-20">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">إرسال التحاليل للطبيب</h1>
            <p className="text-muted-foreground">اختر طبيباً وأرسل تحاليلك لتحصل على تقييم متخصص</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'send' ? 'default' : 'outline'}
              onClick={() => setActiveTab('send')}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              إرسال جديد
            </Button>
            <Button
              variant={activeTab === 'track' ? 'default' : 'outline'}
              onClick={() => setActiveTab('track')}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              تتبع ملفاتي ({myFiles.length})
            </Button>
          </div>

          {loadingData ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : activeTab === 'send' ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* اختيار الطبيب */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    اختر الطبيب
                  </CardTitle>
                  <CardDescription>اختر الطبيب الذي تريد إرسال تحاليلك إليه</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طبيباً..." />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          <div className="flex items-center gap-2">
                            <span>د. {doctor.profiles?.full_name || 'طبيب'}</span>
                            <span className="text-muted-foreground">
                              - {doctor.specialties?.name_ar || 'عام'}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedDoctor && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      {(() => {
                        const doc = doctors.find(d => d.id === selectedDoctor);
                        if (!doc) return null;
                        return (
                          <div className="space-y-2">
                            <h4 className="font-semibold">د. {doc.profiles?.full_name}</h4>
                            <p className="text-sm text-muted-foreground">{doc.specialties?.name_ar}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {doc.wilaya}
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                {doc.rating || 'جديد'}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* رفع الملف */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    رفع التحليل
                  </CardTitle>
                  <CardDescription>ارفع صورة أو ملف التحليل</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                    ) : (
                      <>
                        <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">اضغط لرفع صورة</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleFileSelect}
                  />

                  <Input
                    placeholder="عنوان التحليل (مثال: تحليل دم شامل)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <Textarea
                    placeholder="ملاحظات إضافية للطبيب (اختياري)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* زر الإرسال */}
              <div className="md:col-span-2">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleSendToDoctor}
                  disabled={uploading || !selectedDoctor || !selectedFile || !title.trim()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 ml-2" />
                      إرسال للطبيب
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* تتبع الملفات */
            <div className="space-y-4">
              {myFiles.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">لا توجد ملفات مرسلة</h3>
                    <p className="text-muted-foreground mb-4">أرسل تحاليلك لطبيب لتتبع حالتها هنا</p>
                    <Button onClick={() => setActiveTab('send')}>
                      <Send className="h-4 w-4 ml-2" />
                      إرسال تحليل جديد
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                myFiles.map((file) => (
                  <Card key={file.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-full ${
                            file.review_status === 'reviewed' ? 'bg-green-100' :
                            file.review_status === 'in_review' ? 'bg-blue-100' : 'bg-yellow-100'
                          }`}>
                            {file.review_status === 'reviewed' ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : file.review_status === 'in_review' ? (
                              <Eye className="h-6 w-6 text-blue-600" />
                            ) : (
                              <Clock className="h-6 w-6 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold">{file.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(file.created_at).toLocaleDateString('ar-DZ')}
                            </p>
                            {file.doctor_name && (
                              <p className="text-sm text-primary">
                                الطبيب: د. {file.doctor_name}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(file.review_status)}
                          {file.review_status === 'reviewed' && (
                            <Link to="/medical-record">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 ml-1" />
                                عرض الرد
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SendToDoctor;