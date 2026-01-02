import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PermissionState {
  location: 'granted' | 'denied' | 'prompt' | 'unavailable';
  notifications: 'granted' | 'denied' | 'default' | 'unavailable';
  camera: 'granted' | 'denied' | 'prompt' | 'unavailable';
  microphone: 'granted' | 'denied' | 'prompt' | 'unavailable';
}

export const usePermissions = () => {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<PermissionState>({
    location: 'prompt',
    notifications: 'default',
    camera: 'prompt',
    microphone: 'prompt',
  });
  const [loading, setLoading] = useState(true);

  const checkPermissions = useCallback(async () => {
    setLoading(true);
    const newState: PermissionState = {
      location: 'prompt',
      notifications: 'default',
      camera: 'prompt',
      microphone: 'prompt',
    };

    // Check geolocation
    if ('geolocation' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        newState.location = result.state;
      } catch {
        newState.location = 'prompt';
      }
    } else {
      newState.location = 'unavailable';
    }

    // Check notifications
    if ('Notification' in window) {
      newState.notifications = Notification.permission;
    } else {
      newState.notifications = 'unavailable';
    }

    // Check camera
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      newState.camera = result.state;
    } catch {
      newState.camera = 'prompt';
    }

    // Check microphone
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      newState.microphone = result.state;
    } catch {
      newState.microphone = 'prompt';
    }

    setPermissions(newState);
    setLoading(false);
    return newState;
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const requestLocation = useCallback(async (): Promise<GeolocationPosition | null> => {
    if (!('geolocation' in navigator)) {
      toast({
        title: 'غير مدعوم',
        description: 'المتصفح لا يدعم تحديد الموقع',
        variant: 'destructive',
      });
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPermissions(prev => ({ ...prev, location: 'granted' }));
          toast({
            title: 'تم',
            description: 'تم تحديد موقعك بنجاح',
          });
          resolve(position);
        },
        (error) => {
          setPermissions(prev => ({ ...prev, location: 'denied' }));
          let message = 'فشل تحديد الموقع';
          if (error.code === 1) message = 'تم رفض الوصول للموقع';
          else if (error.code === 2) message = 'الموقع غير متوفر';
          else if (error.code === 3) message = 'انتهت مهلة تحديد الموقع';

          toast({
            title: 'خطأ',
            description: message,
            variant: 'destructive',
          });
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, [toast]);

  const requestNotifications = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast({
        title: 'غير مدعوم',
        description: 'المتصفح لا يدعم الإشعارات',
        variant: 'destructive',
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermissions(prev => ({ ...prev, notifications: permission }));

    if (permission === 'granted') {
      toast({
        title: 'تم',
        description: 'تم تفعيل الإشعارات بنجاح',
      });
      return true;
    } else {
      toast({
        title: 'تنبيه',
        description: 'لن تصلك الإشعارات بدون تفعيلها',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const requestCamera = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissions(prev => ({ ...prev, camera: 'granted' }));
      toast({
        title: 'تم',
        description: 'تم تفعيل الكاميرا بنجاح',
      });
      return stream;
    } catch (error) {
      setPermissions(prev => ({ ...prev, camera: 'denied' }));
      toast({
        title: 'خطأ',
        description: 'فشل الوصول للكاميرا',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const requestMicrophone = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));
      toast({
        title: 'تم',
        description: 'تم تفعيل الميكروفون بنجاح',
      });
      return stream;
    } catch (error) {
      setPermissions(prev => ({ ...prev, microphone: 'denied' }));
      toast({
        title: 'خطأ',
        description: 'فشل الوصول للميكروفون',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const requestAllPermissions = useCallback(async () => {
    toast({
      title: 'طلب الأذونات',
      description: 'سيتم طلب الأذونات اللازمة لعمل التطبيق',
    });

    await requestNotifications();
    await requestLocation();
    
    await checkPermissions();
  }, [requestNotifications, requestLocation, checkPermissions, toast]);

  return {
    permissions,
    loading,
    checkPermissions,
    requestLocation,
    requestNotifications,
    requestCamera,
    requestMicrophone,
    requestAllPermissions,
  };
};
