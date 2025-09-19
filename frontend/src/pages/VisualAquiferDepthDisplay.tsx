import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiSettings, FiInfo } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../components/ThemeProvider';
import Aquifer3DVisualization from '../components/Aquifer3DVisualization';
import Aquifer2DFallback from '../components/Aquifer2DFallback';
import { VisualizationConfig, VisualizationCallbacks, PerformanceSettings } from '../components/types';
import { EnhancedVisualizationConfig, EnhancedSoilLayer, ENHANCED_SOIL_COLORS } from '../components/types.enhanced';
import sampleData from '../data/aquifer3d-sample.json';
import groundwaterApi, { GroundwaterData } from '../services/groundwaterApi';

// ... (interface definitions and helper functions remain the same)
interface Aquifer { id: string; name: string; depth_from: number; depth_to: number; water_table: number; color: string; aquifer_type: string; borewells_connected: number; }
interface AquiferData { location: { name: string; lat: number; lon: number }; timestamp: string; data_source: string; aquifers: Aquifer[]; }
const fetchAquiferFromBackend = async (lat: number, lon: number): Promise<AquiferData> => {
    const url = `/api/gamification/groundwater?lat=${lat}&lon=${lon}`;
    let res = await fetch(url);
    if (res.status === 404 || res.status === 405) { res = await fetch(`/groundwater?lat=${lat}&lon=${lon}`); }
    if (!res.ok) throw new Error('Failed to fetch groundwater data');
    const d = await res.json();
    return { location: { name: d.location, lat, lon }, timestamp: d.last_updated, data_source: 'RTRWH Backend', aquifers: [{ id: `${lat},${lon}`, name: d.location, depth_from: 0, depth_to: 80, water_table: d.groundwater_level_m, color: '#60a5fa', aquifer_type: d.aquifer_type, borewells_connected: d.borewells_connected }] };
};

