import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

// Custom marker icons
const createCustomIcon = (color: string) => {
  return L.divIcon({
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
};

const greenIcon = createCustomIcon('#22c55e');
const redIcon = createCustomIcon('#ef4444');
const blueIcon = createCustomIcon('#3b82f6');

// Component to handle flying to user location
const FlyToLocation = ({ position }: { position: [number, number] | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14);
    }
  }, [position, map]);
  
  return null;
};

const PharmacyMap = ({ pharmacies }: PharmacyMapProps) => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  
  // Default center: Algiers
  const defaultCenter: [number, number] = [36.7538, 3.0588];

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const pharmaciesWithLocation = pharmacies.filter(p => p.latitude && p.longitude);

  return (
    <div className="relative">
      {pharmaciesWithLocation.length === 0 && (
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
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>صيدلية مغلقة</span>
        </div>
      </div>

      <MapContainer
        center={userLocation || defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-[500px] rounded-lg shadow-lg"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FlyToLocation position={userLocation} />
        
        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={blueIcon}>
            <Popup>
              <div dir="rtl" className="text-center">
                <p className="font-bold">موقعك الحالي</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Pharmacy markers */}
        {pharmacies.map((pharmacy) => {
          if (!pharmacy.latitude || !pharmacy.longitude) return null;
          
          return (
            <Marker
              key={pharmacy.id}
              position={[pharmacy.latitude, pharmacy.longitude]}
              icon={pharmacy.is_on_duty ? greenIcon : redIcon}
            >
              <Popup>
                <div dir="rtl" className="p-1">
                  <h3 className="font-bold text-sm">{pharmacy.name}</h3>
                  <p className="text-xs text-gray-600">{pharmacy.address}</p>
                  {pharmacy.phone && (
                    <p className="text-xs mt-1">📞 {pharmacy.phone}</p>
                  )}
                  <p className={`text-xs mt-1 font-medium ${pharmacy.is_on_duty ? 'text-green-600' : 'text-red-600'}`}>
                    {pharmacy.is_on_duty ? '🟢 مناوبة' : '🔴 مغلقة'}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default PharmacyMap;
