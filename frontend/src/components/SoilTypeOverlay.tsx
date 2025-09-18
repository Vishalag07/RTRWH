import { Polygon, Tooltip } from 'react-leaflet';
import React from 'react';

interface SoilTypeOverlayProps {
  soilLayers: Array<{
    type: string;
    color: string;
    area: Array<[number, number]>; // Array of [lat, lon] pairs
  }>;
}

const SoilTypeOverlay: React.FC<SoilTypeOverlayProps> = ({ soilLayers }) => (
  <>
    {soilLayers.map((layer, idx) => (
      <Polygon
        key={layer.type + idx}
        positions={layer.area}
        pathOptions={{ color: layer.color, fillColor: layer.color, fillOpacity: 0.3 }}
      >
        <Tooltip>{layer.type}</Tooltip>
      </Polygon>
    ))}
  </>
);

export default SoilTypeOverlay;
