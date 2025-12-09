import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, MapPin, Phone, Clock, Search } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  wilaya: string;
  phone: string | null;
  is_on_duty: boolean | null;
}

const wilayas = [
  'الجزائر', 'وهران', 'قسنطينة', 'سطيف', 'عنابة', 'باتنة', 'بليدة', 
  'تلمسان', 'بجاية', 'تيزي وزو', 'الجلفة', 'سيدي بلعباس'
];

const Pharmacies = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [showOnDutyOnly, setShowOnDutyOnly] = useState(false);

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .order('is_on_duty', { ascending: false });

      if (error) throw error;
      setPharmacies(data || []);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPharmacies = pharmacies.filter(pharmacy => {
    const matchesSearch = pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pharmacy.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWilaya = selectedWilaya === 'all' || pharmacy.wilaya === selectedWilaya;
    const matchesOnDuty = !showOnDutyOnly || pharmacy.is_on_duty;
    return matchesSearch && matchesWilaya && matchesOnDuty;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8" dir="rtl">
        <h1 className="text-3xl font-bold text-foreground mb-2">الصيدليات المناوبة</h1>
        <p className="text-muted-foreground mb-8">ابحث عن الصيدليات المناوبة القريبة منك</p>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن صيدلية..."
              className="pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedWilaya} onValueChange={setSelectedWilaya}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="اختر الولاية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الولايات</SelectItem>
              {wilayas.map((wilaya) => (
                <SelectItem key={wilaya} value={wilaya}>{wilaya}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => setShowOnDutyOnly(!showOnDutyOnly)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              showOnDutyOnly 
                ? 'bg-green-500 text-white border-green-500' 
                : 'bg-background border-border hover:border-green-500'
            }`}
          >
            <Clock className="h-4 w-4 inline-block ml-2" />
            المناوبة فقط
          </button>
        </div>

        {/* Pharmacies Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPharmacies.map((pharmacy) => (
            <Card key={pharmacy.id} className={pharmacy.is_on_duty ? 'border-green-500 border-2' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{pharmacy.name}</CardTitle>
                  {pharmacy.is_on_duty && (
                    <Badge className="bg-green-500">مناوبة</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-1 shrink-0" />
                  <span className="text-sm">{pharmacy.address}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Badge variant="outline">{pharmacy.wilaya}</Badge>
                </div>
                {pharmacy.phone && (
                  <a 
                    href={`tel:${pharmacy.phone}`}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Phone className="h-4 w-4" />
                    <span dir="ltr">{pharmacy.phone}</span>
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPharmacies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">لا توجد صيدليات مطابقة للبحث</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Pharmacies;
