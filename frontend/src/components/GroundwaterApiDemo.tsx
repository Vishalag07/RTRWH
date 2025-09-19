import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiDatabase, FiTrendingUp, FiShield, FiDroplet, FiLayers } from 'react-icons/fi';
import groundwaterApi, { GroundwaterData } from '../services/groundwaterApi';
import { ENHANCED_SOIL_COLORS } from './types.enhanced';

interface GroundwaterApiDemoProps {
  className?: string;
}

const GroundwaterApiDemo: React.FC<GroundwaterApiDemoProps> = ({ className = "" }) => {
  const [lat, setLat] = useState(22.5);
  const [lon, setLon] = useState(77.0);
  const [data, setData] = useState<GroundwaterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await groundwaterApi.fetchGroundwaterData(lat, lon);
      
      if (response.success && response.data) {
        setData(response.data);
        setSource(response.source);
      } else {
        setError(response.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(`Network error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <motion.div 
      className={`bg-white rounded-2xl shadow-lg border p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Enhanced Groundwater Data API Demo</h3>
        <p className="text-gray-600">Test real groundwater data from Indian APIs with enhanced soil colors</p>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
          <input
            type="number"
            value={lat}
            onChange={(e) => setLat(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            step="0.1"
            min="-90"
            max="90"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input
            type="number"
            value={lon}
            onChange={(e) => setLon(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            step="0.1"
            min="-180"
            max="180"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleFetchData}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </>
            ) : (
              <>
                <FiDatabase />
                Fetch Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Location Buttons */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 mb-2">Quick Indian locations:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
            { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
            { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
            { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
            { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
            { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
            { name: 'Pune', lat: 18.5204, lon: 73.8567 },
            { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 }
          ].map((location) => (
            <button
              key={location.name}
              onClick={() => {
                setLat(location.lat);
                setLon(location.lon);
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              {location.name}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div 
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center gap-2 text-red-800">
            <FiShield />
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </motion.div>
      )}

      {/* Data Display */}
      {data && (
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Data Source Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiDatabase className="text-blue-600" />
                <span className="font-medium text-blue-800">Data Source:</span>
                <span className="text-blue-600">{source}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-600">Confidence:</span>
                <span className={`font-medium ${getConfidenceColor(data.metadata.confidence)}`}>
                  {getConfidenceBadge(data.metadata.confidence)} ({(data.metadata.confidence * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Location Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiMapPin />
                Location Information
              </h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {data.location.name}</div>
                <div><span className="font-medium">Coordinates:</span> {data.location.lat.toFixed(4)}, {data.location.lon.toFixed(4)}</div>
                {data.location.state && <div><span className="font-medium">State:</span> {data.location.state}</div>}
                {data.location.district && <div><span className="font-medium">District:</span> {data.location.district}</div>}
                <div><span className="font-medium">Country:</span> {data.location.country}</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiTrendingUp />
                Groundwater Data
              </h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Water Level:</span> {data.groundwater.level_m.toFixed(2)} m</div>
                <div><span className="font-medium">Depth to Water:</span> {data.groundwater.depth_m.toFixed(2)} m</div>
                <div><span className="font-medium">Quality:</span> {data.groundwater.quality}</div>
                <div><span className="font-medium">Last Updated:</span> {new Date(data.groundwater.last_updated).toLocaleString()}</div>
                <div><span className="font-medium">Source:</span> {data.groundwater.source}</div>
              </div>
            </div>
          </div>

          {/* Aquifer & Soil Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Aquifer Information</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Type:</span> {data.aquifer.type}</div>
                <div><span className="font-medium">Material:</span> {data.aquifer.material}</div>
                <div><span className="font-medium">Thickness:</span> {data.aquifer.thickness_m.toFixed(2)} m</div>
                <div><span className="font-medium">Permeability:</span> {data.aquifer.permeability.toExponential(2)} m/s</div>
                <div><span className="font-medium">Porosity:</span> {(data.aquifer.porosity * 100).toFixed(1)}%</div>
                <div><span className="font-medium">Recharge Rate:</span> {data.aquifer.recharge_rate.toFixed(2)} m/year</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiLayers />
                Enhanced Soil Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Type:</span>
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: data.soil.color }}
                  ></div>
                  <span>{data.soil.type}</span>
                </div>
                <div><span className="font-medium">Texture:</span> {data.soil.texture}</div>
                <div><span className="font-medium">Depth:</span> {data.soil.depth_m.toFixed(2)} m</div>
                <div><span className="font-medium">Permeability:</span> {data.soil.permeability.toExponential(2)} m/s</div>
                <div><span className="font-medium">Water Holding:</span> {(data.soil.water_holding_capacity * 100).toFixed(1)}%</div>
                <div className="mt-3">
                  <span className="font-medium text-green-700">Enhanced Color Palette:</span>
                  <div className="flex gap-1 mt-1">
                    {Object.entries(ENHANCED_SOIL_COLORS[data.soil.type] || {}).map(([key, color]) => (
                      <div
                        key={key}
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: color as string }}
                        title={`${key}: ${color}`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Data Metadata</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">API Endpoint:</span> {data.metadata.api_endpoint}</div>
              <div><span className="font-medium">Last Fetched:</span> {new Date(data.metadata.last_fetched).toLocaleString()}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">Enhanced Features:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Real-time data from Indian APIs (India WRIS, CGWB, Data Portal)</li>
          <li>• Enhanced soil color palettes with multiple shades</li>
          <li>• Animated soil layers in 3D visualization</li>
          <li>• Confidence scoring for data reliability</li>
          <li>• Fallback to demo data if APIs are unavailable</li>
          <li>• Interactive soil color previews</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default GroundwaterApiDemo;
