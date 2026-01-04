import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Heart, Droplets, AlertCircle, Plus, X, Save, Building, MapPin, Clock, Phone } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/usePermissions';
import type { Json } from '@/integrations/supabase/types';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const WILAYAS = [
  'الجزائر', 'وهران', 'قسنطينة', 'عنابة', 'سطيف', 'باتنة', 'بجاية', 'تلمسان',
  'سكيكدة', 'بليدة', 'مستغانم', 'تيزي وزو', 'جيجل', 'البويرة', 'برج بوعريريج',
  'المسيلة', 'الجلفة', 'غرداية', 'بسكرة', 'المدية', 'تيارت', 'سعيدة', 'معسكر',
  'الشلف', 'عين الدفلى', 'تيسمسيلت', 'غليزان', 'سوق أهراس', 'قالمة', 'خنشلة',
  'تبسة', 'ورقلة', 'إليزي', 'تمنراست', 'أدرار', 'البيض', 'النعامة', 'بشار'
];

interface PatientProfile {
  full_name: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_type: string | null;
  wilaya: string | null;
  address: string | null;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
}

interface WorkingHour {
  open: string;
  close: string;
  enabled: boolean;
}

const defaultWorkingHours: Record<string, WorkingHour> = {
  sunday: { open: '08:00', close: '17:00', enabled: true },
  monday: { open: '08:00', close: '17:00', enabled: true },
  tuesday: { open: '08:00', close: '17:00', enabled: true },
  wednesday: { open: '08:00', close: '17:00', enabled: true },
  thursday: { open: '08:00', close: '17:00', enabled: true },
  friday: { open: '08:00', close: '12:00', enabled: false },
  saturday: { open: '08:00', close: '12:00', enabled: true },
};

