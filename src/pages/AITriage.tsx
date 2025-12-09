import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Stethoscope, AlertTriangle, CheckCircle, AlertCircle, Loader2, 
  Plus, X, UserRound, Calendar, FileText 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Navigate, useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface TriageResult {
  urgency_level: 'normal' | 'attention' | 'urgent' | 'critical';
  recommended_specialty: string;
  specialty_fr: string;
  assessment: string;
  advice: string[];
  warning_signs: string[];
}

const commonSymptoms = [
  'صداع', 'حمى', 'سعال', 'ألم في الصدر', 'ضيق تنفس', 
  'غثيان', 'قيء', 'إسهال', 'ألم بطن', 'دوخة',
  'تعب عام', 'ألم مفاصل', 'طفح جلدي', 'حكة', 'ألم ظهر',
  'صعوبة بلع', 'ألم أذن', 'احتقان أنف', 'ألم عين', 'خفقان'
];

const AITriage = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<TriageResult | null>(null);

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

  const addSymptom = (symptom: string) => {
    if (!symptoms.includes(symptom)) {
      setSymptoms([...symptoms, symptom]);
    }
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter(s => s !== symptom));
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !symptoms.includes(customSymptom.trim())) {
      setSymptoms([...symptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const analyzeTriage = async () => {
    if (symptoms.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إضافة عرض واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-triage', {
        body: {
          symptoms,
          age: age || null,
          gender: gender || null,
          medicalHistory: medicalHistory || null,
        }
      });

      if (error) throw error;

      setResult(data);

      // Save to triage sessions
      await supabase.from('ai_triage_sessions').insert({
        user_id: user.id,
        symptoms,
        ai_response: data.assessment,
        urgency_level: data.urgency_level,
      });

      toast({
        title: "تم التقييم بنجاح",
        description: "يمكنك الآن رؤية التوصيات",
      });

    } catch (error: any) {
      console.error('Triage error:', error);
      toast({
        title: "خطأ في التقييم",
        description: error.message || "حدث خطأ أثناء تقييم الأعراض",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const getUrgencyConfig = (level: string) => {
    switch (level) {
      case 'critical':
        return { color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50', icon: AlertTriangle, label: 'حالة طوارئ!' };
      case 'urgent':
        return { color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50', icon: AlertCircle, label: 'عاجل' };
      case 'attention':
        return { color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-50', icon: AlertCircle, label: 'يحتاج متابعة' };
      default:
        return { color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50', icon: CheckCircle, label: 'حالة عادية' };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">المساعد الطبي الذكي</h1>
          </div>
          <p className="text-muted-foreground mb-8">أدخل أعراضك ليقوم الذكاء الاصطناعي بتقييم حالتك وتوجيهك للتخصص المناسب</p>

          <div className="grid gap-6">
            {/* Symptoms Selection */}
            <Card>
              <CardHeader>
                <CardTitle>اختر أعراضك</CardTitle>
                <CardDescription>اضغط على الأعراض التي تعاني منها</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {commonSymptoms.map((symptom) => (
                    <Badge
                      key={symptom}
                      variant={symptoms.includes(symptom) ? "default" : "outline"}
                      className="cursor-pointer text-sm py-1 px-3"
                      onClick={() => symptoms.includes(symptom) ? removeSymptom(symptom) : addSymptom(symptom)}
                    >
                      {symptom}
                      {symptoms.includes(symptom) && <X className="h-3 w-3 mr-1" />}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="أضف عرض آخر..."
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomSymptom()}
                  />
                  <Button variant="outline" onClick={addCustomSymptom}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {symptoms.length > 0 && (
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium mb-2">الأعراض المختارة:</p>
                    <div className="flex flex-wrap gap-2">
                      {symptoms.map((symptom) => (
                        <Badge key={symptom} variant="secondary" className="gap-1">
                          {symptom}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeSymptom(symptom)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle>معلومات إضافية (اختياري)</CardTitle>
                <CardDescription>تساعد في تحسين دقة التقييم</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      العمر
                    </Label>
                    <Input
                      type="number"
                      placeholder="مثال: 35"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <UserRound className="h-4 w-4" />
                      الجنس
                    </Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الجنس" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    التاريخ الطبي
                  </Label>
                  <Textarea
                    placeholder="اذكر أي أمراض مزمنة أو أدوية تتناولها..."
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full" 
              size="lg"
              onClick={analyzeTriage}
              disabled={analyzing || symptoms.length === 0}
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                  جاري التقييم...
                </>
              ) : (
                <>
                  <Stethoscope className="h-5 w-5 ml-2" />
                  تقييم الأعراض
                </>
              )}
            </Button>

            {/* Results */}
            {result && (
              <Card className={`${getUrgencyConfig(result.urgency_level).bgLight}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>نتيجة التقييم</CardTitle>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getUrgencyConfig(result.urgency_level).color} text-white`}>
                      {(() => {
                        const Icon = getUrgencyConfig(result.urgency_level).icon;
                        return <Icon className="h-5 w-5" />;
                      })()}
                      {getUrgencyConfig(result.urgency_level).label}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-background p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">التخصص المقترح:</h3>
                    <p className="text-xl text-primary font-bold">{result.recommended_specialty}</p>
                    <p className="text-muted-foreground">{result.specialty_fr}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">التقييم:</h3>
                    <p className="text-muted-foreground">{result.assessment}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">النصائح:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {result.advice.map((item, index) => (
                        <li key={index} className="text-muted-foreground">{item}</li>
                      ))}
                    </ul>
                  </div>

                  {result.warning_signs && result.warning_signs.length > 0 && (
                    <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                      <h3 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        علامات تحذيرية - توجه للطوارئ إذا ظهرت:
                      </h3>
                      <ul className="list-disc list-inside space-y-1">
                        {result.warning_signs.map((sign, index) => (
                          <li key={index} className="text-red-600">{sign}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button 
                    className="w-full"
                    onClick={() => navigate('/doctors')}
                  >
                    البحث عن طبيب {result.recommended_specialty}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    ⚠️ هذا تقييم أولي بالذكاء الاصطناعي وليس تشخيصاً طبياً. يرجى استشارة طبيب للتشخيص الدقيق.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AITriage;
