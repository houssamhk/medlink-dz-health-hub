import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Settings, Bell, Globe, Moon, Sun, Shield, Save } from 'lucide-react';

const UserSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    language: 'ar',
    theme: 'light',
    notifications: {
      email: true,
      sms: false,
      push: true,
      appointments: true,
      labResults: true,
      prescriptions: true,
      promotions: false
    },
    privacy: {
      showProfile: true,
      shareData: false
    }
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // تحميل الإعدادات من localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // حفظ في localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // تطبيق الثيم
      document.documentElement.classList.toggle('dark', settings.theme === 'dark');
      
      toast({
        title: "تم الحفظ",
        description: "تم حفظ الإعدادات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateNotification = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value }
    }));
  };

  const updatePrivacy = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: value }
    }));
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
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">الإعدادات</h1>
          </div>

          <div className="space-y-6">
            {/* المظهر واللغة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  المظهر واللغة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>اللغة</Label>
                    <p className="text-sm text-muted-foreground">اختر لغة الواجهة</p>
                  </div>
                  <Select 
                    value={settings.language} 
                    onValueChange={(v) => setSettings(prev => ({ ...prev, language: v }))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      {settings.theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      المظهر
                    </Label>
                    <p className="text-sm text-muted-foreground">اختر المظهر الفاتح أو الداكن</p>
                  </div>
                  <Select 
                    value={settings.theme} 
                    onValueChange={(v) => setSettings(prev => ({ ...prev, theme: v }))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">فاتح</SelectItem>
                      <SelectItem value="dark">داكن</SelectItem>
                      <SelectItem value="system">تلقائي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* الإشعارات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  الإشعارات
                </CardTitle>
                <CardDescription>تخصيص إعدادات الإشعارات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>إشعارات البريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">استلام إشعارات عبر البريد</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.email}
                    onCheckedChange={(v) => updateNotification('email', v)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>إشعارات الرسائل القصيرة</Label>
                    <p className="text-sm text-muted-foreground">استلام رسائل SMS</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.sms}
                    onCheckedChange={(v) => updateNotification('sms', v)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>إشعارات المواعيد</Label>
                    <p className="text-sm text-muted-foreground">تذكير بالمواعيد القادمة</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.appointments}
                    onCheckedChange={(v) => updateNotification('appointments', v)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>نتائج التحاليل</Label>
                    <p className="text-sm text-muted-foreground">إشعار عند توفر نتائج جديدة</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.labResults}
                    onCheckedChange={(v) => updateNotification('labResults', v)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>الوصفات الطبية</Label>
                    <p className="text-sm text-muted-foreground">إشعار بالوصفات الجديدة</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.prescriptions}
                    onCheckedChange={(v) => updateNotification('prescriptions', v)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>العروض والأخبار</Label>
                    <p className="text-sm text-muted-foreground">استلام أخبار وعروض المنصة</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.promotions}
                    onCheckedChange={(v) => updateNotification('promotions', v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* الخصوصية */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  الخصوصية والأمان
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>عرض الملف الشخصي</Label>
                    <p className="text-sm text-muted-foreground">السماح للآخرين بمشاهدة ملفك</p>
                  </div>
                  <Switch 
                    checked={settings.privacy.showProfile}
                    onCheckedChange={(v) => updatePrivacy('showProfile', v)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>مشاركة البيانات للتحسين</Label>
                    <p className="text-sm text-muted-foreground">المساعدة في تحسين خدماتنا</p>
                  </div>
                  <Switch 
                    checked={settings.privacy.shareData}
                    onCheckedChange={(v) => updatePrivacy('shareData', v)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* زر الحفظ */}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              حفظ الإعدادات
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserSettings;
