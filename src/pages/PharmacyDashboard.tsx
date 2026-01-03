import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, MapPin, Clock, Phone, Settings, Pill, Users, TrendingUp, Calendar, CheckCircle, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Navigate, Link } from 'react-router-dom';

interface PharmacyData {
  id: string;
  name: string;
  address: string;
  wilaya: string;
  phone: string | null;
  is_on_duty: boolean;
  latitude: number | null;
  longitude: number | null;
  opening_hours: any;
}

const PharmacyDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isPharmacist, setIsPharmacist] = useState(false);
  const [pharmacy, setPharmacy] = useState<PharmacyData | null>(null);
  const [updatingDuty, setUpdatingDuty] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    // Check role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .eq('role', 'pharmacist')
      .maybeSingle();

    setIsPharmacist(!!roleData);

    if (roleData) {
      // Fetch pharmacy
      const { data: pharmacyData } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      setPharmacy(pharmacyData);
    }

    setLoading(false);
  };

  const toggleDutyStatus = async () => {
    if (!pharmacy) return;
    
    setUpdatingDuty(true);
    const newStatus = !pharmacy.is_on_duty;
    
    const { error } = await supabase
      .from('pharmacies')
      .update({ is_on_duty: newStatus, duty_date: newStatus ? new Date().toISOString().split('T')[0] : null })
      .eq('id', pharmacy.id);

    if (error) {
      toast({ title: "خطأ", description: "فشل تحديث حالة المناوبة", variant: "destructive" });
    } else {
      setPharmacy(prev => prev ? { ...prev, is_on_duty: newStatus } : null);
      toast({ 
        title: "تم التحديث", 
        description: newStatus ? "أنت الآن في المناوبة" : "تم إيقاف حالة المناوبة"
      });
    }
    setUpdatingDuty(false);
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
        <main className="container mx-auto px-4 py-8 pt-24" dir="rtl">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
              <p className="text-muted-foreground mb-4">هذه الصفحة لأصحاب الصيدليات فقط</p>
              <Link to="/dashboard">
                <Button>العودة للوحة التحكم</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24" dir="rtl">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">لم يتم إعداد الصيدلية</h2>
              <p className="text-muted-foreground mb-4">يرجى إكمال بيانات صيدليتك أولاً</p>
              <Link to="/pharmacy-profile">
                <Button>إعداد الصيدلية</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24" dir="rtl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">لوحة تحكم الصيدلية</h1>
          <p className="text-muted-foreground">إدارة صيدليتك وحالة المناوبة</p>
        </div>

        {/* Pharmacy Info Card */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{pharmacy.name}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{pharmacy.address}، {pharmacy.wilaya}</span>
                  </div>
                  {pharmacy.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Phone className="h-4 w-4" />
                      <span dir="ltr">{pharmacy.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={pharmacy.is_on_duty ? "default" : "secondary"} className="text-lg py-2 px-4">
                  {pharmacy.is_on_duty ? "🟢 مناوبة" : "🔴 غير مناوبة"}
                </Badge>
                <Link to="/pharmacy-profile">
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">حالة المناوبة</p>
                  <p className="text-xl font-bold">{pharmacy.is_on_duty ? "نشطة" : "متوقفة"}</p>
                </div>
                <Switch 
                  checked={pharmacy.is_on_duty} 
                  onCheckedChange={toggleDutyStatus}
                  disabled={updatingDuty}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">زيارات اليوم</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Pill className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">وصفات مستلمة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">إجمالي هذا الشهر</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                ساعات العمل
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pharmacy.opening_hours ? (
                <div className="space-y-2">
                  {Object.entries(pharmacy.opening_hours as Record<string, any>).map(([day, hours]) => {
                    const dayNames: Record<string, string> = {
                      sunday: 'الأحد', monday: 'الإثنين', tuesday: 'الثلاثاء', 
                      wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت'
                    };
                    return (
                      <div key={day} className="flex justify-between items-center py-2 border-b last:border-0">
                        <span className="font-medium">{dayNames[day] || day}</span>
                        {hours?.enabled ? (
                          <span className="text-muted-foreground">{hours.open} - {hours.close}</span>
                        ) : (
                          <span className="text-red-500">مغلق</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>لم يتم تحديد ساعات العمل</p>
                  <Link to="/pharmacy-profile">
                    <Button variant="link" size="sm">تحديد الآن</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                الموقع الجغرافي
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pharmacy.latitude && pharmacy.longitude ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>تم تحديد الموقع بنجاح</span>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-sm">
                    <p>خط العرض: {pharmacy.latitude}</p>
                    <p>خط الطول: {pharmacy.longitude}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    سيتم عرض صيدليتك على الخريطة للمرضى القريبين منك
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>لم يتم تحديد الموقع</p>
                  <p className="text-sm mb-2">لن تظهر صيدليتك على الخريطة</p>
                  <Link to="/pharmacy-profile">
                    <Button variant="outline" size="sm">تحديد الموقع</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                النشاط الأخير
              </CardTitle>
              <CardDescription>آخر الأنشطة والتحديثات</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد أنشطة حالياً</p>
                <p className="text-sm mt-2">ستظهر هنا الوصفات والطلبات المستلمة</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PharmacyDashboard;
