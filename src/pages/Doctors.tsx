import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  MapPin,
  Star,
  CheckCircle,
  Clock,
  Loader2,
  Calendar,
  Video,
} from 'lucide-react';

interface Specialty {
  id: string;
  name_ar: string;
  name_fr: string;
}

interface Doctor {
  id: string;
  user_id: string;
  clinic_name: string | null;
  clinic_address: string | null;
  wilaya: string;
  consultation_price: number | null;
  bio: string | null;
  experience_years: number;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  telemedicine_enabled: boolean;
  specialties: Specialty | null;
  doctor_name?: string;
}

const WILAYAS = [
  'الجزائر', 'وهران', 'قسنطينة', 'عنابة', 'سطيف', 'باتنة', 'بجاية',
  'تلمسان', 'البليدة', 'بومرداس', 'تيزي وزو', 'جيجل', 'مستغانم',
];

const Doctors = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');

  useEffect(() => {
    fetchSpecialties();
    fetchDoctors();
  }, []);

  const fetchSpecialties = async () => {
    const { data, error } = await supabase
      .from('specialties')
      .select('*')
      .order('name_ar');

    if (!error && data) {
      setSpecialties(data);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    let query = supabase
      .from('doctors')
      .select(`
        *,
        specialties (
          id,
          name_ar,
          name_fr
        )
      `)
      .eq('is_verified', true)
      .eq('is_available', true);

    if (selectedWilaya && selectedWilaya !== 'all') {
      query = query.eq('wilaya', selectedWilaya);
    }

    if (selectedSpecialty && selectedSpecialty !== 'all') {
      query = query.eq('specialty_id', selectedSpecialty);
    }

    const { data, error } = await query.order('rating', { ascending: false });

    if (error) {
      console.error('Error fetching doctors:', error);
    } else {
      setDoctors(data as Doctor[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors();
  }, [selectedWilaya, selectedSpecialty]);

  const handleBookAppointment = (doctorId: string) => {
    if (!user) {
      toast({
        title: 'تنبيه',
        description: 'يرجى تسجيل الدخول لحجز موعد',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }
    navigate(`/book-appointment?doctor=${doctorId}`);
  };

  const filteredDoctors = doctors.filter((doctor) => {
    if (!searchQuery) return true;
    const name = doctor.clinic_name?.toLowerCase() || '';
    const specialty = doctor.specialties?.name_ar?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return name.includes(query) || specialty.includes(query);
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            ابحث عن طبيب
          </h1>
          <p className="text-muted-foreground">
            اختر من بين أفضل الأطباء المعتمدين في الجزائر
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ابحث باسم الطبيب أو التخصص..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-11"
                dir="rtl"
              />
            </div>

            <Select value={selectedWilaya} onValueChange={setSelectedWilaya}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الولاية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الولايات</SelectItem>
                {WILAYAS.map((wilaya) => (
                  <SelectItem key={wilaya} value={wilaya}>
                    {wilaya}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="اختر التخصص" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التخصصات</SelectItem>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty.id} value={specialty.id}>
                    {specialty.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              لا يوجد أطباء متاحون
            </h3>
            <p className="text-muted-foreground">
              جرب تغيير معايير البحث أو أضف طبيبك المفضل
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="bg-card rounded-2xl p-6 shadow-card border border-border/50 hover:shadow-elevated transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-2xl font-bold text-primary">
                    {doctor.clinic_name?.charAt(0) || 'د'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">
                        {doctor.clinic_name || 'عيادة طبية'}
                      </h3>
                      {doctor.is_verified && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-primary font-medium">
                      {doctor.specialties?.name_ar}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-4 h-4" />
                      <span>{doctor.wilaya}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-foreground">
                      {doctor.rating || '0.0'}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      ({doctor.total_reviews} تقييم)
                    </span>
                  </div>
                  {doctor.telemedicine_enabled && (
                    <div className="flex items-center gap-1 text-primary text-sm">
                      <Video className="w-4 h-4" />
                      <span>عن بعد</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4 py-3 border-t border-b border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{doctor.experience_years} سنوات خبرة</span>
                  </div>
                  <div className="text-left">
                    <span className="text-xl font-bold text-primary">
                      {doctor.consultation_price || '---'}
                    </span>
                    <span className="text-sm text-muted-foreground"> دج</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleBookAppointment(doctor.id)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  حجز موعد
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Doctors;
