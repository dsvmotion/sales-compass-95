/// <reference types="@types/google.maps" />

import { useEffect, useRef, useCallback, useState } from 'react';
import { Pharmacy, STATUS_COLORS } from '@/types/pharmacy';

interface ProspectingMapProps {
  pharmacies: Pharmacy[];
  selectedPharmacyId: string | null;
  onSelectPharmacy: (pharmacy: Pharmacy) => void;
  onMapReady?: (map: google.maps.Map) => void;
  onBoundsChanged?: (bounds: google.maps.LatLngBounds, center: google.maps.LatLng) => void;
  center?: { lat: number; lng: number };
  markerIconUrl?: string;
}

// Debounce utility
function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T & { cancel: () => void };
  
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return debouncedFn;
}

export function ProspectingMap({
  pharmacies,
  selectedPharmacyId,
  onSelectPharmacy,
  onMapReady,
  onBoundsChanged,
  center = { lat: 40.4168, lng: -3.7038 }, // Madrid
  markerIconUrl,
}: ProspectingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersByIdRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const debouncedBoundsChanged = useRef<ReturnType<typeof debounce> | null>(null);

  const getMarkerIcon = useCallback(
    (pharmacy: Pharmacy, isSelected: boolean): google.maps.Icon | google.maps.Symbol => {
      // Prefer custom icon when provided
      if (markerIconUrl) {
        const width = isSelected ? 44 : 36;
        const height = isSelected ? 54 : 44;
        return {
          url: markerIconUrl,
          scaledSize: new google.maps.Size(width, height),
          anchor: new google.maps.Point(width / 2, height),
        };
      }

      // Fallback (should be replaced by the provided icon)
      const color = STATUS_COLORS[pharmacy.commercial_status].pin;
      return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: isSelected ? 3 : 2,
        scale: isSelected ? 12 : 9,
      };
    },
    [markerIconUrl]
  );

  const initMap = useCallback(() => {
    if (!mapRef.current || typeof google === 'undefined') return;

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
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
    setIsMapReady(true);

    // Airbnb-style: trigger only when interaction ENDS (idle)
    // Debounced to avoid rapid-fire calls and to keep UI calm.
    if (onBoundsChanged) {
      // Create debounced handler - 800ms delay after map becomes idle
      debouncedBoundsChanged.current = debounce((bounds: google.maps.LatLngBounds, center: google.maps.LatLng) => {
        onBoundsChanged(bounds, center);
      }, 800);
      
      map.addListener('idle', () => {
        const bounds = map.getBounds();
        const center = map.getCenter();
        if (bounds && center && debouncedBoundsChanged.current) {
          // Never allow async exceptions to crash the map loop
          try {
            debouncedBoundsChanged.current(bounds, center);
          } catch (e) {
            console.error('onBoundsChanged error:', e);
          }
        }
      });
    }
    
    if (onMapReady) {
      onMapReady(map);
    }
  }, [center, onMapReady, onBoundsChanged]);

  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || typeof google === 'undefined' || !isMapReady) return;

    const map = mapInstanceRef.current;
    const nextIds = new Set(pharmacies.map((p) => p.id));
    const markersById = markersByIdRef.current;

    // Remove markers that are no longer present (no full clear → avoids flicker)
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
          const statusColor = STATUS_COLORS[pharmacy.commercial_status];
          infoWindowRef.current.setContent(`
            <div style="padding: 8px; min-width: 200px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="
                  display: inline-flex;
                  align-items: center;
                  gap: 4px;
                  padding: 2px 8px;
                  border-radius: 9999px;
                  font-size: 11px;
                  font-weight: 500;
                  background: ${statusColor.pin}20;
                  color: ${statusColor.pin};
                ">
                  <span style="
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: ${statusColor.pin};
                  "></span>
                  ${pharmacy.commercial_status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${pharmacy.name}</h3>
              ${pharmacy.address ? `<p style="font-size: 12px; color: #666; margin-bottom: 4px;">${pharmacy.address}</p>` : ''}
              ${pharmacy.phone ? `<p style="font-size: 12px; color: #666;">📞 ${pharmacy.phone}</p>` : ''}
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
      initMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    
    document.head.appendChild(script);

    return () => {
      // Clean up debounced function
      if (debouncedBoundsChanged.current) {
        debouncedBoundsChanged.current.cancel();
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [initMap]);

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

  return (
    <div ref={mapRef} className="w-full h-full rounded-lg" />
  );
}
