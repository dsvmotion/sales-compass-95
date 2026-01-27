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
}

export function ProspectingMap({
  pharmacies,
  selectedPharmacyId,
  onSelectPharmacy,
  onMapReady,
  onBoundsChanged,
  center = { lat: 40.4168, lng: -3.7038 }, // Madrid
}: ProspectingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const getMarkerIcon = useCallback((pharmacy: Pharmacy, isSelected: boolean) => {
    const color = STATUS_COLORS[pharmacy.commercial_status].pin;
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: isSelected ? '#ffffff' : '#ffffff',
      strokeWeight: isSelected ? 3 : 2,
      scale: isSelected ? 12 : 9,
    };
  }, []);

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
    
    // Set up bounds changed listener for dynamic loading
    if (onBoundsChanged) {
      let debounceTimer: ReturnType<typeof setTimeout>;
      
      map.addListener('idle', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const bounds = map.getBounds();
          const center = map.getCenter();
          if (bounds && center) {
            onBoundsChanged(bounds, center);
          }
        }, 500); // Debounce 500ms
      });
    }
    
    if (onMapReady) {
      onMapReady(map);
    }
  }, [center, onMapReady, onBoundsChanged]);

  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || typeof google === 'undefined' || !isMapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // Create new markers using standard Marker (not AdvancedMarkerElement)
    pharmacies.forEach((pharmacy) => {
      const isSelected = pharmacy.id === selectedPharmacyId;
      
      const marker = new google.maps.Marker({
        map: mapInstanceRef.current,
        position: { lat: pharmacy.lat, lng: pharmacy.lng },
        icon: getMarkerIcon(pharmacy, isSelected),
        title: pharmacy.name,
      });

      marker.addListener('click', () => {
        onSelectPharmacy(pharmacy);
        
        // Show info window
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
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }
      });

      markersRef.current.push(marker);
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
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [initMap]);

  // Update markers when pharmacies change
  useEffect(() => {
    updateMarkers();
  }, [updateMarkers]);

  // Fit bounds to all pharmacies when they first load
  useEffect(() => {
    if (mapInstanceRef.current && pharmacies.length > 0 && isMapReady) {
      const bounds = new google.maps.LatLngBounds();
      pharmacies.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      mapInstanceRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  }, [pharmacies.length, isMapReady]);

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
