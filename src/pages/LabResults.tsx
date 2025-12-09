import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, AlertTriangle, CheckCircle, AlertCircle, Loader2, Camera, Barcode } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Navigate } from 'react-router-dom';

interface AnalysisResult {
  urgency_level: 'normal' | 'attention' | 'urgent' | 'critical';
  analysis: string;
  recommendations: string[];
  abnormal_values?: { name: string; value: string; normal_range: string; status: string }[];
}

const LabResults = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [textResults, setTextResults] = useState('');
  const [barcode, setBarcode] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setAnalysisResult(null);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const analyzeResults = async () => {
    if (!textResults && !selectedFile) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال نتائج التحاليل أو رفع صورة",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      let imageBase64: string | null = null;
      
      if (selectedFile) {
        imageBase64 = await convertToBase64(selectedFile);
      }

      const { data, error } = await supabase.functions.invoke('analyze-lab-results', {
        body: {
          labResults: textResults || null,
          imageBase64: imageBase64,
        }
      });

      if (error) throw error;

      setAnalysisResult(data);

      // Save to medical records
      const { error: saveError } = await supabase.from('medical_records').insert({
        patient_id: user.id,
        title: `تحليل ${new Date().toLocaleDateString('ar-DZ')}`,
        record_type: 'lab_result',
        ai_analysis: data.analysis,
        urgency_level: data.urgency_level,
        ai_recommendations: data.recommendations,
        barcode: barcode || null,
        analyzed_at: new Date().toISOString(),
      });

      if (saveError) {
        console.error('Error saving record:', saveError);
      }

      toast({
        title: "تم التحليل بنجاح",
        description: "تم حفظ النتائج في سجلك الطبي",
      });

    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "خطأ في التحليل",
        description: error.message || "حدث خطأ أثناء تحليل النتائج",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getUrgencyConfig = (level: string) => {
    switch (level) {
      case 'critical':
        return { color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50', icon: AlertTriangle, label: 'حرج - تدخل فوري!' };
      case 'urgent':
        return { color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50', icon: AlertCircle, label: 'عاجل - راجع طبيب قريباً' };
      case 'attention':
        return { color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-50', icon: AlertCircle, label: 'يحتاج متابعة' };
      default:
        return { color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50', icon: CheckCircle, label: 'طبيعي' };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">تحليل النتائج المخبرية</h1>
          <p className="text-muted-foreground mb-8">ارفع صورة تحاليلك أو أدخل النتائج يدوياً ليقوم الذكاء الاصطناعي بتحليلها</p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  رفع صورة التحاليل
                </CardTitle>
                <CardDescription>يدعم JPG, PNG, PDF</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                  ) : (
                    <>
                      <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">اضغط لرفع صورة أو التقاط صورة</p>
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

                <div className="flex items-center gap-2">
                  <Barcode className="h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="كود التحليل (اختياري)"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Text Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  إدخال النتائج يدوياً
                </CardTitle>
                <CardDescription>أدخل قيم التحاليل مع أسمائها</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={`مثال:
Glucose: 120 mg/dL
Hemoglobin: 12.5 g/dL
WBC: 8000 /μL
Cholesterol: 220 mg/dL`}
                  className="min-h-[200px] font-mono text-sm"
                  value={textResults}
                  onChange={(e) => setTextResults(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          <Button 
            className="w-full mt-6" 
            size="lg"
            onClick={analyzeResults}
            disabled={analyzing || (!textResults && !selectedFile)}
          >
            {analyzing ? (
              <>
                <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                جاري التحليل...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 ml-2" />
                تحليل النتائج
              </>
            )}
          </Button>

          {/* Results Section */}
          {analysisResult && (
            <Card className={`mt-8 ${getUrgencyConfig(analysisResult.urgency_level).bgLight}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>نتيجة التحليل</CardTitle>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getUrgencyConfig(analysisResult.urgency_level).color} text-white`}>
                    {(() => {
                      const Icon = getUrgencyConfig(analysisResult.urgency_level).icon;
                      return <Icon className="h-5 w-5" />;
                    })()}
                    {getUrgencyConfig(analysisResult.urgency_level).label}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">التحليل:</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{analysisResult.analysis}</p>
                </div>

                {analysisResult.abnormal_values && analysisResult.abnormal_values.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">القيم غير الطبيعية:</h3>
                    <div className="space-y-2">
                      {analysisResult.abnormal_values.map((item, index) => (
                        <div key={index} className="flex items-center justify-between bg-background p-3 rounded-lg">
                          <span className="font-medium">{item.name}</span>
                          <div className="flex items-center gap-4">
                            <span className={item.status === 'high' ? 'text-red-600' : 'text-blue-600'}>
                              {item.value} ({item.status === 'high' ? '↑' : '↓'})
                            </span>
                            <span className="text-muted-foreground text-sm">
                              الطبيعي: {item.normal_range}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">التوصيات:</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {analysisResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-muted-foreground">{rec}</li>
                    ))}
                  </ul>
                </div>

                {analysisResult.urgency_level === 'critical' && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700 font-bold">
                      <AlertTriangle className="h-6 w-6" />
                      تحذير: هذه الحالة تستوجب تدخلاً طبياً فورياً!
                    </div>
                    <p className="text-red-600 mt-2">يرجى التوجه إلى أقرب مستشفى أو الاتصال بالطوارئ.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default LabResults;
