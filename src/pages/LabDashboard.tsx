import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Search,
  Upload,
  FileText,
  Barcode,
  User,
  Calendar,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface UploadedResult {
  id: string;
  patient_id: string;
  title: string;
  barcode: string | null;
  created_at: string;
  patient?: Patient;
}

const LabDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [isLabAdmin, setIsLabAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [uploadedResults, setUploadedResults] = useState<UploadedResult[]>([]);
  
  // Upload form state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [resultTitle, setResultTitle] = useState('');
  const [resultBarcode, setResultBarcode] = useState('');
  const [resultDescription, setResultDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkLabAdminRole();
    }
  }, [user]);

  const checkLabAdminRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data?.role === 'lab_admin') {
        setIsLabAdmin(true);
        fetchUploadedResults();
      }
    } catch (error) {
      console.error('Error checking role:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadedResults = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('id, patient_id, title, barcode, created_at')
        .eq('record_type', 'lab_result')
        .eq('lab_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploadedResults(data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const searchPatientByBarcode = async () => {
    if (!barcodeSearch.trim()) return;

    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('patient_id')
        .eq('barcode', barcodeSearch.trim())
        .single();

      if (error || !data) {
        toast({
          title: 'غير موجود',
          description: 'لم يتم العثور على مريض بهذا الباركود',
          variant: 'destructive',
        });
        return;
      }

      setSelectedPatient(data.patient_id);
      toast({
        title: 'تم العثور',
        description: 'تم العثور على المريض المرتبط بالباركود',
      });
    } catch (error) {
      console.error('Error searching by barcode:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadResult = async () => {
    if (!selectedPatient || !resultTitle || !file) {
      toast({
        title: 'خطأ',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('medical-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('medical-files')
        .getPublicUrl(fileName);

      // Create medical record
      const { error: recordError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: selectedPatient,
          title: resultTitle,
          record_type: 'lab_result',
          file_url: urlData.publicUrl,
          description: resultDescription,
          barcode: resultBarcode || null,
          lab_id: user?.id,
          review_status: 'pending',
        });

      if (recordError) throw recordError;

      toast({
        title: 'تم بنجاح',
        description: 'تم رفع نتيجة التحليل وسيتم إشعار المريض',
      });

      setUploadDialogOpen(false);
      resetForm();
      fetchUploadedResults();
    } catch (error: any) {
      console.error('Error uploading result:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء رفع النتيجة',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedPatient('');
    setResultTitle('');
    setResultBarcode('');
    setResultDescription('');
    setFile(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLabAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12 text-center" dir="rtl">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">غير مصرح</h1>
          <p className="text-muted-foreground">
            هذه الصفحة مخصصة للمختبرات الطبية فقط
          </p>
          <Button className="mt-4" onClick={() => navigate('/')}>
            العودة للرئيسية
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">لوحة تحكم المختبر</h1>
            <p className="text-muted-foreground">إدارة ورفع نتائج التحاليل للمرضى</p>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 ml-2" />
                رفع نتيجة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" dir="rtl">
              <DialogHeader>
                <DialogTitle>رفع نتيجة تحليل</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                {/* Barcode Search */}
                <div className="flex gap-2">
                  <Input
                    placeholder="البحث بالباركود..."
                    value={barcodeSearch}
                    onChange={(e) => setBarcodeSearch(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={searchPatientByBarcode}>
                    <Barcode className="w-4 h-4" />
                  </Button>
                </div>

                {/* Patient ID (manual entry for now) */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    معرف المريض *
                  </label>
                  <Input
                    placeholder="أدخل معرف المريض..."
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                  />
                </div>

                {/* Result Title */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    عنوان التحليل *
                  </label>
                  <Input
                    placeholder="مثال: تحليل دم شامل"
                    value={resultTitle}
                    onChange={(e) => setResultTitle(e.target.value)}
                  />
                </div>

                {/* Barcode */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    باركود النتيجة
                  </label>
                  <Input
                    placeholder="باركود التحليل (اختياري)"
                    value={resultBarcode}
                    onChange={(e) => setResultBarcode(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    ملاحظات
                  </label>
                  <Textarea
                    placeholder="ملاحظات إضافية..."
                    value={resultDescription}
                    onChange={(e) => setResultDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    ملف النتيجة *
                  </label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  {file && (
                    <p className="text-sm text-muted-foreground mt-1">
                      الملف: {file.name}
                    </p>
                  )}
                </div>

                <Button
                  onClick={uploadResult}
                  disabled={uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 ml-2" />
                      رفع النتيجة
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">النتائج المرفوعة</p>
                  <p className="text-2xl font-bold text-foreground">{uploadedResults.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المرضى</p>
                  <p className="text-2xl font-bold text-foreground">
                    {new Set(uploadedResults.map(r => r.patient_id)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">اليوم</p>
                  <p className="text-2xl font-bold text-foreground">
                    {uploadedResults.filter(r => 
                      new Date(r.created_at).toDateString() === new Date().toDateString()
                    ).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              النتائج المرفوعة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {uploadedResults.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد نتائج مرفوعة بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {uploadedResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{result.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.created_at).toLocaleDateString('ar-DZ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.barcode && (
                        <Badge variant="outline">
                          <Barcode className="w-3 h-3 ml-1" />
                          {result.barcode}
                        </Badge>
                      )}
                      <Badge className="bg-green-500/10 text-green-600">
                        <CheckCircle className="w-3 h-3 ml-1" />
                        تم الرفع
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LabDashboard;
