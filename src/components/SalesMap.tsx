import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { Sale } from '@/data/mockSales';

interface SalesMapProps {
  sales: Sale[];
  showHeatmap: boolean;
}

// Custom marker icons
const createMarkerIcon = (type: 'pharmacy' | 'client') => {
  const color = type === 'pharmacy' ? '#14b8a6' : '#a855f7';
  const borderColor = type === 'pharmacy' ? '#2dd4bf' : '#c084fc';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid ${borderColor};
        box-shadow: 0 0 15px ${color}80;
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const pharmacyIcon = createMarkerIcon('pharmacy');
const clientIcon = createMarkerIcon('client');

// Map initialization and resize handler
function MapInitializer({ sales }: { sales: Sale[] }) {
  const map = useMap();
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    // Force a resize check after map mounts
    const resizeMap = () => {
      map.invalidateSize({ animate: false });
      
      // Fit to data bounds on first load
      if (!hasInitialized.current && sales.length > 0) {
        const bounds = L.latLngBounds(sales.map(s => [s.lat, s.lng] as L.LatLngTuple));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
          hasInitialized.current = true;
        }
      }
    };
    
    // Multiple resize calls to handle async container sizing
    resizeMap();
    const t1 = setTimeout(resizeMap, 100);
    const t2 = setTimeout(resizeMap, 300);
    const t3 = setTimeout(resizeMap, 600);
    
    window.addEventListener('resize', resizeMap);
    
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', resizeMap);
    };
  }, [map, sales]);
  
  return null;
}

// Heatmap layer component
function HeatmapLayer({ sales, show }: { sales: Sale[]; show: boolean }) {
  const map = useMap();
  const heatLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    // Clean up existing layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (show && sales.length > 0) {
      const heatData: [number, number, number][] = sales.map(sale => [
        sale.lat,
        sale.lng,
        Math.max(sale.amount / 300, 1),
      ]);

      console.log('Creating heatmap with', heatData.length, 'points');

      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 45,
        blur: 35,
        maxZoom: 12,
        max: 10,
        minOpacity: 0.5,
        gradient: {
          0.0: '#0d9488',
          0.2: '#14b8a6',
          0.4: '#2dd4bf',
          0.6: '#5eead4',
          0.8: '#a855f7',
          1.0: '#c084fc',
        },
      });

      heatLayerRef.current.addTo(map);
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, sales, show]);

  return null;
}

export function SalesMap({ sales, showHeatmap }: SalesMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Calculate Spain bounds from sales data or use defaults
  const center: L.LatLngTuple = sales.length > 0
    ? [
        sales.reduce((sum, s) => sum + s.lat, 0) / sales.length,
        sales.reduce((sum, s) => sum + s.lng, 0) / sales.length
      ]
    : [40.2, -3.5];
  
  // Callback to handle map creation
  const whenCreated = useCallback((map: L.Map) => {
    mapRef.current = map;
    // Delay invalidateSize to ensure container is fully rendered
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, []);
  
  return (
    <div 
      ref={containerRef}
      style={{ 
        height: '100%', 
        width: '100%',
        position: 'relative'
      }}
    >
      <MapContainer
        center={center}
        zoom={6}
        style={{ 
          height: '100%', 
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        zoomControl={true}
        ref={whenCreated as any}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapInitializer sales={sales} />
        <HeatmapLayer sales={sales} show={showHeatmap} />
        
        {!showHeatmap && sales.map((sale) => (
          <Marker
            key={sale.id}
            position={[sale.lat, sale.lng]}
            icon={sale.customerType === 'pharmacy' ? pharmacyIcon : clientIcon}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      sale.customerType === 'pharmacy' 
                        ? 'bg-teal-500/20 text-teal-400' 
                        : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {sale.customerType === 'pharmacy' ? 'Pharmacy' : 'Client'}
                  </span>
                </div>
                <h3 className="font-semibold text-base mb-1">{sale.customerName}</h3>
                <p className="text-sm text-muted-foreground mb-2">{sale.address}, {sale.city}</p>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Order {sale.orderId}</span>
                  <span className="font-bold text-primary">€{sale.amount.toLocaleString()}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
