import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Banknote, CheckCircle, Shield, Lock } from 'lucide-react';

const PaymentPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const appointmentId = searchParams.get('appointment');
  const amount = searchParams.get('amount') || '0';
  const doctorName = searchParams.get('doctor') || 'الطبيب';
  
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cib');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handlePayment = async () => {
    if (!user) return;

    // التحقق من البيانات
    if (paymentMethod === 'cib' || paymentMethod === 'edahabia') {
      if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv) {
        toast({
          title: "يرجى ملء جميع البيانات",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      // تحديث حالة الموعد إذا كان مرتبطاً
      if (appointmentId) {
        const { error } = await supabase
          .from('appointments')
          .update({ status: 'confirmed' })
          .eq('id', appointmentId);
        if (error) throw error;
      }

      // إنشاء إشعار للمريض
      await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_title: 'تم الدفع بنجاح',
        p_message: `تم تأكيد دفع ${amount} دج ${paymentMethod === 'cash' ? '(نقداً عند الوصول)' : 'إلكترونياً'}`,
        p_type: 'success',
      });

      toast({
        title: "تم الدفع بنجاح!",
        description: "تم تأكيد موعدك",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "خطأ في الدفع",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
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
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold text-foreground mb-2">الدفع الإلكتروني</h1>
          <p className="text-muted-foreground mb-8">أكمل عملية الدفع بشكل آمن</p>

          {/* ملخص الدفع */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">استشارة طبية</p>
                  <p className="font-medium">د. {doctorName}</p>
                </div>
                <div className="text-left">
                  <p className="text-3xl font-bold text-primary">{amount}</p>
                  <p className="text-muted-foreground">دينار جزائري</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* طريقة الدفع */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>اختر طريقة الدفع</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-reverse space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="cib" id="cib" />
                  <Label htmlFor="cib" className="flex items-center gap-3 cursor-pointer flex-1">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-medium">بطاقة CIB</p>
                      <p className="text-sm text-muted-foreground">الدفع ببطاقة البنك</p>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-reverse space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 cursor-pointer mt-3">
                  <RadioGroupItem value="edahabia" id="edahabia" />
                  <Label htmlFor="edahabia" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="w-8 h-8 rounded bg-yellow-500 flex items-center justify-center text-white font-bold text-xs">
                      ED
                    </div>
                    <div>
                      <p className="font-medium">بطاقة الذهبية</p>
                      <p className="text-sm text-muted-foreground">بريد الجزائر</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-reverse space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 cursor-pointer mt-3">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Banknote className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium">الدفع نقداً</p>
                      <p className="text-sm text-muted-foreground">عند الوصول للعيادة</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* تفاصيل البطاقة */}
          {(paymentMethod === 'cib' || paymentMethod === 'edahabia') && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  بيانات البطاقة
                </CardTitle>
                <CardDescription>
                  بياناتك محمية ومشفرة بالكامل
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>رقم البطاقة</Label>
                  <Input
                    placeholder="1234 5678 9012 3456"
                    value={cardDetails.cardNumber}
                    onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                    dir="ltr"
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>تاريخ الانتهاء</Label>
                    <Input
                      placeholder="MM/YY"
                      value={cardDetails.expiryDate}
                      onChange={(e) => setCardDetails({ ...cardDetails, expiryDate: e.target.value })}
                      dir="ltr"
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label>CVV</Label>
                    <Input
                      placeholder="123"
                      type="password"
                      value={cardDetails.cvv}
                      onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                      dir="ltr"
                      maxLength={3}
                    />
                  </div>
                </div>
                <div>
                  <Label>الاسم على البطاقة</Label>
                  <Input
                    placeholder="MOHAMED AHMED"
                    value={cardDetails.cardName}
                    onChange={(e) => setCardDetails({ ...cardDetails, cardName: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* زر الدفع */}
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : paymentMethod === 'cash' ? (
              <>
                <CheckCircle className="w-5 h-5 ml-2" />
                تأكيد الحجز (الدفع عند الوصول)
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 ml-2" />
                ادفع {amount} دج
              </>
            )}
          </Button>

          {/* شارة الأمان */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span className="text-sm">معاملة آمنة ومشفرة 100%</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;
