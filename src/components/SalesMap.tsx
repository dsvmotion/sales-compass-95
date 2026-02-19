import { useCallback, useRef, useEffect, forwardRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import { MarkerClusterer, type Cluster, type ClusterStats, type Renderer } from '@googlemaps/markerclusterer';
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

function getMarkerIcon(customerType: string, status?: string) {
  let color = '#9333ea'; // default: morado (WooCommerce order / not contacted)
  if (status === 'client') {
    color = '#f97316'; // naranja para clientes
  } else if (status === 'contacted') {
    color = '#3b82f6'; // azul para contactados
  } else if (customerType === 'pharmacy') {
    color = '#16a34a'; // verde para farmacias no contactadas
  } else if (customerType === 'herbalist') {
    color = '#166534'; // verde oscuro para herbolarios no contactados
  }
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: 8,
  };
}

export const SalesMap = forwardRef<google.maps.Map | null, SalesMapProps>(function SalesMap(
  { sales, onSaleSelect },
  ref
) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const prevSalesLengthRef = useRef(0);
  const [mapReady, setMapReady] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      setMapReady(true);
      if (typeof ref === 'function') {
        ref(map);
      } else if (ref) {
        ref.current = map;
      }
    },
    [ref]
  );

  // Fit bounds only when sales.length changes (not on marker click)
  useEffect(() => {
    if (!mapRef.current || sales.length === 0) return;
    if (sales.length === prevSalesLengthRef.current) return;
    prevSalesLengthRef.current = sales.length;

    const bounds = new google.maps.LatLngBounds();
    sales.forEach((sale) => bounds.extend({ lat: sale.lat, lng: sale.lng }));
    mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    const listener = google.maps.event.addListenerOnce(mapRef.current, 'idle', () => {
      if (mapRef.current) {
        const zoom = mapRef.current.getZoom();
        if (zoom != null && zoom > 12) {
          mapRef.current.setZoom(12);
        }
      }
    });
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [sales]);

  // Create markers and clusterer when map is ready and sales change
  useEffect(() => {
    if (!isLoaded || !mapReady || !mapRef.current) return;

    const map = mapRef.current;

    // Clear previous clusterer and markers
    try {
      if (clustererRef.current) {
        clustererRef.current.setMap(null);
        clustererRef.current = null;
      }
    } catch (e) {
      clustererRef.current = null;
    }

    if (sales.length === 0) {
      return;
    }

    const markerTypeMap = new Map<google.maps.Marker, string>();
    const markerStatusMap = new Map<google.maps.Marker, string>();

    const markers: google.maps.Marker[] = sales.map((sale) => {
      const marker = new google.maps.Marker({
        position: { lat: sale.lat, lng: sale.lng },
        icon: getMarkerIcon(sale.customerType, sale.commercialStatus),
        title: sale.customerName,
        map,
      });

      markerTypeMap.set(marker, sale.customerType);
      if (sale.commercialStatus) markerStatusMap.set(marker, sale.commercialStatus);

      marker.addListener('click', () => {
        setSelectedSale(sale);
        onSaleSelect?.(sale);
      });

      return marker;
    });

    markersRef.current = markers;

    const renderer: Renderer = {
      render(cluster: Cluster, _stats: ClusterStats, _map: google.maps.Map) {
        const count = cluster.count;
        const position = cluster.position;
        const clusterMarkers = cluster.markers;

        let wooCount = 0;
        let clientCount = 0;
        let contactedCount = 0;
        let herbalistCount = 0;
        let pharmacyCount = 0;

        clusterMarkers?.forEach((m) => {
          const type = markerTypeMap.get(m as google.maps.Marker);
          const status = markerStatusMap.get(m as google.maps.Marker);

          if (type === 'client' || (!status && type !== 'pharmacy' && type !== 'herbalist')) {
            wooCount++;
          } else if (status === 'client') {
            clientCount++;
          } else if (status === 'contacted') {
            contactedCount++;
          } else if (type === 'herbalist') {
            herbalistCount++;
          } else {
            pharmacyCount++;
          }
        });

        const counts = [
          { count: wooCount, color: '#9333ea' },
          { count: clientCount, color: '#f97316' },
          { count: contactedCount, color: '#3b82f6' },
          { count: herbalistCount, color: '#166534' },
          { count: pharmacyCount, color: '#16a34a' },
        ];
        const color = counts.sort((a, b) => b.count - a.count)[0].color;

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2" opacity="0.9"/>
      <text x="20" y="25" text-anchor="middle" fill="white" font-size="13" font-weight="bold">${count}</text>
    </svg>`;

        return new google.maps.Marker({
          position,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
            scaledSize: new google.maps.Size(40, 40),
          },
          zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
        });
      },
    };

    // Create clusterer - this will manage adding/removing markers from the map
    clustererRef.current = new MarkerClusterer({
      map,
      markers,
      renderer,
      algorithmOptions: { maxZoom: 14 },
    });

    return () => {
      try {
        if (clustererRef.current) {
          clustererRef.current.setMap(null);
          clustererRef.current = null;
        }
      } catch (e) {
        clustererRef.current = null;
      }
      // Remove markers from map
      markersRef.current.forEach(m => {
        google.maps.event.clearInstanceListeners(m);
        m.setMap(null);
      });
      markersRef.current = [];
    };
  }, [isLoaded, mapReady, sales, onSaleSelect]);

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
      {selectedSale && (
        <InfoWindow
          position={{ lat: selectedSale.lat, lng: selectedSale.lng }}
          onCloseClick={() => setSelectedSale(null)}
        >
          <div style={{ padding: '8px', maxWidth: '280px', fontFamily: 'system-ui, sans-serif' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600 }}>{selectedSale.customerName}</h3>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666' }}>{selectedSale.address || ''}</p>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666' }}>
              {[selectedSale.city, selectedSale.province, selectedSale.country].filter(Boolean).join(', ')}
            </p>
            {selectedSale.phone && (
              <p style={{ margin: '0 0 2px', fontSize: '12px', color: '#444' }}>📞 {selectedSale.phone}</p>
            )}
            {selectedSale.email && (
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#444' }}>✉️ {selectedSale.email}</p>
            )}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
              <span style={{
                background: selectedSale.commercialStatus === 'client' ? '#f97316' : selectedSale.commercialStatus === 'contacted' ? '#3b82f6' : '#9333ea',
                color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px'
              }}>
                {selectedSale.commercialStatus || (selectedSale.customerType === 'client' ? 'WooCommerce' : 'Not contacted')}
              </span>
              {selectedSale.amount > 0 && (
                <span style={{ fontSize: '12px', fontWeight: 600 }}>€{selectedSale.amount.toFixed(2)}</span>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
});
