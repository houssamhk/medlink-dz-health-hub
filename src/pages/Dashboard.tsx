import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calendar,
  FileText,
  Clock,
  Heart,
  User,
  Activity,
  Loader2,
} from 'lucide-react';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  reason: string | null;
  doctors: {
    clinic_name: string | null;
    specialties: {
      name_ar: string;
    } | null;
  } | null;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          reason,
          doctors (
            clinic_name,
            specialties (
              name_ar
            )
          )
        `)
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true })
        .limit(5);

      if (!error && data) {
        setAppointments(data as Appointment[]);
      }
      setLoading(false);
    };

    if (user) {
      fetchAppointments();
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    {
      title: 'المواعيد القادمة',
      value: appointments.filter(a => a.status === 'pending' || a.status === 'confirmed').length,
      icon: Calendar,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'السجلات الطبية',
      value: 0,
      icon: FileText,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
    },
    {
      title: 'ساعات الانتظار المحفوظة',
      value: '12+',
      icon: Clock,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      pending: 'قيد الانتظار',
      confirmed: 'مؤكد',
      completed: 'مكتمل',
      cancelled: 'ملغي',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            مرحباً، {user.user_metadata?.full_name || 'مستخدم'}! 👋
          </h1>
          <p className="text-muted-foreground">
            إدارة صحتك أصبحت أسهل مع MEDLINK DZ
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50 gradient-card">
            <CardContent className="p-4">
              <Heart className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">حجز موعد</h3>
              <p className="text-sm text-muted-foreground mb-3">ابحث عن طبيب واحجز</p>
              <Button size="sm" onClick={() => navigate('/doctors')}>البحث</Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 gradient-card">
            <CardContent className="p-4">
              <FileText className="w-8 h-8 text-secondary mb-2" />
              <h3 className="font-semibold mb-1">ملفي الطبي</h3>
              <p className="text-sm text-muted-foreground mb-3">جميع سجلاتك الطبية</p>
              <Button size="sm" variant="secondary" onClick={() => navigate('/medical-record')}>عرض</Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 gradient-card">
            <CardContent className="p-4">
              <Activity className="w-8 h-8 text-accent mb-2" />
              <h3 className="font-semibold mb-1">إرسال تحاليل</h3>
              <p className="text-sm text-muted-foreground mb-3">أرسل لطبيب مختار</p>
              <Button size="sm" variant="outline" onClick={() => navigate('/send-to-doctor')}>إرسال</Button>
            </CardContent>
          </Card>

          <Card className="border-border/50 gradient-card">
            <CardContent className="p-4">
              <Clock className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">رفع تحاليل</h3>
              <p className="text-sm text-muted-foreground mb-3">تحليل سريع بالذكاء</p>
              <Button size="sm" variant="outline" onClick={() => navigate('/lab-results')}>رفع</Button>
            </CardContent>
          </Card>
        </div>

        {/* Appointments */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              المواعيد القادمة
            </CardTitle>
            <Button variant="ghost" size="sm">
              عرض الكل
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">لا توجد مواعيد قادمة</p>
                <Button className="mt-4" onClick={() => navigate('/doctors')}>
                  احجز موعدك الأول
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {appointment.doctors?.specialties?.name_ar || 'موعد طبي'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.doctors?.clinic_name || 'عيادة'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">
                        {new Date(appointment.appointment_date).toLocaleDateString('ar-DZ')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.appointment_time}
                      </p>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
