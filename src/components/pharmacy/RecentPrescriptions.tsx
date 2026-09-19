import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Pill, CheckCircle, Clock, Loader2 } from 'lucide-react';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

interface PrescriptionItem {
  id: string;
  medications: Medication[];
  notes: string | null;
  status: string;
  created_at: string;
  patient_name?: string;
}

const RecentPrescriptions = ({ pharmacyId }: { pharmacyId: string }) => {
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, [pharmacyId]);

  const fetchPrescriptions = async () => {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('id, medications, notes, status, created_at, patient_id')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      const patientIds = data.map(p => p.patient_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', patientIds);

      setPrescriptions(data.map(p => ({
        ...p,
        medications: p.medications as unknown as Medication[],
        patient_name: profiles?.find(pr => pr.id === p.patient_id)?.full_name || 'مريض'
      })));
    }
    setLoading(false);
  };

  const [dispensing, setDispensing] = useState<string | null>(null);

  const confirmDispense = async (id: string) => {
    setDispensing(id);
    const { data, error } = await supabase.rpc('dispense_prescription', {
      p_prescription_id: id,
    });

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      const result = data as { deducted?: { name: string; quantity: number }[]; missing?: { name: string }[] } | null;
      const missing = result?.missing || [];
      const deducted = result?.deducted || [];
      toast({
        title: "تم صرف الوصفة",
        description: missing.length > 0
          ? `تم خصم ${deducted.length} دواء من المخزون. غير متوفر: ${missing.map(m => m.name).join('، ')}`
          : `تم خصم ${deducted.length} دواء من المخزون تلقائياً`,
        variant: missing.length > 0 ? "destructive" : undefined,
      });
      fetchPrescriptions();
    }
    setDispensing(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          الوصفات المستلمة
        </CardTitle>
        <CardDescription>الوصفات المرسلة من المرضى</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد وصفات مستلمة</p>
            <p className="text-sm mt-2">ستظهر هنا الوصفات المرسلة من المرضى</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{rx.patient_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(rx.created_at).toLocaleDateString('ar-DZ')}
                    </p>
                  </div>
                  <Badge variant={rx.status === 'dispensed' ? 'default' : 'secondary'}>
                    {rx.status === 'dispensed' ? (
                      <><CheckCircle className="h-3 w-3 ml-1" />تم الصرف</>
                    ) : (
                      <><Clock className="h-3 w-3 ml-1" />بانتظار الصرف</>
                    )}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(rx.medications || []).slice(0, 3).map((med, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      <Pill className="h-3 w-3 ml-1" />
                      {med.name}
                    </Badge>
                  ))}
                </div>
                {rx.status !== 'dispensed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={dispensing === rx.id}
                    onClick={() => confirmDispense(rx.id)}
                  >
                    {dispensing === rx.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><CheckCircle className="h-4 w-4 ml-1" />تأكيد الصرف وخصم المخزون</>
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentPrescriptions;
