import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import AnalyticsCharts from '@/components/analytics/AnalyticsCharts';
import DataExport from '@/components/reports/DataExport';
import {
  Users, UserCheck, Calendar, FileText, Building2, 
  Settings, Shield, Loader2, Search, CheckCircle, XCircle,
  TrendingUp, Activity, BarChart3, Download
} from 'lucide-react';

interface Doctor {
  id: string;
  user_id: string;
  is_verified: boolean;
  license_number: string | null;
  clinic_name: string | null;
  wilaya: string;
  created_at: string;
  profiles?: { full_name: string; email: string };
  specialties?: { name_ar: string };
}

interface Stats {
  total_users: number;
  verified_doctors: number;
  total_appointments: number;
  completed_appointments: number;
  total_records: number;
  total_pharmacies: number;
}

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  
  // Analytics data
  const [appointmentsData, setAppointmentsData] = useState<{ name: string; count: number }[]>([]);
  const [specialtiesData, setSpecialtiesData] = useState<{ name: string; value: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; appointments: number; records: number }[]>([]);
  const [wilayaData, setWilayaData] = useState<{ wilaya: string; count: number }[]>([]);

  useEffect(() => {
    if (user) {
      checkAdminRole();
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      fetchAnalyticsData();
    }
  }, [isAdmin]);

  const checkAdminRole = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .eq('role', 'admin')
      .single();
    
    setIsAdmin(!!data);
  };

  const fetchData = async () => {
    setLoadingData(true);
    
    const { data: doctorsData } = await supabase
      .from('doctors')
      .select(`*, specialties (name_ar)`)
      .order('created_at', { ascending: false });

    if (doctorsData) {
      const userIds = doctorsData.map(d => d.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const enrichedDoctors = doctorsData.map(doctor => ({
        ...doctor,
        profiles: profilesData?.find(p => p.id === doctor.user_id)
      }));
      
      setDoctors(enrichedDoctors);
    }

    const [usersRes, doctorsRes, appointmentsRes, recordsRes, pharmaciesRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('is_verified', true),
      supabase.from('appointments').select('id, status', { count: 'exact' }),
      supabase.from('medical_records').select('id', { count: 'exact', head: true }),
      supabase.from('pharmacies').select('id', { count: 'exact', head: true })
    ]);

    const completedCount = appointmentsRes.data?.filter(a => a.status === 'completed').length || 0;

    setStats({
      total_users: usersRes.count || 0,
      verified_doctors: doctorsRes.count || 0,
      total_appointments: appointmentsRes.count || 0,
      completed_appointments: completedCount,
      total_records: recordsRes.count || 0,
      total_pharmacies: pharmaciesRes.count || 0
    });

    setLoadingData(false);
  };

  const fetchAnalyticsData = async () => {
    // Appointments by status
    const { data: appointments } = await supabase.from('appointments').select('status');
    if (appointments) {
      const statusCounts: Record<string, number> = {};
      appointments.forEach(a => {
        const status = a.status || 'pending';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      setAppointmentsData([
        { name: 'قيد الانتظار', count: statusCounts['pending'] || 0 },
        { name: 'مؤكد', count: statusCounts['confirmed'] || 0 },
        { name: 'مكتمل', count: statusCounts['completed'] || 0 },
        { name: 'ملغي', count: statusCounts['cancelled'] || 0 },
      ]);
    }

    // Specialties distribution
    const { data: doctorsWithSpec } = await supabase
      .from('doctors')
      .select('specialty_id, specialties(name_ar)');
    if (doctorsWithSpec) {
      const specCounts: Record<string, number> = {};
      doctorsWithSpec.forEach(d => {
        const name = d.specialties?.name_ar || 'غير محدد';
        specCounts[name] = (specCounts[name] || 0) + 1;
      });
      setSpecialtiesData(
        Object.entries(specCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8)
      );
    }

    // Monthly data - fetch real data from appointments
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const { data: monthlyAppointments } = await supabase
      .from('appointments')
      .select('created_at, status')
      .gte('created_at', sixMonthsAgo.toISOString());

    const { data: monthlyRecords } = await supabase
      .from('medical_records')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString());

    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const now = new Date();
    const monthlyStats = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      
      const appointmentsInMonth = monthlyAppointments?.filter(a => {
        const d = new Date(a.created_at);
        return d.getMonth() === monthIndex && d.getFullYear() === year;
      }).length || 0;
      
      const recordsInMonth = monthlyRecords?.filter(r => {
        const d = new Date(r.created_at);
        return d.getMonth() === monthIndex && d.getFullYear() === year;
      }).length || 0;
      
      monthlyStats.push({ month: months[monthIndex], appointments: appointmentsInMonth, records: recordsInMonth });
    }
    setMonthlyData(monthlyStats);

    // Wilaya distribution
    const { data: doctorsByWilaya } = await supabase
      .from('doctors')
      .select('wilaya')
      .eq('is_verified', true);
    if (doctorsByWilaya) {
      const wilayaCounts: Record<string, number> = {};
      doctorsByWilaya.forEach(d => {
        wilayaCounts[d.wilaya] = (wilayaCounts[d.wilaya] || 0) + 1;
      });
      setWilayaData(
        Object.entries(wilayaCounts)
          .map(([wilaya, count]) => ({ wilaya, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
      );
    }
  };

  const verifyDoctor = async (doctorId: string, verify: boolean) => {
    const { error } = await supabase
      .from('doctors')
      .update({ is_verified: verify })
      .eq('id', doctorId);

    if (error) {
      toast({ title: "خطأ", description: "حدث خطأ", variant: "destructive" });
    } else {
      toast({ title: "تم", description: verify ? "تم التحقق من الطبيب" : "تم إلغاء التحقق" });
      fetchData();
    }
  };

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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24" dir="rtl">
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
              <p className="text-muted-foreground">هذه الصفحة للمسؤولين فقط</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const filteredDoctors = doctors.filter(d => 
    d.profiles?.full_name?.includes(searchTerm) ||
    d.clinic_name?.includes(searchTerm) ||
    d.wilaya?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24" dir="rtl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">لوحة تحكم المسؤول</h1>
          <p className="text-muted-foreground">إدارة المنصة والمستخدمين والتحليلات</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="py-4 text-center">
                <Users className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{stats.total_users}</p>
                <p className="text-xs text-muted-foreground">المستخدمين</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <UserCheck className="h-6 w-6 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">{stats.verified_doctors}</p>
                <p className="text-xs text-muted-foreground">أطباء موثقين</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <Calendar className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{stats.total_appointments}</p>
                <p className="text-xs text-muted-foreground">المواعيد</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <CheckCircle className="h-6 w-6 mx-auto text-emerald-500 mb-2" />
                <p className="text-2xl font-bold">{stats.completed_appointments}</p>
                <p className="text-xs text-muted-foreground">مواعيد مكتملة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <FileText className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold">{stats.total_records}</p>
                <p className="text-xs text-muted-foreground">سجلات طبية</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <Building2 className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold">{stats.total_pharmacies}</p>
                <p className="text-xs text-muted-foreground">الصيدليات</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="analytics">
          <TabsList className="mb-6">
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4 ml-2" />
              التحليلات
            </TabsTrigger>
            <TabsTrigger value="doctors">
              <UserCheck className="h-4 w-4 ml-2" />
              إدارة الأطباء
            </TabsTrigger>
            <TabsTrigger value="reports">
              <Download className="h-4 w-4 ml-2" />
              التقارير
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 ml-2" />
              الإعدادات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsCharts 
              appointmentsData={appointmentsData}
              specialtiesData={specialtiesData}
              monthlyData={monthlyData}
              wilayaData={wilayaData}
            />
          </TabsContent>

          <TabsContent value="doctors">
            <Card>
              <CardHeader>
                <CardTitle>الأطباء المسجلين</CardTitle>
                <CardDescription>التحقق من الأطباء وإدارة حساباتهم</CardDescription>
                <div className="relative mt-4">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث عن طبيب..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredDoctors.map((doctor) => (
                      <div key={doctor.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{doctor.profiles?.full_name || 'غير معروف'}</h3>
                            {doctor.is_verified ? (
                              <Badge className="bg-green-500">موثق</Badge>
                            ) : (
                              <Badge variant="secondary">بانتظار التوثيق</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {doctor.specialties?.name_ar || 'تخصص غير محدد'} | {doctor.wilaya}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            رقم الرخصة: {doctor.license_number || 'غير متوفر'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {!doctor.is_verified ? (
                            <Button size="sm" onClick={() => verifyDoctor(doctor.id, true)}>
                              <CheckCircle className="h-4 w-4 ml-2" />
                              توثيق
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => verifyDoctor(doctor.id, false)}>
                              <XCircle className="h-4 w-4 ml-2" />
                              إلغاء التوثيق
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DataExport userType="admin" userId={user?.id} />
              <Card>
                <CardHeader>
                  <CardTitle>تقارير سريعة</CardTitle>
                  <CardDescription>تقارير جاهزة للتحميل</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 ml-2" />
                    تقرير الأطباء الموثقين
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 ml-2" />
                    تقرير المواعيد الشهري
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 ml-2" />
                    تقرير الصيدليات المناوبة
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات النظام</CardTitle>
                <CardDescription>تكوين إعدادات المنصة</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  إعدادات النظام قيد التطوير
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
