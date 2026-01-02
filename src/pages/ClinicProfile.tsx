import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Clock, Building, Phone, Save, Navigation, Shield, CreditCard } from 'lucide-react';
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

const ClinicProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { requestLocation } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    specialty_id: '',
    address: '',
    wilaya: '',
    phone: '',
    bio: '',
    consultation_price: '',
    latitude: '',
    longitude: '',
    is_available: true,
    working_hours: defaultWorkingHours
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [specialtiesRes, clinicRes] = await Promise.all([
      supabase.from('specialties').select('*').order('name_ar'),
      supabase.from('clinics').select('*').eq('user_id', user?.id).maybeSingle()
    ]);

    if (specialtiesRes.data) setSpecialties(specialtiesRes.data);
    
    if (clinicRes.data) {
      setClinicId(clinicRes.data.id);
      const wh = clinicRes.data.working_hours as any || defaultWorkingHours;
      setFormData({
        name: clinicRes.data.name || '',
        specialty_id: clinicRes.data.specialty_id || '',
        address: clinicRes.data.address || '',
        wilaya: clinicRes.data.wilaya || '',
        phone: clinicRes.data.phone || '',
        bio: clinicRes.data.bio || '',
        consultation_price: clinicRes.data.consultation_price?.toString() || '',
        latitude: clinicRes.data.latitude?.toString() || '',
        longitude: clinicRes.data.longitude?.toString() || '',
        is_available: clinicRes.data.is_available ?? true,
        working_hours: wh
      });
    }

    setLoading(false);
  };

  const handleGetLocation = async () => {
    const position = await requestLocation();
    if (position) {
      setFormData(prev => ({
        ...prev,
        latitude: position.coords.latitude.toString(),
        longitude: position.coords.longitude.toString()
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.wilaya) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    
    setSaving(true);

    const clinicData = {
      name: formData.name,
      specialty_id: formData.specialty_id || null,
      address: formData.address,
      wilaya: formData.wilaya,
      phone: formData.phone,
      bio: formData.bio,
      consultation_price: formData.consultation_price ? parseFloat(formData.consultation_price) : null,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      is_available: formData.is_available,
      working_hours: formData.working_hours as any,
      user_id: user?.id,
    };

    let error;
    if (clinicId) {
      const result = await supabase
        .from('clinics')
        .update(clinicData)
        .eq('id', clinicId);
      error = result.error;
    } else {
      const result = await supabase
        .from('clinics')
        .insert(clinicData)
        .select()
        .single();
      error = result.error;
      if (result.data) setClinicId(result.data.id);
    }

    setSaving(false);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم الحفظ", description: "تم حفظ بيانات العيادة بنجاح" });
    }
  };

  const updateWorkingHour = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      working_hours: { ...prev.working_hours, [day]: { ...prev.working_hours[day], [field]: value } }
    }));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8" dir="rtl">
        <div className="pt-20 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">إعدادات العيادة</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  المعلومات الأساسية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم العيادة *</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="عيادة الشفاء"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>التخصص</Label>
                    <Select value={formData.specialty_id} onValueChange={(v) => setFormData(p => ({ ...p, specialty_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر التخصص" /></SelectTrigger>
                      <SelectContent>
                        {specialties.map(s => <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الولاية *</Label>
                    <Select value={formData.wilaya} onValueChange={(v) => setFormData(p => ({ ...p, wilaya: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                      <SelectContent>
                        {wilayas.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>رقم الهاتف</Label>
                    <Input 
                      value={formData.phone} 
                      onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                      placeholder="0555123456"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <Input 
                    value={formData.address} 
                    onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                    placeholder="شارع ديدوش مراد، رقم 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نبذة عن العيادة</Label>
                  <Textarea 
                    value={formData.bio} 
                    onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                    placeholder="اكتب وصفاً مختصراً عن العيادة والخدمات المقدمة"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  الأسعار والتوفر
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>سعر الاستشارة (دج)</Label>
                  <Input 
                    type="number"
                    value={formData.consultation_price} 
                    onChange={(e) => setFormData(p => ({ ...p, consultation_price: e.target.value }))}
                    placeholder="2000"
                    dir="ltr"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">متاحة للحجز</h3>
                    <p className="text-sm text-muted-foreground">هل العيادة متاحة لاستقبال المرضى؟</p>
                  </div>
                  <Switch 
                    checked={formData.is_available} 
                    onCheckedChange={(c) => setFormData(p => ({ ...p, is_available: c }))} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  الموقع الجغرافي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button type="button" variant="outline" onClick={handleGetLocation} className="w-full">
                  <Navigation className="h-4 w-4 ml-2" />
                  تحديد موقعي الحالي تلقائياً
                </Button>
                <p className="text-sm text-muted-foreground text-center">أو أدخل الإحداثيات يدوياً:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>خط العرض (Latitude)</Label>
                    <Input 
                      type="number"
                      step="any"
                      value={formData.latitude} 
                      onChange={(e) => setFormData(p => ({ ...p, latitude: e.target.value }))}
                      placeholder="36.7538"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>خط الطول (Longitude)</Label>
                    <Input 
                      type="number"
                      step="any"
                      value={formData.longitude} 
                      onChange={(e) => setFormData(p => ({ ...p, longitude: e.target.value }))}
                      placeholder="3.0588"
                      dir="ltr"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  ساعات العمل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(dayNames).map(([k, v]) => (
                  <div 
                    key={k} 
                    className={`flex items-center gap-4 p-3 rounded-lg border ${
                      formData.working_hours[k]?.enabled ? 'bg-muted/50' : 'opacity-50'
                    }`}
                  >
                    <Switch 
                      checked={formData.working_hours[k]?.enabled ?? false} 
                      onCheckedChange={(c) => updateWorkingHour(k, 'enabled', c)} 
                    />
                    <span className="w-20 font-medium">{v}</span>
                    {formData.working_hours[k]?.enabled && (
                      <>
                        <Input 
                          type="time" 
                          className="w-32" 
                          value={formData.working_hours[k]?.open || '08:00'} 
                          onChange={(e) => updateWorkingHour(k, 'open', e.target.value)} 
                        />
                        <span>إلى</span>
                        <Input 
                          type="time" 
                          className="w-32" 
                          value={formData.working_hours[k]?.close || '16:00'} 
                          onChange={(e) => updateWorkingHour(k, 'close', e.target.value)} 
                        />
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" size="lg" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="ml-2 h-5 w-5" />
                  حفظ البيانات
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ClinicProfile;
