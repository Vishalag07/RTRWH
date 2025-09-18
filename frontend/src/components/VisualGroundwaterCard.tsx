
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface GroundwaterMetrics {
  waterLevel: number;
  aquiferDepth: number;
  soilMoisture: number;
  rechargeRate: number;
  trend: 'up' | 'down' | 'stable';
}

const VisualGroundwaterCard: React.FC = () => {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<GroundwaterMetrics>({
    waterLevel: 15.2,
    aquiferDepth: 45.8,
    soilMoisture: 68,
    rechargeRate: 2.4,
    trend: 'up'
  });
  const [isHovered, setIsHovered] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        waterLevel: prev.waterLevel + (Math.random() - 0.5) * 0.2,
        soilMoisture: Math.max(0, Math.min(100, prev.soilMoisture + (Math.random() - 0.5) * 2)),
        rechargeRate: Math.max(0, prev.rechargeRate + (Math.random() - 0.5) * 0.1),
        trend: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : prev.trend
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Animation phase cycling
  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 2000);

    return () => clearInterval(phaseInterval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <Link to="/visual-groundwater" className="block">
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 border border-blue-200 p-6 shadow-lg cursor-pointer h-full"
        whileHover={{ 
          scale: 1.02, 
          y: -8,
          boxShadow: "0 20px 40px rgba(59, 130, 246, 0.15)"
        }}
        whileTap={{ scale: 0.98 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated Background Waves */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-200 rounded-full opacity-20"
            animate={{
              x: [0, 20, 0],
              y: [0, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -top-5 -right-5 w-32 h-32 bg-cyan-200 rounded-full opacity-15"
            animate={{
              x: [0, -15, 0],
              y: [0, 15, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="text-3xl"
              animate={{ rotate: isHovered ? 360 : 0 }}
              transition={{ duration: 0.6 }}
            >
              💧
            </motion.div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">
                Visual Groundwater
              </h3>
              <p className="text-sm text-gray-600">
                Real-time Analysis
              </p>
            </div>
          </div>
          <motion.div
            className={`text-lg ${getTrendColor(metrics.trend)}`}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {getTrendIcon(metrics.trend)}
          </motion.div>
        </div>

        {/* Metrics Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-3 mb-4">
          <motion.div
            className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/40"
            whileHover={{ scale: 1.05 }}
            animate={{
              backgroundColor: animationPhase === 0 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.6)"
            }}
          >
            <div className="text-xs text-gray-600 mb-1">Water Level</div>
            <div className="font-bold text-blue-700">
              <motion.span
                key={metrics.waterLevel.toFixed(1)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {metrics.waterLevel.toFixed(1)}m
              </motion.span>
            </div>
          </motion.div>

          <motion.div
            className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/40"
            whileHover={{ scale: 1.05 }}
            animate={{
              backgroundColor: animationPhase === 1 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.6)"
            }}
          >
            <div className="text-xs text-gray-600 mb-1">Aquifer Depth</div>
            <div className="font-bold text-cyan-700">{metrics.aquiferDepth.toFixed(1)}m</div>
          </motion.div>

          <motion.div
            className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/40"
            whileHover={{ scale: 1.05 }}
            animate={{
              backgroundColor: animationPhase === 2 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.6)"
            }}
          >
            <div className="text-xs text-gray-600 mb-1">Soil Moisture</div>
            <div className="font-bold text-teal-700">
              <motion.span
                key={metrics.soilMoisture.toFixed(0)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {metrics.soilMoisture.toFixed(0)}%
              </motion.span>
            </div>
          </motion.div>

          <motion.div
            className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/40"
            whileHover={{ scale: 1.05 }}
            animate={{
              backgroundColor: animationPhase === 3 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.6)"
            }}
          >
            <div className="text-xs text-gray-600 mb-1">Recharge Rate</div>
            <div className="font-bold text-emerald-700">{metrics.rechargeRate.toFixed(1)} L/h</div>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="relative z-10 mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>System Health</span>
            <span>{Math.round((metrics.soilMoisture + metrics.rechargeRate * 10) / 2)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.round((metrics.soilMoisture + metrics.rechargeRate * 10) / 2)}%` 
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Live Indicator */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-xs text-gray-600">Live Data</span>
          </div>
          <motion.div
            className="text-xs text-blue-600 font-medium"
            whileHover={{ scale: 1.1 }}
          >
            View Details →
          </motion.div>
        </div>

        {/* Hover Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>

        {/* Pulse Effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-blue-400"
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0, 0.3, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
    </Link>
  );
};

export default VisualGroundwaterCard;
