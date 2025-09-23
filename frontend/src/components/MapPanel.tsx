import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon paths for Vite builds
const DefaultIcon = L.icon({
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom droplet icon for borewells
const BorewellIcon = L.icon({
  iconUrl:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='36' viewBox='0 0 24 36'><path fill='%2300aaff' d='M12 0c0 0-9 12-9 18a9 9 0 0 0 18 0C21 12 12 0 12 0z'/><circle cx='12' cy='19' r='4' fill='%23ffffff' opacity='0.3'/></svg>",
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -30]
});
import GroundwaterHeatmapLayer from './GroundwaterHeatmapLayer';
import SoilTypeOverlay from './SoilTypeOverlay';
import UserLocationMarker from './UserLocationMarker';

interface BoreWellMarker {
  id: string;
  lat: number;
  lon: number;
  waterLevel: number;
}

interface SoilOverlay {
  type: string;
  color: string;
  area: Array<[number, number]>;
}

interface MapPanelProps {
  lat: number;
  lon: number;
  onPickLocation: (lat: number, lon: number) => void;
  boreWells?: BoreWellMarker[];
  soilLayers?: SoilOverlay[];
  showHeatmap?: boolean;
}

function LocationPicker({ onPickLocation }: { onPickLocation: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onPickLocation(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function LocateControl({ onLocate, selectedPos }: { onLocate: (lat: number, lon: number) => void; selectedPos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    const control = L.control({ position: 'bottomright' });
    control.onAdd = () => {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const btn = L.DomUtil.create('a', '', container);
      btn.href = '#';
      btn.title = 'Use my location';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.width = '34px';
      btn.style.height = '34px';
      btn.style.fontSize = '18px';
      btn.style.lineHeight = '18px';
      btn.innerHTML = '📍';

      const onClick = (e: any) => {
        e.preventDefault();
        // Prefer Leaflet locate which handles permissions and recenters
        map.once('locationfound', (ev: L.LocationEvent) => {
          const lat = ev.latlng.lat;
          const lon = ev.latlng.lng;
          onLocate(lat, lon);
          if (selectedPos) {
            const bounds = L.latLngBounds([lat, lon], selectedPos);
            map.fitBounds(bounds.pad(0.2));
          } else {
            map.setView([lat, lon], Math.max(map.getZoom(), 15));
          }
        });
        map.once('locationerror', () => {
          if (!navigator.geolocation) return alert('Geolocation not supported');
          navigator.geolocation.getCurrentPosition(
            (p) => {
              const lat = p.coords.latitude;
              const lon = p.coords.longitude;
              onLocate(lat, lon);
              if (selectedPos) {
                const bounds = L.latLngBounds([lat, lon], selectedPos);
                map.fitBounds(bounds.pad(0.2));
              } else {
                map.setView([lat, lon], Math.max(map.getZoom(), 15));
              }
            },
            (err) => {
              console.warn('Geolocation error:', err);
              alert('Unable to fetch current location. Please allow location access.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
          );
        });
        map.locate({ setView: false, enableHighAccuracy: true, watch: false, timeout: 10000 });
      };

      L.DomEvent.on(btn, 'click', onClick);
      return container;
    };

    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map, onLocate]);

  return null;
}

// Red pin icon for user-selected/current location
const PinIcon = L.icon({
  iconUrl:
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='36' viewBox='0 0 24 36'><path fill='%23ff3b3b' d='M12 0C6.48 0 2 4.48 2 10c0 7 10 26 10 26s10-19 10-26C22 4.48 17.52 0 12 0z'/><circle cx='12' cy='10' r='4' fill='%23ffffff' opacity='0.85'/></svg>",
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -30]
});

const MapPanel: React.FC<MapPanelProps> = ({ lat, lon, onPickLocation, boreWells = [], soilLayers = [], showHeatmap = true }) => {
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);

  // Keep red pin in sync with current lat/lon by default
  useEffect(() => {
    // default to center if nothing selected/current
    if (!currentPos && !selectedPos) {
      setCurrentPos([lat, lon]);
    }
  }, [lat, lon]);

  // Try to get user's current geolocation on mount
  useEffect(() => {
    if (!currentPos && !selectedPos && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const la = p.coords.latitude;
          const lo = p.coords.longitude;
          setCurrentPos([la, lo]);
          setSelectedPos([la, lo]);
          onPickLocation(la, lo);
        },
        (err) => {
          console.warn('Initial geolocation denied/unavailable:', err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []);

  const handlePickLocation = async (la: number, lo: number) => {
    setSelectedPos([la, lo]);
    onPickLocation(la, lo);
  };

  const handleLocate = async (la: number, lo: number) => {
    // Set both current (red) and selected (blue) to current location
    setCurrentPos([la, lo]);
    setSelectedPos([la, lo]);
    onPickLocation(la, lo);
  };

  return (
  <div className="rounded-lg overflow-hidden shadow-sm h-full bg-white">
    <div className="p-3 flex items-center justify-between">
      <div className="font-semibold">Borewell</div>
    </div>
    <div className="h-72">
      <MapContainer center={[lat, lon]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationPicker onPickLocation={handlePickLocation} />
        <LocateControl onLocate={handleLocate} selectedPos={selectedPos} />
        {/* Current location red pin */}
        {currentPos && (
          <Marker position={currentPos} icon={PinIcon}>
            <Popup>Your current location</Popup>
          </Marker>
        )}
        {/* Selected location blue pin */}
        {selectedPos && (
          <Marker
            position={selectedPos}
            icon={L.icon({
              iconUrl:
                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='36' viewBox='0 0 24 36'><path fill='%23007bff' d='M12 0C6.48 0 2 4.48 2 10c0 7 10 26 10 26s10-19 10-26C22 4.48 17.52 0 12 0z'/><circle cx='12' cy='10' r='4' fill='%23ffffff' opacity='0.85'/></svg>",
              iconSize: [24, 36],
              iconAnchor: [12, 36],
              popupAnchor: [0, -30]
            })}
          >
            <Popup>Selected location</Popup>
          </Marker>
        )}
        {/* Borewell markers */}
        {boreWells.map((bw) => (
          <Marker key={bw.id} position={[bw.lat, bw.lon]} icon={BorewellIcon}>
            <Popup>
              <div>
                <div className="font-semibold">Borewell: {bw.id}</div>
                <div>Water level: {bw.waterLevel} m</div>
              </div>
            </Popup>
          </Marker>
        ))}
        {/* Removed center marker to avoid overlapping with red pin */}
        {/* Soil type overlays */}
        {soilLayers.length > 0 && <SoilTypeOverlay soilLayers={soilLayers} />}
        {/* Groundwater heatmap */}
        {showHeatmap && boreWells.length > 0 && (
          <GroundwaterHeatmapLayer points={boreWells.map(bw => ({ lat: bw.lat, lon: bw.lon, intensity: bw.waterLevel }))} />
        )}
      </MapContainer>
    </div>
  </div>
);
}

export default MapPanel;
