import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { VisualizationConfig, VisualizationCallbacks, PerformanceSettings } from './types';
import { EnhancedSoilLayer, ENHANCED_SOIL_COLORS } from './types.enhanced';

// Performance-optimized materials
const createOptimizedMaterial = (color: string, performanceMode: boolean) => {
  if (performanceMode) {
    return new THREE.MeshBasicMaterial({ color });
  }
  return new THREE.MeshLambertMaterial({ color });
};

// Soil Layer Component
interface SoilLayerProps {
  layer: any;
  position: [number, number, number];
  size: [number, number, number];
  performanceMode: boolean;
  onHover: (layer: any) => void;
  onLeave: () => void;
}

const SoilLayer3D: React.FC<SoilLayerProps> = ({ 
  layer, 
  position, 
  size, 
  performanceMode, 
  onHover, 
  onLeave 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const material = useMemo(() => createOptimizedMaterial(layer.color, performanceMode), [layer.color, performanceMode]);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        material={material}
        onPointerOver={() => onHover(layer)}
        onPointerOut={onLeave}
      >
        <boxGeometry args={size} />
      </mesh>
      <Text
        position={[0, 0, size[2] / 2 + 0.1]}
        fontSize={0.3}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {layer.name}
      </Text>
    </group>
  );
};

