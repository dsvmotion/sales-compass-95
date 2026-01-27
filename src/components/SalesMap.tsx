import { useEffect, useRef } from 'react';
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

// Heatmap layer component
function HeatmapLayer({ sales, show }: { sales: Sale[]; show: boolean }) {
  const map = useMap();
  const heatLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (show && sales.length > 0) {
      const heatData: [number, number, number][] = sales.map(sale => [
        sale.lat,
        sale.lng,
        sale.amount / 1000, // Intensity based on amount
      ]);

      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 35,
        blur: 25,
        maxZoom: 10,
        max: 3,
        gradient: {
          0.0: '#0d9488',
          0.25: '#14b8a6',
          0.5: '#2dd4bf',
          0.75: '#a855f7',
          1.0: '#c084fc',
        },
      });

      heatLayerRef.current.addTo(map);
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, sales, show]);

  return null;
}

export function SalesMap({ sales, showHeatmap }: SalesMapProps) {
  const center: [number, number] = [40.0, -3.7]; // Center of Spain
  
  return (
    <div className="map-container h-full w-full">
      <MapContainer
        center={center}
        zoom={6}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
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
