import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiSettings, FiInfo } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../components/ThemeProvider';
import Aquifer3DVisualization from '../components/Aquifer3DVisualization';
import MapPanel from '../components/MapPanel';
import Aquifer2DFallback from '../components/Aquifer2DFallback';
import EnhancedRainwaterSchematic from '../components/EnhancedRainwaterSchematic';
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
    water_table_depth?: number; 
    color: string; 
    aquifer_type: string; 
    borewells_connected: number; 
}

interface AquiferData { 
    location: { name: string; lat: number; lon: number }; 
    timestamp: string; 
    data_source: string; 
    aquifers: Aquifer[];
    metadata?: {
        data_source: string;
        api_endpoint: string;
        confidence: number;
        last_fetched: string;
    };
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
        const apiBase = import.meta.env.VITE_API_BASE || '/api';
        const url = `${apiBase}/groundwater/aquifer-depth?lat=${lat}&lon=${lon}`;
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
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [fetchSuccess, setFetchSuccess] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [dataSource, setDataSource] = useState<string>('Loading...');
    const [enhancedSoilLayers, setEnhancedSoilLayers] = useState<EnhancedSoilLayer[]>([]);
    
    const chartHeight = 500;
    const chartWidth = 200;

    // State for city name
    const [cityName, setCityName] = useState<string>('Loading location...');
    // Store raw CGWB/aggregated API data for detailed display
    const [rawData, setRawData] = useState<GroundwaterData | null>(null);
    const [boreWells, setBoreWells] = useState<Array<{ id: string; lat: number; lon: number; waterLevel: number }>>([]);

