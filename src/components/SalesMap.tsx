import { useCallback, useMemo, useRef, useEffect, forwardRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Sale } from '@/types/sale';

interface SalesMapProps {
  sales: Sale[];
  onSaleSelect?: (sale: Sale) => void;
  selectedSaleId?: string | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 40.0,
  lng: -3.7, // Center of Spain
};

// Light mode map styles
const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      elementType: 'geometry',
      stylers: [{ color: '#f5f5f5' }],
    },
    {
      elementType: 'labels.text.stroke',
      stylers: [{ color: '#ffffff' }],
    },
    {
      elementType: 'labels.text.fill',
      stylers: [{ color: '#616161' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#e0e0e0' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#c9c9c9' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'administrative',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#c9c9c9' }],
    },
  ],
};

export const SalesMap = forwardRef<google.maps.Map | null, SalesMapProps>(function SalesMap(
  { sales, onSaleSelect, selectedSaleId },
  ref
) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeInfoWindow, setActiveInfoWindow] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Calculate bounds from sales
  const bounds = useMemo(() => {
    if (!isLoaded || sales.length === 0) return null;

    const bounds = new google.maps.LatLngBounds();
    sales.forEach((sale) => {
      bounds.extend({ lat: sale.lat, lng: sale.lng });
    });
    return bounds;
  }, [sales, isLoaded]);

  // Fit bounds when sales change
  useEffect(() => {
    if (mapRef.current && bounds && sales.length > 0) {
      mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

      // Don't zoom in too much for single markers
      const listener = google.maps.event.addListenerOnce(mapRef.current, 'bounds_changed', () => {
        const zoom = mapRef.current?.getZoom();
        if (zoom && zoom > 12) {
          mapRef.current?.setZoom(12);
        }
      });

      return () => {
        google.maps.event.removeListener(listener);
      };
    }
  }, [bounds, sales]);

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      if (typeof ref === 'function') {
        ref(map);
      } else if (ref) {
        ref.current = map;
      }

      // Fit to bounds on initial load
      if (bounds && sales.length > 0) {
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      }
    },
    [bounds, sales, ref]
  );

  const handleMarkerClick = useCallback(
    (sale: Sale) => {
      setActiveInfoWindow(sale.id);
      onSaleSelect?.(sale);
    },
    [onSaleSelect]
  );

  // Monochrome marker colors for light mode
  const getMarkerIcon = useCallback((type: 'pharmacy' | 'client') => {
    const color = type === 'pharmacy' ? '#1f2937' : '#9ca3af'; // gray-800 / gray-400
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 8,
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
      center={sales.length === 0 ? defaultCenter : undefined}
      zoom={sales.length === 0 ? 6 : undefined}
      options={mapOptions}
      onLoad={onMapLoad}
    >
      {sales.map((sale) => (
        <MarkerF
          key={sale.id}
          position={{ lat: sale.lat, lng: sale.lng }}
          icon={getMarkerIcon(sale.customerType)}
          onClick={() => handleMarkerClick(sale)}
          title={sale.customerName}
        >
          {activeInfoWindow === sale.id && (
            <InfoWindowF
              position={{ lat: sale.lat, lng: sale.lng }}
              onCloseClick={() => setActiveInfoWindow(null)}
            >
              <div className="min-w-[200px] p-2 text-gray-900">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      sale.customerType === 'pharmacy'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {sale.customerType === 'pharmacy' ? 'Pharmacy' : 'Client'}
                  </span>
                </div>
                <h3 className="font-semibold text-base mb-1">{sale.customerName}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {sale.address}, {sale.city}
                </p>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">Order {sale.orderId}</span>
                  <span className="font-bold text-gray-900">
                    €{sale.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </InfoWindowF>
          )}
        </MarkerF>
      ))}
    </GoogleMap>
  );
});
