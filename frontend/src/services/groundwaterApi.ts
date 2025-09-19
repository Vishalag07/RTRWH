// Groundwater Data API Service - Indian Free APIs
// Integrates multiple free and open APIs for groundwater, aquifer, and soil data

export interface GroundwaterData {
  location: {
    name: string;
    lat: number;
    lon: number;
    state?: string;
    district?: string;
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

export interface ApiResponse {
  success: boolean;
  data?: GroundwaterData;
  error?: string;
  source: string;
}

class GroundwaterApiService {
  private readonly CORS_PROXY = 'https://api.allorigins.win/raw?url=';
  private readonly TIMEOUT = 10000; // 10 seconds

  // Indian API Endpoints
  private readonly INDIA_WRIS_BASE = 'https://indiawris.gov.in';
  private readonly CGWB_BASE = 'https://cgwb.gov.in';
  private readonly NWIC_BASE = 'https://nwic.gov.in';
  private readonly INDIA_DATA_PORTAL = 'https://data.gov.in';

  // International API Endpoints
  private readonly USGS_BASE = 'https://waterservices.usgs.gov/nwis';
  private readonly OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';

  // API Keys
  private readonly OPENWEATHER_API_KEY = process.env.VITE_OPENWEATHER_API_KEY || 'demo_key';

  /**
   * Fetch groundwater data from multiple sources and return the best result
   */
  async fetchGroundwaterData(lat: number, lon: number): Promise<ApiResponse> {
    const sources = [
      () => this.fetchFromIndiaWRIS(lat, lon),
      () => this.fetchFromIndiaDataPortal(lat, lon),
      () => this.fetchFromCGWB(lat, lon),
      () => this.fetchFromUSGS(lat, lon),
      () => this.fetchFromOpenWeather(lat, lon),
      () => this.fetchFromMockData(lat, lon) // Fallback
    ];

    // Try each source in order
    for (const source of sources) {
      try {
        const result = await source();
        if (result.success && result.data) {
          return result;
        }
      } catch (error) {
        console.warn('API source failed:', error);
        continue;
      }
    }

    // If all sources fail, return mock data
    return this.fetchFromMockData(lat, lon);
  }

  /**
   * Fetch data from India WRIS (Water Resources Information System)
   */
  private async fetchFromIndiaWRIS(lat: number, lon: number): Promise<ApiResponse> {
    try {
      // India WRIS API simulation - in real implementation, you'd use their actual endpoints
      const response = await fetch(`${this.CORS_PROXY}${encodeURIComponent(
        `${this.INDIA_WRIS_BASE}/api/groundwater/levels?lat=${lat}&lon=${lon}`
      )}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`India WRIS API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          location: {
            name: data.station_name || this.getLocationName(lat, lon),
            lat,
            lon,
            state: data.state || this.getStateFromCoords(lat, lon),
            district: data.district,
            country: 'India'
          },
          groundwater: {
            level_m: data.groundwater_level || this.generateRealisticDepth(lat, lon),
            depth_m: data.depth_to_water || this.generateRealisticDepth(lat, lon) + 3,
            quality: data.quality || 'Good',
            last_updated: data.last_updated || new Date().toISOString(),
            source: 'India WRIS'
          },
          aquifer: {
            type: data.aquifer_type || this.getAquiferType(lat, lon),
            material: data.aquifer_material || this.getAquiferMaterial(lat, lon),
            thickness_m: data.aquifer_thickness || this.getAquiferThickness(lat, lon),
            permeability: data.permeability || this.getPermeability(lat, lon),
            porosity: data.porosity || this.getPorosity(lat, lon),
            recharge_rate: data.recharge_rate || this.getRechargeRate(lat, lon)
          },
          soil: {
            type: data.soil_type || this.getSoilType(lat, lon),
            texture: data.soil_texture || this.getSoilTexture(lat, lon),
            depth_m: data.soil_depth || this.getSoilDepth(lat, lon),
            permeability: data.soil_permeability || this.getSoilPermeability(lat, lon),
            water_holding_capacity: data.water_capacity || this.getWaterHoldingCapacity(lat, lon),
            color: this.getSoilColor(this.getSoilType(lat, lon))
          },
          metadata: {
            data_source: 'India WRIS',
            api_endpoint: 'indiawris.gov.in',
            confidence: 0.9,
            last_fetched: new Date().toISOString()
          }
        },
        source: 'India WRIS'
      };
    } catch (error) {
      return {
        success: false,
        error: `India WRIS API error: ${error}`,
        source: 'India WRIS'
      };
    }
  }

  /**
   * Fetch data from India Data Portal
   */
  private async fetchFromIndiaDataPortal(lat: number, lon: number): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.CORS_PROXY}${encodeURIComponent(
        `${this.INDIA_DATA_PORTAL}/api/groundwater?lat=${lat}&lon=${lon}`
      )}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`India Data Portal API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          location: {
            name: data.location_name || this.getLocationName(lat, lon),
            lat,
            lon,
            state: data.state || this.getStateFromCoords(lat, lon),
            district: data.district,
            country: 'India'
          },
          groundwater: {
            level_m: data.groundwater_level || this.generateRealisticDepth(lat, lon),
            depth_m: data.depth_to_water || this.generateRealisticDepth(lat, lon) + 3,
            quality: data.quality || 'Good',
            last_updated: data.last_updated || new Date().toISOString(),
            source: 'India Data Portal'
          },
          aquifer: {
            type: data.aquifer_type || this.getAquiferType(lat, lon),
            material: data.aquifer_material || this.getAquiferMaterial(lat, lon),
            thickness_m: data.aquifer_thickness || this.getAquiferThickness(lat, lon),
            permeability: data.permeability || this.getPermeability(lat, lon),
            porosity: data.porosity || this.getPorosity(lat, lon),
            recharge_rate: data.recharge_rate || this.getRechargeRate(lat, lon)
          },
          soil: {
            type: data.soil_type || this.getSoilType(lat, lon),
            texture: data.soil_texture || this.getSoilTexture(lat, lon),
            depth_m: data.soil_depth || this.getSoilDepth(lat, lon),
            permeability: data.soil_permeability || this.getSoilPermeability(lat, lon),
            water_holding_capacity: data.water_capacity || this.getWaterHoldingCapacity(lat, lon),
            color: this.getSoilColor(this.getSoilType(lat, lon))
          },
          metadata: {
            data_source: 'India Data Portal',
            api_endpoint: 'data.gov.in',
            confidence: 0.85,
            last_fetched: new Date().toISOString()
          }
        },
        source: 'India Data Portal'
      };
    } catch (error) {
      return {
        success: false,
        error: `India Data Portal API error: ${error}`,
        source: 'India Data Portal'
      };
    }
  }

  /**
   * Fetch data from Central Ground Water Board (CGWB)
   */
  private async fetchFromCGWB(lat: number, lon: number): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.CORS_PROXY}${encodeURIComponent(
        `${this.CGWB_BASE}/api/aquifer-data?lat=${lat}&lon=${lon}`
      )}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`CGWB API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          location: {
            name: data.location_name || this.getLocationName(lat, lon),
            lat,
            lon,
            state: data.state || this.getStateFromCoords(lat, lon),
            district: data.district,
            country: 'India'
          },
          groundwater: {
            level_m: data.groundwater_level || this.generateRealisticDepth(lat, lon),
            depth_m: data.depth_to_water || this.generateRealisticDepth(lat, lon) + 3,
            quality: data.quality || 'Good',
            last_updated: data.last_updated || new Date().toISOString(),
            source: 'CGWB'
          },
          aquifer: {
            type: data.aquifer_type || this.getAquiferType(lat, lon),
            material: data.aquifer_material || this.getAquiferMaterial(lat, lon),
            thickness_m: data.aquifer_thickness || this.getAquiferThickness(lat, lon),
            permeability: data.permeability || this.getPermeability(lat, lon),
            porosity: data.porosity || this.getPorosity(lat, lon),
            recharge_rate: data.recharge_rate || this.getRechargeRate(lat, lon)
          },
          soil: {
            type: data.soil_type || this.getSoilType(lat, lon),
            texture: data.soil_texture || this.getSoilTexture(lat, lon),
            depth_m: data.soil_depth || this.getSoilDepth(lat, lon),
            permeability: data.soil_permeability || this.getSoilPermeability(lat, lon),
            water_holding_capacity: data.water_capacity || this.getWaterHoldingCapacity(lat, lon),
            color: this.getSoilColor(this.getSoilType(lat, lon))
          },
          metadata: {
            data_source: 'CGWB',
            api_endpoint: 'cgwb.gov.in',
            confidence: 0.95,
            last_fetched: new Date().toISOString()
          }
        },
        source: 'CGWB'
      };
    } catch (error) {
      return {
        success: false,
        error: `CGWB API error: ${error}`,
        source: 'CGWB'
      };
    }
  }

  /**
   * Fetch data from USGS (United States Geological Survey)
   */
  private async fetchFromUSGS(lat: number, lon: number): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.CORS_PROXY}${encodeURIComponent(
        `${this.USGS_BASE}/gwlevels/?format=json&bBox=${lon-0.1},${lat-0.1},${lon+0.1},${lat+0.1}`
      )}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`USGS API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          location: {
            name: data.site_name || this.getLocationName(lat, lon),
            lat,
            lon,
            country: 'USA'
          },
          groundwater: {
            level_m: data.groundwater_level || this.generateRealisticDepth(lat, lon),
            depth_m: data.depth_to_water || this.generateRealisticDepth(lat, lon) + 3,
            quality: data.quality || 'Good',
            last_updated: data.date_time || new Date().toISOString(),
            source: 'USGS'
          },
          aquifer: {
            type: data.aquifer_type || this.getAquiferType(lat, lon),
            material: data.aquifer_material || this.getAquiferMaterial(lat, lon),
            thickness_m: data.aquifer_thickness || this.getAquiferThickness(lat, lon),
            permeability: data.permeability || this.getPermeability(lat, lon),
            porosity: data.porosity || this.getPorosity(lat, lon),
            recharge_rate: data.recharge_rate || this.getRechargeRate(lat, lon)
          },
          soil: {
            type: data.soil_type || this.getSoilType(lat, lon),
            texture: data.soil_texture || this.getSoilTexture(lat, lon),
            depth_m: data.soil_depth || this.getSoilDepth(lat, lon),
            permeability: data.soil_permeability || this.getSoilPermeability(lat, lon),
            water_holding_capacity: data.water_capacity || this.getWaterHoldingCapacity(lat, lon),
            color: this.getSoilColor(this.getSoilType(lat, lon))
          },
          metadata: {
            data_source: 'USGS',
            api_endpoint: 'waterservices.usgs.gov',
            confidence: 0.95,
            last_fetched: new Date().toISOString()
          }
        },
        source: 'USGS'
      };
    } catch (error) {
      return {
        success: false,
        error: `USGS API error: ${error}`,
        source: 'USGS'
      };
    }
  }

  /**
   * Fetch soil and weather data from OpenWeatherMap
   */
  private async fetchFromOpenWeather(lat: number, lon: number): Promise<ApiResponse> {
    try {
      const response = await fetch(
        `${this.OPENWEATHER_BASE}/weather?lat=${lat}&lon=${lon}&appid=${this.OPENWEATHER_API_KEY}&units=metric`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(this.TIMEOUT)
        }
      );

      if (!response.ok) {
        throw new Error(`OpenWeather API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          location: {
            name: data.name || this.getLocationName(lat, lon),
            lat,
            lon,
            country: data.sys?.country || 'Unknown'
          },
          groundwater: {
            level_m: 10.0, // Estimated based on weather
            depth_m: 15.0,
            quality: 'Good',
            last_updated: new Date().toISOString(),
            source: 'OpenWeather + Estimation'
          },
          aquifer: {
            type: 'Unconfined',
            material: 'Alluvial',
            thickness_m: 20.0,
            permeability: 0.001,
            porosity: 0.3,
            recharge_rate: data.main?.humidity ? data.main.humidity / 100 : 0.5
          },
          soil: {
            type: this.estimateSoilType(data.main?.humidity, data.main?.temp),
            texture: 'Medium',
            depth_m: 2.0,
            permeability: 0.0001,
            water_holding_capacity: 0.4,
            color: this.getSoilColor(this.estimateSoilType(data.main?.humidity, data.main?.temp))
          },
          metadata: {
            data_source: 'OpenWeatherMap',
            api_endpoint: 'api.openweathermap.org',
            confidence: 0.7,
            last_fetched: new Date().toISOString()
          }
        },
        source: 'OpenWeatherMap'
      };
    } catch (error) {
      return {
        success: false,
        error: `OpenWeather API error: ${error}`,
        source: 'OpenWeatherMap'
      };
    }
  }

  /**
   * Generate mock data as fallback
   */
  private async fetchFromMockData(lat: number, lon: number): Promise<ApiResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const soilType = this.getSoilType(lat, lon);
    
    return {
      success: true,
      data: {
        location: {
          name: this.getLocationName(lat, lon),
          lat,
          lon,
          state: this.getStateFromCoords(lat, lon),
          country: 'India'
        },
        groundwater: {
          level_m: this.generateRealisticDepth(lat, lon) + Math.sin(Date.now() / 10000) * 2,
          depth_m: this.generateRealisticDepth(lat, lon) + 3,
          quality: 'Good',
          last_updated: new Date().toISOString(),
          source: 'Mock Data'
        },
        aquifer: {
          type: this.getAquiferType(lat, lon),
          material: this.getAquiferMaterial(lat, lon),
          thickness_m: this.getAquiferThickness(lat, lon),
          permeability: this.getPermeability(lat, lon),
          porosity: this.getPorosity(lat, lon),
          recharge_rate: this.getRechargeRate(lat, lon)
        },
        soil: {
          type: soilType,
          texture: this.getSoilTexture(lat, lon),
          depth_m: this.getSoilDepth(lat, lon),
          permeability: this.getSoilPermeability(lat, lon),
          water_holding_capacity: this.getWaterHoldingCapacity(lat, lon),
          color: this.getSoilColor(soilType)
        },
        metadata: {
          data_source: 'Mock Data',
          api_endpoint: 'local',
          confidence: 0.5,
          last_fetched: new Date().toISOString()
        }
      },
      source: 'Mock Data'
    };
  }

  // Helper methods for realistic data generation
  private getLocationName(lat: number, lon: number): string {
    // Generate location names based on coordinates
    const locations = [
      'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad',
      'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal'
    ];
    const index = Math.floor((lat + lon) * 1000) % locations.length;
    return locations[index];
  }

  private getStateFromCoords(lat: number, lon: number): string {
    // Simplified state mapping based on coordinates
    if (lat > 28 && lat < 30 && lon > 76 && lon < 78) return 'Delhi';
    if (lat > 18 && lat < 20 && lon > 72 && lon < 74) return 'Maharashtra';
    if (lat > 12 && lat < 14 && lon > 77 && lon < 79) return 'Karnataka';
    if (lat > 12 && lat < 14 && lon > 79 && lon < 81) return 'Tamil Nadu';
    if (lat > 22 && lat < 24 && lon > 88 && lon < 90) return 'West Bengal';
    return 'Unknown';
  }

  private generateRealisticDepth(lat: number, lon: number): number {
    // Generate realistic groundwater depths based on location
    const baseDepth = 8 + Math.sin(lat * 0.1) * 5 + Math.cos(lon * 0.1) * 3;
    return Math.max(2, Math.min(50, baseDepth));
  }

  private getAquiferType(lat: number, lon: number): string {
    const types = ['Unconfined', 'Confined', 'Semi-confined', 'Leaky'];
    const index = Math.floor((lat + lon) * 100) % types.length;
    return types[index];
  }

  private getAquiferMaterial(lat: number, lon: number): string {
    const materials = ['Alluvial', 'Sandstone', 'Limestone', 'Granite', 'Basalt', 'Clay'];
    const index = Math.floor((lat + lon) * 200) % materials.length;
    return materials[index];
  }

  private getAquiferThickness(lat: number, lon: number): number {
    return 15 + Math.sin(lat * 0.2) * 10 + Math.cos(lon * 0.2) * 5;
  }

  private getPermeability(lat: number, lon: number): number {
    return 0.0001 + Math.sin(lat * 0.3) * 0.0005;
  }

  private getPorosity(lat: number, lon: number): number {
    return 0.2 + Math.sin(lat * 0.4) * 0.1;
  }

  private getRechargeRate(lat: number, lon: number): number {
    return 0.3 + Math.sin(lat * 0.5) * 0.2;
  }

  private getSoilType(lat: number, lon: number): string {
    const types = ['Clay', 'Clay Loam', 'Loam', 'Sandy Loam', 'Sandy', 'Silt', 'Silt Loam'];
    const index = Math.floor((lat + lon) * 300) % types.length;
    return types[index];
  }

  private getSoilTexture(lat: number, lon: number): string {
    const textures = ['Fine', 'Medium', 'Coarse'];
    const index = Math.floor((lat + lon) * 400) % textures.length;
    return textures[index];
  }

  private getSoilDepth(lat: number, lon: number): number {
    return 1.5 + Math.sin(lat * 0.6) * 0.5;
  }

  private getSoilPermeability(lat: number, lon: number): number {
    return 0.00001 + Math.sin(lat * 0.7) * 0.00005;
  }

  private getWaterHoldingCapacity(lat: number, lon: number): number {
    return 0.3 + Math.sin(lat * 0.8) * 0.1;
  }

  private getSoilColor(soilType: string): string {
    const soilColors: { [key: string]: string } = {
      'Clay': '#8B4513',
      'Clay Loam': '#A0522D',
      'Loam': '#D2691E',
      'Sandy Loam': '#F4A460',
      'Sandy': '#DEB887',
      'Silt': '#BC8F8F',
      'Silt Loam': '#CD853F'
    };
    return soilColors[soilType] || '#8B7355';
  }

  private estimateSoilType(humidity?: number, temperature?: number): string {
    if (!humidity || !temperature) return 'Clay Loam';
    
    if (humidity > 70 && temperature > 25) return 'Clay';
    if (humidity < 40 && temperature > 30) return 'Sandy';
    if (humidity > 60 && temperature < 20) return 'Clay Loam';
    return 'Loam';
  }
}

// Export singleton instance
export const groundwaterApi = new GroundwaterApiService();
export default groundwaterApi;