const dayNames: Record<string, string> = {
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
  saturday: 'السبت',
};

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { requestLocation } = usePermissions();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Patient profile state
  const [patientProfile, setPatientProfile] = useState<PatientProfile>({
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    blood_type: '',
    wilaya: '',
    address: '',
    allergies: [],
    chronic_conditions: [],
  });
  
  // Pharmacy profile state
  const [pharmacyProfile, setPharmacyProfile] = useState({
    id: '',
    name: '',
    address: '',
    wilaya: '',
    phone: '',
    is_on_duty: false,
    latitude: null as number | null,
    longitude: null as number | null,
    opening_hours: defaultWorkingHours,
  });
  
  // Clinic profile state
  const [clinicProfile, setClinicProfile] = useState({
    id: '',
    name: '',
    address: '',
    wilaya: '',
    phone: '',
    bio: '',
    consultation_price: '',
    is_available: true,
    latitude: null as number | null,
    longitude: null as number | null,
    working_hours: defaultWorkingHours,
    specialty_id: '',
  });

  const [specialties, setSpecialties] = useState<Array<{id: string, name_ar: string}>>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || roleLoading) return;
    
    const fetchData = async () => {
      setLoading(true);
      
      if (role === 'patient') {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (data) {
          setPatientProfile({
            full_name: data.full_name || '',
            phone: data.phone || '',
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || '',
            blood_type: data.blood_type || '',
            wilaya: data.wilaya || '',
            address: data.address || '',
            allergies: data.allergies || [],
            chronic_conditions: data.chronic_conditions || [],
          });
        }
      } else if (role === 'pharmacist') {
        const { data } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (data) {
          setPharmacyProfile({
            id: data.id,
            name: data.name || '',
            address: data.address || '',
            wilaya: data.wilaya || '',
            phone: data.phone || '',
            is_on_duty: data.is_on_duty || false,
            latitude: data.latitude,
            longitude: data.longitude,
            opening_hours: (data.opening_hours as unknown as Record<string, WorkingHour>) || defaultWorkingHours,
          });
        }
      } else if (role === 'clinic') {
        const [{ data: clinicData }, { data: specialtiesData }] = await Promise.all([
          supabase.from('clinics').select('*').eq('user_id', user.id).maybeSingle(),
          supabase.from('specialties').select('id, name_ar'),
        ]);
        
        if (specialtiesData) setSpecialties(specialtiesData);
        
        if (clinicData) {
          setClinicProfile({
            id: clinicData.id,
            name: clinicData.name || '',
            address: clinicData.address || '',
            wilaya: clinicData.wilaya || '',
            phone: clinicData.phone || '',
            bio: clinicData.bio || '',
            consultation_price: clinicData.consultation_price?.toString() || '',
            is_available: clinicData.is_available ?? true,
            latitude: clinicData.latitude,
            longitude: clinicData.longitude,
            working_hours: (clinicData.working_hours as unknown as Record<string, WorkingHour>) || defaultWorkingHours,
            specialty_id: clinicData.specialty_id || '',
          });
        }
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [user, role, roleLoading]);

  const handleGetLocation = async () => {
    const granted = await requestLocation();
    if (granted && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (role === 'pharmacist') {
            setPharmacyProfile(prev => ({
              ...prev,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }));
          } else if (role === 'clinic') {
            setClinicProfile(prev => ({
              ...prev,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }));
          }
          toast({ title: "تم تحديد الموقع بنجاح" });
        },
        () => toast({ title: "خطأ", description: "تعذر الحصول على الموقع", variant: "destructive" })
      );
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      if (role === 'patient') {
        const { error } = await supabase
          .from('profiles')
          .update({
            ...patientProfile,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
        if (error) throw error;
      } else if (role === 'pharmacist') {
        const pharmacyData = {
          name: pharmacyProfile.name,
          address: pharmacyProfile.address,
          wilaya: pharmacyProfile.wilaya,
          phone: pharmacyProfile.phone,
          is_on_duty: pharmacyProfile.is_on_duty,
          latitude: pharmacyProfile.latitude,
          longitude: pharmacyProfile.longitude,
          opening_hours: JSON.parse(JSON.stringify(pharmacyProfile.opening_hours)),
          user_id: user.id,
        };
        
        if (pharmacyProfile.id) {
          const { error } = await supabase
            .from('pharmacies')
            .update(pharmacyData)
            .eq('id', pharmacyProfile.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('pharmacies')
            .insert(pharmacyData);
          if (error) throw error;
        }
      } else if (role === 'clinic') {
        const clinicData = {
          name: clinicProfile.name,
          address: clinicProfile.address,
          wilaya: clinicProfile.wilaya,
          phone: clinicProfile.phone,
          bio: clinicProfile.bio,
          consultation_price: clinicProfile.consultation_price ? parseFloat(clinicProfile.consultation_price) : null,
          is_available: clinicProfile.is_available,
          latitude: clinicProfile.latitude,
          longitude: clinicProfile.longitude,
          working_hours: JSON.parse(JSON.stringify(clinicProfile.working_hours)),
          specialty_id: clinicProfile.specialty_id || null,
          user_id: user.id,
        };
        
        if (clinicProfile.id) {
          const { error } = await supabase
            .from('clinics')
            .update(clinicData)
            .eq('id', clinicProfile.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('clinics')
            .insert(clinicData);
          if (error) throw error;
        }
      }

      toast({ title: "تم الحفظ بنجاح", description: "تم تحديث ملفك الشخصي" });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !patientProfile.allergies?.includes(newAllergy.trim())) {
      setPatientProfile({
        ...patientProfile,
        allergies: [...(patientProfile.allergies || []), newAllergy.trim()],
      });
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setPatientProfile({
      ...patientProfile,
      allergies: patientProfile.allergies?.filter(a => a !== allergy) || [],
    });
  };

  const addCondition = () => {
    if (newCondition.trim() && !patientProfile.chronic_conditions?.includes(newCondition.trim())) {
      setPatientProfile({
        ...patientProfile,
        chronic_conditions: [...(patientProfile.chronic_conditions || []), newCondition.trim()],
      });
      setNewCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    setPatientProfile({
      ...patientProfile,
      chronic_conditions: patientProfile.chronic_conditions?.filter(c => c !== condition) || [],
    });
  };

  const updateWorkingHour = (day: string, field: keyof WorkingHour, value: string | boolean) => {
    if (role === 'pharmacist') {
      setPharmacyProfile(prev => ({
        ...prev,
        opening_hours: {
          ...prev.opening_hours,
          [day]: { ...prev.opening_hours[day], [field]: value }
        }
      }));
    } else if (role === 'clinic') {
      setClinicProfile(prev => ({
        ...prev,
        working_hours: {
          ...prev.working_hours,
          [day]: { ...prev.working_hours[day], [field]: value }
        }
      }));
    }
  };

  const getRoleTitle = () => {
    switch (role) {
      case 'pharmacist': return 'ملف الصيدلية';
      case 'clinic': return 'ملف العيادة';
      case 'doctor': return 'ملف الطبيب';
      default: return 'ملفي الشخصي';
    }
  };

  const getRoleDescription = () => {
    switch (role) {
      case 'pharmacist': return 'أكمل بيانات صيدليتك للظهور على الخريطة';
      case 'clinic': return 'أكمل بيانات عيادتك لاستقبال المرضى';
      case 'doctor': return 'أكمل معلوماتك المهنية';
      default: return 'أكمل معلوماتك الطبية للحصول على رعاية أفضل';
    }
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect doctors to their specific profile page
  if (role === 'doctor') {
    navigate('/doctor-profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12" dir="rtl">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{getRoleTitle()}</h1>
              <p className="text-muted-foreground">{getRoleDescription()}</p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
              حفظ التغييرات
            </Button>
          </div>

          <div className="space-y-6">
            {/* Patient Profile Fields */}
            {role === 'patient' && (
              <>
                {/* المعلومات الأساسية */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      المعلومات الأساسية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>الاسم الكامل</Label>
                      <Input
                        value={patientProfile.full_name || ''}
                        onChange={(e) => setPatientProfile({ ...patientProfile, full_name: e.target.value })}
                        placeholder="محمد أحمد"
                      />
                    </div>
                    <div>
                      <Label>رقم الهاتف</Label>
                      <Input
                        value={patientProfile.phone || ''}
                        onChange={(e) => setPatientProfile({ ...patientProfile, phone: e.target.value })}
                        placeholder="0555123456"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label>تاريخ الميلاد</Label>
                      <Input
                        type="date"
                        value={patientProfile.date_of_birth || ''}
                        onChange={(e) => setPatientProfile({ ...patientProfile, date_of_birth: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>الجنس</Label>
                      <Select
                        value={patientProfile.gender || ''}
                        onValueChange={(v) => setPatientProfile({ ...patientProfile, gender: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الجنس" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">ذكر</SelectItem>
                          <SelectItem value="female">أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>الولاية</Label>
                      <Select
                        value={patientProfile.wilaya || ''}
                        onValueChange={(v) => setPatientProfile({ ...patientProfile, wilaya: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الولاية" />
                        </SelectTrigger>
                        <SelectContent>
                          {WILAYAS.map((w) => (
                            <SelectItem key={w} value={w}>{w}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>العنوان</Label>
                      <Input
                        value={patientProfile.address || ''}
                        onChange={(e) => setPatientProfile({ ...patientProfile, address: e.target.value })}
                        placeholder="الحي، الشارع..."
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* فصيلة الدم - للمرضى فقط */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="w-5 h-5 text-destructive" />
                      فصيلة الدم
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                      {BLOOD_TYPES.map((type) => (
                        <Button
                          key={type}
                          variant={patientProfile.blood_type === type ? 'default' : 'outline'}
                          className={patientProfile.blood_type === type ? 'bg-destructive hover:bg-destructive/90' : ''}
                          onClick={() => setPatientProfile({ ...patientProfile, blood_type: type })}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* الحساسية - للمرضى فقط */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-accent" />
                      الحساسية
                    </CardTitle>
                    <CardDescription>أضف أي أدوية أو مواد لديك حساسية منها</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-4">
                      <Input
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                        placeholder="مثال: البنسلين"
                        onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
                      />
                      <Button onClick={addAllergy} size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {patientProfile.allergies?.map((allergy) => (
                        <Badge key={allergy} variant="secondary" className="px-3 py-1">
                          {allergy}
                          <button onClick={() => removeAllergy(allergy)} className="mr-2">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      {(!patientProfile.allergies || patientProfile.allergies.length === 0) && (
                        <p className="text-sm text-muted-foreground">لا توجد حساسية مسجلة</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* الأمراض المزمنة - للمرضى فقط */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      الأمراض المزمنة
                    </CardTitle>
                    <CardDescription>أضف أي أمراض مزمنة تعاني منها</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-4">
                      <Input
                        value={newCondition}
                        onChange={(e) => setNewCondition(e.target.value)}
                        placeholder="مثال: السكري"
                        onKeyPress={(e) => e.key === 'Enter' && addCondition()}
                      />
                      <Button onClick={addCondition} size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {patientProfile.chronic_conditions?.map((condition) => (
                        <Badge key={condition} variant="outline" className="px-3 py-1 border-primary">
                          {condition}
                          <button onClick={() => removeCondition(condition)} className="mr-2">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      {(!patientProfile.chronic_conditions || patientProfile.chronic_conditions.length === 0) && (
                        <p className="text-sm text-muted-foreground">لا توجد أمراض مزمنة مسجلة</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Pharmacy Profile Fields */}
            {role === 'pharmacist' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-primary" />
                      معلومات الصيدلية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>اسم الصيدلية</Label>
                      <Input
                        value={pharmacyProfile.name}
                        onChange={(e) => setPharmacyProfile({ ...pharmacyProfile, name: e.target.value })}
                        placeholder="صيدلية الشفاء"
                      />
                    </div>
                    <div>
                      <Label>رقم الهاتف</Label>
                      <Input
                        value={pharmacyProfile.phone}
                        onChange={(e) => setPharmacyProfile({ ...pharmacyProfile, phone: e.target.value })}
                        placeholder="0555123456"
                        dir="ltr"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>العنوان</Label>
                      <Input
                        value={pharmacyProfile.address}
                        onChange={(e) => setPharmacyProfile({ ...pharmacyProfile, address: e.target.value })}
                        placeholder="الحي، الشارع..."
                      />
                    </div>
                    <div>
                      <Label>الولاية</Label>
                      <Select
                        value={pharmacyProfile.wilaya}
                        onValueChange={(v) => setPharmacyProfile({ ...pharmacyProfile, wilaya: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الولاية" />
                        </SelectTrigger>
                        <SelectContent>
                          {WILAYAS.map((w) => (
                            <SelectItem key={w} value={w}>{w}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label>حالة المناوبة</Label>
                      <Switch
                        checked={pharmacyProfile.is_on_duty}
                        onCheckedChange={(v) => setPharmacyProfile({ ...pharmacyProfile, is_on_duty: v })}
                      />
                      <span className={pharmacyProfile.is_on_duty ? 'text-green-600' : 'text-muted-foreground'}>
                        {pharmacyProfile.is_on_duty ? 'مناوبة' : 'غير مناوبة'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      الموقع الجغرافي
                    </CardTitle>
                    <CardDescription>حدد موقع صيدليتك للظهور على الخريطة</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>خط العرض</Label>
                        <Input
                          type="number"
                          step="any"
                          value={pharmacyProfile.latitude || ''}
                          onChange={(e) => setPharmacyProfile({ ...pharmacyProfile, latitude: parseFloat(e.target.value) || null })}
                          placeholder="36.7538"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <Label>خط الطول</Label>
                        <Input
                          type="number"
                          step="any"
                          value={pharmacyProfile.longitude || ''}
                          onChange={(e) => setPharmacyProfile({ ...pharmacyProfile, longitude: parseFloat(e.target.value) || null })}
                          placeholder="3.0588"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleGetLocation} className="w-full">
                      <MapPin className="w-4 h-4 ml-2" />
                      تحديد موقعي تلقائياً
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      ساعات العمل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(pharmacyProfile.opening_hours).map(([day, hours]) => (
                      <div key={day} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <Switch
                          checked={hours.enabled}
                          onCheckedChange={(v) => updateWorkingHour(day, 'enabled', v)}
                        />
                        <span className="w-24 font-medium">{dayNames[day]}</span>
                        {hours.enabled ? (
                          <>
                            <Input
                              type="time"
                              value={hours.open}
                              onChange={(e) => updateWorkingHour(day, 'open', e.target.value)}
                              className="w-32"
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateWorkingHour(day, 'close', e.target.value)}
                              className="w-32"
                            />
                          </>
                        ) : (
                          <span className="text-red-500">مغلق</span>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Clinic Profile Fields */}
            {role === 'clinic' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-primary" />
                      معلومات العيادة
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>اسم العيادة</Label>
                      <Input
                        value={clinicProfile.name}
                        onChange={(e) => setClinicProfile({ ...clinicProfile, name: e.target.value })}
                        placeholder="عيادة الشفاء"
                      />
                    </div>
                    <div>
                      <Label>رقم الهاتف</Label>
                      <Input
                        value={clinicProfile.phone}
                        onChange={(e) => setClinicProfile({ ...clinicProfile, phone: e.target.value })}
                        placeholder="0555123456"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label>التخصص</Label>
                      <Select
                        value={clinicProfile.specialty_id}
                        onValueChange={(v) => setClinicProfile({ ...clinicProfile, specialty_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر التخصص" />
                        </SelectTrigger>
                        <SelectContent>
                          {specialties.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>سعر الاستشارة (دج)</Label>
                      <Input
                        type="number"
                        value={clinicProfile.consultation_price}
                        onChange={(e) => setClinicProfile({ ...clinicProfile, consultation_price: e.target.value })}
                        placeholder="2000"
                        dir="ltr"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>العنوان</Label>
                      <Input
                        value={clinicProfile.address}
                        onChange={(e) => setClinicProfile({ ...clinicProfile, address: e.target.value })}
                        placeholder="الحي، الشارع..."
                      />
                    </div>
                    <div>
                      <Label>الولاية</Label>
                      <Select
                        value={clinicProfile.wilaya}
                        onValueChange={(v) => setClinicProfile({ ...clinicProfile, wilaya: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الولاية" />
                        </SelectTrigger>
                        <SelectContent>
                          {WILAYAS.map((w) => (
                            <SelectItem key={w} value={w}>{w}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label>متاحة للحجز</Label>
                      <Switch
                        checked={clinicProfile.is_available}
                        onCheckedChange={(v) => setClinicProfile({ ...clinicProfile, is_available: v })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>نبذة عن العيادة</Label>
                      <Textarea
                        value={clinicProfile.bio}
                        onChange={(e) => setClinicProfile({ ...clinicProfile, bio: e.target.value })}
                        placeholder="اكتب نبذة عن العيادة والخدمات المقدمة..."
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      الموقع الجغرافي
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>خط العرض</Label>
                        <Input
                          type="number"
                          step="any"
                          value={clinicProfile.latitude || ''}
                          onChange={(e) => setClinicProfile({ ...clinicProfile, latitude: parseFloat(e.target.value) || null })}
                          placeholder="36.7538"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <Label>خط الطول</Label>
                        <Input
                          type="number"
                          step="any"
                          value={clinicProfile.longitude || ''}
                          onChange={(e) => setClinicProfile({ ...clinicProfile, longitude: parseFloat(e.target.value) || null })}
                          placeholder="3.0588"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleGetLocation} className="w-full">
                      <MapPin className="w-4 h-4 ml-2" />
                      تحديد موقعي تلقائياً
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      ساعات العمل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(clinicProfile.working_hours).map(([day, hours]) => (
                      <div key={day} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                        <Switch
                          checked={hours.enabled}
                          onCheckedChange={(v) => updateWorkingHour(day, 'enabled', v)}
                        />
                        <span className="w-24 font-medium">{dayNames[day]}</span>
                        {hours.enabled ? (
                          <>
                            <Input
                              type="time"
                              value={hours.open}
                              onChange={(e) => updateWorkingHour(day, 'open', e.target.value)}
                              className="w-32"
                            />
                            <span>-</span>
                            <Input
                              type="time"
                              value={hours.close}
                              onChange={(e) => updateWorkingHour(day, 'close', e.target.value)}
                              className="w-32"
                            />
                          </>
                        ) : (
                          <span className="text-red-500">مغلق</span>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
