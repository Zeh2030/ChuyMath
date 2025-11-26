import { Day } from "@/types/itinerary";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

interface GlobalMapProps {
  days: Day[];
}

export default function GlobalMap({ days }: GlobalMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // City coordinates
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      "Tokyo": { lat: 35.6762, lng: 139.6503 },
      "Kyoto": { lat: 35.0116, lng: 135.7681 },
      "Osaka": { lat: 34.6937, lng: 135.5023 },
      "Hiroshima": { lat: 34.3853, lng: 132.4553 },
      "Fukuoka": { lat: 33.5904, lng: 130.4017 },
      "Seúl": { lat: 37.5665, lng: 126.9780 },
      "Seoul": { lat: 37.5665, lng: 126.9780 }
    };

    // Group days by city
    const cityDays: Record<string, number[]> = {};
    days.forEach(day => {
      const city = day.location;
      if (!cityDays[city]) {
        cityDays[city] = [];
      }
      cityDays[city].push(day.id);
    });

    // Create map centered on Japan
    const map = L.map(mapRef.current).setView([36.2048, 138.2529], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // City colors
    const cityColors: Record<string, string> = {
      "Tokyo": "#ef4444",
      "Kyoto": "#f97316",
      "Osaka": "#eab308",
      "Hiroshima": "#22c55e",
      "Fukuoka": "#3b82f6",
      "Seúl": "#a855f7",
      "Seoul": "#a855f7"
    };

    // Add markers for each city
    Object.entries(cityDays).forEach(([city, dayIds]) => {
      const coords = cityCoordinates[city];
      if (!coords) return;

      const color = cityColors[city] || "#6b7280";
      
      const customIcon = L.divIcon({
        className: 'custom-city-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 4px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <span style="
              color: white;
              font-weight: bold;
              font-size: 14px;
            ">${dayIds.length}</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const dayList = dayIds.length === 1 
        ? `Día ${dayIds[0]}` 
        : `Días ${dayIds[0]}-${dayIds[dayIds.length - 1]}`;

      L.marker([coords.lat, coords.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="text-align: center;">
            <strong style="font-size: 16px;">${city}</strong><br/>
            <span style="font-size: 13px; color: #666;">${dayList}</span><br/>
            <span style="font-size: 12px; color: #999;">${dayIds.length} día${dayIds.length > 1 ? 's' : ''}</span>
          </div>
        `);
    });

    // Draw route lines
    const routeCoords: [number, number][] = [];
    const visitedCities = new Set<string>();
    
    days.forEach(day => {
      const city = day.location;
      if (!visitedCities.has(city)) {
        const coords = cityCoordinates[city];
        if (coords) {
          routeCoords.push([coords.lat, coords.lng]);
          visitedCities.add(city);
        }
      }
    });

    if (routeCoords.length > 1) {
      L.polyline(routeCoords, {
        color: '#C41E3A',
        weight: 3,
        opacity: 0.6,
        dashArray: '10, 10'
      }).addTo(map);
    }

    // Fit bounds to show all cities
    if (routeCoords.length > 0) {
      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [days]);

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-lg border border-border">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}

