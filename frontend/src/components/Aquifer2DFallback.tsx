import React, { useEffect, useState, useRef } from 'react';
import { VisualizationConfig, VisualizationCallbacks } from './types';
import { EnhancedSoilLayer, ENHANCED_SOIL_COLORS } from './types.enhanced';
import RainwaterHarvestingSchematic from './RainwaterHarvestingSchematic';

interface Aquifer2DFallbackProps {
  config: VisualizationConfig;
  callbacks?: VisualizationCallbacks;
  waterLevel: number;
  animationTime: number;
  isPlaying: boolean;
  onLevelChange: (level: number) => void;
  onTogglePlay?: () => void;
  enhancedSoilLayers?: EnhancedSoilLayer[];
  dataSource?: string;
  isLoading?: boolean;
  lat?: number;
  lon?: number;
  aquiferName?: string;
  soilType?: string;
  soilColor?: string;
}

const Aquifer2DFallback: React.FC<Aquifer2DFallbackProps> = ({
  config,
  callbacks = {},
  waterLevel,
  animationTime,
  isPlaying,
  onLevelChange,
  onTogglePlay,
  enhancedSoilLayers = [],
  dataSource = 'Demo Data',
  isLoading = false,
  lat = 22.5,
  lon = 77.0,
  aquiferName,
  soilType,
  soilColor
}) => {

  return (
    <RainwaterHarvestingSchematic
      waterLevel={waterLevel}
      animationTime={animationTime}
      isPlaying={isPlaying}
      onLevelChange={onLevelChange}
      onTogglePlay={onTogglePlay}
      dataSource={dataSource}
      isLoading={isLoading}
      groundwaterDepth={config.groundwater_depth_m}
      lat={lat}
      lon={lon}
      aquiferName={aquiferName}
      soilType={soilType}
      soilColor={soilColor}
    />
  );
};

export default Aquifer2DFallback;
