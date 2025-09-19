# 3D Aquifer Depth Visualization

A lightweight, cross-device 3D visualization system for groundwater depth analysis with borewell and shaft overflow simulation. Built with React Three Fiber and optimized for low-end devices.

## Features

### 🎯 Core Visualization
- **3D Cross-section View**: Interactive 3D scene showing ground surface, soil layers, aquifer, and water table
- **Borewell & Shaft System**: Connected borewell and shaft with realistic overflow mechanics
- **Animated Water Levels**: 8-12 second cycling water level animation with overflow visualization
- **Soil Layer Interaction**: Hover/tap soil layers to view properties (permeability, porosity)

### 🔧 Interactive Controls
- **Playback Controls**: Play/pause animation with spacebar support
- **Water Level Slider**: Real-time adjustment of groundwater levels
- **Shaft Size Selector**: Switch between small (pit), medium (pit+channel), and large (trench) configurations
- **Performance Mode**: Ultra-low GPU path for integrated graphics

### 📱 Cross-Device Support
- **WebGL Detection**: Automatic fallback to 2D canvas for unsupported devices
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Keyboard Accessibility**: Full keyboard navigation support
- **Screen Reader Support**: ARIA labels and semantic HTML

## Performance Optimizations

### 🚀 3D Rendering Optimizations
- **Polygon Limit**: Scene kept under 10,000 triangles
- **Texture Budget**: Maximum 512×512 textures, prefer 256×256
- **Material Sharing**: Reuse materials across similar objects
- **LOD System**: Simplified geometry when camera zooms out
- **Instanced Geometry**: Reuse geometry for repeated elements

### ⚡ Performance Mode Features
- **Basic Materials**: Switch from Lambert to Basic materials
- **Disabled Water Shader**: Replace dynamic water with static plane
- **Reduced DPR**: Single pixel ratio instead of adaptive
- **Simplified Lighting**: Single directional light + ambient

### 🔄 2D Fallback Mode
- **Canvas Rendering**: Pure 2D canvas for ultra-low devices
- **Same Functionality**: All features available in 2D mode
- **Pixelated Style**: Optimized for low-resolution displays
- **Automatic Detection**: WebGL capability detection

## Technical Implementation

### 🏗️ Architecture
```
VisualAquiferDepthDisplay (Main Page)
├── Aquifer3DVisualization (3D Mode)
│   ├── Scene3D (3D Scene Container)
│   ├── SoilLayer3D (Individual Soil Layers)
│   ├── WaterSurface (Animated Water)
│   ├── BoreWell3D (Borewell Component)
│   ├── Shaft3D (Shaft Component)
│   └── ConnectionPipe (Borewell-Shaft Connection)
└── Aquifer2DFallback (2D Mode)
    └── Canvas-based rendering
```

### 📊 Data Structure
```typescript
interface VisualizationConfig {
  soil_layers: SoilLayer3D[];
  groundwater_depth_m: number;
  borewell: BoreWell3D;
  shaft: Shaft3D;
  overflow_threshold: number;
}
```

### 🎮 Controls
- **Mouse/Touch**: Orbit controls for camera movement
- **Spacebar**: Toggle animation play/pause
- **Arrow Keys**: Adjust water level
- **1/2/3 Keys**: Switch shaft sizes
- **P Key**: Toggle performance mode

## Sample Data

The system includes three pre-configured scenarios:

### Small Shaft (Pit Overflow)
- Shaft depth: 8m, diameter: 0.2m
- Overflow creates a small pit
- Groundwater depth: 12m

### Medium Shaft (Pit + Channel)
- Shaft depth: 12m, diameter: 0.3m
- Overflow creates pit with channel
- Groundwater depth: 15m

### Large Shaft (Trench Overflow)
- Shaft depth: 15m, diameter: 0.4m
- Overflow creates large trench
- Groundwater depth: 18m

## Performance Decisions

### 🎯 Key Optimizations Made

1. **Material Optimization**
   - Use `MeshBasicMaterial` in performance mode instead of `MeshLambertMaterial`
   - Share materials across similar objects to reduce draw calls
   - Avoid expensive PBR materials

2. **Geometry Efficiency**
   - Use low-poly cylinders (8 segments) for borewells and shafts
   - Simple box geometry for soil layers
   - Instanced geometry for repeated elements

3. **Animation Strategy**
   - Simple sine wave vertex animation for water surface
   - Avoid complex fluid simulation
   - Use `requestAnimationFrame` with proper cleanup

4. **Lighting Optimization**
   - Single directional light + ambient light
   - No shadow casting to reduce GPU load
   - Bake static lighting into material colors where possible

5. **Texture Management**
   - No textures larger than 512×512
   - Use solid colors instead of textures where possible
   - Compressed texture formats when available

6. **Fallback Strategy**
   - Automatic WebGL detection
   - 2D canvas fallback with same functionality
   - Graceful degradation for all features

## Usage

### Basic Implementation
```tsx
import Aquifer3DVisualization from './components/Aquifer3DVisualization';
import sampleData from './data/aquifer3d-sample.json';

<Aquifer3DVisualization
  config={sampleData.small_shaft}
  callbacks={{
    onLevelChange: (level) => console.log('Water level:', level),
    onOverflow: (type) => console.log('Overflow:', type),
    onSelection: (element) => console.log('Selected:', element)
  }}
  performanceSettings={{
    enablePerformanceMode: false,
    maxPolygons: 10000,
    textureSize: 512,
    enableLOD: true,
    enableWaterShader: true
  }}
/>
```

### With Fallback
```tsx
import { useState, useEffect } from 'react';

const [useFallback, setUseFallback] = useState(false);

useEffect(() => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) setUseFallback(true);
}, []);

{useFallback ? (
  <Aquifer2DFallback {...props} />
) : (
  <Aquifer3DVisualization {...props} />
)}
```

## Browser Support

- **Modern Browsers**: Full 3D WebGL support
- **Older Browsers**: Automatic 2D fallback
- **Mobile Devices**: Touch controls and responsive design
- **Low-end Devices**: Performance mode and 2D fallback

## Dependencies

- `@react-three/fiber`: React renderer for Three.js
- `@react-three/drei`: Useful helpers for Three.js
- `three`: 3D graphics library
- `framer-motion`: Animation library
- `react-i18next`: Internationalization

## Performance Targets

- **Target FPS**: 30-60 FPS on integrated GPUs
- **Memory Usage**: < 100MB for 3D mode, < 50MB for 2D mode
- **Load Time**: < 2 seconds initial render
- **Polygon Count**: < 10,000 triangles in scene
- **Texture Memory**: < 16MB total texture budget

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all controls
- **Screen Reader**: ARIA labels and semantic HTML
- **High Contrast**: Color choices meet WCAG guidelines
- **Focus Management**: Clear focus indicators
- **Alternative Text**: Text descriptions for visual elements

## Future Enhancements

- **VR Support**: WebXR integration for immersive viewing
- **Data Import**: Support for real groundwater data
- **Export Features**: Screenshot and data export capabilities
- **Advanced Shaders**: More realistic water rendering
- **Multi-language**: Full internationalization support
