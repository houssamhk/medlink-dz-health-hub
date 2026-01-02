import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, MapPin, Clock, Building, Phone, Save, Navigation, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Navigate } from 'react-router-dom';

const wilayas = [
  'الجزائر', 'وهران', 'قسنطينة', 'سطيف', 'عنابة', 'باتنة', 'بليدة', 
  'تلمسان', 'بجاية', 'تيزي وزو', 'الجلفة', 'سيدي بلعباس'
];

const defaultWorkingHours: Record<string, { open: string; close: string; enabled: boolean }> = {
  sunday: { open: '08:00', close: '20:00', enabled: true },
  monday: { open: '08:00', close: '20:00', enabled: true },
  tuesday: { open: '08:00', close: '20:00', enabled: true },
  wednesday: { open: '08:00', close: '20:00', enabled: true },
  thursday: { open: '08:00', close: '20:00', enabled: true },
  friday: { open: '08:00', close: '12:00', enabled: false },
  saturday: { open: '08:00', close: '12:00', enabled: false },
};

const dayNames: Record<string, string> = {
  sunday: 'الأحد', monday: 'الإثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء',
  thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت',
};

const PharmacyProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { requestLocation } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [isPharmacist, setIsPharmacist] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    wilaya: '',
    phone: '',
    latitude: '',
    longitude: '',
    is_on_duty: false,
    working_hours: defaultWorkingHours
  });

  useEffect(() => {
    if (user) {
      checkRoleAndFetchData();
    }
  }, [user]);

  const checkRoleAndFetchData = async () => {
    // Check if user is pharmacist
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .eq('role', 'pharmacist')
      .maybeSingle();

    setIsPharmacist(!!roleData);

    if (roleData) {
      // Fetch pharmacy data
      const { data: pharmacyData } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (pharmacyData) {
        setPharmacyId(pharmacyData.id);
        const wh = pharmacyData.opening_hours as any || defaultWorkingHours;
        setFormData({
          name: pharmacyData.name || '',
          address: pharmacyData.address || '',
          wilaya: pharmacyData.wilaya || '',
          phone: pharmacyData.phone || '',
          latitude: pharmacyData.latitude?.toString() || '',
          longitude: pharmacyData.longitude?.toString() || '',
          is_on_duty: pharmacyData.is_on_duty || false,
          working_hours: wh
        });
      }
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
    if (!formData.name || !formData.address || !formData.wilaya) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    
    setSaving(true);

    const pharmacyData = {
      name: formData.name,
      address: formData.address,
      wilaya: formData.wilaya,
      phone: formData.phone,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      is_on_duty: formData.is_on_duty,
      opening_hours: formData.working_hours as any,
      user_id: user?.id,
    };

    let error;
    if (pharmacyId) {
      const result = await supabase
        .from('pharmacies')
        .update(pharmacyData)
        .eq('id', pharmacyId);
      error = result.error;
    } else {
      const result = await supabase
        .from('pharmacies')
        .insert(pharmacyData)
        .select()
        .single();
      error = result.error;
      if (result.data) setPharmacyId(result.data.id);
    }

    setSaving(false);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم الحفظ", description: "تم حفظ بيانات الصيدلية بنجاح" });
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

  if (!isPharmacist) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8" dir="rtl">
          <Card className="mt-20 max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
              <p className="text-muted-foreground">هذه الصفحة لأصحاب الصيدليات فقط</p>
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
        <div className="pt-20 max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-8">إعدادات الصيدلية</h1>
          
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
                    <Label>اسم الصيدلية *</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="صيدلية الشفاء"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الولاية *</Label>
                    <Select value={formData.wilaya} onValueChange={(v) => setFormData(p => ({ ...p, wilaya: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                      <SelectContent>
                        {wilayas.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>العنوان *</Label>
                  <Input 
                    value={formData.address} 
                    onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                    placeholder="شارع ديدوش مراد، رقم 10"
                  />
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

            {/* On Duty Status */}
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">حالة المناوبة</h3>
                    <p className="text-sm text-muted-foreground">هل الصيدلية مناوبة اليوم؟</p>
                  </div>
                  <Switch 
                    checked={formData.is_on_duty} 
                    onCheckedChange={(c) => setFormData(p => ({ ...p, is_on_duty: c }))} 
                  />
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
                          value={formData.working_hours[k]?.close || '20:00'} 
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

export default PharmacyProfile;
