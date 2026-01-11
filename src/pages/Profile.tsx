import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, User, Clock, FileText, Building, Phone, CreditCard, 
  Save, MapPin, Upload, Stethoscope, Heart, Plus, X, CheckCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Navigate } from 'react-router-dom';

interface Specialty {
  id: string;
  name_ar: string;
  name_fr: string;
}

const wilayas = [
  'الجزائر', 'وهران', 'قسنطينة', 'سطيف', 'عنابة', 'باتنة', 'بليدة', 
  'تلمسان', 'بجاية', 'تيزي وزو', 'الجلفة', 'سيدي بلعباس', 'غرداية',
  'ورقلة', 'المسيلة', 'البويرة', 'برج بوعريريج', 'سكيكدة', 'جيجل'
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

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Patient fields
  const [patientData, setPatientData] = useState({
    full_name: '', phone: '', date_of_birth: '', gender: '', blood_type: '',
    wilaya: '', address: '', allergies: [] as string[], chronic_conditions: [] as string[]
  });
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  // Doctor fields
  const [doctorData, setDoctorData] = useState({
    specialty_id: '', bio: '', clinic_name: '', clinic_address: '', wilaya: '',
    consultation_price: '', experience_years: '', license_number: '',
    telemedicine_enabled: false, accepts_insurance: false,
    working_hours: defaultWorkingHours,
    certificate_url: ''
  });
  const [isVerified, setIsVerified] = useState(false);

  // Pharmacy fields
  const [pharmacyData, setPharmacyData] = useState({
    name: '', address: '', wilaya: '', phone: '', latitude: null as number | null, longitude: null as number | null,
    opening_hours: defaultWorkingHours
  });

  // Clinic fields
  const [clinicData, setClinicData] = useState({
    name: '', address: '', wilaya: '', phone: '', bio: '', specialty_id: '',
    consultation_price: '', latitude: null as number | null, longitude: null as number | null,
    working_hours: defaultWorkingHours, capacity: ''
  });

  useEffect(() => {
    if (user && role) {
      fetchData();
    }
  }, [user, role]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch specialties for doctors/clinics
    if (role === 'doctor' || role === 'clinic') {
      const { data } = await supabase.from('specialties').select('*').order('name_ar');
      if (data) setSpecialties(data);
    }

    // Fetch role-specific data
    if (role === 'patient') {
      // Fetch profile data
      const { data } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      // Fetch medical data from separate secure table
      const { data: medicalData } = await supabase.from('patient_medical_data').select('*').eq('patient_id', user?.id).maybeSingle();
      
      if (data) {
        setPatientData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
          blood_type: medicalData?.blood_type || '',
          wilaya: data.wilaya || '',
          address: data.address || '',
          allergies: medicalData?.allergies || [],
          chronic_conditions: medicalData?.chronic_conditions || []
        });
      }
    } else if (role === 'doctor') {
      const { data } = await supabase.from('doctors').select('*').eq('user_id', user?.id).maybeSingle();
      if (data) {
        setIsVerified(data.is_verified || false);
        setDoctorData({
          specialty_id: data.specialty_id || '',
          bio: data.bio || '',
          clinic_name: data.clinic_name || '',
          clinic_address: data.clinic_address || '',
          wilaya: data.wilaya || '',
          consultation_price: data.consultation_price?.toString() || '',
          experience_years: data.experience_years?.toString() || '',
          license_number: data.license_number || '',
          telemedicine_enabled: data.telemedicine_enabled || false,
          accepts_insurance: data.accepts_insurance || false,
          working_hours: (data.working_hours as any) || defaultWorkingHours,
          certificate_url: ''
        });
      }
      // Also fetch profile name
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();
      if (profile) setPatientData(prev => ({ ...prev, full_name: profile.full_name || '' }));
    } else if (role === 'pharmacist') {
      const { data } = await supabase.from('pharmacies').select('*').eq('user_id', user?.id).maybeSingle();
      if (data) {
        setPharmacyData({
          name: data.name || '',
          address: data.address || '',
          wilaya: data.wilaya || '',
          phone: data.phone || '',
          latitude: data.latitude,
          longitude: data.longitude,
          opening_hours: (data.opening_hours as any) || defaultWorkingHours
        });
      }
    } else if (role === 'clinic') {
      const { data } = await supabase.from('clinics').select('*').eq('user_id', user?.id).maybeSingle();
      if (data) {
        setClinicData({
          name: data.name || '',
          address: data.address || '',
          wilaya: data.wilaya || '',
          phone: data.phone || '',
          bio: data.bio || '',
          specialty_id: data.specialty_id || '',
          consultation_price: data.consultation_price?.toString() || '',
          latitude: data.latitude,
          longitude: data.longitude,
          working_hours: (data.working_hours as any) || defaultWorkingHours,
          capacity: ''
        });
      }
    }
    
    setLoading(false);
  };

  const getCurrentLocation = async (type: 'pharmacy' | 'clinic') => {
    if (!navigator.geolocation) {
      toast({ title: "خطأ", description: "المتصفح لا يدعم تحديد الموقع", variant: "destructive" });
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (type === 'pharmacy') {
          setPharmacyData(prev => ({ ...prev, latitude, longitude }));
        } else {
          setClinicData(prev => ({ ...prev, latitude, longitude }));
        }
        toast({ title: "تم", description: "تم تحديد الموقع بنجاح" });
        setGettingLocation(false);
      },
      (error) => {
        toast({ title: "خطأ", description: "فشل تحديد الموقع: " + error.message, variant: "destructive" });
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    let error = null;

    try {
      if (role === 'patient') {
        // Update profile data (non-medical)
        const { error: profileError } = await supabase.from('profiles').update({
          full_name: patientData.full_name,
          phone: patientData.phone,
          date_of_birth: patientData.date_of_birth || null,
          gender: patientData.gender || null,
          wilaya: patientData.wilaya || null,
          address: patientData.address || null,
        }).eq('id', user?.id);
        
        // Update or insert medical data in separate secure table
        const { error: medicalError } = await supabase.from('patient_medical_data').upsert({
          patient_id: user?.id,
          blood_type: patientData.blood_type || null,
          allergies: patientData.allergies,
          chronic_conditions: patientData.chronic_conditions
        }, { onConflict: 'patient_id' });
        
        error = profileError || medicalError;
      } else if (role === 'doctor') {
        // Update profile name
        await supabase.from('profiles').update({ full_name: patientData.full_name }).eq('id', user?.id);
        
        const { error: e } = await supabase.from('doctors').update({
          specialty_id: doctorData.specialty_id || null,
          bio: doctorData.bio || null,
          clinic_name: doctorData.clinic_name || null,
          clinic_address: doctorData.clinic_address || null,
          wilaya: doctorData.wilaya,
          consultation_price: doctorData.consultation_price ? parseFloat(doctorData.consultation_price) : null,
          experience_years: doctorData.experience_years ? parseInt(doctorData.experience_years) : null,
          license_number: doctorData.license_number || null,
          telemedicine_enabled: doctorData.telemedicine_enabled,
          accepts_insurance: doctorData.accepts_insurance,
          working_hours: JSON.parse(JSON.stringify(doctorData.working_hours))
        }).eq('user_id', user?.id);
        error = e;
      } else if (role === 'pharmacist') {
        // Check if pharmacy exists
        const { data: existing } = await supabase.from('pharmacies').select('id').eq('user_id', user?.id).maybeSingle();
        
        if (existing) {
          const { error: e } = await supabase.from('pharmacies').update({
            name: pharmacyData.name,
            address: pharmacyData.address,
            wilaya: pharmacyData.wilaya,
            phone: pharmacyData.phone || null,
            latitude: pharmacyData.latitude,
            longitude: pharmacyData.longitude,
            opening_hours: JSON.parse(JSON.stringify(pharmacyData.opening_hours))
          }).eq('user_id', user?.id);
          error = e;
        } else {
          // Pharmacists can't insert - need to have it created by admin
          toast({ title: "خطأ", description: "لا يمكن إنشاء صيدلية جديدة. يرجى التواصل مع الإدارة.", variant: "destructive" });
          setSaving(false);
          return;
        }
      } else if (role === 'clinic') {
        // Check if clinic exists
        const { data: existing } = await supabase.from('clinics').select('id').eq('user_id', user?.id).maybeSingle();
        
        if (existing) {
          const { error: e } = await supabase.from('clinics').update({
            name: clinicData.name,
            address: clinicData.address,
            wilaya: clinicData.wilaya,
            phone: clinicData.phone || null,
            bio: clinicData.bio || null,
            specialty_id: clinicData.specialty_id || null,
            consultation_price: clinicData.consultation_price ? parseFloat(clinicData.consultation_price) : null,
            latitude: clinicData.latitude,
            longitude: clinicData.longitude,
            working_hours: JSON.parse(JSON.stringify(clinicData.working_hours))
          }).eq('user_id', user?.id);
          error = e;
        } else {
          const { error: e } = await supabase.from('clinics').insert({
            user_id: user?.id,
            name: clinicData.name,
            address: clinicData.address || '',
            wilaya: clinicData.wilaya || 'الجزائر',
            phone: clinicData.phone || null,
            bio: clinicData.bio || null,
            specialty_id: clinicData.specialty_id || null,
            consultation_price: clinicData.consultation_price ? parseFloat(clinicData.consultation_price) : null,
            latitude: clinicData.latitude,
            longitude: clinicData.longitude,
            working_hours: JSON.parse(JSON.stringify(clinicData.working_hours))
          });
          error = e;
        }
      }

      if (error) {
        toast({ title: "خطأ", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "تم الحفظ", description: "تم حفظ البيانات بنجاح" });
      }
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setPatientData(prev => ({ ...prev, allergies: [...prev.allergies, newAllergy.trim()] }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (index: number) => {
    setPatientData(prev => ({ ...prev, allergies: prev.allergies.filter((_, i) => i !== index) }));
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      setPatientData(prev => ({ ...prev, chronic_conditions: [...prev.chronic_conditions, newCondition.trim()] }));
      setNewCondition('');
    }
  };

  const removeCondition = (index: number) => {
    setPatientData(prev => ({ ...prev, chronic_conditions: prev.chronic_conditions.filter((_, i) => i !== index) }));
  };

  const updateDoctorWorkingHour = (day: string, field: string, value: string | boolean) => {
    setDoctorData(prev => ({
      ...prev,
      working_hours: { ...prev.working_hours, [day]: { ...prev.working_hours[day], [field]: value } }
    }));
  };

  const updatePharmacyWorkingHour = (day: string, field: string, value: string | boolean) => {
    setPharmacyData(prev => ({
      ...prev,
      opening_hours: { ...prev.opening_hours, [day]: { ...prev.opening_hours[day], [field]: value } }
    }));
  };

  const updateClinicWorkingHour = (day: string, field: string, value: string | boolean) => {
    setClinicData(prev => ({
      ...prev,
      working_hours: { ...prev.working_hours, [day]: { ...prev.working_hours[day], [field]: value } }
    }));
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const getPageTitle = () => {
    switch (role) {
      case 'doctor': return 'الملف الشخصي - طبيب';
      case 'pharmacist': return 'الملف الشخصي - صيدلية';
      case 'clinic': return 'الملف الشخصي - عيادة';
      default: return 'الملف الشخصي';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">{getPageTitle()}</h1>
            {role === 'doctor' && isVerified && <CheckCircle className="h-6 w-6 text-green-500" />}
          </div>

          {/* PATIENT PROFILE */}
          {role === 'patient' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    المعلومات الشخصية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الاسم الكامل</Label>
                      <Input value={patientData.full_name} onChange={(e) => setPatientData(p => ({ ...p, full_name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input value={patientData.phone} onChange={(e) => setPatientData(p => ({ ...p, phone: e.target.value }))} dir="ltr" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>تاريخ الميلاد</Label>
                      <Input type="date" value={patientData.date_of_birth} onChange={(e) => setPatientData(p => ({ ...p, date_of_birth: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>الجنس</Label>
                      <Select value={patientData.gender} onValueChange={(v) => setPatientData(p => ({ ...p, gender: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">ذكر</SelectItem>
                          <SelectItem value="female">أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الولاية</Label>
                      <Select value={patientData.wilaya} onValueChange={(v) => setPatientData(p => ({ ...p, wilaya: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                        <SelectContent>{wilayas.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>العنوان</Label>
                      <Input value={patientData.address} onChange={(e) => setPatientData(p => ({ ...p, address: e.target.value }))} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    المعلومات الصحية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>فصيلة الدم</Label>
                    <Select value={patientData.blood_type} onValueChange={(v) => setPatientData(p => ({ ...p, blood_type: v }))}>
                      <SelectTrigger className="w-[200px]"><SelectValue placeholder="اختر فصيلة الدم" /></SelectTrigger>
                      <SelectContent>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>الحساسيات</Label>
                    <div className="flex gap-2">
                      <Input value={newAllergy} onChange={(e) => setNewAllergy(e.target.value)} placeholder="أضف حساسية" onKeyPress={(e) => e.key === 'Enter' && addAllergy()} />
                      <Button type="button" variant="outline" onClick={addAllergy}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {patientData.allergies.map((a, i) => (
                        <span key={i} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          {a}
                          <button onClick={() => removeAllergy(i)}><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>الأمراض المزمنة</Label>
                    <div className="flex gap-2">
                      <Input value={newCondition} onChange={(e) => setNewCondition(e.target.value)} placeholder="أضف مرض مزمن" onKeyPress={(e) => e.key === 'Enter' && addCondition()} />
                      <Button type="button" variant="outline" onClick={addCondition}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {patientData.chronic_conditions.map((c, i) => (
                        <span key={i} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          {c}
                          <button onClick={() => removeCondition(i)}><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* DOCTOR PROFILE */}
          {role === 'doctor' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5" />
                    المعلومات الأساسية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الاسم الكامل *</Label>
                      <Input value={patientData.full_name} onChange={(e) => setPatientData(p => ({ ...p, full_name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>التخصص *</Label>
                      <Select value={doctorData.specialty_id} onValueChange={(v) => setDoctorData(p => ({ ...p, specialty_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختر التخصص" /></SelectTrigger>
                        <SelectContent>{specialties.map(s => <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رقم الترخيص الطبي *</Label>
                      <Input value={doctorData.license_number} onChange={(e) => setDoctorData(p => ({ ...p, license_number: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>سنوات الخبرة</Label>
                      <Input type="number" value={doctorData.experience_years} onChange={(e) => setDoctorData(p => ({ ...p, experience_years: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>نبذة تعريفية</Label>
                    <Textarea value={doctorData.bio} onChange={(e) => setDoctorData(p => ({ ...p, bio: e.target.value }))} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>رفع الشهادات المهنية</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">اضغط لرفع الشهادات (PDF, صور)</p>
                      <Input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    معلومات العيادة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم العيادة</Label>
                      <Input value={doctorData.clinic_name} onChange={(e) => setDoctorData(p => ({ ...p, clinic_name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>الولاية *</Label>
                      <Select value={doctorData.wilaya} onValueChange={(v) => setDoctorData(p => ({ ...p, wilaya: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                        <SelectContent>{wilayas.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>عنوان العيادة</Label>
                    <Input value={doctorData.clinic_address} onChange={(e) => setDoctorData(p => ({ ...p, clinic_address: e.target.value }))} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    الأسعار والخدمات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>سعر الاستشارة (دج)</Label>
                    <Input type="number" value={doctorData.consultation_price} onChange={(e) => setDoctorData(p => ({ ...p, consultation_price: e.target.value }))} />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <span>قبول التأمين</span>
                    </div>
                    <Switch checked={doctorData.accepts_insurance} onCheckedChange={(c) => setDoctorData(p => ({ ...p, accepts_insurance: c }))} />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <span>التطبيب عن بعد</span>
                    </div>
                    <Switch checked={doctorData.telemedicine_enabled} onCheckedChange={(c) => setDoctorData(p => ({ ...p, telemedicine_enabled: c }))} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    ساعات العمل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(dayNames).map(([key, name]) => (
                    <div key={key} className={`flex items-center gap-4 p-3 rounded-lg border ${doctorData.working_hours[key]?.enabled ? 'bg-muted/50' : 'opacity-50'}`}>
                      <Switch checked={doctorData.working_hours[key]?.enabled ?? false} onCheckedChange={(c) => updateDoctorWorkingHour(key, 'enabled', c)} />
                      <span className="w-20 font-medium">{name}</span>
                      {doctorData.working_hours[key]?.enabled && (
                        <>
                          <Input type="time" className="w-32" value={doctorData.working_hours[key]?.open || '08:00'} onChange={(e) => updateDoctorWorkingHour(key, 'open', e.target.value)} />
                          <span>إلى</span>
                          <Input type="time" className="w-32" value={doctorData.working_hours[key]?.close || '16:00'} onChange={(e) => updateDoctorWorkingHour(key, 'close', e.target.value)} />
                        </>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* PHARMACY PROFILE */}
          {role === 'pharmacist' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    معلومات الصيدلية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم الصيدلية *</Label>
                      <Input value={pharmacyData.name} onChange={(e) => setPharmacyData(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input value={pharmacyData.phone} onChange={(e) => setPharmacyData(p => ({ ...p, phone: e.target.value }))} dir="ltr" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الولاية *</Label>
                      <Select value={pharmacyData.wilaya} onValueChange={(v) => setPharmacyData(p => ({ ...p, wilaya: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                        <SelectContent>{wilayas.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>العنوان *</Label>
                      <Input value={pharmacyData.address} onChange={(e) => setPharmacyData(p => ({ ...p, address: e.target.value }))} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    الموقع الجغرافي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button type="button" variant="outline" onClick={() => getCurrentLocation('pharmacy')} disabled={gettingLocation}>
                    {gettingLocation ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <MapPin className="h-4 w-4 ml-2" />}
                    تحديد موقعي الحالي
                  </Button>
                  {pharmacyData.latitude && pharmacyData.longitude && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">تم تحديد الموقع</span>
                      </div>
                      <p className="text-sm text-muted-foreground">خط العرض: {pharmacyData.latitude?.toFixed(6)}</p>
                      <p className="text-sm text-muted-foreground">خط الطول: {pharmacyData.longitude?.toFixed(6)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    ساعات العمل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(dayNames).map(([key, name]) => (
                    <div key={key} className={`flex items-center gap-4 p-3 rounded-lg border ${pharmacyData.opening_hours[key]?.enabled ? 'bg-muted/50' : 'opacity-50'}`}>
                      <Switch checked={pharmacyData.opening_hours[key]?.enabled ?? false} onCheckedChange={(c) => updatePharmacyWorkingHour(key, 'enabled', c)} />
                      <span className="w-20 font-medium">{name}</span>
                      {pharmacyData.opening_hours[key]?.enabled && (
                        <>
                          <Input type="time" className="w-32" value={pharmacyData.opening_hours[key]?.open || '08:00'} onChange={(e) => updatePharmacyWorkingHour(key, 'open', e.target.value)} />
                          <span>إلى</span>
                          <Input type="time" className="w-32" value={pharmacyData.opening_hours[key]?.close || '16:00'} onChange={(e) => updatePharmacyWorkingHour(key, 'close', e.target.value)} />
                        </>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* CLINIC PROFILE */}
          {role === 'clinic' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    معلومات العيادة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>اسم العيادة *</Label>
                      <Input value={clinicData.name} onChange={(e) => setClinicData(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>التخصص</Label>
                      <Select value={clinicData.specialty_id} onValueChange={(v) => setClinicData(p => ({ ...p, specialty_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختر التخصص" /></SelectTrigger>
                        <SelectContent>{specialties.map(s => <SelectItem key={s.id} value={s.id}>{s.name_ar}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input value={clinicData.phone} onChange={(e) => setClinicData(p => ({ ...p, phone: e.target.value }))} dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <Label>سعة العيادة (عدد المقاعد)</Label>
                      <Input type="number" value={clinicData.capacity} onChange={(e) => setClinicData(p => ({ ...p, capacity: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الولاية *</Label>
                      <Select value={clinicData.wilaya} onValueChange={(v) => setClinicData(p => ({ ...p, wilaya: v }))}>
                        <SelectTrigger><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
                        <SelectContent>{wilayas.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>سعر الاستشارة (دج)</Label>
                      <Input type="number" value={clinicData.consultation_price} onChange={(e) => setClinicData(p => ({ ...p, consultation_price: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input value={clinicData.address} onChange={(e) => setClinicData(p => ({ ...p, address: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>نبذة عن العيادة</Label>
                    <Textarea value={clinicData.bio} onChange={(e) => setClinicData(p => ({ ...p, bio: e.target.value }))} rows={3} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    الموقع الجغرافي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button type="button" variant="outline" onClick={() => getCurrentLocation('clinic')} disabled={gettingLocation}>
                    {gettingLocation ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <MapPin className="h-4 w-4 ml-2" />}
                    تحديد موقعي الحالي
                  </Button>
                  {clinicData.latitude && clinicData.longitude && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">تم تحديد الموقع</span>
                      </div>
                      <p className="text-sm text-muted-foreground">خط العرض: {clinicData.latitude?.toFixed(6)}</p>
                      <p className="text-sm text-muted-foreground">خط الطول: {clinicData.longitude?.toFixed(6)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    ساعات العمل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(dayNames).map(([key, name]) => (
                    <div key={key} className={`flex items-center gap-4 p-3 rounded-lg border ${clinicData.working_hours[key]?.enabled ? 'bg-muted/50' : 'opacity-50'}`}>
                      <Switch checked={clinicData.working_hours[key]?.enabled ?? false} onCheckedChange={(c) => updateClinicWorkingHour(key, 'enabled', c)} />
                      <span className="w-20 font-medium">{name}</span>
                      {clinicData.working_hours[key]?.enabled && (
                        <>
                          <Input type="time" className="w-32" value={clinicData.working_hours[key]?.open || '08:00'} onChange={(e) => updateClinicWorkingHour(key, 'open', e.target.value)} />
                          <span>إلى</span>
                          <Input type="time" className="w-32" value={clinicData.working_hours[key]?.close || '16:00'} onChange={(e) => updateClinicWorkingHour(key, 'close', e.target.value)} />
                        </>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full mt-6" size="lg" disabled={saving}>
            {saving ? (
              <><Loader2 className="ml-2 h-5 w-5 animate-spin" />جاري الحفظ...</>
            ) : (
              <><Save className="ml-2 h-5 w-5" />حفظ التغييرات</>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Profile;