import { useCallback, useMemo, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Pharmacy, STATUS_COLORS } from '@/types/pharmacy';
import { useState } from 'react';

interface PharmacyGoogleMapProps {
  pharmacies: Pharmacy[];
  onPharmacySelect?: (pharmacy: Pharmacy) => void;
  selectedPharmacyId?: string | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 40.4168,
  lng: -3.7038, // Madrid, Spain
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      elementType: 'geometry',
      stylers: [{ color: '#1a1f2e' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#1a1f2e' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#8b9dc3' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#2d3548' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#0e1626' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ],
};

export function PharmacyGoogleMap({ 
  pharmacies, 
  onPharmacySelect,
  selectedPharmacyId 
}: PharmacyGoogleMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<string | null>(null);
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Calculate bounds from pharmacies
  const bounds = useMemo(() => {
    if (!isLoaded || pharmacies.length === 0) return null;
    
    const bounds = new google.maps.LatLngBounds();
    pharmacies.forEach(pharmacy => {
      bounds.extend({ lat: pharmacy.lat, lng: pharmacy.lng });
    });
    return bounds;
  }, [pharmacies, isLoaded]);

  // Fit bounds when pharmacies change
  useEffect(() => {
    if (mapRef.current && bounds && pharmacies.length > 0) {
      mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      
      // Don't zoom in too much for single markers
      const listener = google.maps.event.addListenerOnce(mapRef.current, 'bounds_changed', () => {
        const zoom = mapRef.current?.getZoom();
        if (zoom && zoom > 15) {
          mapRef.current?.setZoom(15);
        }
      });
      
      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [bounds, pharmacies]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    
    // Fit to bounds on initial load
    if (bounds && pharmacies.length > 0) {
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [bounds, pharmacies]);

  const handleMarkerClick = useCallback((pharmacy: Pharmacy) => {
    setActiveInfoWindow(pharmacy.id);
    onPharmacySelect?.(pharmacy);
  }, [onPharmacySelect]);

  const getMarkerIcon = useCallback((status: Pharmacy['commercial_status']) => {
    const color = STATUS_COLORS[status].pin;
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 10,
    };
  }, []);

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-card/50 rounded-lg">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Failed to load Google Maps</p>
          <p className="text-sm mt-1">Please check your API key configuration</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-card/50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={pharmacies.length === 0 ? defaultCenter : undefined}
      zoom={pharmacies.length === 0 ? 6 : undefined}
      options={mapOptions}
      onLoad={onMapLoad}
    >
      {pharmacies.map((pharmacy) => (
        <MarkerF
          key={pharmacy.id}
          position={{ lat: pharmacy.lat, lng: pharmacy.lng }}
          icon={getMarkerIcon(pharmacy.commercial_status)}
          onClick={() => handleMarkerClick(pharmacy)}
          title={pharmacy.name}
        >
          {activeInfoWindow === pharmacy.id && (
            <InfoWindowF
              position={{ lat: pharmacy.lat, lng: pharmacy.lng }}
              onCloseClick={() => setActiveInfoWindow(null)}
            >
              <div className="min-w-[200px] p-2 text-gray-900">
                <h3 className="font-semibold text-base mb-1">{pharmacy.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {pharmacy.address && `${pharmacy.address}, `}
                  {pharmacy.city}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span 
                    className={`px-2 py-0.5 rounded-full ${STATUS_COLORS[pharmacy.commercial_status].bg} ${STATUS_COLORS[pharmacy.commercial_status].text}`}
                  >
                    {pharmacy.commercial_status.replace('_', ' ')}
                  </span>
                </div>
                {pharmacy.phone && (
                  <p className="text-xs text-gray-500 mt-2">{pharmacy.phone}</p>
                )}
              </div>
            </InfoWindowF>
          )}
        </MarkerF>
      ))}
    </GoogleMap>
  );
}
