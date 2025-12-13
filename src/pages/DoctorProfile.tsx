import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Clock, FileText, Building, Phone, CreditCard, CheckCircle, Shield, Save } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Navigate } from 'react-router-dom';

interface Specialty {
  id: string;
  name_ar: string;
  name_fr: string;
}

const wilayas = [
  'الجزائر', 'وهران', 'قسنطينة', 'سطيف', 'عنابة', 'باتنة', 'بليدة', 
  'تلمسان', 'بجاية', 'تيزي وزو', 'الجلفة', 'سيدي بلعباس'
];

const defaultWorkingHours: Record<string, { open: string; close: string; enabled: boolean }> = {
  sunday: { open: '08:00', close: '16:00', enabled: true },
  monday: { open: '08:00', close: '16:00', enabled: true },
  tuesday: { open: '08:00', close: '16:00', enabled: true },
  wednesday: { open: '08:00', close: '16:00', enabled: true },
  thursday: { open: '08:00', close: '16:00', enabled: true },
  friday: { open: '08:00', close: '12:00', enabled: false },
  saturday: { open: '08:00', close: '12:00', enabled: false },
};

const dayNames: Record<string, string> = {
  sunday: 'الأحد', monday: 'الإثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء',
  thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت',
};

const DoctorProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  
  const [formData, setFormData] = useState({
    specialty_id: '', bio: '', clinic_name: '', clinic_address: '', wilaya: '',
    consultation_price: '', experience_years: '', license_number: '',
    telemedicine_enabled: false, accepts_insurance: false,
    working_hours: defaultWorkingHours
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [specialtiesRes, doctorRes] = await Promise.all([
      supabase.from('specialties').select('*').order('name_ar'),
      supabase.from('doctors').select('*').eq('user_id', user?.id).maybeSingle()
    ]);
    if (specialtiesRes.data) setSpecialties(specialtiesRes.data);
    if (doctorRes.data) {
      setDoctorId(doctorRes.data.id);
      setIsVerified(doctorRes.data.is_verified || false);
      const wh = doctorRes.data.working_hours as any || defaultWorkingHours;
      setFormData({
        specialty_id: doctorRes.data.specialty_id || '',
        bio: doctorRes.data.bio || '',
        clinic_name: doctorRes.data.clinic_name || '',
        clinic_address: doctorRes.data.clinic_address || '',
        wilaya: doctorRes.data.wilaya || '',
        consultation_price: doctorRes.data.consultation_price?.toString() || '',
        experience_years: doctorRes.data.experience_years?.toString() || '',
        license_number: doctorRes.data.license_number || '',
        telemedicine_enabled: doctorRes.data.telemedicine_enabled || false,
        accepts_insurance: doctorRes.data.accepts_insurance || false,
        working_hours: wh
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.specialty_id || !formData.wilaya || !formData.license_number) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('doctors').update({
      specialty_id: formData.specialty_id, bio: formData.bio, clinic_name: formData.clinic_name,
      clinic_address: formData.clinic_address, wilaya: formData.wilaya,
      consultation_price: formData.consultation_price ? parseFloat(formData.consultation_price) : null,
      experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
      license_number: formData.license_number, telemedicine_enabled: formData.telemedicine_enabled,
      accepts_insurance: formData.accepts_insurance, working_hours: formData.working_hours as any,
    }).eq('user_id', user?.id);
    setSaving(false);
    if (error) toast({ title: "خطأ", description: error.message, variant: "destructive" });
    else toast({ title: "تم الحفظ", description: "تم حفظ بيانات الملف الشخصي بنجاح" });
  };

  const updateWorkingHour = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      working_hours: { ...prev.working_hours, [day]: { ...prev.working_hours[day], [field]: value } }
    }));
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!doctorId) return <div className="min-h-screen bg-background"><Navbar /><main className="container mx-auto px-4 py-8" dir="rtl"><Card className="mt-20"><CardContent className="py-12 text-center"><Shield className="h-12 w-12 mx-auto text-yellow-500 mb-4" /><h2 className="text-xl font-bold mb-2">غير مصرح</h2><p className="text-muted-foreground">هذه الصفحة للأطباء فقط</p></CardContent></Card></main></div>;

  return (
    <div className="min-h-screen bg-background"><Navbar />
      <main className="container mx-auto px-4 py-8" dir="rtl">
        <div className="pt-20 max-w-4xl mx-auto">
          <div className="mb-8 flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">إكمال ملف الطبيب</h1>
            {isVerified && <CheckCircle className="h-6 w-6 text-green-500" />}
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />المعلومات الأساسية</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>التخصص *</Label>
                    <Select value={formData.specialty_id} onValueChange={(v) => setFormData(p => ({ ...p, specialty_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر التخصص" /></SelectTrigger>
                      <SelectContent>{specialties.map(s => <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>سنوات الخبرة</Label><Input type="number" value={formData.experience_years} onChange={(e) => setFormData(p => ({ ...p, experience_years: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><Label>نبذة تعريفية</Label><Textarea value={formData.bio} onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} rows={3} /></div>
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" />معلومات العيادة</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>اسم العيادة</Label><Input value={formData.clinic_name} onChange={(e) => setFormData(p => ({ ...p, clinic_name: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>الولاية *</Label>
                    <Select value={formData.wilaya} onValueChange={(v) => setFormData(p => ({ ...p, wilaya: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                      <SelectContent>{wilayas.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>عنوان العيادة</Label><Input value={formData.clinic_address} onChange={(e) => setFormData(p => ({ ...p, clinic_address: e.target.value }))} /></div>
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />الترخيص والأسعار</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>رقم الترخيص الطبي *</Label><Input value={formData.license_number} onChange={(e) => setFormData(p => ({ ...p, license_number: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>سعر الاستشارة (دج)</Label><Input type="number" value={formData.consultation_price} onChange={(e) => setFormData(p => ({ ...p, consultation_price: e.target.value }))} /></div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg"><div className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-muted-foreground" /><span>قبول التأمين</span></div><Switch checked={formData.accepts_insurance} onCheckedChange={(c) => setFormData(p => ({ ...p, accepts_insurance: c }))} /></div>
                <div className="flex items-center justify-between p-4 border rounded-lg"><div className="flex items-center gap-2"><Phone className="h-5 w-5 text-muted-foreground" /><span>التطبيب عن بعد</span></div><Switch checked={formData.telemedicine_enabled} onCheckedChange={(c) => setFormData(p => ({ ...p, telemedicine_enabled: c }))} /></div>
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />ساعات العمل</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(dayNames).map(([k, v]) => (
                  <div key={k} className={`flex items-center gap-4 p-3 rounded-lg border ${formData.working_hours[k]?.enabled ? 'bg-muted/50' : 'opacity-50'}`}>
                    <Switch checked={formData.working_hours[k]?.enabled ?? false} onCheckedChange={(c) => updateWorkingHour(k, 'enabled', c)} />
                    <span className="w-20 font-medium">{v}</span>
                    {formData.working_hours[k]?.enabled && (<><Input type="time" className="w-32" value={formData.working_hours[k]?.open || '08:00'} onChange={(e) => updateWorkingHour(k, 'open', e.target.value)} /><span>إلى</span><Input type="time" className="w-32" value={formData.working_hours[k]?.close || '16:00'} onChange={(e) => updateWorkingHour(k, 'close', e.target.value)} /></>)}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Button type="submit" className="w-full" size="lg" disabled={saving}>{saving ? <><Loader2 className="ml-2 h-5 w-5 animate-spin" />جاري الحفظ...</> : <><Save className="ml-2 h-5 w-5" />حفظ الملف الشخصي</>}</Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default DoctorProfile;
