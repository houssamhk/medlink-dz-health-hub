import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MapPin, Bell, Camera, Mic, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const PermissionPrompt = () => {
  const [showDialog, setShowDialog] = useState(false);
  const { permissions, loading, requestLocation, requestNotifications, requestCamera, requestMicrophone } = usePermissions();

  useEffect(() => {
    // Check if user has seen the permission prompt before
    const hasSeenPrompt = localStorage.getItem('permissions_prompted');
    
    if (!hasSeenPrompt && !loading) {
      // Check if any permission needs to be requested
      const needsPermission = 
        permissions.location === 'prompt' ||
        permissions.notifications === 'default';
      
      if (needsPermission) {
        setTimeout(() => setShowDialog(true), 2000);
      }
    }
  }, [loading, permissions]);

  const handleRequestAll = async () => {
    await requestNotifications();
    await requestLocation();
    localStorage.setItem('permissions_prompted', 'true');
    setShowDialog(false);
  };

  const handleSkip = () => {
    localStorage.setItem('permissions_prompted', 'true');
    setShowDialog(false);
  };

  const getIcon = (status: string) => {
    if (status === 'granted') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'denied') return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const permissionItems = [
    {
      key: 'location',
      icon: MapPin,
      title: 'الموقع الجغرافي',
      description: 'لعرض الصيدليات والعيادات القريبة منك',
      status: permissions.location,
    },
    {
      key: 'notifications',
      icon: Bell,
      title: 'الإشعارات',
      description: 'لإبلاغك بالمواعيد والتحديثات المهمة',
      status: permissions.notifications,
    },
  ];

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="max-w-md" dir="rtl">
        <Card className="border-0 shadow-none">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">أذونات التطبيق</CardTitle>
            <CardDescription>
              للحصول على أفضل تجربة، يحتاج التطبيق للأذونات التالية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {permissionItems.map((item) => (
              <div 
                key={item.key} 
                className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                {getIcon(item.status)}
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <Button onClick={handleRequestAll} className="flex-1">
                السماح للأذونات
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                لاحقاً
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionPrompt;
