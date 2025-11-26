import { Activity } from "@/types/itinerary";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

interface DayMapProps {
  activities: Activity[];
  dayTitle: string;
}

export default function DayMap({ activities, dayTitle }: DayMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Extract coordinates from Google Maps URLs (including options)
    const locations: Array<{ lat: number; lng: number; title: string; type: string }> = [];
    
    activities.forEach(activity => {
      // Check main activity mapUrl
      if (activity.mapUrl) {
        const match = activity.mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match) {
          locations.push({
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2]),
            title: activity.title,
            type: activity.type
          });
        }
      }
      
      // Check options mapUrl
      if (activity.options) {
        activity.options.forEach(option => {
          if (option.mapUrl) {
            const match = option.mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
            if (match) {
              locations.push({
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2]),
                title: option.name,
                type: activity.type
              });
            }
          }
        });
      }
    });

    // Don't show map if less than 2 locations (transport/flight days)
    if (locations.length < 2) return;

    // Calculate center
    const centerLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
    const centerLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;

    // Create map
    const map = L.map(mapRef.current).setView([centerLat, centerLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Custom icon colors by type
    const getMarkerColor = (type: string) => {
      switch (type) {
        case 'attraction': return '#22c55e';
        case 'food': return '#f97316';
        case 'transport': return '#3b82f6';
        case 'accommodation': return '#a855f7';
        default: return '#6b7280';
      }
    };

    // Add markers
    locations.forEach((location, index) => {
      const color = getMarkerColor(location.type);
      
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              color: white;
              font-weight: bold;
              font-size: 12px;
              transform: rotate(45deg);
            ">${index + 1}</span>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      L.marker([location.lat, location.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`<strong>${location.title}</strong>`);
    });

    // Fit bounds to show all markers
    if (locations.length > 1) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activities]);

  // Check if there are enough locations to show map
  const locationCount = activities.reduce((count, activity) => {
    let activityCount = activity.mapUrl ? 1 : 0;
    if (activity.options) {
      activityCount += activity.options.filter(opt => opt.mapUrl).length;
    }
    return count + activityCount;
  }, 0);

  // Don't show map if less than 2 locations
  if (locationCount < 2) {
    return null;
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg border border-border">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}

