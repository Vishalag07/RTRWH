import { useMap } from 'react-leaflet';
import { useEffect } from 'react';

interface HeatmapPoint {
  lat: number;
  lon: number;
  intensity: number;
}

interface GroundwaterHeatmapLayerProps {
  points: HeatmapPoint[];
}

// This is a placeholder for a real heatmap implementation. For production, use leaflet.heat or similar.
const GroundwaterHeatmapLayer: React.FC<GroundwaterHeatmapLayerProps> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    // TODO: Integrate leaflet.heat or similar for real heatmap rendering
    // For now, just log points
    // Remove this effect and implement heatmap rendering as needed
    // Example: L.heatLayer(points.map(p => [p.lat, p.lon, p.intensity]), { ...options }).addTo(map)
    // Clean up on unmount
    return () => {};
  }, [points, map]);
  return null;
};

export default GroundwaterHeatmapLayer;
