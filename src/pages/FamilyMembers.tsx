import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Users, Plus, Edit2, Trash2, Loader2, UserCircle } from 'lucide-react';

interface FamilyMember {
  id: string;
  member_name: string;
  relationship: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_type: string | null;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  can_book_appointments: boolean;
}

const relationships = [
  { value: 'spouse', label: 'زوج/زوجة' },
  { value: 'child', label: 'ابن/ابنة' },
  { value: 'parent', label: 'والد/والدة' },
  { value: 'sibling', label: 'أخ/أخت' },
  { value: 'other', label: 'آخر' },
];

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const FamilyMembers = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    member_name: '',
    relationship: '',
    date_of_birth: '',
    gender: '',
    blood_type: '',
    allergies: '',
    chronic_conditions: '',
    can_book_appointments: true,
  });

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [user]);

  const fetchMembers = async () => {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('primary_user_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMembers(data);
    }
    setLoadingMembers(false);
  };

  const resetForm = () => {
    setFormData({
      member_name: '',
      relationship: '',
      date_of_birth: '',
      gender: '',
      blood_type: '',
      allergies: '',
      chronic_conditions: '',
      can_book_appointments: true,
    });
    setEditingMember(null);
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      member_name: member.member_name,
      relationship: member.relationship,
      date_of_birth: member.date_of_birth || '',
      gender: member.gender || '',
      blood_type: member.blood_type || '',
      allergies: member.allergies?.join(', ') || '',
      chronic_conditions: member.chronic_conditions?.join(', ') || '',
      can_book_appointments: member.can_book_appointments,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.member_name || !formData.relationship) {
      toast({ title: "خطأ", description: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const memberData = {
      primary_user_id: user?.id,
      member_name: formData.member_name,
      relationship: formData.relationship,
      date_of_birth: formData.date_of_birth || null,
      gender: formData.gender || null,
      blood_type: formData.blood_type || null,
      allergies: formData.allergies ? formData.allergies.split(',').map(a => a.trim()) : null,
      chronic_conditions: formData.chronic_conditions ? formData.chronic_conditions.split(',').map(c => c.trim()) : null,
      can_book_appointments: formData.can_book_appointments,
    };

    let error;
    if (editingMember) {
      const result = await supabase
        .from('family_members')
        .update(memberData)
        .eq('id', editingMember.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('family_members')
        .insert(memberData);
      error = result.error;
    }

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: editingMember ? "تم تحديث العضو" : "تمت إضافة العضو" });
      fetchMembers();
      setDialogOpen(false);
      resetForm();
    }

    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العضو؟')) return;

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم", description: "تم حذف العضو" });
      fetchMembers();
    }
  };

  const getRelationshipLabel = (value: string) => {
    return relationships.find(r => r.value === value)?.label || value;
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
      
      <main className="container mx-auto px-4 py-8 pt-24" dir="rtl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">أفراد العائلة</h1>
            <p className="text-muted-foreground">إدارة حسابات أفراد عائلتك</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة عضو
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>{editingMember ? 'تعديل العضو' : 'إضافة عضو جديد'}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>الاسم الكامل *</Label>
                  <Input
                    value={formData.member_name}
                    onChange={(e) => setFormData({ ...formData, member_name: e.target.value })}
                    placeholder="أدخل اسم العضو"
                  />
                </div>
                
                <div>
                  <Label>صلة القرابة *</Label>
                  <Select value={formData.relationship} onValueChange={(v) => setFormData({ ...formData, relationship: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر صلة القرابة" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationships.map((rel) => (
                        <SelectItem key={rel.value} value={rel.value}>{rel.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>تاريخ الميلاد</Label>
                    <Input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>الجنس</Label>
                    <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>فصيلة الدم</Label>
                  <Select value={formData.blood_type} onValueChange={(v) => setFormData({ ...formData, blood_type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر فصيلة الدم" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>الحساسية (مفصولة بفواصل)</Label>
                  <Input
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="مثال: البنسلين, الفول السوداني"
                  />
                </div>
                
                <div>
                  <Label>الأمراض المزمنة (مفصولة بفواصل)</Label>
                  <Input
                    value={formData.chronic_conditions}
                    onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                    placeholder="مثال: السكري, ارتفاع ضغط الدم"
                  />
                </div>
                
                <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                  {editingMember ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loadingMembers ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : members.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">لا يوجد أفراد عائلة</h3>
              <p className="text-muted-foreground mb-4">أضف أفراد عائلتك لحجز المواعيد نيابة عنهم</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <UserCircle className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{member.member_name}</h3>
                        <p className="text-sm text-muted-foreground">{getRelationshipLabel(member.relationship)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(member)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(member.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {member.date_of_birth && (
                      <p><span className="text-muted-foreground">تاريخ الميلاد:</span> {member.date_of_birth}</p>
                    )}
                    {member.blood_type && (
                      <p><span className="text-muted-foreground">فصيلة الدم:</span> {member.blood_type}</p>
                    )}
                    {member.gender && (
                      <p><span className="text-muted-foreground">الجنس:</span> {member.gender === 'male' ? 'ذكر' : 'أنثى'}</p>
                    )}
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    {member.allergies?.map((allergy, i) => (
                      <Badge key={i} variant="secondary">{allergy}</Badge>
                    ))}
                    {member.chronic_conditions?.map((condition, i) => (
                      <Badge key={i} variant="outline">{condition}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FamilyMembers;
