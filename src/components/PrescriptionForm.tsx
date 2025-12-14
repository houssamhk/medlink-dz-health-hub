import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, X, Pill, Send } from 'lucide-react';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

interface PrescriptionFormProps {
  patientId: string;
  appointmentId?: string;
  onSuccess?: () => void;
}

const PrescriptionForm = ({ patientId, appointmentId, onSuccess }: PrescriptionFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [notes, setNotes] = useState('');
  
  const [newMed, setNewMed] = useState<Medication>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
  });

  const addMedication = () => {
    if (newMed.name && newMed.dosage && newMed.frequency) {
      setMedications([...medications, newMed]);
      setNewMed({ name: '', dosage: '', frequency: '', duration: '', notes: '' });
    }
  };

  const removeMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || medications.length === 0) {
      toast({
        title: "يرجى إضافة دواء واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // جلب معرف الطبيب
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!doctorData) {
        throw new Error('لم يتم العثور على ملف الطبيب');
      }

      const { error } = await (supabase as any).from('prescriptions').insert({
        doctor_id: doctorData.id,
        patient_id: patientId,
        appointment_id: appointmentId || null,
        medications: medications,
        notes: notes,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: "تم إنشاء الوصفة بنجاح",
        description: "يمكن للمريض الآن مشاهدتها وإرسالها للصيدلية",
      });

      setMedications([]);
      setNotes('');
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="w-5 h-5 text-primary" />
          كتابة وصفة طبية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6" dir="rtl">
        {/* إضافة دواء جديد */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-4">
          <h4 className="font-medium">إضافة دواء</h4>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>اسم الدواء</Label>
              <Input
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                placeholder="مثال: أموكسيسيلين"
              />
            </div>
            <div>
              <Label>الجرعة</Label>
              <Input
                value={newMed.dosage}
                onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                placeholder="مثال: 500mg"
              />
            </div>
            <div>
              <Label>التكرار</Label>
              <Input
                value={newMed.frequency}
                onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                placeholder="مثال: 3 مرات يومياً"
              />
            </div>
            <div>
              <Label>المدة</Label>
              <Input
                value={newMed.duration}
                onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })}
                placeholder="مثال: 7 أيام"
              />
            </div>
          </div>
          <div>
            <Label>ملاحظات (اختياري)</Label>
            <Input
              value={newMed.notes || ''}
              onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
              placeholder="مثال: بعد الأكل"
            />
          </div>
          <Button onClick={addMedication} variant="secondary" className="w-full">
            <Plus className="w-4 h-4 ml-2" />
            إضافة الدواء
          </Button>
        </div>

        {/* قائمة الأدوية */}
        {medications.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">الأدوية المضافة ({medications.length})</h4>
            {medications.map((med, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-primary" />
                    <span className="font-medium">{med.name}</span>
                    <Badge variant="outline">{med.dosage}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {med.frequency} - {med.duration}
                    {med.notes && ` (${med.notes})`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMedication(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* ملاحظات عامة */}
        <div>
          <Label>ملاحظات عامة للمريض</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أي تعليمات إضافية للمريض..."
            rows={3}
          />
        </div>

        {/* إرسال */}
        <Button
          onClick={handleSubmit}
          disabled={loading || medications.length === 0}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5 ml-2" />
              إرسال الوصفة
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PrescriptionForm;
