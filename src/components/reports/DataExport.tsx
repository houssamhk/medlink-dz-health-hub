import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, FileText, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DataExportProps {
  userType: 'patient' | 'doctor' | 'admin';
  userId?: string;
}

const DataExport = ({ userType, userId }: DataExportProps) => {
  const { toast } = useToast();
  const [exportType, setExportType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [loading, setLoading] = useState(false);

  const exportOptions = {
    patient: [
      { value: 'appointments', label: 'المواعيد' },
      { value: 'medical_records', label: 'السجلات الطبية' },
      { value: 'prescriptions', label: 'الوصفات الطبية' },
    ],
    doctor: [
      { value: 'appointments', label: 'المواعيد' },
      { value: 'patients', label: 'قائمة المرضى' },
      { value: 'evaluations', label: 'التقييمات' },
      { value: 'reviews', label: 'آراء المرضى' },
    ],
    admin: [
      { value: 'users', label: 'المستخدمين' },
      { value: 'doctors', label: 'الأطباء' },
      { value: 'appointments', label: 'جميع المواعيد' },
      { value: 'medical_records', label: 'جميع السجلات' },
      { value: 'pharmacies', label: 'الصيدليات' },
    ],
  };

  const handleExport = async () => {
    if (!exportType) {
      toast({ title: "خطأ", description: "اختر نوع البيانات للتصدير", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let data: any[] = [];
      let fileName = '';

      switch (exportType) {
        case 'appointments':
          if (userType === 'patient') {
            const { data: appointments } = await supabase
              .from('appointments')
              .select('*, doctors(clinic_name, wilaya)')
              .eq('patient_id', userId)
              .order('appointment_date', { ascending: false });
            data = appointments || [];
          } else if (userType === 'doctor') {
            const { data: doctorData } = await supabase
              .from('doctors')
              .select('id')
              .eq('user_id', userId)
              .single();
            if (doctorData) {
              const { data: appointments } = await supabase
                .from('appointments')
                .select('*')
                .eq('doctor_id', doctorData.id)
                .order('appointment_date', { ascending: false });
              data = appointments || [];
            }
          } else {
            const { data: appointments } = await supabase
              .from('appointments')
              .select('*')
              .order('appointment_date', { ascending: false });
            data = appointments || [];
          }
          fileName = 'appointments';
          break;

        case 'medical_records':
          if (userType === 'patient') {
            const { data: records } = await supabase
              .from('medical_records')
              .select('*')
              .eq('patient_id', userId)
              .order('created_at', { ascending: false });
            data = records || [];
          } else {
            const { data: records } = await supabase
              .from('medical_records')
              .select('*')
              .order('created_at', { ascending: false });
            data = records || [];
          }
          fileName = 'medical_records';
          break;

        case 'doctors':
          const { data: doctors } = await supabase
            .from('doctors')
            .select('*, specialties(name_ar)')
            .order('created_at', { ascending: false });
          data = doctors || [];
          fileName = 'doctors';
          break;

        case 'pharmacies':
          const { data: pharmacies } = await supabase
            .from('pharmacies')
            .select('*')
            .order('wilaya');
          data = pharmacies || [];
          fileName = 'pharmacies';
          break;

        default:
          toast({ title: "خطأ", description: "نوع التصدير غير مدعوم", variant: "destructive" });
          setLoading(false);
          return;
      }

      // Filter by date if specified
      if (dateFrom || dateTo) {
        data = data.filter(item => {
          const itemDate = new Date(item.created_at || item.appointment_date);
          if (dateFrom && itemDate < dateFrom) return false;
          if (dateTo && itemDate > dateTo) return false;
          return true;
        });
      }

      // Convert to CSV
      if (data.length === 0) {
        toast({ title: "تنبيه", description: "لا توجد بيانات للتصدير", variant: "default" });
        setLoading(false);
        return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
          const value = row[h];
          if (typeof value === 'object') return JSON.stringify(value);
          if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
          return value ?? '';
        }).join(','))
      ].join('\n');

      // Download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast({ title: "تم التصدير", description: `تم تصدير ${data.length} سجل بنجاح` });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء التصدير", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          تصدير البيانات
        </CardTitle>
        <CardDescription>قم بتصدير بياناتك بصيغة CSV</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">نوع البيانات</label>
          <Select value={exportType} onValueChange={setExportType}>
            <SelectTrigger>
              <SelectValue placeholder="اختر نوع البيانات" />
            </SelectTrigger>
            <SelectContent>
              {exportOptions[userType].map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">من تاريخ</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="h-4 w-4 ml-2" />
                  {dateFrom ? format(dateFrom, 'PPP', { locale: ar }) : 'اختر تاريخ'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">إلى تاريخ</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="h-4 w-4 ml-2" />
                  {dateTo ? format(dateTo, 'PPP', { locale: ar }) : 'اختر تاريخ'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Button onClick={handleExport} disabled={loading} className="w-full">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin ml-2" />
          ) : (
            <Download className="h-4 w-4 ml-2" />
          )}
          تصدير البيانات
        </Button>
      </CardContent>
    </Card>
  );
};

export default DataExport;
