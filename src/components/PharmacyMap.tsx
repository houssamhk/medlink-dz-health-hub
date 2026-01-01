import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PharmacyLocation {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  is_on_duty: boolean | null;
  phone: string | null;
}

interface PharmacyMapProps {
  pharmacies: PharmacyLocation[];
}

const PharmacyMap = ({ pharmacies }: PharmacyMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { toast } = useToast();

  // Default center: Algiers
  const defaultCenter: [number, number] = [36.7538, 3.0588];

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Add Leaflet CSS
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Load Leaflet JS
        if (!(window as any).L) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Leaflet'));
            document.head.appendChild(script);
          });
        }

        setMapLoaded(true);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
        toast({
          title: "خطأ",
          description: "فشل تحميل الخريطة",
          variant: "destructive"
        });
      }
    };

    loadLeaflet();
  }, [toast]);

  // Initialize map when Leaflet is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    try {
      const center = userLocation || defaultCenter;
      const map = L.map(mapRef.current).setView(center, 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      mapInstanceRef.current = map;
      setLoading(false);
    } catch (error) {
      console.error('Error initializing map:', error);
      setLoading(false);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  // Add markers when map and pharmacies are ready
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    const L = (window as any).L;
    if (!L) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create custom icons
    const createIcon = (color: string) => L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });

    const greenIcon = createIcon('#22c55e');
    const redIcon = createIcon('#ef4444');
    const blueIcon = createIcon('#3b82f6');

    // Add user location marker
    if (userLocation) {
      const userMarker = L.marker(userLocation, { icon: blueIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<div dir="rtl" class="text-center font-bold">موقعك الحالي</div>');
      markersRef.current.push(userMarker);
    }

    // Add pharmacy markers
    pharmacies.forEach((pharmacy) => {
      if (!pharmacy.latitude || !pharmacy.longitude) return;

      const icon = pharmacy.is_on_duty ? greenIcon : redIcon;
      const marker = L.marker([pharmacy.latitude, pharmacy.longitude], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div dir="rtl" class="p-1">
            <h3 class="font-bold text-sm">${pharmacy.name}</h3>
            <p class="text-xs text-gray-600">${pharmacy.address}</p>
            ${pharmacy.phone ? `<p class="text-xs mt-1">📞 ${pharmacy.phone}</p>` : ''}
            <p class="text-xs mt-1 font-medium ${pharmacy.is_on_duty ? 'text-green-600' : 'text-red-600'}">
              ${pharmacy.is_on_duty ? '🟢 مناوبة' : '🔴 مغلقة'}
            </p>
          </div>
        `);
      markersRef.current.push(marker);
    });
  }, [pharmacies, userLocation, mapLoaded]);

  // Fly to user location when it changes
  useEffect(() => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(userLocation, 14);
    }
  }, [userLocation]);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "غير مدعوم",
        description: "المتصفح لا يدعم تحديد الموقع",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "جاري تحديد الموقع...",
      description: "يرجى السماح بالوصول للموقع"
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        toast({
          title: "تم",
          description: "تم تحديد موقعك بنجاح"
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        let message = "فشل تحديد الموقع";
        if (error.code === 1) message = "يرجى السماح بالوصول للموقع";
        else if (error.code === 2) message = "الموقع غير متوفر";
        else if (error.code === 3) message = "انتهت مهلة تحديد الموقع";
        
        toast({
          title: "خطأ",
          description: message,
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const pharmaciesWithLocation = pharmacies.filter(p => p.latitude && p.longitude);

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/80 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && pharmaciesWithLocation.length === 0 && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-background/80 rounded-lg">
          <div className="text-center p-4">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">لا توجد صيدليات بإحداثيات جغرافية</p>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 right-4 z-[1000]">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={getUserLocation}
          className="shadow-lg"
        >
          <Navigation className="h-4 w-4 ml-2" />
          موقعي
        </Button>
      </div>

      <div className="absolute bottom-4 right-4 z-[1000] bg-background/90 p-2 rounded-lg shadow text-xs" dir="rtl">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>صيدلية مناوبة</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>صيدلية مغلقة</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span>موقعك</span>
        </div>
      </div>

      <div 
        ref={mapRef}
        className="w-full h-[500px] rounded-lg shadow-lg"
        style={{ zIndex: 0 }}
      />
    </div>
  );
};

export default PharmacyMap;
