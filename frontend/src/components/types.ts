// Shared types for components

export interface AquiferProfilePoint {
  depth: number;
  soilType: string;
  color: string;
}

export interface BoreWell {
  id: string;
  name: string;
  x: number;
  y: number;
  depth: number;
  waterLevel: number;
  connectedShafts: string[];
}

export interface SoilLayer {
  id: string;
  name: string;
  type: string;
  thickness: number;
  color: string;
  description?: string;
}

export interface GroundwaterData {
  id: string;
  location: string;
  depth: number;
  quality: string;
  lastUpdated: string;
}

// 3D Visualization Types
export interface SoilLayer3D {
  name: string;
  thickness_m: number;
  permeability: number;
  porosity: number;
  color: string;
}

export interface BoreWell3D {
  depth_m: number;
  diameter_m: number;
  position: [number, number, number];
}

export interface Shaft3D {
  depth_m: number;
  diameter_m: number;
  size_category: 'small' | 'medium' | 'large';
}

export interface RooftopSystem {
  width_m: number;
  length_m: number;
  height_m: number;
  position: [number, number, number];
  pipe_diameter_m: number;
  pipe_length_m: number;
}

export interface WaterFlow {
  isActive: boolean;
  flowRate: number;
  direction: 'down' | 'horizontal' | 'up';
  color: string;
}

export interface VisualizationConfig {
  soil_layers: SoilLayer3D[];
  groundwater_depth_m: number;
  borewell: BoreWell3D;
  shaft: Shaft3D;
  rooftop: RooftopSystem;
  overflow_threshold: number;
  water_flow: WaterFlow;
}

export interface VisualizationCallbacks {
  onLevelChange?: (level: number) => void;
  onOverflow?: (type: 'pit' | 'channel' | 'trench') => void;
  onSelection?: (element: 'borewell' | 'shaft' | 'soil' | 'rooftop' | null) => void; // Updated to include rooftop
}

export interface PerformanceSettings {
  enablePerformanceMode: boolean;
  maxPolygons: number;
  textureSize: number;
  enableLOD: boolean;
  enableWaterShader: boolean;
}