// Fetch real-time aquifer depth data
const fetchAquiferDepth = async (lat: number, lon: number): Promise<number> => {
    try {
        const url = `/api/aquifer-depth?lat=${lat}&lon=${lon}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch aquifer depth');
        const data = await res.json();
        return data.depth_m || 12; // Default fallback
    } catch (error) {
        console.warn('Using fallback aquifer depth:', error);
        return 12; // Default fallback depth
    }
};
const getDepthColor = (depth: number) => { if (depth < 10) return '#34d399'; if (depth < 30) return '#fbbf24'; if (depth < 60) return '#fb7185'; return '#6366f1'; };


function MapClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
    useMapEvents({ click: (e: L.LeafletMouseEvent) => onPick(e.latlng.lat, e.latlng.lng) });
    return null;
}

function MapPicker({ onPick, lat, lon }: { onPick: (lat: number, lon: number) => void; lat: number; lon: number }) {
    const { t } = useTranslation();
    return (
        <MapContainer center={[lat, lon]} zoom={5} style={{ height: 300, width: '100%', borderRadius: 16 }} className="z-10">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={t('gda.map_attribution')} />
            <Marker position={[lat, lon]} />
            <MapClickHandler onPick={onPick} />
        </MapContainer>
    );
}

function VisualAquiferDepthDisplay() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [data, setData] = useState<AquiferData | null>(null);
    const [lat, setLat] = useState(22.5);
    const [lon, setLon] = useState(77.0);
    const [hoveredAquifer, setHoveredAquifer] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // 3D Visualization state
    const [visualizationConfig, setVisualizationConfig] = useState<VisualizationConfig>(sampleData.small_shaft as VisualizationConfig);
    const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>({
        enablePerformanceMode: false,
        maxPolygons: 10000,
        textureSize: 512,
        enableLOD: true,
        enableWaterShader: true
    });
    const [useFallback, setUseFallback] = useState(true);
    const [waterLevel, setWaterLevel] = useState(12);
    const [animationTime, setAnimationTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [selectedElement, setSelectedElement] = useState<'borewell' | 'shaft' | 'soil' | 'rooftop' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [dataSource, setDataSource] = useState<string>('Loading...');
    const [enhancedSoilLayers, setEnhancedSoilLayers] = useState<EnhancedSoilLayer[]>([]);
    
    const chartHeight = 500;
    const chartWidth = 200;

    // Auto-fetch user's current latitude/longitude (with graceful fallback)
    useEffect(() => {
        let cancelled = false;
        const setIfNotCancelled = (la: number, lo: number) => {
            if (cancelled) return;
            // Basic sanity clamp to valid ranges
            const clampedLat = Math.max(-90, Math.min(90, la));
            const clampedLon = Math.max(-180, Math.min(180, lo));
            setLat(clampedLat);
            setLon(clampedLon);
        };

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setIfNotCancelled(pos.coords.latitude, pos.coords.longitude);
                },
                (err) => {
                    console.warn('Geolocation unavailable, using defaults:', err);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
            );
        }

        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        setError(null);
        setData(null);
        
        // Fetch enhanced groundwater data from Indian APIs
        const fetchEnhancedData = async () => {
            try {
                setIsLoading(true);
                const apiResponse = await groundwaterApi.fetchGroundwaterData(lat, lon);
                
                if (apiResponse.success && apiResponse.data) {
                    const groundwaterData = apiResponse.data;
                    
                    // Convert to the expected format
                    const aquiferData: AquiferData = {
                        location: {
                            name: groundwaterData.location.name,
                            lat: groundwaterData.location.lat,
                            lon: groundwaterData.location.lon
                        },
                        timestamp: groundwaterData.groundwater.last_updated,
                        data_source: groundwaterData.metadata.data_source,
                        aquifers: [{
                            id: `${lat},${lon}`,
                            name: `${groundwaterData.aquifer.type} Aquifer`,
                            depth_from: 0,
                            depth_to: groundwaterData.aquifer.thickness_m,
                            water_table: groundwaterData.groundwater.level_m,
                            color: getDepthColor(groundwaterData.groundwater.level_m),
                            aquifer_type: groundwaterData.aquifer.type,
                            borewells_connected: 1
                        }]
                    };
                    
                    setData(aquiferData);
                    
                    // Create enhanced soil layers with colors
                    const enhancedLayers: EnhancedSoilLayer[] = [{
                        name: groundwaterData.soil.type,
                        thickness_m: groundwaterData.soil.depth_m,
                        permeability: groundwaterData.soil.permeability,
                        porosity: groundwaterData.aquifer.porosity,
                        color: groundwaterData.soil.color,
                        texture: groundwaterData.soil.texture,
                        water_holding_capacity: groundwaterData.soil.water_holding_capacity,
                        organic_matter: 2.5,
                        ph: 6.8,
                        nutrients: {
                            nitrogen: 'Medium',
                            phosphorus: 'Low',
                            potassium: 'High'
                        }
                    }];
                    
                    setEnhancedSoilLayers(enhancedLayers);
                    
                    // Update visualization config with enhanced data
                    setVisualizationConfig(prev => ({
                        ...prev,
                        groundwater_depth_m: groundwaterData.groundwater.level_m,
                        soil_layers: [{
                            name: groundwaterData.soil.type,
                            thickness_m: groundwaterData.soil.depth_m,
                            permeability: groundwaterData.soil.permeability,
                            porosity: groundwaterData.aquifer.porosity,
                            color: groundwaterData.soil.color
                        }]
                    }));
                    
                    setWaterLevel(groundwaterData.groundwater.level_m);
                    setDataSource(`${apiResponse.source} (${(groundwaterData.metadata.confidence * 100).toFixed(0)}% confidence)`);
                    
                    console.log('Enhanced groundwater data loaded:', {
                        source: apiResponse.source,
                        confidence: groundwaterData.metadata.confidence,
                        location: groundwaterData.location.name,
                        soilType: groundwaterData.soil.type,
                        soilColor: groundwaterData.soil.color
                    });
                } else {
                    throw new Error(apiResponse.error || 'Failed to fetch groundwater data');
                }
            } catch (err) {
                console.warn('Failed to fetch enhanced groundwater data, using fallback:', err);
                setError('Using demo data - real data unavailable');
                
                // Fallback to original API calls
                fetchAquiferFromBackend(lat, lon).then(setData).catch((e) => setError(e.message || t('vad.error_fetch')));
                fetchAquiferDepth(lat, lon).then((depth) => {
                    setVisualizationConfig(prev => ({
                        ...prev,
                        groundwater_depth_m: depth
                    }));
                    setWaterLevel(depth);
                });
                
                setDataSource('Demo Data (Real API Unavailable)');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchEnhancedData();
    }, [lat, lon, t]);

    // Real-time aquifer depth updates every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchAquiferDepth(lat, lon).then((depth) => {
                setVisualizationConfig(prev => ({
                    ...prev,
                    groundwater_depth_m: depth
                }));
            });
        }, 30000); // Update every 30 seconds

        return () => clearInterval(interval);
    }, [lat, lon]);

    // Animation loop
    useEffect(() => {
        if (!isPlaying) return;
        
        const interval = setInterval(() => {
            setAnimationTime(prev => prev + 0.1);
            // Simulate water level changes over 8-12 second cycle
            const cycleTime = (animationTime % 10) / 10; // 10 second cycle
            const newLevel = visualizationConfig.groundwater_depth_m + Math.sin(cycleTime * Math.PI * 2) * 2;
            setWaterLevel(newLevel);
        }, 100);

        return () => clearInterval(interval);
    }, [isPlaying, animationTime, visualizationConfig.groundwater_depth_m]);

    // Check for WebGL support and device capabilities
    useEffect(() => {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
        
        if (!gl || isLowEndDevice) {
            setUseFallback(true);
            setPerformanceSettings(prev => ({ ...prev, enablePerformanceMode: true }));
        }
    }, []);

    // Visualization callbacks
    const visualizationCallbacks: VisualizationCallbacks = useMemo(() => ({
        onLevelChange: (level: number) => {
            setWaterLevel(level);
        },
        onOverflow: (type: 'pit' | 'channel' | 'trench') => {
            console.log('Overflow detected:', type);
        },
        onSelection: (element: 'borewell' | 'shaft' | 'soil' | 'rooftop' | null) => {
            setSelectedElement(element);
        }
    }), []);

    const handleShaftSizeChange = (size: 'small' | 'medium' | 'large') => {
        const configKey = `${size}_shaft` as keyof typeof sampleData;
        setVisualizationConfig(sampleData[configKey] as VisualizationConfig);
        setWaterLevel(sampleData[configKey].groundwater_depth_m);
    };

    const handlePerformanceModeToggle = (enabled: boolean) => {
        setPerformanceSettings(prev => ({ ...prev, enablePerformanceMode: enabled }));
    };

    // Keyboard accessibility
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Only handle shortcuts when not typing in input fields
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return;
            }
            
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    setIsPlaying(!isPlaying);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setWaterLevel(prev => Math.min(prev + 0.5, visualizationConfig.groundwater_depth_m + 5));
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    setWaterLevel(prev => Math.max(prev - 0.5, visualizationConfig.groundwater_depth_m - 5));
                    break;
                case 'Digit1':
                    event.preventDefault();
                    handleShaftSizeChange('small');
                    break;
                case 'Digit2':
                    event.preventDefault();
                    handleShaftSizeChange('medium');
                    break;
                case 'Digit3':
                    event.preventDefault();
                    handleShaftSizeChange('large');
                    break;
                case 'KeyP':
                    event.preventDefault();
                    handlePerformanceModeToggle(!performanceSettings.enablePerformanceMode);
                    break;
                case 'KeyF':
                    event.preventDefault();
                    setUseFallback(!useFallback);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isPlaying, visualizationConfig.groundwater_depth_m, performanceSettings.enablePerformanceMode, useFallback]);

    const aquifers = useMemo(() => data?.aquifers || [], [data]);
    const maxDepth = useMemo(() => Math.max(...aquifers.map((aq) => aq.depth_to), 1), [aquifers]);
    const pxPerMeter = chartHeight / (maxDepth || 1);

    const downloadData = () => {
        if (!data) return;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aquifer_data_${data.location.name.replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const voiceCommands = {
        [t('voice_commands.set_latitude')]: (val: string) => setLat(parseFloat(val)),
        [t('voice_commands.set_longitude')]: (val: string) => setLon(parseFloat(val)),
        [t('voice_commands.download_data')]: downloadData,
        [t('voice_commands.go_home')]: () => navigate('/'),
    };

    // Voice assistant handled globally in navbar

    return (
        <motion.div className="mx-auto my-8 p-6 rounded-3xl shadow-2xl border bg-white/80 backdrop-blur-lg" aria-label={t('aria.vad_main')} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <header className="mb-4 flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Rooftop Rainwater Collection System</h2>
                    <p className="text-gray-600 mt-1">Interactive 3D visualization of rainwater flow from rooftop to aquifer recharge</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="text-blue-600 hover:underline">{t('gda.back_to_dashboard')}</Link>
                    <button
                        onClick={() => setUseFallback(!useFallback)}
                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                        title="Toggle 2D/3D mode"
                    >
                        {useFallback ? '3D View' : '2D View'}
                    </button>
                </div>
            </header>

            {/* System Flow Diagram */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Water Flow System</h3>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="font-medium">Rooftop</span>
                    </div>
                    <div className="text-gray-400">↓</div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="font-medium">Pipe</span>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="font-medium">Pit/Trench/Shaft</span>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="font-medium">Borewell</span>
                    </div>
                    <div className="text-gray-400">↓</div>
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">Aquifer</span>
                    </div>
                </div>
            </div>

            {/* Enhanced Data Source Information */}
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                            <span className="text-sm font-medium text-blue-800">Data Source:</span>
                            <span className="text-sm text-blue-600 ml-2">{dataSource}</span>
                        </div>
                    </div>
                    {isLoading && (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-blue-600">Loading real data...</span>
                        </div>
                    )}
                </div>
                
                {/* Enhanced Soil Information */}
                {enhancedSoilLayers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-green-800">Soil Type:</span>
                            {enhancedSoilLayers.map((layer, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div 
                                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                        style={{ backgroundColor: layer.color }}
                                    ></div>
                                    <span className="text-sm text-green-600">{layer.name}</span>
                                    <span className="text-xs text-gray-500">({layer.texture})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Main 3D Visualization */}
            <div className="mb-6 h-96 rounded-2xl overflow-hidden shadow-lg border relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-blue-600 font-medium">Loading groundwater data from Indian APIs...</p>
                            <p className="text-sm text-gray-500 mt-2">Trying India WRIS, CGWB, and other sources</p>
                        </div>
                    </div>
                )}
                   {useFallback ? (
                       <Aquifer2DFallback
                           config={visualizationConfig}
                           callbacks={visualizationCallbacks}
                           waterLevel={waterLevel}
                           animationTime={animationTime}
                           isPlaying={isPlaying}
                           onLevelChange={setWaterLevel}
                           onTogglePlay={() => setIsPlaying(!isPlaying)}
                           enhancedSoilLayers={enhancedSoilLayers}
                           dataSource={dataSource}
                           isLoading={isLoading}
                           lat={lat}
                           lon={lon}
                           aquiferName={data?.aquifers?.[0]?.name}
                           soilType={enhancedSoilLayers?.[0]?.name}
                           soilColor={enhancedSoilLayers?.[0]?.color}
                       />
                   ) : (
                    <Aquifer3DVisualization
                        config={visualizationConfig}
                        callbacks={visualizationCallbacks}
                        performanceSettings={performanceSettings}
                    />
                )}
            </div>

            {/* Controls Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Shaft Configuration */}
                <div className="bg-gray-50 rounded-2xl p-4 shadow-inner border">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FiSettings className="text-blue-600" />
                        Shaft Configuration
                    </h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">Shaft Size</label>
                            <select
                                value={visualizationConfig.shaft.size_category}
                                onChange={(e) => handleShaftSizeChange(e.target.value as 'small' | 'medium' | 'large')}
                                className="w-full bg-white border rounded px-3 py-2"
                            >
                                <option value="small">Small (Pit overflow)</option>
                                <option value="medium">Medium (Pit + Channel)</option>
                                <option value="large">Large (Trench overflow)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">Depth: {visualizationConfig.shaft.depth_m}m</label>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${(visualizationConfig.shaft.depth_m / 20) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600 block mb-1">Diameter: {visualizationConfig.shaft.diameter_m}m</label>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-green-600 h-2 rounded-full" 
                                    style={{ width: `${(visualizationConfig.shaft.diameter_m / 0.5) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Performance Settings */}
                <div className="bg-gray-50 rounded-2xl p-4 shadow-inner border">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FiInfo className="text-green-600" />
                        Performance
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Performance Mode</span>
                            <input
                                type="checkbox"
                                checked={performanceSettings.enablePerformanceMode}
                                onChange={(e) => handlePerformanceModeToggle(e.target.checked)}
                                className="rounded"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Water Shader</span>
                            <input
                                type="checkbox"
                                checked={performanceSettings.enableWaterShader}
                                onChange={(e) => setPerformanceSettings(prev => ({ ...prev, enableWaterShader: e.target.checked }))}
                                className="rounded"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">LOD System</span>
                            <input
                                type="checkbox"
                                checked={performanceSettings.enableLOD}
                                onChange={(e) => setPerformanceSettings(prev => ({ ...prev, enableLOD: e.target.checked }))}
                                className="rounded"
                            />
                        </div>
                        <div className="text-xs text-gray-500">
                            Max Polygons: {performanceSettings.maxPolygons.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-gray-50 rounded-2xl p-4 shadow-inner border">
                    <h3 className="font-semibold text-gray-700 mb-3">System Status</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Mode:</span>
                            <span className={useFallback ? "text-yellow-600" : "text-green-600"}>
                                {useFallback ? "2D Fallback" : "3D WebGL"}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Water Level:</span>
                            <span className="text-blue-600">{waterLevel.toFixed(1)}m</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Animation:</span>
                            <span className={isPlaying ? "text-green-600" : "text-red-600"}>
                                {isPlaying ? "Playing" : "Paused"}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Selected:</span>
                            <span className="text-purple-600">
                                {selectedElement || "None"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location Data (if available) */}
            {data && (
                <div className="bg-gray-50 rounded-2xl p-4 shadow-inner border">
                    <h3 className="font-semibold text-gray-700 mb-3">Location Data</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-medium text-gray-600">Location</h4>
                            <p>{data.location.name}</p>
                            <p className="text-sm text-gray-500">({data.location.lat}, {data.location.lon})</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-600">Data Source</h4>
                            <p>{data.data_source}</p>
                            <p className="text-sm text-gray-500">Last updated: {new Date(data.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                    <button onClick={downloadData} className="btn btn-sm btn-outline mt-4" aria-label={t('aria.download_data')}>
                        Download Data
                    </button>
                </div>
            )}

            {/* Keyboard Shortcuts Info */}
            <div className="mt-6 bg-blue-50 rounded-2xl p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Keyboard Shortcuts</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm text-blue-700">
                    <div><kbd className="bg-blue-200 px-2 py-1 rounded">Space</kbd> Toggle animation</div>
                    <div><kbd className="bg-blue-200 px-2 py-1 rounded">↑/↓</kbd> Adjust water level</div>
                    <div><kbd className="bg-blue-200 px-2 py-1 rounded">1/2/3</kbd> Shaft size</div>
                    <div><kbd className="bg-blue-200 px-2 py-1 rounded">P</kbd> Performance mode</div>
                    <div><kbd className="bg-blue-200 px-2 py-1 rounded">F</kbd> Toggle 2D/3D</div>
                </div>
            </div>
        </motion.div>
    );
}

export default VisualAquiferDepthDisplay;