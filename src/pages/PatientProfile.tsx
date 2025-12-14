import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Heart, Droplets, AlertCircle, Plus, X, Save } from 'lucide-react';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const WILAYAS = [
  'الجزائر', 'وهران', 'قسنطينة', 'عنابة', 'سطيف', 'باتنة', 'بجاية', 'تلمسان',
  'سكيكدة', 'بليدة', 'مستغانم', 'تيزي وزو', 'جيجل', 'البويرة', 'برج بوعريريج'
];

interface Profile {
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

const PatientProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile>({
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
  
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setProfile({
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
      setLoading(false);
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث ملفك الشخصي",
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !profile.allergies?.includes(newAllergy.trim())) {
      setProfile({
        ...profile,
        allergies: [...(profile.allergies || []), newAllergy.trim()],
      });
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setProfile({
      ...profile,
      allergies: profile.allergies?.filter(a => a !== allergy) || [],
    });
  };

  const addCondition = () => {
    if (newCondition.trim() && !profile.chronic_conditions?.includes(newCondition.trim())) {
      setProfile({
        ...profile,
        chronic_conditions: [...(profile.chronic_conditions || []), newCondition.trim()],
      });
      setNewCondition('');
    }
  };

  const removeCondition = (condition: string) => {
    setProfile({
      ...profile,
      chronic_conditions: profile.chronic_conditions?.filter(c => c !== condition) || [],
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12" dir="rtl">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">ملفي الشخصي</h1>
              <p className="text-muted-foreground">أكمل معلوماتك الطبية للحصول على رعاية أفضل</p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
              حفظ التغييرات
            </Button>
          </div>

          <div className="space-y-6">
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
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="محمد أحمد"
                  />
                </div>
                <div>
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="0555123456"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label>تاريخ الميلاد</Label>
                  <Input
                    type="date"
                    value={profile.date_of_birth || ''}
                    onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <Label>الجنس</Label>
                  <Select
                    value={profile.gender || ''}
                    onValueChange={(v) => setProfile({ ...profile, gender: v })}
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
                    value={profile.wilaya || ''}
                    onValueChange={(v) => setProfile({ ...profile, wilaya: v })}
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
                    value={profile.address || ''}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="الحي، الشارع..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* المعلومات الطبية */}
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
                      variant={profile.blood_type === type ? 'default' : 'outline'}
                      className={profile.blood_type === type ? 'bg-destructive hover:bg-destructive/90' : ''}
                      onClick={() => setProfile({ ...profile, blood_type: type })}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* الحساسية */}
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
                  {profile.allergies?.map((allergy) => (
                    <Badge key={allergy} variant="secondary" className="px-3 py-1">
                      {allergy}
                      <button onClick={() => removeAllergy(allergy)} className="mr-2">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {(!profile.allergies || profile.allergies.length === 0) && (
                    <p className="text-sm text-muted-foreground">لا توجد حساسية مسجلة</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* الأمراض المزمنة */}
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
                  {profile.chronic_conditions?.map((condition) => (
                    <Badge key={condition} variant="outline" className="px-3 py-1 border-primary">
                      {condition}
                      <button onClick={() => removeCondition(condition)} className="mr-2">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {(!profile.chronic_conditions || profile.chronic_conditions.length === 0) && (
                    <p className="text-sm text-muted-foreground">لا توجد أمراض مزمنة مسجلة</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientProfile;
