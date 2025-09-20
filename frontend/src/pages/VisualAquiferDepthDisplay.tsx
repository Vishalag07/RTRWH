import React, { useEffect, useState, useMemo, useCallback } from 'react';
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

// Interface definitions
interface Aquifer { 
    id: string; 
    name: string; 
    depth_from: number; 
    depth_to: number; 
    water_table: number; 
    color: string; 
    aquifer_type: string; 
    borewells_connected: number; 
}

interface AquiferData { 
    location: { name: string; lat: number; lon: number }; 
    timestamp: string; 
    data_source: string; 
    aquifers: Aquifer[]; 
}

const fetchAquiferFromBackend = async (lat: number, lon: number): Promise<AquiferData> => {
    const url = `/api/groundwater/info?lat=${lat}&lon=${lon}`;
    let res = await fetch(url);
    if (res.status === 404 || res.status === 405) { 
        res = await fetch(`/groundwater?lat=${lat}&lon=${lon}`); 
    }
    if (!res.ok) throw new Error('Failed to fetch groundwater data');
    const d = await res.json();
    return { 
        location: { name: d.location, lat, lon }, 
        timestamp: d.last_updated, 
        data_source: 'India WRIS (Primary)', 
        aquifers: [{ 
            id: `${lat},${lon}`, 
            name: d.location, 
            depth_from: 0, 
            depth_to: 80, 
            water_table: d.groundwater_level_m, 
            color: '#60a5fa', 
            aquifer_type: d.aquifer_type, 
            borewells_connected: d.borewells_connected 
        }] 
    };
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

const getDepthColor = (depth: number) => { 
    if (depth < 10) return '#34d399'; 
    if (depth < 30) return '#fbbf24'; 
    if (depth < 60) return '#fb7185'; 
    return '#6366f1'; 
};


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
    const [showShortcuts, setShowShortcuts] = useState(false);
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
                            borewells_connected: groundwaterData.aquifer.borewells_connected || 1
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
                        water_holding_capacity: 0.3,
                        organic_matter: 2.5,
                        ph: 6.5,
                        nutrients: { nitrogen: 'Medium', phosphorus: 'Low', potassium: 'High' }
                    }];
                    
                    setEnhancedSoilLayers(enhancedLayers);
                    
                    // Update visualization config
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
                    setDataSource(`${apiResponse.source} - ${groundwaterData.metadata.data_source} (${(groundwaterData.metadata.confidence * 100).toFixed(0)}% confidence)`);
                    
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
                setError('Using fallback data - real data unavailable');
                
                // Fallback to original API calls
                fetchAquiferFromBackend(lat, lon).then(setData).catch((e) => setError(e.message || t('vad.error_fetch')));
                fetchAquiferDepth(lat, lon).then((depth) => {
                    setVisualizationConfig(prev => ({
                        ...prev,
                        groundwater_depth_m: depth
                    }));
                    setWaterLevel(depth);
                });
                
                setDataSource('India WRIS (Fallback)');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchEnhancedData();
    }, [lat, lon, t]);

    // Real-time aquifer depth updates every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isLoading) {
                fetchAquiferDepth(lat, lon).then((depth) => {
                    setVisualizationConfig(prev => ({
                        ...prev,
                        groundwater_depth_m: depth
                    }));
                    setWaterLevel(depth);
                }).catch(console.warn);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [lat, lon, isLoading]);

    // Enhanced keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in input fields
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    setIsPlaying(!isPlaying);
                    break;
                case 'KeyR':
                    event.preventDefault();
                    setAnimationTime(0);
                    break;
                case 'KeyF':
                    event.preventDefault();
                    setUseFallback(!useFallback);
                    break;
                case 'KeyP':
                    event.preventDefault();
                    setIsPlaying(!isPlaying);
                    break;
                case 'KeyS':
                    event.preventDefault();
                    setAnimationTime(0);
                    break;
                case 'KeyT':
                    event.preventDefault();
                    setUseFallback(!useFallback);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setWaterLevel(prev => Math.min(20, prev + 1));
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    setWaterLevel(prev => Math.max(0, prev - 1));
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    setAnimationTime(prev => Math.max(0, prev - 1));
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    setAnimationTime(prev => prev + 1);
                    break;
                case 'KeyH':
                    event.preventDefault();
                    setShowShortcuts(!showShortcuts);
                    break;
                case 'Escape':
                    event.preventDefault();
                    setShowShortcuts(false);
                    setSelectedElement(null);
                    break;
                case 'Digit1':
                    event.preventDefault();
                    setVisualizationConfig(prev => ({
                        ...prev,
                        shaft: { ...prev.shaft, size_category: 'small' }
                    }));
                    break;
                case 'Digit2':
                    event.preventDefault();
                    setVisualizationConfig(prev => ({
                        ...prev,
                        shaft: { ...prev.shaft, size_category: 'medium' }
                    }));
                    break;
                case 'Digit3':
                    event.preventDefault();
                    setVisualizationConfig(prev => ({
                        ...prev,
                        shaft: { ...prev.shaft, size_category: 'large' }
                    }));
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isPlaying, showShortcuts, visualizationConfig.groundwater_depth_m, performanceSettings.enablePerformanceMode, useFallback]);

    const aquifers = useMemo(() => data?.aquifers || [], [data]);

    const visualizationCallbacks: VisualizationCallbacks = useMemo(() => ({
        onLevelChange: setWaterLevel,
        onSelection: setSelectedElement
    }), []);

    const handleShaftSizeChange = useCallback((size: 'small' | 'medium' | 'large') => {
        setVisualizationConfig(prev => ({
            ...prev,
            shaft: {
                ...prev.shaft,
                size_category: size,
                diameter_m: size === 'small' ? 0.5 : size === 'medium' ? 1.0 : 1.5,
                depth_m: size === 'small' ? 20 : size === 'medium' ? 40 : 60
            }
        }));
    }, []);


    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Retry
                        </button>
                        <Link to="/dashboard" className="text-blue-600 hover:underline">{t('gda.back_to_dashboard')}</Link>
                        <button
                            onClick={() => setUseFallback(!useFallback)}
                            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                            title="Toggle 2D/3D mode"
                        >
                            {useFallback ? '3D View' : '2D View'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Visual Aquifer Depth Display</h1>
                            <p className="text-gray-600">Interactive 3D visualization of groundwater aquifers and soil layers</p>
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
                            <button
                                onClick={() => setShowShortcuts(true)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                                title="Show keyboard shortcuts (H)"
                            >
                                <FiInfo className="w-3 h-3" />
                                Help
                            </button>
                        </div>
                    </div>
                </div>

                {/* Data Source Information */}
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
                </div>
                
                {/* Enhanced Information Panel */}
                {enhancedSoilLayers.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {/* Top Row - Soil and Aquifer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {/* Soil Type Card */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200/50 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-green-500 to-emerald-600"></div>
                                        <span className="text-xs font-semibold text-green-800">Soil Type</span>
                                    </div>
                                </div>
                                <div className="mt-1 flex items-center gap-1.5">
                                    {enhancedSoilLayers.map((layer, index) => (
                                        <div key={index} className="flex items-center gap-1">
                                            <div 
                                                className="w-3 h-3 rounded-full border border-white shadow-sm"
                                                style={{ backgroundColor: layer.color }}
                                            ></div>
                                            <span className="text-xs font-medium text-green-700">{layer.name}</span>
                                            <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">{layer.texture}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Aquifer Type Card */}
                            {data && data.aquifers[0] && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200/50 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600"></div>
                                            <span className="text-xs font-semibold text-blue-800">Aquifer Type</span>
                                        </div>
                                    </div>
                                    <div className="mt-1">
                                        <span className="text-xs font-medium text-blue-700">{data.aquifers[0].aquifer_type}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Middle Row - Water Data */}
                        {data && data.aquifers[0] && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {/* Groundwater Level Card */}
                                <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-lg p-3 border border-cyan-200/50 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-cyan-500 to-teal-600"></div>
                                            <span className="text-xs font-semibold text-cyan-800">Groundwater Level</span>
                                        </div>
                                    </div>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <span className="text-sm font-bold text-cyan-700">{data.aquifers[0].water_table.toFixed(1)}m</span>
                                        <span className="text-xs text-cyan-600 bg-cyan-100 px-1.5 py-0.5 rounded-full">depth</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bottom Row - Location and Refresh */}
                        {data && (
                            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg p-3 border border-slate-200/50 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600"></div>
                                            <span className="text-xs font-semibold text-slate-800">Location</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-medium text-slate-700">{data.location.name}</span>
                                            <span className="text-xs text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-full">{new Date(data.timestamp).toLocaleDateString()}</span>
                                            {/* Refresh Button beside last updated */}
                                            <button
                                                onClick={() => {
                                                    setIsLoading(true);
                                                    setError(null);
                                                    setData(null);
                                                    
                                                    // Fetch enhanced groundwater data from Indian APIs
                                                    const fetchEnhancedData = async () => {
                                                        try {
                                                            const response = await fetch(`/api/groundwater/info?lat=${lat}&lon=${lon}`);
                                                            if (!response.ok) {
                                                                throw new Error('Failed to fetch groundwater data');
                                                            }
                                                            const apiData = await response.json();
                                                            
                                                            // Transform API data to match expected format
                                                            const transformedData: AquiferData = {
                                                                location: {
                                                                    name: apiData.location,
                                                                    lat: lat,
                                                                    lon: lon
                                                                },
                                                                data_source: 'India WRIS (Primary)',
                                                                aquifers: [{
                                                                    id: `${lat},${lon}`,
                                                                    name: apiData.location,
                                                                    depth_from: 0,
                                                                    depth_to: 80,
                                                                    aquifer_type: apiData.aquifer_type,
                                                                    water_table: apiData.groundwater_level_m,
                                                                    color: getDepthColor(apiData.groundwater_level_m),
                                                                    borewells_connected: apiData.borewells_connected
                                                                }],
                                                                timestamp: apiData.last_updated
                                                            };
                                                            
                                                            setData(transformedData);
                                                            setError(null);
                                                        } catch (err) {
                                                            console.error('Error fetching groundwater data:', err);
                                                            setError('Failed to fetch groundwater data');
                                                        } finally {
                                                            setIsLoading(false);
                                                        }
                                                    };
                                                    
                                                    fetchEnhancedData();
                                                }}
                                                disabled={isLoading}
                                                className={`p-1 rounded-md transition-all duration-200 ${
                                                    isLoading 
                                                        ? 'bg-slate-200 cursor-not-allowed' 
                                                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 shadow-sm hover:shadow-md'
                                                }`}
                                                title="Fetch fresh data from API"
                                            >
                                                <svg 
                                                    className={`w-3 h-3 ${isLoading ? 'animate-spin text-slate-400' : 'text-white'}`} 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round" 
                                                        strokeWidth={2} 
                                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="small">Small (0.5m)</option>
                                    <option value="medium">Medium (1.0m)</option>
                                    <option value="large">Large (1.5m)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600 block mb-1">Depth: {visualizationConfig.shaft.depth_m}m</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={visualizationConfig.shaft.depth_m}
                                    onChange={(e) => setVisualizationConfig(prev => ({
                                        ...prev,
                                        shaft: { ...prev.shaft, depth_m: parseInt(e.target.value) }
                                    }))}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Performance Settings */}
                    <div className="bg-gray-50 rounded-2xl p-4 shadow-inner border">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FiSettings className="text-green-600" />
                            Performance
                        </h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={performanceSettings.enablePerformanceMode}
                                    onChange={(e) => setPerformanceSettings(prev => ({
                                        ...prev,
                                        enablePerformanceMode: e.target.checked
                                    }))}
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-600">Performance Mode</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={performanceSettings.enableLOD}
                                    onChange={(e) => setPerformanceSettings(prev => ({
                                        ...prev,
                                        enableLOD: e.target.checked
                                    }))}
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-600">Level of Detail</span>
                            </label>
                        </div>
                    </div>

                    {/* Information Panel */}
                    <div className="bg-gray-50 rounded-2xl p-4 shadow-inner border">
                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FiInfo className="text-purple-600" />
                            Information
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Location:</span>
                                <span className="font-medium">{data?.location.name || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Water Level:</span>
                                <span className="font-medium">{waterLevel.toFixed(1)}m</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Mode:</span>
                                <span className={useFallback ? "text-yellow-600" : "text-green-600"}>
                                    {useFallback ? "2D Fallback" : "3D WebGL"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Keyboard Shortcuts Help Panel */}
                {showShortcuts && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">Keyboard Shortcuts</h2>
                                <button
                                    onClick={() => setShowShortcuts(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Animation Controls */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-blue-600 border-b border-blue-200 pb-2">Animation Controls</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Play/Pause</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Space</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Play/Pause (Alt)</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">P</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Reset Animation</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">R</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Stop Animation</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">S</kbd>
                                        </div>
                                    </div>
                                </div>

                                {/* View Controls */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-green-600 border-b border-green-200 pb-2">View Controls</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Toggle 2D/3D</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">F</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Toggle View (Alt)</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">T</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Show/Hide Help</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">H</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Close Help</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Esc</kbd>
                                        </div>
                                    </div>
                                </div>

                                {/* Water Level Controls */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-cyan-600 border-b border-cyan-200 pb-2">Water Level</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Increase Level</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">↑</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Decrease Level</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">↓</kbd>
                                        </div>
                                    </div>
                                </div>

                                {/* Animation Timeline */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-purple-600 border-b border-purple-200 pb-2">Timeline</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Rewind</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">←</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Fast Forward</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">→</kbd>
                                        </div>
                                    </div>
                                </div>

                                {/* Shaft Size Controls */}
                                <div className="space-y-4 md:col-span-2">
                                    <h3 className="text-lg font-semibold text-orange-600 border-b border-orange-200 pb-2">Shaft Size</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Small</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">1</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Medium</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">2</kbd>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700">Large</span>
                                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">3</kbd>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>Tip:</strong> Press <kbd className="px-1 py-0.5 bg-blue-200 rounded text-xs">H</kbd> anytime to toggle this help panel.
                                    All shortcuts work when the page is focused and you're not typing in input fields.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default VisualAquiferDepthDisplay;