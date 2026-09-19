import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Truck, MapPin, Phone, Loader2, CheckCircle, XCircle, Package } from 'lucide-react';

interface Delivery {
  id: string;
  recipient_name: string;
  phone: string;
  wilaya: string;
  address: string;
  notes: string | null;
  status: string;
  delivery_fee: number;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  requested: 'طلب جديد',
  preparing: 'قيد التجهيز',
  out_for_delivery: 'في الطريق',
  delivered: 'تم التسليم',
  cancelled: 'ملغى',
};

const NEXT_STATUS: Record<string, { value: string; label: string }> = {
  requested: { value: 'preparing', label: 'بدء التجهيز' },
  preparing: { value: 'out_for_delivery', label: 'إرسال مع الموصل' },
  out_for_delivery: { value: 'delivered', label: 'تأكيد التسليم' },
};

const DeliveryRequests = ({ pharmacyId }: { pharmacyId: string }) => {
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchDeliveries();

    const channel = supabase
      .channel('pharmacy-deliveries')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'medication_deliveries',
        filter: `pharmacy_id=eq.${pharmacyId}`,
      }, () => fetchDeliveries())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pharmacyId]);

  const fetchDeliveries = async () => {
    const { data } = await supabase
      .from('medication_deliveries')
      .select('id, recipient_name, phone, wilaya, address, notes, status, delivery_fee, created_at')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
      .limit(15);

    setDeliveries(data || []);
    setLoading(false);
  };

  const changeStatus = async (id: string, status: string) => {
    setUpdating(id);
    const payload: Record<string, unknown> = { status };
    if (status === 'delivered') payload.delivered_at = new Date().toISOString();

    const { error } = await supabase
      .from('medication_deliveries')
      .update(payload)
      .eq('id', id);

    if (error) {
      toast({ title: 'خطأ', description: 'تعذر تحديث حالة التوصيل', variant: 'destructive' });
    } else {
      toast({ title: 'تم', description: 'تم تحديث حالة التوصيل وإشعار المريض' });
      fetchDeliveries();
    }
    setUpdating(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          طلبات التوصيل
        </CardTitle>
        <CardDescription>توصيل الأدوية إلى منازل المرضى</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : deliveries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد طلبات توصيل</p>
            <p className="text-sm mt-2">ستظهر هنا طلبات المرضى بعد صرف الوصفات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deliveries.map((d) => (
              <div key={d.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{d.recipient_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {d.address}، {d.wilaya}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> <span dir="ltr">{d.phone}</span>
                    </p>
                  </div>
                  <div className="text-left space-y-1">
                    <Badge variant={d.status === 'delivered' ? 'default' : 'secondary'}>
                      {STATUS_LABELS[d.status] || d.status}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{d.delivery_fee} دج</p>
                  </div>
                </div>

                {d.notes && (
                  <p className="text-sm bg-muted/40 p-2 rounded">📝 {d.notes}</p>
                )}

                {NEXT_STATUS[d.status] && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={updating === d.id}
                      onClick={() => changeStatus(d.id, NEXT_STATUS[d.status].value)}
                    >
                      {updating === d.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><CheckCircle className="h-4 w-4 ml-1" />{NEXT_STATUS[d.status].label}</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updating === d.id}
                      onClick={() => changeStatus(d.id, 'cancelled')}
                    >
                      <XCircle className="h-4 w-4 ml-1" />
                      إلغاء
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryRequests;
