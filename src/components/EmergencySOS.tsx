import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Phone, MapPin, Loader2, Ambulance, Heart, Brain } from 'lucide-react';

const EMERGENCY_TYPES = [
  { value: 'cardiac', label: 'حالة قلبية', icon: Heart },
  { value: 'accident', label: 'حادث', icon: Ambulance },
  { value: 'stroke', label: 'سكتة دماغية', icon: Brain },
  { value: 'other', label: 'طوارئ أخرى', icon: AlertTriangle },
];

const EmergencySOS = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [emergencyType, setEmergencyType] = useState('');
  const [description, setDescription] = useState('');

  const getLocation = () => {
    setGettingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGettingLocation(false);
          toast({
            title: "تم تحديد موقعك",
            description: "سيتم إرسال موقعك مع طلب الطوارئ",
          });
        },
        (error) => {
          console.error('Location error:', error);
          setGettingLocation(false);
          toast({
            title: "تعذر تحديد الموقع",
            description: "يرجى السماح بالوصول للموقع",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleEmergency = async () => {
    if (!user) {
      toast({
        title: "يرجى تسجيل الدخول",
        variant: "destructive",
      });
      return;
    }

    if (!location) {
      toast({
        title: "يرجى تحديد موقعك أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!emergencyType) {
      toast({
        title: "يرجى اختيار نوع الطوارئ",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Insert emergency request
      const { error: requestError } = await supabase
        .from('emergency_requests' as any)
        .insert({
          user_id: user.id,
          latitude: location.lat,
          longitude: location.lng,
          emergency_type: emergencyType,
          description: description,
          status: 'pending'
        });

      if (requestError) throw requestError;

      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'طلب طوارئ',
          message: 'تم إرسال طلب الطوارئ بنجاح. سيتم التواصل معك قريباً.',
          type: 'emergency',
          related_type: 'emergency'
        });

      toast({
        title: "تم إرسال طلب الطوارئ",
        description: "سيتم التواصل معك قريباً. للطوارئ الفورية اتصل بـ 14",
      });
      setIsOpen(false);
      setLocation(null);
      setEmergencyType('');
      setDescription('');
    } catch (error: any) {
      console.error('Emergency request error:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ. للطوارئ الفورية اتصل بـ 14 أو 1021",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-4 z-50 w-16 h-16 rounded-full gradient-emergency shadow-elevated animate-pulse-soft"
        size="icon"
      >
        <Phone className="h-7 w-7 text-white" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              طلب طوارئ
            </DialogTitle>
            <DialogDescription>
              أرسل طلب مساعدة طارئة مع موقعك
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* تحديد الموقع */}
            <div className="p-4 rounded-lg bg-muted border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="font-medium">موقعك</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getLocation}
                  disabled={gettingLocation}
                >
                  {gettingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : location ? (
                    'تم التحديد ✓'
                  ) : (
                    'تحديد الموقع'
                  )}
                </Button>
              </div>
              {location && (
                <p className="text-sm text-muted-foreground mt-2">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              )}
            </div>

            {/* نوع الطوارئ */}
            <div>
              <label className="block text-sm font-medium mb-2">نوع الطوارئ</label>
              <Select value={emergencyType} onValueChange={setEmergencyType}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الطوارئ" />
                </SelectTrigger>
                <SelectContent>
                  {EMERGENCY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* وصف إضافي */}
            <div>
              <label className="block text-sm font-medium mb-2">وصف الحالة (اختياري)</label>
              <Textarea
                placeholder="اكتب وصفاً مختصراً للحالة..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* أزرار */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                className="flex-1 gradient-emergency"
                onClick={handleEmergency}
                disabled={loading || !location || !emergencyType}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Phone className="h-5 w-5 ml-2" />
                    إرسال طلب الطوارئ
                  </>
                )}
              </Button>
            </div>

            {/* رقم الطوارئ */}
            <div className="text-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-muted-foreground mb-1">للطوارئ الفورية اتصل بـ:</p>
              <a href="tel:14" className="text-2xl font-bold text-destructive">14</a>
              <span className="mx-2 text-muted-foreground">أو</span>
              <a href="tel:1021" className="text-2xl font-bold text-destructive">1021</a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EmergencySOS;
