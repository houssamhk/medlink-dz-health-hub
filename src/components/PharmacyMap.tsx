import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';

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
  mapboxToken?: string;
}

const PharmacyMap = ({ pharmacies, mapboxToken }: PharmacyMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [token, setToken] = useState(mapboxToken || '');
  const [isTokenSet, setIsTokenSet] = useState(!!mapboxToken);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!isTokenSet || !mapContainer.current || !token) return;

    mapboxgl.accessToken = token;

    // الموقع الافتراضي: الجزائر العاصمة
    const defaultCenter: [number, number] = [3.0588, 36.7538];
    const center = userLocation || defaultCenter;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center,
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');

    // إضافة موقع المستخدم
    if (userLocation) {
      new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat(userLocation)
        .setPopup(new mapboxgl.Popup().setHTML('<p class="font-bold">موقعك الحالي</p>'))
        .addTo(map.current);
    }

    // إضافة الصيدليات
    pharmacies.forEach((pharmacy) => {
      if (pharmacy.latitude && pharmacy.longitude) {
        const color = pharmacy.is_on_duty ? '#22c55e' : '#ef4444';
        
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div dir="rtl" class="p-2">
            <h3 class="font-bold text-sm">${pharmacy.name}</h3>
            <p class="text-xs text-gray-600">${pharmacy.address}</p>
            ${pharmacy.phone ? `<p class="text-xs mt-1">📞 ${pharmacy.phone}</p>` : ''}
            <p class="text-xs mt-1 font-medium ${pharmacy.is_on_duty ? 'text-green-600' : 'text-red-600'}">
              ${pharmacy.is_on_duty ? '🟢 مناوبة' : '🔴 مغلقة'}
            </p>
          </div>
        `);

        const marker = new mapboxgl.Marker({ color })
          .setLngLat([pharmacy.longitude, pharmacy.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current.push(marker);
      }
    });

    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      map.current?.remove();
    };
  }, [isTokenSet, token, pharmacies, userLocation]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
          if (map.current) {
            map.current.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 14
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleSetToken = () => {
    if (token.trim()) {
      setIsTokenSet(true);
    }
  };

  if (!isTokenSet) {
    return (
      <Card className="p-6" dir="rtl">
        <div className="text-center space-y-4">
          <MapPin className="h-12 w-12 mx-auto text-primary" />
          <h3 className="font-bold text-lg">الخريطة التفاعلية</h3>
          <p className="text-muted-foreground text-sm">
            لعرض الخريطة التفاعلية، يرجى إدخال مفتاح Mapbox الخاص بك
          </p>
          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              type="text"
              placeholder="أدخل مفتاح Mapbox..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSetToken}>تفعيل</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            يمكنك الحصول على مفتاح مجاني من{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              mapbox.com
            </a>
          </p>
        </div>
      </Card>
    );
  }

  const pharmaciesWithLocation = pharmacies.filter(p => p.latitude && p.longitude);

  return (
    <div className="relative">
      {pharmaciesWithLocation.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <div className="text-center p-4">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">لا توجد صيدليات بإحداثيات جغرافية</p>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 right-4 z-10">
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

      <div className="absolute bottom-4 right-4 z-10 bg-background/90 p-2 rounded-lg shadow text-xs" dir="rtl">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>صيدلية مناوبة</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>صيدلية مغلقة</span>
        </div>
      </div>

      <div 
        ref={mapContainer} 
        className="w-full h-[500px] rounded-lg shadow-lg"
      />
    </div>
  );
};

export default PharmacyMap;
