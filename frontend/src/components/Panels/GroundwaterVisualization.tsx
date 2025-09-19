import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { useLazyLoad } from '../../hooks/useLazyLoad';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { FiEye, FiEyeOff, FiMaximize2, FiMinimize2, FiRefreshCw } from 'react-icons/fi';
import groundwaterApi, { GroundwaterData } from '../../services/groundwaterApi';

interface GroundwaterVisualizationProps {
  className?: string;
}

const GroundwaterVisualization: React.FC<GroundwaterVisualizationProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [groundwaterData, setGroundwaterData] = useState<GroundwaterData | null>(null);
  const [dataSource, setDataSource] = useState<string>('Loading...');
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { elementRef, hasIntersected } = useLazyLoad({ threshold: 0.1 });
  const prefersReducedMotion = useReducedMotion();

  // Get user's current location
  const [userLocation, setUserLocation] = useState({ lat: 22.5, lon: 77.0 });

  // Fetch real-time groundwater data
  const fetchGroundwaterData = async (lat: number, lon: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await groundwaterApi.fetchGroundwaterData(lat, lon);
      
      if (response.success && response.data) {
        setGroundwaterData(response.data);
        setDataSource(`${response.source} (${(response.data.metadata.confidence * 100).toFixed(0)}% confidence)`);
        console.log('Groundwater data loaded:', {
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
      setDataSource('Demo Data (API Unavailable)');
      
      // Fallback to mock data
      setGroundwaterData({
        location: {
          name: 'Demo Location',
          lat,
          lon,
          country: 'India'
        },
        groundwater: {
          level_m: 12.5,
          depth_m: 15.8,
          quality: 'Good',
          last_updated: new Date().toISOString(),
          source: 'Mock Data'
        },
        aquifer: {
          type: 'Unconfined',
          material: 'Alluvial',
          thickness_m: 20.0,
          permeability: 0.001,
          porosity: 0.3,
          recharge_rate: 0.5
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
          data_source: 'Mock Data',
          api_endpoint: 'local',
          confidence: 0.5,
          last_fetched: new Date().toISOString()
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get user's current location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation unavailable, using default location:', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
      );
    }
  }, []);

  // Fetch data when location changes or component mounts
  useEffect(() => {
    if (hasIntersected) {
      fetchGroundwaterData(userLocation.lat, userLocation.lon);
    }
  }, [userLocation.lat, userLocation.lon, hasIntersected]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasIntersected && !isLoading) {
        fetchGroundwaterData(userLocation.lat, userLocation.lon);
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [userLocation.lat, userLocation.lon, hasIntersected, isLoading]);

  useEffect(() => {
    if (!hasIntersected) return; // Only render when component is visible
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawVisualization = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Use light theme colors when in dark mode for better contrast
      const useLightTheme = isDark;
      
      // Draw ground surface
      ctx.fillStyle = useLightTheme ? '#8B7355' : '#8B7355';
      ctx.fillRect(0, 0, width, 20);
      
      // Draw soil layers
      const soilLayers = [
        { color: useLightTheme ? '#A78B5B' : '#A78B5B', height: 30 },
        { color: useLightTheme ? '#C4A484' : '#C4A484', height: 25 },
        { color: useLightTheme ? '#D4C4A8' : '#D4C4A8', height: 20 }
      ];
      
      let yOffset = 20;
      soilLayers.forEach(layer => {
        ctx.fillStyle = layer.color;
        ctx.fillRect(0, yOffset, width, layer.height);
        yOffset += layer.height;
      });
      
      // Draw water table using real data
      const currentLevel = groundwaterData?.groundwater?.level_m || 12.5;
      const waterTableY = 20 + (currentLevel / 100) * (height - 20);
      ctx.fillStyle = useLightTheme ? '#3B82F6' : '#3B82F6';
      ctx.fillRect(0, waterTableY, width, height - waterTableY);
      
      // Draw water level indicator
      ctx.strokeStyle = useLightTheme ? '#1D4ED8' : '#1D4ED8';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, waterTableY);
      ctx.lineTo(width, waterTableY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw borewell shaft
      const shaftX = width / 2;
      ctx.strokeStyle = useLightTheme ? '#9CA3AF' : '#9CA3AF';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(shaftX, 20);
      ctx.lineTo(shaftX, waterTableY);
      ctx.stroke();
      
      // Draw water level text
      ctx.fillStyle = useLightTheme ? '#1F2937' : '#1F2937';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${currentLevel.toFixed(1)}m`, width - 10, waterTableY - 5);
    };

    drawVisualization();
  }, [isDark, groundwaterData?.groundwater?.level_m, hasIntersected]);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-500';
      case 'decreasing': return 'text-red-500';
      case 'stable': return 'text-blue-500';
      default: return 'text-slate-400';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div 
      ref={elementRef}
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
                3D borewell shaft analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => {
                setIsRefreshing(true);
                fetchGroundwaterData(userLocation.lat, userLocation.lon);
                setTimeout(() => setIsRefreshing(false), 1000);
              }}
              disabled={isRefreshing}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDark 
                  ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300' 
                  : 'bg-slate-200/50 hover:bg-slate-300/50 text-slate-600'
              } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              whileHover={{ scale: isRefreshing ? 1 : 1.05 }}
              whileTap={{ scale: isRefreshing ? 1 : 0.95 }}
            >
              <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button
              onClick={() => setIsAnimating(!isAnimating)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDark 
                  ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300' 
                  : 'bg-slate-200/50 hover:bg-slate-300/50 text-slate-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isAnimating ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
            </motion.button>
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDark 
                  ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300' 
                  : 'bg-slate-200/50 hover:bg-slate-300/50 text-slate-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isExpanded ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
            </motion.button>
          </div>
        </div>

        {/* Visualization Canvas */}
        <div className={`relative rounded-xl overflow-hidden mb-4 ${
          isDark 
            ? 'bg-slate-900/50 border border-slate-700/50' 
            : 'bg-slate-100/50 border border-slate-200/50'
        }`}>
          {hasIntersected ? (
            <>
              {/* Light theme image overlay for dark theme */}
              {isDark && (
                <div className="absolute inset-0 z-10 opacity-20">
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 via-cyan-50 to-green-100 rounded-xl" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                width={400}
                height={isExpanded ? 300 : 200}
                className="w-full h-auto relative z-20"
                aria-label="Groundwater visualization showing water table depth and borewell shaft"
              />
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
          
          {/* Overlay Info */}
          <div className="absolute top-4 left-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isDark 
                ? 'bg-slate-800/80 text-slate-200' 
                : 'bg-white/80 text-slate-800'
            }`}>
              Water Level: {groundwaterData?.groundwater?.level_m?.toFixed(1) || '12.5'}m
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
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-slate-700">Loading real-time data...</span>
              </div>
            </div>
          )}
          
          {/* Animation Indicator */}
          {isAnimating && (
            <motion.div
              className="absolute top-4 right-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className={`w-3 h-3 rounded-full ${
                isDark ? 'bg-green-400' : 'bg-green-500'
              }`} />
            </motion.div>
          )}
        </div>

        {/* Data Summary */}
        <div className={`p-4 rounded-xl ${
          isDark 
            ? 'bg-slate-700/30 border border-slate-600/30' 
            : 'bg-slate-100/50 border border-slate-200/50'
        }`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Current Level
              </div>
              <div className={`text-xl font-bold ${
                isDark ? 'text-cyan-400' : 'text-cyan-600'
              }`}>
                {groundwaterData?.groundwater?.level_m?.toFixed(1) || '12.5'}m
              </div>
            </div>
            <div>
              <div className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Depth to Water
              </div>
              <div className={`text-xl font-bold ${
                isDark ? 'text-slate-200' : 'text-slate-800'
              }`}>
                {groundwaterData?.groundwater?.depth_m?.toFixed(1) || '15.8'}m
              </div>
            </div>
            <div>
              <div className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Location
              </div>
              <div className={`text-lg font-semibold ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {groundwaterData?.location?.name || 'Demo Location'}
              </div>
            </div>
            <div>
              <div className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Quality
              </div>
              <div className={`text-lg font-semibold ${getQualityColor(groundwaterData?.groundwater?.quality || 'Good')}`}>
                {groundwaterData?.groundwater?.quality || 'Good'}
              </div>
            </div>
          </div>
          
          {/* Additional Info */}
          {groundwaterData && (
            <div className="mt-4 pt-4 border-t border-slate-300/20">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Aquifer Type:</span>
                  <span className={`ml-2 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {groundwaterData.aquifer?.type || 'Unconfined'}
                  </span>
                </div>
                <div>
                  <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Soil Type:</span>
                  <span className={`ml-2 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {groundwaterData.soil?.type || 'Clay Loam'}
                  </span>
                </div>
                <div>
                  <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Last Updated:</span>
                  <span className={`ml-2 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {new Date(groundwaterData.groundwater?.last_updated || new Date()).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Confidence:</span>
                  <span className={`ml-2 font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {((groundwaterData.metadata?.confidence || 0.5) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Expanded View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="mt-4 space-y-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`p-4 rounded-xl ${
                isDark 
                  ? 'bg-slate-700/20 border border-slate-600/20' 
                  : 'bg-slate-100/30 border border-slate-200/30'
              }`}>
                <h4 className={`font-semibold mb-3 ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  Historical Data
                </h4>
                <div className="space-y-2">
                  {[
                    { period: 'Last 7 days', change: '+2.3m', trend: 'up' },
                    { period: 'Last 30 days', change: '+5.1m', trend: 'up' },
                    { period: 'Last 3 months', change: '-1.2m', trend: 'down' },
                    { period: 'Last year', change: '+8.7m', trend: 'up' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className={`text-sm ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {item.period}
                      </span>
                      <span className={`text-sm font-medium ${
                        item.trend === 'up' 
                          ? 'text-green-500' 
                          : 'text-red-500'
                      }`}>
                        {item.change}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            3D View
          </motion.button>
          <motion.button
            onClick={() => navigate('/dashboard')}
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
