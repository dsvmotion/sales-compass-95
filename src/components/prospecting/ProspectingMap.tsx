/// <reference types="@types/google.maps" />

import { useEffect, useRef, useCallback } from 'react';
import { Pharmacy, STATUS_COLORS } from '@/types/pharmacy';

interface ProspectingMapProps {
  pharmacies: Pharmacy[];
  selectedPharmacyId: string | null;
  onSelectPharmacy: (pharmacy: Pharmacy) => void;
  onMapReady?: (map: google.maps.Map) => void;
  center?: { lat: number; lng: number };
}

export function ProspectingMap({
  pharmacies,
  selectedPharmacyId,
  onSelectPharmacy,
  onMapReady,
  center = { lat: 40.4168, lng: -3.7038 }, // Madrid
}: ProspectingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const createMarkerContent = useCallback((pharmacy: Pharmacy, isSelected: boolean) => {
    const color = STATUS_COLORS[pharmacy.commercial_status].pin;
    const size = isSelected ? 32 : 24;
    const borderWidth = isSelected ? 4 : 3;
    
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        border: ${borderWidth}px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.2s ease;
        ${isSelected ? 'transform: scale(1.2);' : ''}
      "></div>
    `;
    return div;
  }, []);

  const initMap = useCallback(() => {
    if (!mapRef.current || typeof google === 'undefined') return;

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 6,
      mapId: 'prospecting_map',
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
    
    if (onMapReady) {
      onMapReady(map);
    }
  }, [center, onMapReady]);

  const updateMarkers = useCallback(() => {
    if (!mapInstanceRef.current || typeof google === 'undefined') return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];

    // Create new markers
    pharmacies.forEach((pharmacy) => {
      const isSelected = pharmacy.id === selectedPharmacyId;
      
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: pharmacy.lat, lng: pharmacy.lng },
        content: createMarkerContent(pharmacy, isSelected),
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
  }, [pharmacies, selectedPharmacyId, createMarkerContent, onSelectPharmacy]);

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly`;
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
