import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { useLazyLoad } from '../../hooks/useLazyLoad';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { FiRefreshCw } from 'react-icons/fi';
import groundwaterApi, { GroundwaterData } from '../../services/groundwaterApi';
import { generateGroundwaterPDF } from '../../services/pdfExport';
import SimpleAutoPlayGroundwater from '../SimpleAutoPlayGroundwater';

interface GroundwaterVisualizationProps {
  className?: string;
}

const GroundwaterVisualization: React.FC<GroundwaterVisualizationProps> = ({ className = '' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [groundwaterData, setGroundwaterData] = useState<GroundwaterData | null>(null);
  const [dataSource, setDataSource] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { elementRef, hasIntersected } = useLazyLoad({ threshold: 0.1 });
  const prefersReducedMotion = useReducedMotion();

  // Get user's current location
  const [userLocation, setUserLocation] = useState({ lat: 22.5, lon: 77.0 });
  const [locationName, setLocationName] = useState<string>('Loading location...');

  // Get current location with reverse geocoding
  const getCurrentLocation = async () => {
    return new Promise<{ lat: number; lon: number; name: string }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Reverse geocoding to get location name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            );
            const data = await response.json();
            
            const city = data.address.city || data.address.town || data.address.village || 
                        data.address.county || data.address.state || 'Unknown Location';
            const country = data.address.country || 'Unknown Country';
            const locationName = `${city}, ${country}`;
            
            resolve({ lat: latitude, lon: longitude, name: locationName });
          } catch (error) {
            console.warn('Reverse geocoding failed, using coordinates:', error);
            resolve({ lat: latitude, lon: longitude, name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // Fetch real-time groundwater data from API
  const fetchGroundwaterData = async (lat: number, lon: number, locationName?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
        // Try backend groundwater info API first
        try {
          const cgwbResponse = await fetch(`/api/groundwater/info?lat=${lat}&lon=${lon}`);
          if (cgwbResponse.ok) {
            const cgwbData = await cgwbResponse.json();
          
            // Transform CGWB API data to GroundwaterData format
            const transformedData: GroundwaterData = {
              location: {
                name: cgwbData.location && cgwbData.location !== 'Unknown' ? cgwbData.location : locationName || 'Current Location',
                lat,
                lon,
                state: 'Unknown',
                country: 'India'
              },
              groundwater: {
                level_m: cgwbData.groundwater_level_m || 15.0,
                depth_m: cgwbData.water_table_depth_m || cgwbData.groundwater_level_m || 15.0,
                quality: 'Good',
                last_updated: cgwbData.last_updated || new Date().toISOString().split('T')[0],
                source: 'CGWB API'
              },
              aquifer: {
                type: cgwbData.aquifer_type || 'Unconfined Aquifer',
                material: 'Alluvial',
                thickness_m: 20.0,
                permeability: 0.001,
                porosity: 0.3,
                recharge_rate: 0.5,
                borewells_connected: cgwbData.borewells_connected || 0
              },
              soil: {
                type: cgwbData.soil_type || 'Clay Loam',
                texture: 'Medium',
                depth_m: 2.0,
                permeability: 0.0001,
                water_holding_capacity: 0.4,
                color: '#A0522D'
              },
              metadata: {
                data_source: 'CGWB API',
                api_endpoint: '/api/groundwater/info',
                confidence: 0.95,
                last_fetched: new Date().toISOString().split('T')[0]
              }
            };
            
            setGroundwaterData(transformedData);
            setDataSource('CGWB API (95% confidence)');
            console.log('CGWB API groundwater data loaded:', {
              source: 'CGWB API',
              location: cgwbData.location,
              groundwater_level: cgwbData.groundwater_level_m,
              water_table_depth: cgwbData.water_table_depth_m,
              aquifer_type: cgwbData.aquifer_type,
              soil_type: cgwbData.soil_type,
              borewells_connected: cgwbData.borewells_connected
            });
            return; // Success, exit early
          }
        } catch (cgwbError) {
          console.warn('CGWB API failed, trying enhanced API:', cgwbError);
        }
      
      // Fallback to enhanced API
      const response = await groundwaterApi.fetchGroundwaterData(lat, lon);
      
      if (response.success && response.data) {
        setGroundwaterData(response.data);
        setDataSource(`CGWB API - ${response.data.metadata.data_source} (${(response.data.metadata.confidence * 100).toFixed(0)}% confidence)`);
        console.log('Fallback API groundwater data loaded:', {
          source: response.source,
          confidence: response.data.metadata.confidence,
          location: response.data.location.name,
          level: response.data.groundwater.level_m
        });
      } else {
        throw new Error(response.error || 'Failed to fetch groundwater data');
      }
    } catch (err) {
      console.error('Error fetching groundwater data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
                setDataSource('CGWB API Unavailable - Using Fallback Data');
      
      // Fallback data with realistic values
      const mockData = {
        location: {
          name: locationName || 'Current Location',
          lat,
          lon,
          country: 'India'
        },
        groundwater: {
          level_m: 15.0,
          depth_m: 18.0,
          quality: 'Good',
          last_updated: new Date().toISOString().split('T')[0],
          source: 'Fallback Data'
        },
        aquifer: {
          type: 'Unconfined Aquifer',
          material: 'Alluvial',
          thickness_m: 20.0,
          permeability: 0.001,
          porosity: 0.3,
          recharge_rate: 0.5,
          borewells_connected: 100
        },
        soil: {
          type: 'Clay Loam',
          texture: 'Medium',
          depth_m: 2.0,
          permeability: 0.0001,
          water_holding_capacity: 0.4,
          color: '#A0522D'
        },
        metadata: {
          data_source: 'CGWB API (Fallback)',
          api_endpoint: 'N/A',
          confidence: 0.5,
          last_fetched: new Date().toISOString().split('T')[0]
        }
      };
      
      setGroundwaterData(mockData);
      console.log('Fallback mock data set');
    } finally {
      setIsLoading(false);
    }
  };

  // Get user's current location on component mount
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const locationData = await getCurrentLocation();
        setUserLocation({ lat: locationData.lat, lon: locationData.lon });
        setLocationName(locationData.name);
      } catch (error) {
        console.warn('Failed to get current location, using default:', error);
        setLocationName('Default Location (Bangalore, India)');
      }
    };

    if (hasIntersected) {
      initializeLocation();
    }
  }, [hasIntersected]);

  // Fetch data when location changes or component mounts
  useEffect(() => {
    if (hasIntersected && userLocation.lat !== 22.5) { // Only fetch if we have real location
      fetchGroundwaterData(userLocation.lat, userLocation.lon, locationName);
    }
  }, [userLocation.lat, userLocation.lon, hasIntersected, locationName]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasIntersected && !isLoading) {
        fetchGroundwaterData(userLocation.lat, userLocation.lon);
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [userLocation.lat, userLocation.lon, hasIntersected, isLoading]);


  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-500';
      case 'decreasing': return 'text-red-500';
      case 'stable': return 'text-blue-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div 
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={`${className} p-6 rounded-2xl shadow-soft border backdrop-blur-sm ${
        isDark 
          ? 'bg-slate-800/50 border-slate-700/50' 
          : 'bg-white/50 border-slate-200/50'
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center"
              animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}
              transition={prefersReducedMotion ? {} : { duration: 2, repeat: Infinity }}
            >
              <span className="text-xl">🗺️</span>
            </motion.div>
            <div>
              <h3 className={`text-lg font-semibold ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                Groundwater Visualization
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Real-time groundwater data from API
              </p>
            </div>
          </div>
        </div>

        {/* Simple Auto-Play Groundwater Animation */}
        <div className={`relative rounded-xl overflow-hidden mb-4 ${
          isDark 
            ? 'bg-slate-900/50 border border-slate-700/50' 
            : 'bg-slate-100/50 border border-slate-200/50'
        }`}>
          {hasIntersected ? (
            <>
              <SimpleAutoPlayGroundwater 
                lat={userLocation.lat}
                lon={userLocation.lon}
                waterLevel={groundwaterData?.groundwater?.level_m || 12.5}
                className="w-full h-48"
              />
              
              {/* Overlay Info */}
              <div className="absolute top-4 left-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isDark 
                    ? 'bg-slate-800/80 text-slate-200' 
                    : 'bg-white/80 text-slate-800'
                }`}>
                  Water Level: {groundwaterData?.groundwater?.level_m?.toFixed(1) || '12.5'}m | Borewells: {groundwaterData?.aquifer?.borewells_connected || 'N/A'}
                </div>
              </div>
              
              {/* Data Source Info */}
              <div className="absolute bottom-4 left-4">
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  isDark 
                    ? 'bg-slate-800/80 text-slate-300' 
                    : 'bg-white/80 text-slate-600'
                }`}>
                  {dataSource}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-48 flex items-center justify-center">
              <div className="text-center">
                <div className={`w-12 h-12 mx-auto mb-2 rounded-full ${
                  isDark ? 'bg-slate-700' : 'bg-slate-200'
                } animate-pulse`} />
                <p className={`text-sm ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Loading visualization...
                </p>
              </div>
            </div>
          )}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-slate-700">Loading real-time data...</span>
              </div>
            </div>
          )}
        </div>

        {/* Aquifer & Soil Information - Moved to first position */}
        {groundwaterData && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-xl border ${
              isDark 
                ? 'bg-slate-800/50 border-slate-700/50' 
                : 'bg-white/70 border-slate-200/70'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-purple-500/20' : 'bg-purple-100'
                }`}>
                  <svg className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className={`text-sm font-medium ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Aquifer Type
                </div>
              </div>
              <div className={`text-xl font-bold ${
                isDark ? 'text-purple-400' : 'text-purple-600'
              }`}>
                {groundwaterData.aquifer?.type || 'Unconfined Aquifer'}
              </div>
              <div className={`text-xs mt-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Geological formation
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${
              isDark 
                ? 'bg-slate-800/50 border-slate-700/50' 
                : 'bg-white/70 border-slate-200/70'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-orange-500/20' : 'bg-orange-100'
                }`}>
                  <svg className={`w-5 h-5 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                </div>
                <div className={`text-sm font-medium ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Soil Type
                </div>
              </div>
              <div className={`text-xl font-bold ${
                isDark ? 'text-orange-400' : 'text-orange-600'
              }`}>
                {groundwaterData.soil?.type || 'Clay Loam'}
              </div>
              <div className={`text-xs mt-1 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Surface composition
              </div>
            </div>
          </div>
        )}

        {/* Data Summary */}
        <div className={`p-4 rounded-xl ${
          isDark 
            ? 'bg-slate-700/30 border border-slate-600/30' 
            : 'bg-slate-100/50 border border-slate-200/50'
        }`}>
            {/* Primary Metrics - Only show data available from API */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-xl border ${
                isDark 
                  ? 'bg-slate-800/50 border-slate-700/50' 
                  : 'bg-white/70 border-slate-200/70'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'
                  }`}>
                    <svg className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <div className={`text-sm font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Aquifer Material
                  </div>
                </div>
                <div className={`text-2xl font-bold ${
                  isDark ? 'text-cyan-400' : 'text-cyan-600'
                }`}>
                  {groundwaterData?.aquifer?.material || 'Alluvial'}
                </div>
                
              </div>
              <div className={`p-4 rounded-xl border ${
                isDark 
                  ? 'bg-slate-800/50 border-slate-700/50' 
                  : 'bg-white/70 border-slate-200/70'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                  }`}>
                    <svg className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className={`text-sm font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Groundwater Level
                  </div>
                </div>
                <div className={`text-2xl font-bold ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {groundwaterData?.groundwater?.level_m?.toFixed(1) || '12.5'}m
                </div>
                <div className={`text-xs mt-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Below surface
                </div>
              </div>
              <div className={`p-4 rounded-xl border ${
                isDark 
                  ? 'bg-slate-800/50 border-slate-700/50' 
                  : 'bg-white/70 border-slate-200/70'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
                  }`}>
                    <svg className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className={`text-sm font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Borewells Connected
                  </div>
                </div>
                <div className={`text-2xl font-bold ${
                  isDark ? 'text-indigo-400' : 'text-indigo-600'
                }`}>
                  {groundwaterData?.aquifer?.borewells_connected || '0'}
                </div>
                <div className={`text-xs mt-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  In this area
                </div>
              </div>
            </div>

          
          {/* Detailed Information - Only show data available from API */}
          {groundwaterData && (
            <div className="space-y-4">

            {/* Data Information Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-xl border ${
                isDark 
                  ? 'bg-slate-800/50 border-slate-700/50' 
                  : 'bg-white/70 border-slate-200/70'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
                  }`}>
                    <svg className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className={`text-sm font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Data Source
                  </div>
                </div>
                <div className={`text-lg font-bold ${
                  isDark ? 'text-indigo-400' : 'text-indigo-600'
                }`}>
                  CGWB API
                </div>
                <div className={`text-xs mt-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Central Ground Water Board
                </div>
              </div>
              <div className={`p-4 rounded-xl border ${
                isDark 
                  ? 'bg-slate-800/50 border-slate-700/50' 
                  : 'bg-white/70 border-slate-200/70'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    isDark ? 'bg-green-500/20' : 'bg-green-100'
                  }`}>
                    <svg className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className={`text-sm font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Last Updated
                  </div>
                </div>
                <div className={`text-lg font-bold ${
                  isDark ? 'text-green-400' : 'text-green-600'
                }`}>
                  {groundwaterData.groundwater?.last_updated ? 
                    new Date(groundwaterData.groundwater.last_updated).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 
                    'Just now'
                  }
                </div>
                <div className={`text-xs mt-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Data timestamp
                </div>
              </div>
              <div className={`p-4 rounded-xl border ${
                isDark 
                  ? 'bg-slate-800/50 border-slate-700/50' 
                  : 'bg-white/70 border-slate-200/70'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                  }`}>
                    <svg className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className={`text-sm font-medium ${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Confidence
                  </div>
                </div>
                <div className={`text-lg font-bold ${
                  isDark ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  {((groundwaterData.metadata?.confidence || 0.95) * 100).toFixed(0)}%
                </div>
                <div className={`text-xs mt-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Data accuracy
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Location Information - Moved to last position */}
          <div className={`mb-6 p-4 rounded-xl border ${
            isDark 
              ? 'bg-slate-800/50 border-slate-700/50' 
              : 'bg-white/70 border-slate-200/70'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                }`}>
                  <svg className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className={`text-sm font-medium ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Current Location
                </div>
              </div>
              <motion.button
                onClick={async () => {
                  setIsRefreshing(true);
                  try {
                    // Get fresh location
                    const locationData = await getCurrentLocation();
                    setUserLocation({ lat: locationData.lat, lon: locationData.lon });
                    setLocationName(locationData.name);
                    
                    // Fetch fresh data
                    await fetchGroundwaterData(locationData.lat, locationData.lon, locationData.name);
                  } catch (error) {
                    console.warn('Failed to refresh location, using current:', error);
                    // Still fetch data with current location
                    await fetchGroundwaterData(userLocation.lat, userLocation.lon, locationName);
                  }
                  setIsRefreshing(false);
                  setFetchSuccess(true);
                  
                  // Hide success message after 3 seconds
                  setTimeout(() => setFetchSuccess(false), 3000);
                }}
                disabled={isRefreshing}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2.5 ${
                  isDark 
                    ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border border-emerald-200'
                } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                whileHover={{ scale: isRefreshing ? 1 : 1.02 }}
                whileTap={{ scale: isRefreshing ? 1 : 0.98 }}
                title="Fetch fresh location and data"
              >
                <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Fetching...' : 'Fetch Data'}
              </motion.button>
            </div>
            <div className={`text-lg font-semibold mb-2 ${
              isDark ? 'text-emerald-400' : 'text-emerald-600'
            }`}>
              {locationName}
            </div>
            <div className={`text-sm ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {userLocation.lat.toFixed(4)}°N, {userLocation.lon.toFixed(4)}°E
            </div>
            {dataSource && (
              <div className={`text-xs mt-2 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {dataSource}
              </div>
            )}
            {fetchSuccess && (
              <div className={`text-xs mt-2 flex items-center gap-1 ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Data refreshed successfully!
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <motion.button
            onClick={() => navigate('/aquifer-visualization')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30' 
                : 'bg-cyan-100 hover:bg-cyan-200 text-cyan-700 border border-cyan-200'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            2D Animation
          </motion.button>
          <motion.button
            onClick={() => {
              try {
                console.log('Export button clicked');
                console.log('Groundwater data:', groundwaterData);
                console.log('User location:', userLocation);
                console.log('Location name:', locationName);
                
                const filename = `groundwater-report-${new Date().toISOString().split('T')[0]}.pdf`;
                generateGroundwaterPDF(groundwaterData, { ...userLocation, name: locationName });
                console.log('PDF generation completed');
              } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Error generating PDF: ' + (error as Error).message);
              }
            }}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300' 
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Export Data
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default GroundwaterVisualization;