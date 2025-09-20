
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../components/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { FiDroplet, FiCloudRain, FiMap, FiTarget, FiBarChart, FiAlertTriangle, FiInfo, FiTrendingUp, FiAward, FiCheckCircle } from 'react-icons/fi';
import Ticker from '../components/Ticker';
import WeatherWidget from '../components/WeatherWidget';
import StartAssessmentPanel from '../components/StartAssessmentPanel';
import RainfallPrediction from '../components/Panels/RainfallPrediction';
import GroundwaterVisualization from '../components/Panels/GroundwaterVisualization';
// Removed Results panel per requirement
import Gamification from '../components/Panels/Gamification';
import StatCards from '../components/StatCards';

function Dashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [weatherData, setWeatherData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Sample alerts and tips data
  const sampleAlerts = [
    {
      id: 1,
      type: 'warning',
      title: 'High Rainfall Expected',
      message: 'Heavy rainfall predicted for tomorrow. Consider adjusting your water collection strategy.',
      icon: FiAlertTriangle,
      emoji: '⚠️',
      time: '2 hours ago'
    },
    {
      id: 2,
      type: 'info',
      title: 'Water Conservation Tip',
      message: 'Did you know? Installing a rain barrel can save up to 1,300 gallons of water during peak summer months.',
      icon: FiInfo,
      emoji: '💡',
      time: '1 day ago'
    },
    {
      id: 3,
      type: 'success',
      title: 'Assessment Complete',
      message: 'Your latest water assessment shows 15% improvement in collection efficiency.',
      icon: FiCheckCircle,
      emoji: '✅',
      time: '3 days ago'
    },
    {
      id: 4,
      type: 'info',
      title: 'New Groundwater Data',
      message: 'Updated groundwater levels available for your region. Check the latest readings.',
      icon: FiMap,
      emoji: '🗺️',
      time: '4 hours ago'
    },
    {
      id: 5,
      type: 'success',
      title: 'Water Saved Today',
      message: 'Great job! You saved 45 liters of water today through efficient collection.',
      icon: FiDroplet,
      emoji: '💧',
      time: '6 hours ago'
    }
  ];

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Using shared Ticker component's interval behavior (matches home page)

  // Authentication is now handled by DashboardLayout

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark 
          ? 'bg-slate-900' 
          : 'bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50'
      }`}>
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p
            className={`text-lg font-medium ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Loading Dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 pt-24">
        {/* Alerts Ticker (no panel) - above greeting */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Ticker 
            label="Alerts"
            items={sampleAlerts.map(a => ({
              id: String(a.id),
              text: a.title,
              emoji: a.emoji,
              type: a.type as 'success' | 'info' | 'warning' | 'achievement'
            }))}
          />
        </motion.div>

        {/* Welcome Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h1 className={`text-4xl font-bold mb-3`}>
            {(() => {
              const hour = new Date().getHours();
              const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
              return (
                <>
                  <span className={`bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600`}>
                    {greeting}, {user?.name || 'User'}!
                  </span>
                  <motion.span
                    className="inline-block ml-2 select-none"
                    style={{ transformOrigin: '70% 70%' }}
                    animate={{ rotate: [0, 20, -10, 12, -5, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
                  >
                    👋
                  </motion.span>
                </>
              );
            })()}
          </h1>
          <p className={`text-lg max-w-2xl ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Monitor your water assessment progress and explore new insights
          </p>
        </motion.div>

        {/* Alerts panel removed; ticker moved above greeting */}

        {/* Stats Cards */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <StatCards />
        </motion.div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Content (3/5 width) */}
          <div className="lg:col-span-3 space-y-8">
            {/* Start Assessment Panel on left (primary) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="transform md:scale-[1.02] lg:scale-[1.04] origin-top">
                <StartAssessmentPanel />
              </div>
            </motion.div>

            {/* Rainfall Prediction - full width under Start Assessment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <RainfallPrediction />
            </motion.div>

            {/* Groundwater Visualization - under Rainfall Prediction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <GroundwaterVisualization />
            </motion.div>

            {/* Achievements section removed - moved to right side */}

            {/* Alerts section moved to top, duplicate removed */}
          </div>

          {/* Right Column - Weather Forecast Focus (2/5 width) */}
          <div className="lg:col-span-2">
            <motion.div
              className="sticky top-24 space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Emphasized Weather Forecast Panel (wider, taller) */}
              <div className={`rounded-2xl border backdrop-blur-sm ${
                isDark 
                  ? 'bg-slate-800/50 border-slate-700/50' 
                  : 'bg-white/60 border-slate-200/50'
              } shadow-xl p-0 overflow-hidden max-h-[700px] max-w-[700px] w-full ml-auto`}
              >
                <WeatherWidget />
              </div>
              {/* Spacer under weather for visual balance */}
              <div className="h-1" />
              
              {/* Heatmap Analysis Panel (expanded to use remaining space) */}
              <div className={`rounded-2xl border backdrop-blur-sm ${
                isDark 
                  ? 'bg-slate-800/50 border-slate-700/50' 
                  : 'bg-white/60 border-slate-200/50'
              } shadow-xl p-6 w-full`}
                style={{ minHeight: '260px' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-xl">🗺️</span>
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      Heatmap Analysis
                    </h3>
                    <p className={`text-sm ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      Groundwater depth visualization
                    </p>
                  </div>
                </div>
                
                <div className={`text-sm mb-5 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  <p className="mb-2">
                    Analyze groundwater depth patterns across your region using interactive heatmaps. 
                    Visualize water table variations and identify optimal locations for water collection.
                  </p>
                  <p className="text-xs opacity-75">
                    Get insights into seasonal changes, depth trends, and regional water availability.
                  </p>
                </div>

                <motion.button
                  onClick={() => navigate('/heatmapanalysis')}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isDark 
                      ? 'bg-gradient-to-r from-purple-200/80 to-pink-200/80 hover:from-purple-300/90 hover:to-pink-300/90 text-purple-900' 
                      : 'bg-gradient-to-r from-purple-100/80 to-pink-100/80 hover:from-purple-200/90 hover:to-pink-200/90 text-purple-800'
                  } shadow-lg`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FiMap className="w-4 h-4" />
                    Analyze Heatmap
                  </div>
                </motion.button>
              </div>
              
              
              {/* Gamification Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Gamification />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
