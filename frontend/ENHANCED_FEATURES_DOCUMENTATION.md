# Enhanced Groundwater Features Documentation

This document describes the restored and enhanced features for groundwater data visualization with Indian API integration and enhanced soil color animations.

## 🌍 **Indian Free API Integration**

### **Data Sources**
1. **India WRIS (Water Resources Information System)**
   - **URL**: https://indiawris.gov.in
   - **Data**: Groundwater levels, aquifer details, soil types
   - **Coverage**: All India
   - **Priority**: Primary source for Indian locations

2. **Central Ground Water Board (CGWB)**
   - **URL**: https://cgwb.gov.in
   - **Data**: Aquifer mapping, groundwater assessment
   - **Coverage**: All India
   - **Features**: AIMS, In-GRES systems

3. **India Data Portal**
   - **URL**: https://data.gov.in
   - **Data**: Government groundwater datasets
   - **Coverage**: All India

4. **USGS (United States Geological Survey)**
   - **URL**: https://waterservices.usgs.gov/nwis
   - **Data**: Groundwater levels, water quality
   - **Coverage**: United States

5. **OpenWeatherMap**
   - **URL**: https://api.openweathermap.org/data/2.5
   - **Data**: Weather conditions, soil estimation
   - **Coverage**: Global

## 🎨 **Enhanced Soil Color System**

### **Color Palette**
The enhanced soil color system includes multiple shades for each soil type:

```typescript
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
```

### **Soil Animation Features**
- **Breathing Animation**: Subtle scale changes based on animation time
- **Color Variation**: Dynamic color shifts using HSL color space
- **Interactive Hover**: Enhanced tooltips with soil information
- **Performance Mode**: Optimized rendering for low-end devices

## 🚀 **Enhanced Features**

### **1. Real-Time Data Integration**
- **Multi-Source Fallback**: Tries multiple APIs in order of preference
- **Confidence Scoring**: Shows data reliability (0-100%)
- **Source Attribution**: Displays which API provided the data
- **Error Handling**: Graceful fallback to demo data

### **2. Enhanced 3D Visualization**
- **Animated Soil Layers**: Breathing and color-changing animations
- **Enhanced Materials**: Better lighting and material properties
- **Interactive Tooltips**: Detailed soil information on hover
- **Performance Optimization**: Adaptive rendering based on device capabilities

### **3. Data Source Display**
- **Live Status Indicator**: Green pulsing dot for active data
- **Source Information**: Shows API source and confidence level
- **Loading States**: Visual feedback during data fetching
- **Error Messages**: Clear error reporting with fallback options

### **4. Enhanced UI Components**
- **Gradient Backgrounds**: Beautiful gradient backgrounds for data panels
- **Interactive Elements**: Hover effects and smooth transitions
- **Color-Coded Information**: Visual indicators for different data types
- **Responsive Design**: Works on all screen sizes

## 📊 **API Response Format**

```typescript
interface GroundwaterData {
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
    color: string; // Enhanced with multiple shades
  };
  metadata: {
    data_source: string;
    api_endpoint: string;
    confidence: number;
    last_fetched: string;
  };
}
```

## 🛠️ **Technical Implementation**

### **Enhanced Soil Layer Component**
```typescript
const EnhancedSoilLayer3D: React.FC<{
  layer: any;
  position: [number, number, number];
  size: [number, number, number];
  colorInfo: any;
  performanceMode: boolean;
  animationTime: number;
  onHover: () => void;
  onLeave: () => void;
}> = ({ layer, position, size, colorInfo, performanceMode, animationTime, onHover, onLeave }) => {
  // Enhanced material with gradient colors
  const material = useMemo(() => {
    if (performanceMode) {
      return new THREE.MeshBasicMaterial({ 
        color: colorInfo.primary,
        transparent: true,
        opacity: 0.8
      });
    }
    
    return new THREE.MeshLambertMaterial({ 
      color: colorInfo.primary,
      transparent: true,
      opacity: 0.9
    });
  }, [colorInfo.primary, performanceMode]);
  
  // Animate soil layer with subtle movement
  useFrame(() => {
    if (meshRef.current && !performanceMode) {
      // Subtle breathing animation
      const scale = 1 + Math.sin(animationTime * 0.5) * 0.02;
      meshRef.current.scale.setScalar(scale);
      
      // Color variation based on animation
      const colorVariation = Math.sin(animationTime * 0.3) * 0.1;
      const currentColor = new THREE.Color(colorInfo.primary);
      currentColor.offsetHSL(colorVariation, 0, 0);
      material.color = currentColor;
    }
  });
  
  // Enhanced tooltip with soil information
  return (
    <group position={position}>
      <mesh ref={meshRef} onPointerOver={handleHover} onPointerOut={handleLeave}>
        <boxGeometry args={size} />
        <primitive object={material} />
      </mesh>
      <Html distanceFactor={10}>
        <div className={`bg-black/70 text-white p-3 rounded-lg text-xs transition-all duration-300 ${
          isHovered ? 'scale-110 shadow-lg' : ''
        }`}>
          <div className="font-semibold text-yellow-300">{layer.name}</div>
          <div className="text-gray-300">Thickness: {layer.thickness_m.toFixed(1)}m</div>
          <div className="text-gray-300">Permeability: {(layer.permeability * 1000000).toFixed(2)} μm/s</div>
          <div className="text-gray-300">Porosity: {(layer.porosity * 100).toFixed(1)}%</div>
          <div className="mt-2 flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border border-white"
              style={{ backgroundColor: colorInfo.primary }}
            ></div>
            <span className="text-xs text-gray-400">Soil Color</span>
          </div>
        </div>
      </Html>
    </group>
  );
};
```

