import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
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

const MapPanel: React.FC<MapPanelProps> = ({ lat, lon, onPickLocation, boreWells = [], soilLayers = [], showHeatmap = true }) => (
  <div className="rounded-lg overflow-hidden shadow-sm h-full bg-white">
    <div className="p-3 flex items-center justify-between">
      <div className="font-semibold">Map & Location</div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (!navigator.geolocation) return alert('Geolocation not supported');
            navigator.geolocation.getCurrentPosition((p) => {
              onPickLocation(p.coords.latitude, p.coords.longitude);
            });
          }}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md shadow-sm"
        >
          Use my location
        </button>
      </div>
    </div>
    <div className="h-72">
      <MapContainer center={[lat, lon]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationPicker onPickLocation={onPickLocation} />
        {/* Borewell markers */}
        {boreWells.map((bw) => (
          <Marker key={bw.id} position={[bw.lat, bw.lon]}>
            <Popup>
              <div>
                <div className="font-semibold">Borewell: {bw.id}</div>
                <div>Water level: {bw.waterLevel} m</div>
              </div>
            </Popup>
          </Marker>
        ))}
        {/* Selected location marker */}
        <Marker position={[lat, lon]}>
          <Popup>
            Selected location: <br /> {lat.toFixed(5)}, {lon.toFixed(5)}
          </Popup>
        </Marker>
        {/* User location marker */}
        <UserLocationMarker />
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

export default MapPanel;
