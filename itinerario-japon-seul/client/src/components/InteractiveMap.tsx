import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Location {
  lat: number;
  lng: number;
  name: string;
  city: string;
  dayId?: number;
}

interface InteractiveMapProps {
  locations: Location[];
  height?: string;
  zoom?: number;
  center?: [number, number];
  onMarkerClick?: (dayId?: number) => void;
}

export default function InteractiveMap({
  locations,
  height = '400px',
  zoom = 5,
  center,
  onMarkerClick
}: InteractiveMapProps) {
  useEffect(() => {
    // Calculate center if not provided
    const mapCenter = center || [
      locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
      locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length,
    ];

    // Create map
    const map = L.map('map').setView(mapCenter as [number, number], zoom);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add markers
    locations.forEach((loc) => {
      const marker = L.marker([loc.lat, loc.lng]).addTo(map);
      marker.bindPopup(`<b>${loc.name}</b><br>${loc.city}`);
      
      if (onMarkerClick && loc.dayId) {
        marker.on('click', () => onMarkerClick(loc.dayId));
      }
    });

    // Cleanup
    return () => {
      map.remove();
    };
  }, [locations, zoom, center, onMarkerClick]);

  return <div id="map" style={{ height, width: '100%', borderRadius: '10px' }} />;
}