### **API Service Integration**
```typescript
class GroundwaterApiService {
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
}
```

## 🎮 **Usage**

### **1. Access the Enhanced Features**
- **Main Visualization**: Visit `/aquifer-visualization` for the enhanced 3D visualization
- **API Demo**: Visit `/api-demo` to test the Indian API integration
- **Interactive Testing**: Use the demo component to test different locations

### **2. Test with Indian Locations**
Quick location buttons are available for:
- Delhi (28.6139, 77.2090)
- Mumbai (19.0760, 72.8777)
- Bangalore (12.9716, 77.5946)
- Chennai (13.0827, 80.2707)
- Kolkata (22.5726, 88.3639)
- Hyderabad (17.3850, 78.4867)
- Pune (18.5204, 73.8567)
- Ahmedabad (23.0225, 72.5714)

### **3. What You'll See**
- ✅ **Real-time data loading** with progress indicators
- ✅ **Enhanced soil colors** with multiple shades and animations
- ✅ **Data source information** showing which API provided the data
- ✅ **Confidence levels** indicating data reliability
- ✅ **Interactive soil layers** with hover effects and detailed information
- ✅ **Animated 3D visualization** with breathing soil layers
- ✅ **Fallback to demo data** if APIs are unavailable

## 🔧 **Configuration**

### **API Keys (Optional)**
Create a `.env` file in the frontend directory:
```env
# Get your free API key from https://openweathermap.org/api
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### **Performance Settings**
The system automatically adjusts performance based on device capabilities:
- **High-end devices**: Full animations and effects
- **Low-end devices**: Simplified rendering and basic materials
- **Mobile devices**: Optimized for touch interaction

## 📈 **Performance Features**

### **Optimizations**
- **Adaptive Rendering**: Automatically adjusts quality based on performance
- **LOD System**: Level-of-detail for complex geometries
- **Material Caching**: Reuses materials for better performance
- **Animation Throttling**: Reduces animation frequency on low-end devices

### **Error Handling**
- **Network Resilience**: Multiple API sources with fallback
- **Timeout Protection**: 10-second timeout for all API calls
- **Graceful Degradation**: Falls back to demo data if APIs fail
- **User Feedback**: Clear error messages and loading states

## 🌟 **Key Benefits**

1. **Real Indian Data**: Access to actual groundwater data from Indian sources
2. **Enhanced Visualization**: Beautiful soil colors and animations
3. **Reliable Fallback**: Always works, even when APIs are unavailable
4. **Performance Optimized**: Adapts to device capabilities
5. **User-Friendly**: Clear feedback and intuitive interface
6. **Educational**: Detailed soil information and data sources

## 🚀 **Future Enhancements**

1. **More Indian APIs**: Additional government data sources
2. **Real-time Updates**: WebSocket connections for live data
3. **Historical Data**: Access to historical groundwater trends
4. **Machine Learning**: Predictive groundwater level modeling
5. **Mobile App**: Native mobile app with offline capabilities
6. **AR/VR Support**: Augmented and virtual reality visualization

## 📞 **Support**

For issues with the enhanced features:
1. Check the console for error messages
2. Verify API keys and endpoints
3. Test individual APIs using the demo component
4. Check network connectivity
5. Review the fallback data system

The enhanced groundwater features are now fully integrated and ready for use! The system provides real-time access to Indian groundwater data with beautiful soil color animations and enhanced 3D visualization.
