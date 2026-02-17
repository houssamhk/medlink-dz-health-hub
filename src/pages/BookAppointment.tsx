import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Clock, MapPin, Star, Loader2, CheckCircle, User } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Navigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Doctor {
  id: string;
  user_id: string;
  wilaya: string;
  clinic_name: string;
  clinic_address: string;
  consultation_price: number;
  rating: number;
  total_reviews: number;
  telemedicine_enabled: boolean;
  specialties: { name_ar: string; name_fr: string } | null;
  profiles?: { full_name: string } | null;
  available_slots?: number;
}

interface Specialty {
  id: string;
  name_ar: string;
  name_fr: string;
}

const WILAYAS = [
  'الجزائر', 'وهران', 'قسنطينة', 'عنابة', 'سطيف', 'باتنة', 'بجاية', 'تلمسان',
  'سكيكدة', 'بليدة', 'مستغانم', 'تيزي وزو', 'جيجل', 'البويرة', 'برج بوعريريج'
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

const BookAppointment = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState(1);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [filters, setFilters] = useState({
    specialty: searchParams.get('specialty') || '',
    wilaya: searchParams.get('wilaya') || ''
  });
  
  const [booking, setBooking] = useState({
    doctor: null as Doctor | null,
    date: undefined as Date | undefined,
    time: '',
    reason: '',
    isTelemedicine: false
  });

  useEffect(() => {
    fetchSpecialties();
  }, []);

  useEffect(() => {
    if (filters.specialty || filters.wilaya) {
      fetchDoctors();
    }
  }, [filters]);

  const fetchSpecialties = async () => {
    const { data } = await supabase.from('specialties').select('*');
    setSpecialties(data || []);
  };

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    
    let query = supabase
      .from('doctors')
      .select(`
        *,
        specialties(name_ar, name_fr)
      `)
      .eq('is_available', true);

    if (filters.specialty) {
      query = query.eq('specialty_id', filters.specialty);
    }
    if (filters.wilaya) {
      query = query.eq('wilaya', filters.wilaya);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching doctors:', error);
    } else if (data) {
      // Fetch doctor profiles (names)
      const userIds = data.map((d: any) => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      // Enrich doctors with profile names
      const enrichedData = data.map((doc: any) => ({
        ...doc,
        profiles: profiles?.find(p => p.id === doc.user_id)
      }));

      // حساب المواعيد المتاحة لكل طبيب
      const today = new Date().toISOString().split('T')[0];
      const { data: capacities } = await supabase
        .from('doctor_capacity')
        .select('*')
        .eq('date', today);

      const doctorsWithSlots = enrichedData.map(doctor => {
        const capacity = capacities?.find(c => c.doctor_id === doctor.id);
        const maxAppointments = capacity?.max_appointments || 20;
        const currentAppointments = capacity?.current_appointments || 0;
        return {
          ...doctor,
          available_slots: maxAppointments - currentAppointments
        };
      }).filter(d => d.available_slots > 0);

      setDoctors(doctorsWithSlots);
    }
    setLoadingDoctors(false);
  };

  const submitBooking = async () => {
    if (!booking.doctor || !booking.date || !booking.time) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('appointments').insert({
        patient_id: user?.id,
        doctor_id: booking.doctor.id,
        appointment_date: format(booking.date, 'yyyy-MM-dd'),
        appointment_time: booking.time,
        reason: booking.reason,
        is_telemedicine: booking.isTelemedicine,
        status: 'pending'
      });

      if (error) throw error;

      toast({
        title: "تم الحجز بنجاح!",
        description: "سيتم تأكيد موعدك قريباً",
      });

      setStep(4); // صفحة التأكيد

    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "خطأ في الحجز",
        description: error.message || "حدث خطأ أثناء الحجز",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">حجز موعد</h1>
          <p className="text-muted-foreground mb-8">احجز موعدك مع الطبيب المناسب في أقل من دقيقة</p>

          {/* خطوات الحجز */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-20 h-1 mx-2 ${step > s ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          {/* الخطوة 1: اختيار الطبيب */}
          {step === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>ابحث عن طبيب</CardTitle>
                  <CardDescription>اختر التخصص والولاية</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <Select
                    value={filters.specialty}
                    onValueChange={(v) => setFilters({...filters, specialty: v})}
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

                  <Select
                    value={filters.wilaya}
                    onValueChange={(v) => setFilters({...filters, wilaya: v})}
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
                </CardContent>
              </Card>

              {loadingDoctors ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : doctors.length > 0 ? (
                <div className="grid gap-4">
                  {doctors.map((doctor) => (
                    <Card 
                      key={doctor.id}
                      className={`cursor-pointer transition-all ${
                        booking.doctor?.id === doctor.id 
                          ? 'ring-2 ring-primary' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setBooking({...booking, doctor})}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">د. {doctor.profiles?.full_name || 'طبيب'}</h3>
                              <p className="text-primary">{doctor.specialties?.name_ar}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <MapPin className="h-4 w-4" />
                                <span>{doctor.clinic_name} - {doctor.wilaya}</span>
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  <span className="text-sm">{doctor.rating || '0'}</span>
                                </div>
                                <Badge variant="secondary">
                                  {doctor.available_slots} مواعيد متاحة
                                </Badge>
                                {doctor.telemedicine_enabled && (
                                  <Badge variant="outline">عن بعد</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="text-2xl font-bold text-primary">{doctor.consultation_price}</p>
                            <p className="text-sm text-muted-foreground">دج</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (filters.specialty || filters.wilaya) ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">لا يوجد أطباء متاحون حالياً بهذه المعايير</p>
                  </CardContent>
                </Card>
              ) : null}

              {booking.doctor && (
                <Button className="w-full" size="lg" onClick={() => setStep(2)}>
                  متابعة - اختيار الموعد
                </Button>
              )}
            </div>
          )}

          {/* الخطوة 2: اختيار التاريخ والوقت */}
          {step === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    اختر التاريخ والوقت
                  </CardTitle>
                  <CardDescription>
                    الطبيب: د. {booking.doctor?.profiles?.full_name || 'طبيب'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Calendar
                        mode="single"
                        selected={booking.date}
                        onSelect={(date) => setBooking({...booking, date})}
                        disabled={(date) => date < new Date() || date.getDay() === 5}
                        locale={ar}
                        className="rounded-md border"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        الأوقات المتاحة
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {TIME_SLOTS.map((time) => (
                          <Button
                            key={time}
                            variant={booking.time === time ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setBooking({...booking, time})}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>رجوع</Button>
                <Button 
                  className="flex-1" 
                  disabled={!booking.date || !booking.time}
                  onClick={() => setStep(3)}
                >
                  متابعة - تأكيد الحجز
                </Button>
              </div>
            </div>
          )}

          {/* الخطوة 3: التأكيد */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>تأكيد الحجز</CardTitle>
                  <CardDescription>راجع تفاصيل موعدك</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الطبيب:</span>
                      <span className="font-medium">د. {booking.doctor?.profiles?.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">التخصص:</span>
                      <span>{booking.doctor?.specialties?.name_ar}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">التاريخ:</span>
                      <span>{booking.date && format(booking.date, 'dd MMMM yyyy', { locale: ar })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">الوقت:</span>
                      <span>{booking.time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المكان:</span>
                      <span>{booking.doctor?.clinic_name}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-bold">
                      <span>المبلغ:</span>
                      <span className="text-primary">{booking.doctor?.consultation_price} دج</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">سبب الزيارة (اختياري)</label>
                    <Textarea
                      placeholder="اكتب سبب زيارتك..."
                      value={booking.reason}
                      onChange={(e) => setBooking({...booking, reason: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>رجوع</Button>
                <Button 
                  className="flex-1" 
                  size="lg"
                  onClick={submitBooking}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin ml-2" />
                  ) : (
                    <CheckCircle className="h-5 w-5 ml-2" />
                  )}
                  تأكيد الحجز
                </Button>
              </div>
            </div>
          )}

          {/* صفحة التأكيد النهائية */}
          {step === 4 && (
            <Card className="text-center py-12">
              <CardContent>
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">تم الحجز بنجاح!</h2>
                <p className="text-muted-foreground mb-6">
                  تم تسجيل موعدك مع د. {booking.doctor?.profiles?.full_name}<br />
                  يوم {booking.date && format(booking.date, 'dd MMMM yyyy', { locale: ar })} الساعة {booking.time}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => window.location.href = '/dashboard'}>
                    عرض مواعيدي
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setStep(1);
                    setBooking({ doctor: null, date: undefined, time: '', reason: '', isTelemedicine: false });
                  }}>
                    حجز موعد آخر
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default BookAppointment;