// Enhanced Soil Layer Component with animations and better colors
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
  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Create enhanced material with gradient colors
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
  
  const handleHover = () => {
    setIsHovered(true);
    onHover();
  };
  
  const handleLeave = () => {
    setIsHovered(false);
    onLeave();
  };
  
  return (
    <group position={position}>
      <mesh 
        ref={meshRef}
        onPointerOver={handleHover}
        onPointerOut={handleLeave}
      >
        <boxGeometry args={size} />
        <primitive object={material} />
      </mesh>
      <Text
        position={[0, 0, size[2] / 2 + 0.1]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {layer.name}
      </Text>
      <Html distanceFactor={10}>
        <div className={`bg-black/70 text-white p-3 rounded-lg text-xs transition-all duration-300 ${
          isHovered ? 'scale-110 shadow-lg' : ''
        }`}>
          <div className="font-semibold text-yellow-300">{layer.name}</div>
          <div className="text-gray-300">
            Thickness: {layer.thickness_m.toFixed(1)}m
          </div>
          <div className="text-gray-300">
            Permeability: {(layer.permeability * 1000000).toFixed(2)} μm/s
          </div>
          <div className="text-gray-300">
            Porosity: {(layer.porosity * 100).toFixed(1)}%
          </div>
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

// Water Surface Component
interface WaterSurfaceProps {
  position: [number, number, number];
  size: [number, number];
  animationTime: number;
}

const WaterSurface: React.FC<WaterSurfaceProps> = ({ 
  position, 
  size, 
  animationTime 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      const vertices = meshRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < vertices.length; i += 3) {
        vertices[i + 2] = Math.sin(vertices[i] * 0.5 + animationTime) * 0.1;
      }
      meshRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const material = useMemo(() => {
    return new THREE.MeshLambertMaterial({ 
      color: '#4A90E2', 
      transparent: true, 
      opacity: 0.8 
    });
  }, []);

  return (
    <mesh ref={meshRef} position={position} material={material}>
      <planeGeometry args={size} />
    </mesh>
  );
};

// Borewell Component
interface BoreWellProps {
  config: any;
  waterLevel: number;
  performanceMode: boolean;
  onHover: () => void;
  onLeave: () => void;
}

const BoreWell3D: React.FC<BoreWellProps> = ({ 
  config, 
  waterLevel, 
  performanceMode, 
  onHover, 
  onLeave 
}) => {
  const material = useMemo(() => createOptimizedMaterial('#8B4513', performanceMode), [performanceMode]);
  const waterMaterial = useMemo(() => createOptimizedMaterial('#4A90E2', performanceMode), [performanceMode]);

  return (
    <group position={config.position}>
      {/* Borewell shaft */}
      <mesh
        material={material}
        onPointerOver={onHover}
        onPointerOut={onLeave}
      >
        <cylinderGeometry args={[config.diameter_m / 2, config.diameter_m / 2, config.depth_m, 8]} />
      </mesh>
      
      {/* Water in borewell */}
      {waterLevel > 0 && (
        <mesh position={[0, 0, -config.depth_m / 2 + waterLevel / 2]}>
          <cylinderGeometry args={[config.diameter_m / 2 - 0.1, config.diameter_m / 2 - 0.1, waterLevel, 8]} />
          <meshBasicMaterial color="#4A90E2" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
};

// Shaft Component
interface ShaftProps {
  config: any;
  waterLevel: number;
  performanceMode: boolean;
  onHover: () => void;
  onLeave: () => void;
}

const Shaft3D: React.FC<ShaftProps> = ({ 
  config, 
  waterLevel, 
  performanceMode, 
  onHover, 
  onLeave 
}) => {
  const material = useMemo(() => createOptimizedMaterial('#654321', performanceMode), [performanceMode]);
  const waterMaterial = useMemo(() => createOptimizedMaterial('#4A90E2', performanceMode), [performanceMode]);

  // Calculate overflow geometry based on size category
  const getOverflowGeometry = () => {
    switch (config.size_category) {
      case 'small':
        return <sphereGeometry args={[0.5, 8, 6]} />;
      case 'medium':
        return <boxGeometry args={[2, 0.5, 1]} />;
      case 'large':
        return <boxGeometry args={[4, 0.5, 1]} />;
      default:
        return <sphereGeometry args={[0.5, 8, 6]} />;
    }
  };

  return (
    <group position={[2, 0, 0]}>
      {/* Shaft */}
      <mesh
        material={material}
        onPointerOver={onHover}
        onPointerOut={onLeave}
      >
        <cylinderGeometry args={[config.diameter_m / 2, config.diameter_m / 2, config.depth_m, 8]} />
      </mesh>
      
      {/* Water in shaft */}
      {waterLevel > 0 && (
        <mesh position={[0, 0, -config.depth_m / 2 + waterLevel / 2]}>
          <cylinderGeometry args={[config.diameter_m / 2 - 0.1, config.diameter_m / 2 - 0.1, waterLevel, 8]} />
          <meshBasicMaterial color="#4A90E2" transparent opacity={0.8} />
        </mesh>
      )}
      
      {/* Overflow visualization */}
      {waterLevel > config.depth_m && (
        <mesh position={[0, 0, 0.5]}>
          {getOverflowGeometry()}
          <meshBasicMaterial color="#87CEEB" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

// Rooftop Component
interface RooftopProps {
  config: any;
  performanceMode: boolean;
  onHover: () => void;
  onLeave: () => void;
}

const Rooftop3D: React.FC<RooftopProps> = ({ 
  config, 
  performanceMode, 
  onHover, 
  onLeave 
}) => {
  const material = useMemo(() => createOptimizedMaterial('#8B4513', performanceMode), [performanceMode]);
  
  return (
    <group position={config.position}>
      {/* Building structure */}
      <mesh
        material={material}
        onPointerOver={onHover}
        onPointerOut={onLeave}
      >
        <boxGeometry args={[config.width_m, config.length_m, config.height_m]} />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, 0, config.height_m / 2 + 0.1]}>
        <boxGeometry args={[config.width_m + 0.2, config.length_m + 0.2, 0.2]} />
        <meshBasicMaterial color="#654321" />
      </mesh>
    </group>
  );
};

// Water Pipe Component
interface WaterPipeProps {
  config: any;
  performanceMode: boolean;
  animationTime: number;
}

const WaterPipe: React.FC<WaterPipeProps> = ({ 
  config, 
  performanceMode, 
  animationTime 
}) => {
  const pipeMaterial = useMemo(() => createOptimizedMaterial('#A0522D', performanceMode), [performanceMode]);
  
  // Optimized animated water drops - reduced count for better performance
  const waterDrops = useMemo(() => {
    const drops = [];
    for (let i = 0; i < 5; i++) {
      const offset = (animationTime * 2 + i * 0.5) % 2;
      drops.push(
        <mesh key={i} position={[0, 0, -offset]}>
          <sphereGeometry args={[0.02, 6, 4]} />
          <meshBasicMaterial color="#4A90E2" transparent opacity={0.8} />
        </mesh>
      );
    }
    return drops;
  }, [animationTime]);
  
  return (
    <group position={[config.rooftop.position[0] + config.rooftop.width_m / 2, 0, config.rooftop.position[2] - config.rooftop.height_m / 2]}>
      {/* Vertical pipe from rooftop */}
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[config.rooftop.pipe_diameter_m / 2, config.rooftop.pipe_diameter_m / 2, config.rooftop.pipe_length_m, 8]} />
        <primitive object={pipeMaterial} />
      </mesh>
      
      {/* Horizontal pipe to shaft */}
      <mesh position={[config.rooftop.pipe_length_m / 2, 0, -config.rooftop.pipe_length_m]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[config.rooftop.pipe_diameter_m / 2, config.rooftop.pipe_diameter_m / 2, 4, 8]} />
        <primitive object={pipeMaterial} />
      </mesh>
      
      {/* Animated water drops */}
      {waterDrops}
    </group>
  );
};

// Connection pipe between borewell and shaft
const ConnectionPipe: React.FC<{ performanceMode: boolean }> = ({ performanceMode }) => {
  const material = useMemo(() => createOptimizedMaterial('#A0522D', performanceMode), [performanceMode]);
  
  return (
    <mesh position={[1, 0, -1]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.1, 0.1, 2, 6]} />
      <primitive object={material} />
    </mesh>
  );
};

// Main 3D Scene Component
interface Scene3DProps {
  config: VisualizationConfig;
  callbacks: VisualizationCallbacks;
  performanceSettings: PerformanceSettings;
  animationTime: number;
  waterLevel: number;
}

const Scene3D: React.FC<Scene3DProps> = ({ 
  config, 
  callbacks, 
  performanceSettings, 
  animationTime, 
  waterLevel 
}) => {
  const [selectedElement, setSelectedElement] = useState<'borewell' | 'shaft' | 'soil' | 'rooftop' | null>(null);
  const [hoveredLayer, setHoveredLayer] = useState<any>(null);

  const handleBorewellHover = () => {
    setSelectedElement('borewell');
    callbacks.onSelection?.('borewell');
  };

  const handleShaftHover = () => {
    setSelectedElement('shaft');
    callbacks.onSelection?.('shaft');
  };

  const handleRooftopHover = () => {
    setSelectedElement('rooftop');
    callbacks.onSelection?.('rooftop');
  };

  const handleSoilHover = (layer: any) => {
    setHoveredLayer(layer);
    setSelectedElement('soil');
    callbacks.onSelection?.('soil');
  };

  const handleLeave = () => {
    setSelectedElement(null);
    setHoveredLayer(null);
    callbacks.onSelection?.(null);
  };

  // FPS monitoring

  // Calculate soil layer positions
  let currentDepth = 0;
  const soilLayers = config.soil_layers.map((layer, index) => {
    const position: [number, number, number] = [0, 0, -currentDepth - layer.thickness_m / 2];
    const size: [number, number, number] = [10, 2, layer.thickness_m];
    currentDepth += layer.thickness_m;
    
    // Get enhanced soil colors
    const soilColorInfo = ENHANCED_SOIL_COLORS[layer.name] || {
      primary: layer.color,
      secondary: layer.color,
      highlight: layer.color,
      shadow: layer.color
    };
    
    return (
      <EnhancedSoilLayer3D
        key={index}
        layer={layer}
        position={position}
        size={size}
        colorInfo={soilColorInfo}
        performanceMode={performanceSettings.enablePerformanceMode}
        animationTime={animationTime}
        onHover={handleSoilHover}
        onLeave={handleLeave}
      />
    );
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      
      {/* Ground surface */}
      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[20, 8]} />
        <meshLambertMaterial color="#8FBC8F" />
      </mesh>
      
      {/* Rooftop System */}
      <Rooftop3D
        config={config.rooftop}
        performanceMode={performanceSettings.enablePerformanceMode}
        onHover={handleRooftopHover}
        onLeave={handleLeave}
      />
      
      {/* Water Pipe System */}
      <WaterPipe
        config={config}
        performanceMode={performanceSettings.enablePerformanceMode}
        animationTime={animationTime}
      />
      
      {/* Soil layers */}
      {soilLayers}
      
      {/* Water surface */}
      <WaterSurface
        position={[0, 0, -config.groundwater_depth_m]}
        size={[10, 2]}
        animationTime={animationTime}
      />
      
      {/* Borewell */}
      <BoreWell3D
        config={config.borewell}
        waterLevel={waterLevel}
        performanceMode={performanceSettings.enablePerformanceMode}
        onHover={handleBorewellHover}
        onLeave={handleLeave}
      />
      
      {/* Shaft */}
      <Shaft3D
        config={config.shaft}
        waterLevel={waterLevel}
        performanceMode={performanceSettings.enablePerformanceMode}
        onHover={handleShaftHover}
        onLeave={handleLeave}
      />
      
      {/* Connection pipe */}
      <ConnectionPipe performanceMode={performanceSettings.enablePerformanceMode} />
      
      {/* Info tooltip */}
      {hoveredLayer && (
        <Html position={[0, 2, 0]} center>
          <div className="bg-black text-white p-2 rounded text-sm max-w-xs">
            <div className="font-bold">{hoveredLayer.name}</div>
            <div>Permeability: {hoveredLayer.permeability}</div>
            <div>Porosity: {hoveredLayer.porosity}</div>
          </div>
        </Html>
      )}
    </>
  );
};

// Main 3D Visualization Component
interface Aquifer3DVisualizationProps {
  config: VisualizationConfig;
  callbacks?: VisualizationCallbacks;
  performanceSettings?: Partial<PerformanceSettings>;
}

const Aquifer3DVisualization: React.FC<Aquifer3DVisualizationProps> = ({
  config,
  callbacks = {},
  performanceSettings = {}
}) => {
  const [animationTime, setAnimationTime] = useState(0);
  const [waterLevel, setWaterLevel] = useState(config.groundwater_depth_m);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedElement, setSelectedElement] = useState<'borewell' | 'shaft' | 'soil' | 'rooftop' | null>(null);

  const defaultPerformanceSettings: PerformanceSettings = {
    enablePerformanceMode: false,
    maxPolygons: 10000,
    textureSize: 512,
    enableLOD: true,
    enableWaterShader: true,
    ...performanceSettings
  };

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setAnimationTime(prev => prev + 0.1);
      // Simulate water level changes over 8-12 second cycle
      const cycleTime = (animationTime % 10) / 10; // 10 second cycle
      const newLevel = config.groundwater_depth_m + Math.sin(cycleTime * Math.PI * 2) * 2;
      setWaterLevel(newLevel);
      callbacks.onLevelChange?.(newLevel);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, animationTime, config.groundwater_depth_m, callbacks]);

  const handleLevelChange = (level: number) => {
    setWaterLevel(level);
    callbacks.onLevelChange?.(level);
  };

  const handleSelection = (element: 'borewell' | 'shaft' | 'soil' | 'rooftop' | null) => {
    setSelectedElement(element);
    callbacks.onSelection?.(element);
  };

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [8, 8, 8], fov: 50 }}
        style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%)' }}
        performance={{ min: 0.5 }}
        dpr={defaultPerformanceSettings.enablePerformanceMode ? 1 : [1, 2]}
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={20}
        />
        <Scene3D
          config={config}
          callbacks={{ ...callbacks, onSelection: handleSelection }}
          performanceSettings={defaultPerformanceSettings}
          animationTime={animationTime}
          waterLevel={waterLevel}
        />
      </Canvas>
      
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <span className="text-sm">Animation</span>
          </div>
          
          <div>
            <label className="text-sm block mb-1">Water Level: {waterLevel.toFixed(1)}m</label>
            <input
              type="range"
              min={config.groundwater_depth_m - 5}
              max={config.groundwater_depth_m + 5}
              value={waterLevel}
              onChange={(e) => handleLevelChange(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="text-sm block mb-1">Shaft Size: {config.shaft.size_category}</label>
            <select
              value={config.shaft.size_category}
              onChange={(e) => {
                // This would need to be handled by parent component
                console.log('Shaft size changed:', e.target.value);
              }}
              className="w-full bg-gray-700 text-white rounded px-2 py-1"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="performance"
              checked={defaultPerformanceSettings.enablePerformanceMode}
              onChange={(e) => {
                // This would need to be handled by parent component
                console.log('Performance mode:', e.target.checked);
              }}
            />
            <label htmlFor="performance" className="text-sm">Performance Mode</label>
          </div>
        </div>
      </div>
      
      {/* Selection Info */}
      {selectedElement && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
          <h3 className="font-bold mb-2">Selected: {selectedElement}</h3>
          {selectedElement === 'rooftop' && (
            <div>
              <div>Size: {config.rooftop.width_m}m × {config.rooftop.length_m}m</div>
              <div>Height: {config.rooftop.height_m}m</div>
              <div>Pipe Diameter: {config.rooftop.pipe_diameter_m}m</div>
              <div>Flow Rate: {config.water_flow.flowRate} L/s</div>
            </div>
          )}
          {selectedElement === 'borewell' && (
            <div>
              <div>Depth: {config.borewell.depth_m}m</div>
              <div>Diameter: {config.borewell.diameter_m}m</div>
              <div>Water Level: {waterLevel.toFixed(1)}m</div>
            </div>
          )}
          {selectedElement === 'shaft' && (
            <div>
              <div>Depth: {config.shaft.depth_m}m</div>
              <div>Diameter: {config.shaft.diameter_m}m</div>
              <div>Size: {config.shaft.size_category}</div>
              <div>Overflow: {waterLevel > config.shaft.depth_m ? 'Yes' : 'No'}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Aquifer3DVisualization;
