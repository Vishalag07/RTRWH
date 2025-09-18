import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiDroplet, FiCalendar, FiMapPin, FiCpu } from 'react-icons/fi';

interface RainfallPredictionProps {
  className?: string;
}

const RainfallPrediction: React.FC<RainfallPredictionProps> = ({ className = '' }) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const rawPredictions = [
    { label: 'Today', rainfall: 15, probability: 60, intensity: 'Light' },
    { label: 'Tomorrow', rainfall: 35, probability: 80, intensity: 'Moderate' },
    { label: 'Day 3', rainfall: 8, probability: 30, intensity: 'Light' },
    { label: 'Day 4', rainfall: 0, probability: 10, intensity: 'None' },
    { label: 'Day 5', rainfall: 22, probability: 45, intensity: 'Light' },
    { label: 'Day 6', rainfall: 45, probability: 75, intensity: 'Heavy' },
    { label: 'Day 7', rainfall: 12, probability: 40, intensity: 'Light' }
  ];

  const dayName = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString(undefined, { weekday: 'short' }); // e.g., Mon, Tue
  };

  const predictions = rawPredictions.map((p, idx) => ({
    date: idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : dayName(idx),
    rainfall: p.rainfall,
    probability: p.probability,
    intensity: p.intensity,
  }));

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'Heavy': return 'text-red-500';
      case 'Moderate': return 'text-yellow-500';
      case 'Light': return 'text-blue-500';
      default: return 'text-slate-400';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'text-green-500';
    if (probability >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getTempColor = (temp: number) => {
    if (temp >= 30) return 'text-red-500';
    if (temp >= 25) return 'text-orange-500';
    if (temp >= 20) return 'text-yellow-500';
    if (temp >= 15) return 'text-blue-500';
    return 'text-blue-600';
  };

  const deriveDayNight = (mm: number, prob: number) => {
    let dayCond = 'Sunny';
    let dayIcon = '☀️';
    let nightCond = prob > 50 ? 'Cloudy' : 'Clear';
    let nightIcon = prob > 50 ? '☁️' : '🌙';
    if (mm >= 40) { dayCond = 'Heavy Rain'; dayIcon = '🌧️'; nightCond = 'Rainy'; nightIcon = '🌧️'; }
    else if (mm >= 15) { dayCond = 'Moderate'; dayIcon = '🌦️'; nightCond = prob > 40 ? 'Cloudy' : 'Light Rain'; nightIcon = prob > 40 ? '☁️' : '🌦️'; }
    else if (mm > 0) { dayCond = 'Light Rain'; dayIcon = '🌦️'; nightCond = prob > 40 ? 'Cloudy' : 'Clear'; nightIcon = prob > 40 ? '☁️' : '🌙'; }
    const dayTemp = Math.max(12, Math.round(30 - Math.min(mm, 24) / 2));
    const nightTemp = Math.max(8, dayTemp - 6);
    return { dayCond, dayIcon, dayTemp, nightCond, nightIcon, nightTemp };
  };

  const getIcon = (mm: number) => (mm > 20 ? '🌧️' : mm > 0 ? '🌦️' : '☀️');

  return (
    <div className={`${className} p-4 rounded-2xl shadow-soft border backdrop-blur-sm ${
      isDark 
        ? 'bg-slate-800/50 border-slate-700/50' 
        : 'bg-white/50 border-slate-200/50'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-lg">🌧️</span>
            </motion.div>
            <div>
              <h3 className={`text-base font-semibold ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                Rainfall Prediction
              </h3>
              <p className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Next 7 days outlook
              </p>
            </div>
          </div>
          <div className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded text-xs border ${
            isDark ? 'text-slate-300 border-slate-600/50 bg-slate-700/30' : 'text-slate-600 border-slate-200 bg-slate-50'
          }`}>
            <FiCalendar className="w-3 h-3" />
            <span>Auto-generated</span>
          </div>
        </div>

        {/* 7-day horizontal tiles */}
        <div className="space-y-2">
          {predictions.map((p, index) => (
            <motion.div
              key={p.date}
              className={`p-3 rounded-xl border transition-all duration-200 ${
                isDark
                  ? 'bg-slate-700/30 border-slate-600/40 hover:bg-slate-700/50'
                  : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Left: date and intensity */}
                <div className="min-w-[80px]">
                  <div className={`text-xs font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{p.date}</div>
                  <div className={`text-[10px] ${getIntensityColor(p.intensity)}`}>{p.intensity}</div>
                </div>

                {/* Divider only (removed emoji after date) */}
                <div className={`hidden sm:block h-6 w-px ${isDark ? 'bg-slate-600/50' : 'bg-slate-200'}`} />
                {/* Right: emoji | condition + colored temp for day / night, then percentage */}
                {(() => {
                  const info = deriveDayNight(p.rainfall, p.probability);
                  return (
                    <div className="ml-auto flex items-center gap-4 text-xs flex-wrap justify-end">
                      <div className={`${isDark ? 'text-slate-200' : 'text-slate-700'} flex items-center gap-2`}>
                        <span>{info.dayIcon}</span>
                        <span className="mx-2">|</span>
                        <span className="truncate">{info.dayCond}</span>
                        <span className={`ml-1 font-semibold ${getTempColor(info.dayTemp)}`}>{info.dayTemp}°C</span>
                        <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'} mx-3`}>/</span>
                        <span>{info.nightIcon}</span>
                        <span className="mx-2">|</span>
                        <span className="truncate">{info.nightCond}</span>
                        <span className={`ml-1 font-semibold ${getTempColor(info.nightTemp)}`}>{info.nightTemp}°C</span>
                      </div>
                      <div className={`hidden sm:block h-5 w-px ${isDark ? 'bg-slate-600/50' : 'bg-slate-200'}`} />
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-3 py-1 rounded-full border ${isDark ? 'border-slate-500/40' : 'border-slate-300'} ${getProbabilityColor(p.probability)}`}>
                          {p.probability}%
                        </span>
                        <span className={`px-3 py-1 rounded-full border ${isDark ? 'border-blue-400/40 text-blue-300' : 'border-blue-300 text-blue-700'}`}>
                          {p.rainfall}mm
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-4">
          <motion.button
            onClick={() => navigate('/predict')}
            className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md ${
              isDark 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <div className="flex items-center justify-center gap-2">
              <FiCpu className="w-4 h-4" />
              <span>AI Rainwater Harvest Prediction</span>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default RainfallPrediction;
