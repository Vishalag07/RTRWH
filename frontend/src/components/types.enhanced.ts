// Enhanced types for groundwater visualization with Indian API integration

export interface EnhancedVisualizationConfig {
  // Basic configuration
  groundwater_depth_m: number;
  shaft: {
    depth_m: number;
    diameter_m: number;
    position: [number, number, number];
    material: string;
  };
  borewell: {
    depth_m: number;
    diameter_m: number;
    position: [number, number, number];
    material: string;
  };
  rooftop: {
    area_m2: number;
    height_m: number;
    position: [number, number, number];
    width_m: number;
  };
  
  // Enhanced soil layers with colors
  soil_layers: EnhancedSoilLayer[];
  
  // Rain system
  rain_system: {
    is_active: boolean;
    intensity: 'light' | 'moderate' | 'heavy';
    duration_hours: number;
  };
  
  // Environment
  environment: {
    temperature_c: number;
    humidity_percent: number;
    season: 'summer' | 'monsoon' | 'winter';
  };
  
  // Water flow
  water_flow: {
    flowRate: number;
    direction: 'down' | 'up' | 'lateral';
  };
  
  // Overflow system
  overflow_threshold: number;
  overflow_threshold: number;
  water_flow: WaterFlow;
}

export interface EnhancedSoilLayer {
  name: string;
  thickness_m: number;
  permeability: number;
  porosity: number;
  color: string;
  texture: string;
  water_holding_capacity: number;
  organic_matter: number;
  ph: number;
  nutrients: {
    nitrogen: 'Low' | 'Medium' | 'High';
    phosphorus: 'Low' | 'Medium' | 'High';
    potassium: 'Low' | 'Medium' | 'High';
  };
}

export interface EnhancedVisualizationCallbacks {
  onLevelChange?: (level: number) => void;
  onOverflow?: (type: 'pit' | 'channel' | 'trench', volume: number) => void;
  onSelection?: (element: 'borewell' | 'shaft' | 'soil' | 'rooftop' | null) => void;
  onWaterQualityChange?: (quality: any) => void;
  onPerformanceUpdate?: (fps: number) => void;
  onSoilLayerChange?: (layer: EnhancedSoilLayer) => void;
  onDataUpdate?: (data: any) => void;
}

export interface EnhancedPerformanceSettings {
  enablePerformanceMode: boolean;
  maxPolygons: number;
  textureSize: number;
  enableLOD: boolean;
  enableWaterShader: boolean;
  enableParticleSystem: boolean;
  enableReflections: boolean;
  enableShadows: boolean;
  max_particles: number;
  target_fps: number;
  enableSoilAnimation: boolean;
  soilAnimationSpeed: number;
}

export interface AnimationState {
  isPlaying: boolean;
  speed: number;
  loop: boolean;
  current_time: number;
  total_duration: number;
}

export interface ViewMode {
  mode: '2d' | '3d' | 'hybrid';
  camera_position?: [number, number, number];
  zoom_level?: number;
}

export interface LiveDataConfig {
  enabled: boolean;
  update_interval_ms: number;
  data_sources: {
    groundwater_api: string;
    weather_api: string;
    sensor_api: string;
  };
  mock_mode: boolean;
}

export interface EducationalContent {
  enabled: boolean;
  current_step: number;
  steps: EducationalStep[];
  show_labels: boolean;
  show_measurements: boolean;
  show_flow_rates: boolean;
}

export interface EducationalStep {
  id: string;
  title: string;
  description: string;
  highlight_element: string;
  camera_position: [number, number, number];
  duration_ms: number;
}

export interface SystemState {
  water_levels: {
    borewell: number;
    shaft: number;
    aquifer: number;
  };
  flow_rates: {
    rooftop_to_shaft: number;
    shaft_to_borewell: number;
    borewell_to_aquifer: number;
  };
  system_efficiency: number;
  total_water_collected: number;
  environmental_impact: {
    groundwater_recharge: number;
    flood_prevention: number;
    energy_saved: number;
  };
}

export interface UserPreferences {
  colorScheme: 'default' | 'dark' | 'high_contrast';
  units: 'metric' | 'imperial';
  language: string;
  animations_enabled: boolean;
  sound_effects: boolean;
  haptic_feedback: boolean;
  accessibility_mode: boolean;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export interface MeasurementUnit {
  length: 'm' | 'ft';
  volume: 'L' | 'gal';
  flow: 'L/s' | 'gal/min';
  pressure: 'Pa' | 'psi';
}

// Indian API specific types
export interface IndiaAPIData {
  location: {
    name: string;
    lat: number;
    lon: number;
    state: string;
    district: string;
    country: string;
  };
  groundwater: {
    level_m: number;
    depth_m: number;
    quality: string;
    last_updated: string;
    source: string;
  };
  aquifer: {
    type: string;
    material: string;
    thickness_m: number;
    permeability: number;
    porosity: number;
    recharge_rate: number;
  };
  soil: {
    type: string;
    texture: string;
    depth_m: number;
    permeability: number;
    water_holding_capacity: number;
    color: string;
  };
  metadata: {
    data_source: string;
    api_endpoint: string;
    confidence: number;
    last_fetched: string;
  };
}

export interface APISource {
  name: string;
  url: string;
  priority: number;
  reliability: number;
  last_updated: string;
  status: 'active' | 'inactive' | 'error';
}

// Enhanced soil color mapping
export interface SoilColorMap {
  [key: string]: {
    primary: string;
    secondary: string;
    highlight: string;
    shadow: string;
  };
}

export const ENHANCED_SOIL_COLORS: SoilColorMap = {
  'Clay': {
    primary: '#8B4513',
    secondary: '#A0522D',
    highlight: '#CD853F',
    shadow: '#654321'
  },
  'Clay Loam': {
    primary: '#A0522D',
    secondary: '#D2691E',
    highlight: '#F4A460',
    shadow: '#8B4513'
  },
  'Loam': {
    primary: '#D2691E',
    secondary: '#F4A460',
    highlight: '#DEB887',
    shadow: '#A0522D'
  },
  'Sandy Loam': {
    primary: '#F4A460',
    secondary: '#DEB887',
    highlight: '#F5DEB3',
    shadow: '#D2691E'
  },
  'Sandy': {
    primary: '#DEB887',
    secondary: '#F5DEB3',
    highlight: '#FFF8DC',
    shadow: '#F4A460'
  },
  'Silt': {
    primary: '#BC8F8F',
    secondary: '#D2B48C',
    highlight: '#F0E68C',
    shadow: '#A0522D'
  },
  'Silt Loam': {
    primary: '#CD853F',
    secondary: '#DEB887',
    highlight: '#F5DEB3',
    shadow: '#A0522D'
  }
};

// Water flow types
export interface WaterFlow {
  flowRate: number;
  direction: 'down' | 'up' | 'lateral';
  velocity: number;
  pressure: number;
}

// Enhanced visualization modes
export type VisualizationMode = 'basic' | 'enhanced' | 'educational' | 'analytical';

export interface VisualizationModeConfig {
  mode: VisualizationMode;
  features: {
    showLabels: boolean;
    showMeasurements: boolean;
    showFlowRates: boolean;
    showSoilLayers: boolean;
    showAquiferDetails: boolean;
    showWaterQuality: boolean;
    showEnvironmentalImpact: boolean;
  };
  animations: {
    waterFlow: boolean;
    soilLayers: boolean;
    particleEffects: boolean;
    cameraMovement: boolean;
  };
}
