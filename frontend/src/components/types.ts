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
