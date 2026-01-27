/// <reference types="@types/google.maps" />

import { useEffect, useRef, useCallback, useState } from 'react';
import { Pharmacy, STATUS_COLORS } from '@/types/pharmacy';
import { Filter } from 'lucide-react';

interface ProspectingMapProps {
  pharmacies: Pharmacy[];
  selectedPharmacyId: string | null;
  onSelectPharmacy: (pharmacy: Pharmacy) => void;
  onMapReady?: (map: google.maps.Map) => void;
  center?: { lat: number; lng: number };
  hasActiveGeoFilter: boolean;
}

// Status colors matching new design: Yellow/Blue/Green
const STATUS_PIN_COLORS = {
  not_contacted: '#eab308', // Yellow
  contacted: '#3b82f6', // Blue
  client: '#22c55e', // Green
};

export function ProspectingMap({
  pharmacies,
  selectedPharmacyId,
  onSelectPharmacy,
  onMapReady,
  center = { lat: 40.4168, lng: -3.7038 }, // Madrid
  hasActiveGeoFilter,
}: ProspectingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersByIdRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Get marker icon using status colors (Yellow/Blue/Green)
  const getMarkerIcon = useCallback(
    (pharmacy: Pharmacy, isSelected: boolean): google.maps.Symbol => {
      const color = STATUS_PIN_COLORS[pharmacy.commercial_status];
      return {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: isSelected ? '#1f2937' : '#ffffff',
        strokeWeight: isSelected ? 2 : 1,
        scale: isSelected ? 8 : 6,
      };
    },
    []
  );

  const initMapOnce = useCallback(() => {
    if (!mapRef.current || typeof google === 'undefined') return;
    if (mapInstanceRef.current) return;

    // Light mode map styles
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 6,
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
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
    setIsMapReady(true);
    
    if (onMapReady) {
      onMapReady(map);
    }
  }, [center, onMapReady]);

  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || typeof google === 'undefined' || !isMapReady) return;

    const map = mapInstanceRef.current;
    const nextIds = new Set(pharmacies.map((p) => p.id));
    const markersById = markersByIdRef.current;

    // Remove markers that are no longer present
    for (const [id, marker] of markersById.entries()) {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        markersById.delete(id);
      }
    }

    // Add/update markers
    pharmacies.forEach((pharmacy) => {
      const isSelected = pharmacy.id === selectedPharmacyId;
      const existing = markersById.get(pharmacy.id);
      const icon = getMarkerIcon(pharmacy, isSelected);

      if (existing) {
        existing.setPosition({ lat: pharmacy.lat, lng: pharmacy.lng });
        existing.setTitle(pharmacy.name);
        existing.setIcon(icon);
        existing.setZIndex(isSelected ? 999 : undefined);
        return;
      }

      const marker = new google.maps.Marker({
        map,
        position: { lat: pharmacy.lat, lng: pharmacy.lng },
        icon,
        title: pharmacy.name,
        zIndex: isSelected ? 999 : undefined,
      });

      marker.addListener('click', () => {
        onSelectPharmacy(pharmacy);

        if (infoWindowRef.current) {
          const statusLabels = {
            not_contacted: 'Not Contacted',
            contacted: 'Contacted',
            client: 'Client',
          };
          infoWindowRef.current.setContent(`
            <div style="padding: 8px; min-width: 200px; font-family: system-ui, sans-serif;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="
                  display: inline-flex;
                  align-items: center;
                  gap: 4px;
                  padding: 2px 8px;
                  border-radius: 4px;
                  font-size: 11px;
                  font-weight: 500;
                  background: #f3f4f6;
                  color: #374151;
                ">
                  ${statusLabels[pharmacy.commercial_status]}
                </span>
              </div>
              <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 4px; color: #111827;">${pharmacy.name}</h3>
              ${pharmacy.address ? `<p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">${pharmacy.address}</p>` : ''}
              ${pharmacy.phone ? `<p style="font-size: 12px; color: #6b7280;">📞 ${pharmacy.phone}</p>` : ''}
            </div>
          `);
          infoWindowRef.current.open(map, marker);
        }
      });

      markersById.set(pharmacy.id, marker);
    });
  }, [pharmacies, selectedPharmacyId, getMarkerIcon, onSelectPharmacy, isMapReady]);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('Google Maps API key not found');
      return;
    }

    if (typeof google !== 'undefined' && google.maps) {
      initMapOnce();
      return;
    }

    const existing = document.getElementById('google-maps-js');
    if (existing) {
      existing.addEventListener('load', initMapOnce);
      return () => existing.removeEventListener('load', initMapOnce);
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = initMapOnce;
    document.head.appendChild(script);
  }, [initMapOnce]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      for (const [, marker] of markersByIdRef.current.entries()) {
        marker.setMap(null);
      }
      markersByIdRef.current.clear();
    };
  }, []);

  // Update markers when pharmacies change
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Pan to selected pharmacy
  useEffect(() => {
    if (selectedPharmacyId && mapInstanceRef.current) {
      const pharmacy = pharmacies.find(p => p.id === selectedPharmacyId);
      if (pharmacy) {
        mapInstanceRef.current.panTo({ lat: pharmacy.lat, lng: pharmacy.lng });
        mapInstanceRef.current.setZoom(15);
      }
    }
  }, [selectedPharmacyId, pharmacies]);

  // Fit bounds when pharmacies change significantly
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady || pharmacies.length === 0) return;

    const map = mapInstanceRef.current;
    const bounds = new google.maps.LatLngBounds();
    
    pharmacies.forEach((pharmacy) => {
      bounds.extend({ lat: pharmacy.lat, lng: pharmacy.lng });
    });

    if (!selectedPharmacyId) {
      map.fitBounds(bounds, 50);
      
      const listener = google.maps.event.addListener(map, 'idle', () => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 15) {
          map.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [pharmacies, isMapReady, selectedPharmacyId]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Empty state overlay when no filters applied */}
      {!hasActiveGeoFilter && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/90 pointer-events-none">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
              <Filter className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Select filters to display pharmacies</h3>
            <p className="text-gray-500 text-sm">
              Use the Country, Province, or City filters in the sidebar to view pharmacies on the map.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Not contacted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Contacted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span>Client</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
