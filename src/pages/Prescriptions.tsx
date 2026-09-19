import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Pill, User, Calendar, Send, CheckCircle, Clock, Store, Truck, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const DELIVERY_FEE = 300;

const DELIVERY_LABELS: Record<string, string> = {
  requested: 'طلب التوصيل قيد المراجعة',
  preparing: 'الصيدلية تجهز طلبك',
  out_for_delivery: 'الطلب في الطريق إليك',
  delivered: 'تم تسليم الأدوية',
  cancelled: 'تم إلغاء التوصيل',
};

interface Delivery {
  id: string;
  prescription_id: string;
  status: string;
  address: string;
  wilaya: string;
  delivery_fee: number;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

interface Prescription {
  id: string;
  medications: Medication[];
  notes: string | null;
  status: string;
  created_at: string;
  dispensed_at: string | null;
  pharmacy_id: string | null;
  doctors: {
    clinic_name: string | null;
    profiles?: { full_name: string } | null;
    specialties?: { name_ar: string } | null;
  } | null;
}

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  wilaya: string;
}

const Prescriptions = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState('');
  const [sending, setSending] = useState(false);

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryFor, setDeliveryFor] = useState<Prescription | null>(null);
  const [requestingDelivery, setRequestingDelivery] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    recipient_name: '', phone: '', wilaya: '', address: '', notes: ''
  });

  const fetchDeliveries = async (patientId: string) => {
    const { data } = await supabase
      .from('medication_deliveries')
      .select('id, prescription_id, status, address, wilaya, delivery_fee')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    setDeliveries(data || []);
  };

  const deliveryOf = (prescriptionId: string) =>
    deliveries.find(d => d.prescription_id === prescriptionId && d.status !== 'cancelled');

  const openDeliveryDialog = async (prescription: Prescription) => {
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone, wilaya, address')
      .eq('id', user.id)
      .maybeSingle();

    setDeliveryForm({
      recipient_name: profile?.full_name || '',
      phone: profile?.phone || '',
      wilaya: profile?.wilaya || '',
      address: profile?.address || '',
      notes: '',
    });
    setDeliveryFor(prescription);
  };

  const requestDelivery = async () => {
    if (!user || !deliveryFor?.pharmacy_id) return;
    const { recipient_name, phone, wilaya, address, notes } = deliveryForm;
    if (!recipient_name || !phone || !wilaya || !address) {
      toast({ title: 'بيانات ناقصة', description: 'يرجى ملء الاسم والهاتف والولاية والعنوان', variant: 'destructive' });
      return;
    }

    setRequestingDelivery(true);
    const { error } = await supabase.from('medication_deliveries').insert({
      prescription_id: deliveryFor.id,
      patient_id: user.id,
      pharmacy_id: deliveryFor.pharmacy_id,
      recipient_name, phone, wilaya, address,
      notes: notes || null,
      delivery_fee: DELIVERY_FEE,
    });

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم إرسال الطلب', description: 'ستقوم الصيدلية بتجهيز أدويتك وتوصيلها' });
      setDeliveryFor(null);
      fetchDeliveries(user.id);
    }
    setRequestingDelivery(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // جلب الوصفات
      const { data: prescriptionsData } = await supabase
        .from('prescriptions')
        .select(`
          *,
          doctors (
            clinic_name,
            user_id,
            specialties (name_ar)
          )
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (prescriptionsData) {
        // Enrich with doctor names from profiles
        const doctorUserIds = prescriptionsData.map((p: any) => p.doctors?.user_id).filter(Boolean);
        let profilesMap: Record<string, string> = {};
        if (doctorUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', doctorUserIds);
          profiles?.forEach(p => { profilesMap[p.id] = p.full_name || 'طبيب'; });
        }
        const enriched = prescriptionsData.map((p: any) => ({
          ...p,
          doctors: {
            ...p.doctors,
            profiles: { full_name: profilesMap[p.doctors?.user_id] || 'طبيب' }
          }
        }));
        setPrescriptions(enriched as unknown as Prescription[]);
      }

      // جلب الصيدليات
      const { data: pharmaciesData } = await supabase
        .from('pharmacies')
        .select('id, name, address, wilaya')
        .eq('is_on_duty', true);

      setPharmacies(pharmaciesData || []);
      await fetchDeliveries(user.id);
      setLoading(false);
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const sendToPharmacy = async () => {
    if (!selectedPrescription || !selectedPharmacy) return;

    setSending(true);
    try {
      const { error } = await (supabase as any)
        .from('prescriptions')
        .update({ 
          pharmacy_id: selectedPharmacy,
          status: 'sent_to_pharmacy'
        })
        .eq('id', selectedPrescription.id);

      if (error) throw error;

      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال الوصفة للصيدلية",
      });

      // تحديث القائمة
      setPrescriptions(prescriptions.map(p => 
        p.id === selectedPrescription.id 
          ? { ...p, pharmacy_id: selectedPharmacy, status: 'sent_to_pharmacy' }
          : p
      ));
      setSelectedPrescription(null);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { class: string; label: string; icon: React.ElementType }> = {
      pending: { class: 'bg-yellow-100 text-yellow-800', label: 'بانتظار الإرسال', icon: Clock },
      sent_to_pharmacy: { class: 'bg-blue-100 text-blue-800', label: 'في الصيدلية', icon: Store },
      dispensed: { class: 'bg-green-100 text-green-800', label: 'تم الصرف', icon: CheckCircle },
    };
    const style = styles[status] || styles.pending;
    const Icon = style.icon;
    return (
      <Badge className={style.class}>
        <Icon className="w-3 h-3 ml-1" />
        {style.label}
      </Badge>
    );
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">الوصفات الطبية</h1>
          <p className="text-muted-foreground mb-8">جميع وصفاتك الطبية في مكان واحد</p>

          {prescriptions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Pill className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد وصفات</h3>
                <p className="text-muted-foreground">ستظهر هنا الوصفات التي يكتبها لك الأطباء</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <Card key={prescription.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Pill className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">
                            د. {prescription.doctors?.profiles?.full_name || 'طبيب'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {prescription.doctors?.specialties?.name_ar}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        {getStatusBadge(prescription.status)}
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(prescription.created_at), 'dd MMM yyyy', { locale: ar })}
                        </p>
                      </div>
                    </div>

                    {/* الأدوية */}
                    <div className="space-y-2 mb-4">
                      {(prescription.medications as unknown as Medication[])?.map((med, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                          <Pill className="w-4 h-4 text-primary" />
                          <span className="font-medium">{med.name}</span>
                          <Badge variant="outline">{med.dosage}</Badge>
                          <span className="text-sm text-muted-foreground">
                            - {med.frequency} لمدة {med.duration}
                          </span>
                        </div>
                      ))}
                    </div>

                    {prescription.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded mb-4">
                        📝 {prescription.notes}
                      </p>
                    )}

                    {prescription.status === 'pending' && (
                      <Button
                        onClick={() => setSelectedPrescription(prescription)}
                        className="w-full"
                      >
                        <Send className="w-4 h-4 ml-2" />
                        إرسال للصيدلية
                      </Button>
                    )}

                    {(() => {
                      const delivery = deliveryOf(prescription.id);
                      if (delivery) {
                        return (
                          <div className="mt-3 p-3 rounded-lg bg-muted/40 space-y-1">
                            <p className="font-medium flex items-center gap-2">
                              <Truck className="w-4 h-4 text-primary" />
                              {DELIVERY_LABELS[delivery.status] || delivery.status}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {delivery.address}، {delivery.wilaya}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              رسوم التوصيل: {delivery.delivery_fee} دج
                            </p>
                          </div>
                        );
                      }
                      if (prescription.pharmacy_id && ['sent_to_pharmacy', 'dispensed'].includes(prescription.status)) {
                        return (
                          <Button
                            variant="outline"
                            className="w-full mt-3"
                            onClick={() => openDeliveryDialog(prescription)}
                          >
                            <Truck className="w-4 h-4 ml-2" />
                            طلب توصيل للمنزل ({DELIVERY_FEE} دج)
                          </Button>
                        );
                      }
                      return null;
                    })()}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal إرسال للصيدلية */}
      <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إرسال الوصفة للصيدلية</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">اختر صيدلية لإرسال الوصفة إليها</p>
            
            <Select value={selectedPharmacy} onValueChange={setSelectedPharmacy}>
              <SelectTrigger>
                <SelectValue placeholder="اختر صيدلية" />
              </SelectTrigger>
              <SelectContent>
                {pharmacies.map((pharmacy) => (
                  <SelectItem key={pharmacy.id} value={pharmacy.id}>
                    <div>
                      <span className="font-medium">{pharmacy.name}</span>
                      <span className="text-muted-foreground text-sm mr-2">
                        - {pharmacy.wilaya}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelectedPrescription(null)} className="flex-1">
                إلغاء
              </Button>
              <Button
                onClick={sendToPharmacy}
                disabled={!selectedPharmacy || sending}
                className="flex-1"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إرسال'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Prescriptions;
