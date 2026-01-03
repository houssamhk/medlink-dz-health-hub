import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Heart, Mail, Lock, User, ArrowLeft, Loader2, Stethoscope, UserCircle, Building, Pill } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('البريد الإلكتروني غير صالح');
const passwordSchema = z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');

type AccountType = 'patient' | 'doctor' | 'clinic' | 'pharmacist';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('patient');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkUserRoleAndRedirect();
    }
  }, [user]);

  const checkUserRoleAndRedirect = async () => {
    if (!user) return;
    
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isDoctor = roles?.some(r => r.role === 'doctor');
    const isPharmacist = roles?.some(r => r.role === 'pharmacist');
    const isAdmin = roles?.some(r => r.role === 'admin');

    // Check if clinic owner
    const { data: clinicData } = await supabase
      .from('clinics')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (isAdmin) {
      navigate('/admin');
    } else if (isDoctor) {
      navigate('/doctor-dashboard');
    } else if (isPharmacist) {
      navigate('/pharmacy-dashboard');
    } else if (clinicData) {
      navigate('/clinic-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const validateForm = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!isLogin && !fullName.trim()) {
        toast({
          title: 'خطأ',
          description: 'الرجاء إدخال الاسم الكامل',
          variant: 'destructive',
        });
        return false;
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'خطأ في التحقق',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      let message = 'حدث خطأ أثناء تسجيل الدخول';
      if (error.message.includes('Invalid login credentials')) {
        message = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
      }
      toast({
        title: 'خطأ',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'مرحباً بك!',
        description: 'تم تسجيل الدخول بنجاح',
      });
    }
    setIsLoading(false);
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            account_type: accountType,
          },
        },
      });

      if (error) {
        let message = 'حدث خطأ أثناء إنشاء الحساب';
        if (error.message.includes('already registered')) {
          message = 'هذا البريد الإلكتروني مسجل بالفعل';
        }
        toast({
          title: 'خطأ',
          description: message,
          variant: 'destructive',
        });
        return;
      }

      if (data.user) {
        // Wait a bit for the trigger to create the default role
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set appropriate role based on account type
        let role: 'patient' | 'doctor' | 'pharmacist' = 'patient';
        if (accountType === 'doctor' || accountType === 'clinic') {
          role = 'doctor';
        } else if (accountType === 'pharmacist') {
          role = 'pharmacist';
        }

        if (role !== 'patient') {
          // Try update first, then upsert if needed
          const { error: updateError } = await supabase
            .from('user_roles')
            .update({ role })
            .eq('user_id', data.user.id);
          
          // If update failed (no rows), insert the role
          if (updateError) {
            await supabase
              .from('user_roles')
              .upsert({ user_id: data.user.id, role }, { onConflict: 'user_id' });
          }
        }

        // Create appropriate profile based on account type
        if (accountType === 'doctor') {
          await supabase.from('doctors').insert({
            user_id: data.user.id,
            wilaya: 'الجزائر',
            is_verified: false,
          });
        } else if (accountType === 'clinic') {
          await supabase.from('clinics').insert({
            user_id: data.user.id,
            name: fullName,
            wilaya: 'الجزائر',
            is_verified: false,
          });
          // Also create doctor record for clinic
          await supabase.from('doctors').insert({
            user_id: data.user.id,
            wilaya: 'الجزائر',
            is_verified: false,
          });
        } else if (accountType === 'pharmacist') {
          await supabase.from('pharmacies').insert({
            user_id: data.user.id,
            name: fullName,
            address: '',
            wilaya: 'الجزائر',
          });
        }
      }

      const successMessages: Record<AccountType, string> = {
        patient: 'مرحباً بك في MEDLINK DZ',
        doctor: 'مرحباً بك! يمكنك الآن إكمال ملفك الشخصي كطبيب',
        clinic: 'مرحباً بك! يمكنك الآن إكمال بيانات عيادتك',
        pharmacist: 'مرحباً بك! يمكنك الآن إكمال بيانات صيدليتك',
      };

      toast({
        title: 'تم إنشاء الحساب!',
        description: successMessages[accountType],
      });

    } finally {
      setIsLoading(false);
    }
  };

  const accountTypeOptions = [
    {
      value: 'patient',
      icon: UserCircle,
      label: 'مريض',
      description: 'للبحث عن أطباء وحجز مواعيد',
    },
    {
      value: 'doctor',
      icon: Stethoscope,
      label: 'طبيب',
      description: 'لإدارة المواعيد والمرضى',
    },
    {
      value: 'clinic',
      icon: Building,
      label: 'عيادة',
      description: 'لإدارة عيادة طبية متكاملة',
    },
    {
      value: 'pharmacist',
      icon: Pill,
      label: 'صيدلية',
      description: 'لعرض صيدليتك على الخريطة',
    },
  ];

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          العودة للرئيسية
        </Button>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-card p-8 border border-border/50">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
              <Heart className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-gradient">MEDLINK DZ</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-foreground mb-2">
            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            {isLogin
              ? 'أدخل بياناتك للوصول إلى حسابك'
              : 'أنشئ حسابك للوصول إلى جميع الخدمات الطبية'}
          </p>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); isLogin ? handleLogin(e) : handleSignUp(); }} className="space-y-5">
            {!isLogin && (
              <>
                {/* Account Type Selection */}
                <div className="space-y-3">
                  <Label className="text-foreground">نوع الحساب</Label>
                  <RadioGroup
                    value={accountType}
                    onValueChange={(v) => setAccountType(v as AccountType)}
                    className="grid grid-cols-2 gap-3"
                  >
                    {accountTypeOptions.map((option) => (
                      <div 
                        key={option.value}
                        className={`flex flex-col items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${
                          accountType === option.value 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                        <label htmlFor={option.value} className="cursor-pointer text-center w-full">
                          <option.icon className={`h-7 w-7 mx-auto mb-1 ${
                            accountType === option.value ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <span className="font-medium text-sm">{option.label}</span>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{option.description}</p>
                        </label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground">
                    {accountType === 'clinic' ? 'اسم العيادة' : 
                     accountType === 'pharmacist' ? 'اسم الصيدلية' : 
                     'الاسم الكامل'}
                  </Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={
                        accountType === 'doctor' ? 'د. محمد أحمد' :
                        accountType === 'clinic' ? 'عيادة الشفاء' :
                        accountType === 'pharmacist' ? 'صيدلية النجاح' :
                        'الاسم الكامل'
                      }
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pr-11 text-right"
                      dir="rtl"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-11"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11"
                  dir="ltr"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isLogin ? (
                'تسجيل الدخول'
              ) : (
                <>
                  {accountType === 'patient' && 'إنشاء حساب مريض'}
                  {accountType === 'doctor' && 'إنشاء حساب طبيب'}
                  {accountType === 'clinic' && 'إنشاء حساب عيادة'}
                  {accountType === 'pharmacist' && 'إنشاء حساب صيدلية'}
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-semibold hover:underline mr-2"
              >
                {isLogin ? 'سجل الآن' : 'سجل الدخول'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