    // Function to get city name from coordinates using reverse geocoding
    const getCityNameFromCoords = async (lat: number, lon: number): Promise<string> => {
        try {
            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
            );
            if (!response.ok) throw new Error('Geocoding failed');
            
            const data = await response.json();
            const city = data.city || data.locality || data.principalSubdivision;
            const country = data.countryCode;
            return city && country ? `${city}, ${country}` : 'Current Location';
        } catch (error) {
            console.error('Error fetching city name:', error);
            return 'Current Location';
        }
    };

    // Generate mock borewell locations within a radius (km) from center
    const generateBoreWells = (centerLat: number, centerLon: number, radiusKm: number, count: number) => {
        const points: Array<{ id: string; lat: number; lon: number; waterLevel: number }> = [];
        const earthRadiusKm = 6371;
        for (let i = 0; i < count; i++) {
            const u = Math.random();
            const v = Math.random();
            // Random distance with uniform distribution over circle
            const w = radiusKm * Math.sqrt(u);
            const t = 2 * Math.PI * v;
            const dx = (w / earthRadiusKm) * (180 / Math.PI) * Math.cos(t);
            const dy = (w / earthRadiusKm) * (180 / Math.PI) * Math.sin(t) / Math.cos(centerLat * Math.PI / 180);
            const lat = centerLat + dy;
            const lon = centerLon + dx;
            const waterLevel = Math.max(2, Math.min(60, (rawData?.groundwater.level_m ?? 12) + (Math.random() * 6 - 3)));
            points.push({ id: `${i + 1}`, lat, lon, waterLevel: Number(waterLevel.toFixed(1)) });
        }
        return points;
    };

    // Auto-fetch user's current latitude/longitude (with graceful fallback)
    useEffect(() => {
        let cancelled = false;
        const setIfNotCancelled = async (la: number, lo: number) => {
            if (cancelled) return;
            // Basic sanity clamp to valid ranges
            const clampedLat = Math.max(-90, Math.min(90, la));
            const clampedLon = Math.max(-180, Math.min(180, lo));
            setLat(clampedLat);
            setLon(clampedLon);
            
            // Get city name for the coordinates
            const city = await getCityNameFromCoords(clampedLat, clampedLon);
            if (!cancelled) {
                setCityName(city);
            }
        };

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setIfNotCancelled(pos.coords.latitude, pos.coords.longitude);
                },
                (err) => {
                    console.warn('Geolocation unavailable, using defaults:', err);
                    setIfNotCancelled(22.5, 77.0); // Default to India coordinates
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
            );
        } else {
            setIfNotCancelled(22.5, 77.0); // Default to India coordinates
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
                            water_table_depth: groundwaterData.groundwater.depth_m,
                            color: getDepthColor(groundwaterData.groundwater.level_m),
                            aquifer_type: groundwaterData.aquifer.type,
                            borewells_connected: groundwaterData.aquifer.borewells_connected || 1
                        }],
                        metadata: {
                            data_source: groundwaterData.metadata.data_source,
                            api_endpoint: groundwaterData.metadata.api_endpoint,
                            confidence: groundwaterData.metadata.confidence,
                            last_fetched: groundwaterData.metadata.last_fetched
                        }
                    };
                    
                    setData(aquiferData);
                    setRawData(groundwaterData);
                    
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
                    // Generate borewells within 10km radius
                    setBoreWells(generateBoreWells(lat, lon, 10, 25));
                    
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
                setRawData(null);
                fetchAquiferDepth(lat, lon).then((depth) => {
                    setVisualizationConfig(prev => ({
                        ...prev,
                        groundwater_depth_m: depth
                    }));
                    setWaterLevel(depth);
                });
                
                setDataSource('India WRIS (Fallback)');
                setBoreWells(generateBoreWells(lat, lon, 10, 20));
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
                                Keyboard
                            </button>
                        </div>
                    </div>
                </div>

                {/* Data Source Information */}
                <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-lg border border-indigo-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse shadow-sm"></div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-indigo-800">Data Source:</span>
                                    <span className="text-sm font-bold text-indigo-600">{dataSource}</span>
                                </div>
                                {data && rawData && (
                                    <div className="text-xs text-indigo-500 mt-1">
                                        API: {rawData.metadata.data_source} · Endpoint: {rawData.metadata.api_endpoint} · Confidence: {(rawData.metadata.confidence * 100).toFixed(0)}% · Last fetched: {new Date(rawData.metadata.last_fetched).toLocaleTimeString()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                setIsLoading(true);
                                setError(null);
                                setData(null);
                                try {
                                    setIsFetchingLocation(true);
                                    let newLat = lat;
                                    let newLon = lon;
                                    if ('geolocation' in navigator) {
                                        try {
                                            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                                                navigator.geolocation.getCurrentPosition(resolve, reject, {
                                                    enableHighAccuracy: true,
                                                    timeout: 10000,
                                                    maximumAge: 60000
                                                });
                                            });
                                            newLat = position.coords.latitude;
                                            newLon = position.coords.longitude;
                                            setLat(newLat);
                                            setLon(newLon);
                                            const newCityName = await getCityNameFromCoords(newLat, newLon);
                                            setCityName(newCityName);
                                        } catch {}
                                    }
                                    setIsFetchingLocation(false);

                                    const apiResponse = await groundwaterApi.fetchGroundwaterData(newLat, newLon);
                                    if (!apiResponse.success || !apiResponse.data) throw new Error(apiResponse.error || 'Failed to fetch groundwater data');
                                    const apiData = apiResponse.data;
                                    const transformedData: AquiferData = {
                                        location: { name: apiData.location.name, lat: newLat, lon: newLon },
                                        data_source: apiData.metadata.data_source,
                                        aquifers: [{
                                            id: `${newLat},${newLon}`,
                                            name: `${apiData.aquifer.type} Aquifer`,
                                            depth_from: 0,
                                            depth_to: apiData.aquifer.thickness_m,
                                            aquifer_type: apiData.aquifer.type,
                                            water_table: apiData.groundwater.level_m,
                                            water_table_depth: apiData.groundwater.depth_m,
                                            color: getDepthColor(apiData.groundwater.level_m),
                                            borewells_connected: apiData.aquifer.borewells_connected
                                        }],
                                        timestamp: apiData.groundwater.last_updated,
                                        metadata: {
                                            data_source: apiData.metadata.data_source,
                                            api_endpoint: apiData.metadata.api_endpoint,
                                            confidence: apiData.metadata.confidence,
                                            last_fetched: apiData.metadata.last_fetched
                                        }
                                    };
                                    setData(transformedData);
                                    setRawData(apiData);
                                    setDataSource(`${apiResponse.source} - ${apiData.metadata.data_source} (${(apiData.metadata.confidence * 100).toFixed(0)}% confidence)`);
                                    setFetchSuccess(true);
                                    setTimeout(() => setFetchSuccess(false), 3000);
                                } catch (err) {
                                    setError('Failed to refresh data');
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            className={`p-2 rounded-lg transition-all duration-200 shadow-sm ${
                                isLoading 
                                    ? 'bg-gray-300 cursor-not-allowed shadow-inner' 
                                    : 'bg-gradient-to-br from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 hover:shadow-md active:scale-95 border border-gray-300/50'
                            }`}
                            title="Fetch fresh location and data from API"
                        >
                            <svg 
                                className={`w-4 h-4 ${isLoading ? 'animate-spin text-slate-500' : 'text-gray-700'}`} 
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
                
                

                {/* CGWB Data - Detailed Panel */}
                {rawData && (
                    <div className="mt-6 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Location */}
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-3 border border-slate-200/60 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-slate-500 to-slate-700"></div>
                                    <span className="text-xs font-semibold text-slate-800">Location</span>
                                </div>
                                <div className="text-xs text-slate-700 space-y-0.5">
                                    <div><span className="font-medium">Name:</span> {cityName}</div>
                                    <div><span className="font-medium">Lat/Lon:</span> {rawData.location.lat.toFixed(4)}, {rawData.location.lon.toFixed(4)}</div>
                                    <div><span className="font-medium">State:</span> {rawData.location.state || 'N/A'} · <span className="font-medium">District:</span> {rawData.location.district || 'N/A'}</div>
                                    <div><span className="font-medium">Country:</span> {rawData.location.country}</div>
                                </div>
                            </div>

                            {/* Groundwater */}
                            <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-lg p-3 border border-sky-200/60 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-sky-500 to-cyan-600"></div>
                                    <span className="text-xs font-semibold text-sky-800">Groundwater</span>
                                </div>
                                <div className="text-xs text-sky-800 space-y-0.5">
                                    <div><span className="font-medium">Level:</span> {rawData.groundwater.level_m.toFixed(1)} m</div>
                                    <div><span className="font-medium">Water Table Depth:</span> {rawData.groundwater.depth_m.toFixed(1)} m</div>
                                    <div><span className="font-medium">Quality:</span> {rawData.groundwater.quality}</div>
                                    <div><span className="font-medium">Last Updated:</span> {new Date(rawData.groundwater.last_updated).toLocaleString()}</div>
                                    <div><span className="font-medium">Source:</span> {rawData.groundwater.source}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Aquifer */}
                            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg p-3 border border-violet-200/60 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-violet-500 to-purple-600"></div>
                                    <span className="text-xs font-semibold text-violet-800">Aquifer</span>
                                </div>
                                <div className="text-xs text-violet-800 space-y-0.5">
                                    <div><span className="font-medium">Type:</span> {rawData.aquifer.type}</div>
                                    <div><span className="font-medium">Material:</span> {rawData.aquifer.material}</div>
                                    <div><span className="font-medium">Thickness:</span> {rawData.aquifer.thickness_m.toFixed(1)} m</div>
                                    <div><span className="font-medium">Permeability:</span> {rawData.aquifer.permeability}</div>
                                    <div><span className="font-medium">Porosity:</span> {rawData.aquifer.porosity}</div>
                                    <div><span className="font-medium">Recharge Rate:</span> {rawData.aquifer.recharge_rate}</div>
                                    <div><span className="font-medium">Borewells Connected:</span> {rawData.aquifer.borewells_connected}</div>
                                </div>
                            </div>

                            {/* Soil */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200/60 shadow-sm">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm bg-gradient-to-br from-amber-500 to-orange-600"></div>
                                    <span className="text-xs font-semibold text-amber-800">Soil</span>
                                </div>
                                <div className="text-xs text-amber-800 space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: rawData.soil.color }}></div>
                                        <div><span className="font-medium">Type:</span> {rawData.soil.type}</div>
                                    </div>
                                    <div><span className="font-medium">Texture:</span> {rawData.soil.texture}</div>
                                    <div><span className="font-medium">Depth:</span> {rawData.soil.depth_m.toFixed(1)} m</div>
                                    <div><span className="font-medium">Permeability:</span> {rawData.soil.permeability}</div>
                                    <div><span className="font-medium">Water Holding Capacity:</span> {rawData.soil.water_holding_capacity}</div>
                                </div>
                            </div>
                        </div>

                        {/* Metadata panel removed as per request */}
                    </div>
                )}

                {/* Main 3D Visualization (moved to bottom) */}
                <div className="mt-8 mb-12 h-96 rounded-2xl overflow-hidden shadow-lg border relative">
                    {isLoading && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-slate-50/80 backdrop-blur-sm flex items-center justify-center z-10">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                <p className="text-indigo-600 font-medium">
                                    {isFetchingLocation ? 'Getting your current location...' : 'Loading groundwater data from Indian APIs...'}
                                </p>
                                <p className="text-sm text-slate-500 mt-2">
                                    {isFetchingLocation ? 'Please allow location access for accurate data' : 'Trying India WRIS, CGWB, and other sources'}
                                </p>
                            </div>
                        </div>
                    )}
                    {useFallback ? (
                        <EnhancedRainwaterSchematic
                            lat={lat}
                            lon={lon}
                            className="w-full h-full"
                            showControls={true}
                            autoPlay={true}
                            loopDuration={20}
                            dataUpdateInterval={30000}
                            initialData={rawData as any}
                            disableAutoFetch={true}
                        />
                    ) : (
                        <Aquifer3DVisualization
                            config={visualizationConfig}
                            callbacks={visualizationCallbacks}
                            performanceSettings={performanceSettings}
                        />
                    )}
                </div>

                {/* Map Panel - Borewells within 25 km (moved below animation) */}
                <div className="mt-6">
                    <MapPanel
                        lat={lat}
                        lon={lon}
                        boreWells={boreWells}
                        onPickLocation={async (newLat, newLon) => {
                            setLat(newLat);
                            setLon(newLon);
                            const city = await getCityNameFromCoords(newLat, newLon);
                            setCityName(city);
                            setBoreWells(generateBoreWells(newLat, newLon, 10, 25));
                        }}
                        showHeatmap={true}
                    />
                </div>

                {/* Keyboard Shortcuts Help Panel */}
                {showShortcuts && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full overflow-y-auto" style={{maxHeight: '80vh'}}>
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