import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, Building, MapPin, Clock, Phone, Settings, Users, 
  Calendar, CheckCircle, CreditCard, Star, BedDouble, UserCheck
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Navigate, Link } from 'react-router-dom';

interface ClinicData {
  id: string;
  name: string;
  address: string | null;
  wilaya: string;
  phone: string | null;
  bio: string | null;
  consultation_price: number | null;
  is_available: boolean;
  is_verified: boolean;
  latitude: number | null;
  longitude: number | null;
  working_hours: any;
  specialty_id: string | null;
  specialties?: { name_ar: string };
}

const ClinicDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalCapacity: 20,
    currentOccupancy: 0,
    waitingPatients: 0
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    // Fetch clinic
    const { data: clinicData } = await supabase
      .from('clinics')
      .select('*, specialties(name_ar)')
      .eq('user_id', user?.id)
      .maybeSingle();

    setClinic(clinicData);

    if (clinicData) {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch real data in parallel
      const [appointmentsRes, capacityRes] = await Promise.all([
        // Today's appointments for doctors in this clinic (if any)
        supabase
          .from('appointments')
          .select('id, appointment_date, appointment_time, status, patient_id')
          .eq('appointment_date', today)
          .in('status', ['pending', 'confirmed']),
        // Clinic capacity for today
        supabase
          .from('clinic_capacity')
          .select('*')
          .eq('clinic_id', clinicData.id)
          .eq('date', today)
          .maybeSingle()
      ]);

      const todayAppts = appointmentsRes.data || [];
      setTodayAppointments(todayAppts);
      
      const capacity = capacityRes.data;
      
      setStats({
        todayAppointments: todayAppts.length,
        totalCapacity: capacity?.total_rooms || capacity?.total_beds || 20,
        currentOccupancy: (capacity?.total_rooms || 0) - (capacity?.available_rooms || 0),
        waitingPatients: todayAppts.filter(a => a.status === 'pending').length
      });
    }

    setLoading(false);
  };

  const toggleAvailability = async () => {
    if (!clinic) return;
    
    setUpdatingAvailability(true);
    const newStatus = !clinic.is_available;
    
    const { error } = await supabase
      .from('clinics')
      .update({ is_available: newStatus })
      .eq('id', clinic.id);

    if (error) {
      toast({ title: "خطأ", description: "فشل تحديث الحالة", variant: "destructive" });
    } else {
      setClinic(prev => prev ? { ...prev, is_available: newStatus } : null);
      toast({ 
        title: "تم التحديث", 
        description: newStatus ? "العيادة متاحة للحجز" : "تم إيقاف الحجوزات مؤقتاً"
      });
    }
    setUpdatingAvailability(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!clinic) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24" dir="rtl">
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">لم يتم إعداد العيادة</h2>
              <p className="text-muted-foreground mb-4">يرجى إكمال بيانات عيادتك أولاً</p>
              <Link to="/profile">
                <Button>إعداد العيادة</Button>
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">لوحة تحكم العيادة</h1>
            <p className="text-muted-foreground">إدارة عيادتك والمواعيد</p>
          </div>
          <Link to="/profile">
            <Button variant="outline">
              <Settings className="h-4 w-4 ml-2" />
              تعديل البيانات
            </Button>
          </Link>
        </div>

        {/* Clinic Info Card */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Building className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{clinic.name}</h2>
                    {clinic.is_verified && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="h-3 w-3 ml-1" />
                        موثقة
                      </Badge>
                    )}
                  </div>
                  {clinic.specialties && (
                    <p className="text-primary font-medium">{clinic.specialties.name_ar}</p>
                  )}
                  {clinic.address && (
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{clinic.address}، {clinic.wilaya}</span>
                    </div>
                  )}
                  {clinic.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Phone className="h-4 w-4" />
                      <span dir="ltr">{clinic.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={clinic.is_available ? "default" : "secondary"} className="text-lg py-2 px-4">
                  {clinic.is_available ? "🟢 متاحة للحجز" : "🔴 غير متاحة"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">حالة التوفر</p>
                  <p className="text-xl font-bold">{clinic.is_available ? "متاحة" : "متوقفة"}</p>
                </div>
                <Switch 
                  checked={clinic.is_available} 
                  onCheckedChange={toggleAvailability}
                  disabled={updatingAvailability}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.todayAppointments}</p>
                  <p className="text-sm text-muted-foreground">مواعيد اليوم</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <BedDouble className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.currentOccupancy}/{stats.totalCapacity}</p>
                  <p className="text-sm text-muted-foreground">السعة الحالية</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <UserCheck className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.waitingPatients}</p>
                  <p className="text-sm text-muted-foreground">بانتظار الدور</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                المواعيد الحضورية
              </CardTitle>
              <CardDescription>المواعيد المحجوزة لليوم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد مواعيد لليوم</p>
                <p className="text-sm mt-2">ستظهر هنا المواعيد المحجوزة</p>
              </div>
            </CardContent>
          </Card>

          {/* Capacity & Rooms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BedDouble className="h-5 w-5" />
                السعة والغرف
              </CardTitle>
              <CardDescription>متابعة إشغال العيادة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">السعة الكلية</p>
                    <p className="text-sm text-muted-foreground">عدد المقاعد/الأسرة</p>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalCapacity}</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium text-green-700">متاح حالياً</p>
                    <p className="text-sm text-green-600">أماكن شاغرة</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{stats.totalCapacity - stats.currentOccupancy}</p>
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
            <CardContent>
              {clinic.working_hours ? (
                <div className="space-y-2">
                  {Object.entries(clinic.working_hours as Record<string, any>).map(([day, hours]) => {
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
                  <Link to="/profile">
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
              {clinic.latitude && clinic.longitude ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>تم تحديد الموقع بنجاح</span>
                  </div>
                  <div className="bg-muted p-4 rounded-lg text-sm">
                    <p>خط العرض: {clinic.latitude}</p>
                    <p>خط الطول: {clinic.longitude}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    سيتم عرض عيادتك على الخريطة للمرضى القريبين
                  </p>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>لم يتم تحديد الموقع</p>
                  <p className="text-sm mb-2">لن تظهر عيادتك على الخريطة</p>
                  <Link to="/profile">
                    <Button variant="outline" size="sm">تحديد الموقع</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clinic Info */}
          {clinic.bio && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>نبذة عن العيادة</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{clinic.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Pricing Info */}
          <Card className="lg:col-span-2">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">سعر الاستشارة</p>
                    <p className="text-sm text-muted-foreground">السعر المعروض للمرضى</p>
                  </div>
                </div>
                <p className="text-2xl font-bold">{clinic.consultation_price || 0} دج</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ClinicDashboard;