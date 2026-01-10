import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Package, AlertTriangle, Edit, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface InventoryItem {
  id: string;
  medication_name: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  price: number;
  expiry_date: string | null;
  created_at: string;
}

const PharmacyInventory = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    medication_name: '',
    quantity: '',
    unit: 'قطعة',
    min_quantity: '10',
    price: '',
    expiry_date: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && role !== 'pharmacist') {
      navigate('/');
    }
  }, [role, roleLoading, navigate]);

  useEffect(() => {
    if (user && role === 'pharmacist') {
      fetchPharmacyAndInventory();
    }
  }, [user, role]);

  useEffect(() => {
    const filtered = inventory.filter(item =>
      item.medication_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInventory(filtered);
  }, [searchTerm, inventory]);

  const fetchPharmacyAndInventory = async () => {
    // جلب معرف الصيدلية
    const { data: pharmacy } = await supabase
      .from('pharmacies')
      .select('id')
      .eq('user_id', user?.id)
      .single();

    if (!pharmacy) {
      setLoading(false);
      return;
    }

    setPharmacyId(pharmacy.id);

    // جلب المخزون
    const { data: inventoryData } = await supabase
      .from('pharmacy_inventory')
      .select('*')
      .eq('pharmacy_id', pharmacy.id)
      .order('medication_name');

    setInventory(inventoryData || []);
    setFilteredInventory(inventoryData || []);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      medication_name: '',
      quantity: '',
      unit: 'قطعة',
      min_quantity: '10',
      price: '',
      expiry_date: ''
    });
    setEditingItem(null);
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      medication_name: item.medication_name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      min_quantity: item.min_quantity.toString(),
      price: item.price.toString(),
      expiry_date: item.expiry_date || ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.medication_name || !formData.quantity || !pharmacyId) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const itemData = {
        pharmacy_id: pharmacyId,
        medication_name: formData.medication_name,
        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        min_quantity: parseInt(formData.min_quantity) || 10,
        price: parseFloat(formData.price) || 0,
        expiry_date: formData.expiry_date || null
      };

      if (editingItem) {
        const { error } = await supabase
          .from('pharmacy_inventory')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({ title: "تم التحديث بنجاح" });
      } else {
        const { error } = await supabase
          .from('pharmacy_inventory')
          .insert(itemData);

        if (error) throw error;
        toast({ title: "تمت الإضافة بنجاح" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPharmacyAndInventory();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;

    try {
      const { error } = await supabase
        .from('pharmacy_inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "تم الحذف بنجاح" });
      fetchPharmacyAndInventory();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity === 0) {
      return <Badge variant="destructive">نفذ</Badge>;
    }
    if (item.quantity <= item.min_quantity) {
      return <Badge className="bg-yellow-500">منخفض</Badge>;
    }
    return <Badge className="bg-green-500">متوفر</Badge>;
  };

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const expiryDate = new Date(date);
    const today = new Date();
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    return expiryDate <= threeMonths && expiryDate > today;
  };

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pharmacyId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-12 text-center" dir="rtl">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">لا توجد صيدلية مرتبطة</h2>
          <p className="text-muted-foreground">يرجى التواصل مع الإدارة لربط حسابك بصيدلية</p>
        </main>
      </div>
    );
  }

  const lowStockCount = inventory.filter(i => i.quantity <= i.min_quantity && i.quantity > 0).length;
  const outOfStockCount = inventory.filter(i => i.quantity === 0).length;
  const expiringSoonCount = inventory.filter(i => isExpiringSoon(i.expiry_date)).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">إدارة المخزون</h1>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 ml-2" />
                إضافة منتج
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم الدواء *</Label>
                  <Input
                    value={formData.medication_name}
                    onChange={(e) => setFormData(f => ({ ...f, medication_name: e.target.value }))}
                    placeholder="مثال: باراسيتامول 500mg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الكمية *</Label>
                    <Input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData(f => ({ ...f, quantity: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الوحدة</Label>
                    <Input
                      value={formData.unit}
                      onChange={(e) => setFormData(f => ({ ...f, unit: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الحد الأدنى</Label>
                    <Input
                      type="number"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData(f => ({ ...f, min_quantity: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>السعر (دج)</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(f => ({ ...f, price: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>تاريخ انتهاء الصلاحية</Label>
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(f => ({ ...f, expiry_date: e.target.value }))}
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingItem ? 'تحديث' : 'إضافة')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* الإحصائيات */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{inventory.length}</p>
                <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-500">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{lowStockCount}</p>
                <p className="text-sm text-muted-foreground">مخزون منخفض</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500">
            <CardContent className="p-4 flex items-center gap-3">
              <Package className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{outOfStockCount}</p>
                <p className="text-sm text-muted-foreground">نفذ المخزون</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-500">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{expiringSoonCount}</p>
                <p className="text-sm text-muted-foreground">قريب الانتهاء</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* البحث */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث عن دواء..."
                className="pr-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* جدول المخزون */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المخزون</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredInventory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>لا توجد منتجات</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم الدواء</TableHead>
                    <TableHead className="text-center">الكمية</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">السعر</TableHead>
                    <TableHead className="text-center">تاريخ الانتهاء</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.medication_name}</TableCell>
                      <TableCell className="text-center">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-center">{getStockStatus(item)}</TableCell>
                      <TableCell className="text-center">{item.price} دج</TableCell>
                      <TableCell className="text-center">
                        {item.expiry_date ? (
                          <span className={
                            isExpired(item.expiry_date) ? 'text-red-500 font-bold' :
                            isExpiringSoon(item.expiry_date) ? 'text-orange-500' : ''
                          }>
                            {format(new Date(item.expiry_date), 'yyyy/MM/dd')}
                            {isExpired(item.expiry_date) && ' (منتهي)'}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PharmacyInventory;
