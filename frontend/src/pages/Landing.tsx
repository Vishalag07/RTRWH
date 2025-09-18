
import { Link, useNavigate } from 'react-router-dom';
import { registerPushNotifications } from '../services/pushNotifications';
import { useTranslation } from 'react-i18next';
import CanvasAnimation from '../components/CanvasAnimation';
import Ticker from '../components/Ticker';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../components/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

export function Landing() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  const handleNavigation = (path: string) => navigate(path);

  // Enhanced voice commands with more natural language patterns
  const voiceCommands = {
    // Navigation commands
    [t('voice_commands.navigate_to_assessment')]: () => handleNavigation(isAuthenticated ? '/dashboard/assess' : '/assess'),
    [t('voice_commands.navigate_to_dashboard')]: () => handleNavigation(isAuthenticated ? '/dashboard' : '/auth'),
    [t('voice_commands.login')]: () => handleNavigation('/auth'),
    [t('voice_commands.register')]: () => handleNavigation('/auth?mode=register'),
    [t('voice_commands.predict')]: () => handleNavigation(isAuthenticated ? '/dashboard/predict' : '/predict'),
    [t('voice_commands.chat')]: () => handleNavigation(isAuthenticated ? '/dashboard/chat' : '/chat'),
    
    // Alternative phrasings
    'go to dashboard': () => handleNavigation(isAuthenticated ? '/dashboard' : '/auth'),
    'open dashboard': () => handleNavigation(isAuthenticated ? '/dashboard' : '/auth'),
    'start assessment': () => handleNavigation(isAuthenticated ? '/dashboard/assess' : '/assess'),
    'new assessment': () => handleNavigation(isAuthenticated ? '/dashboard/assess' : '/assess'),
    'sign in': () => handleNavigation('/auth'),
    'log in': () => handleNavigation('/auth'),
    'sign up': () => handleNavigation('/auth?mode=register'),
    'create account': () => handleNavigation('/auth?mode=register'),
    'predict rain': () => handleNavigation(isAuthenticated ? '/dashboard/predict' : '/predict'),
    'weather prediction': () => handleNavigation(isAuthenticated ? '/dashboard/predict' : '/predict'),
    'open chat': () => handleNavigation(isAuthenticated ? '/dashboard/chat' : '/chat'),
    'chatbot': () => handleNavigation(isAuthenticated ? '/dashboard/chat' : '/chat'),
    
    // Utility commands
    'scroll to features': () => {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    },
    'enable notifications': async () => {
      await registerPushNotifications();
      alert(t('notifications.enabled_message'));
    },
    'help': () => {
      const helpMessage = t('voice_assistant.help_message');
      alert(helpMessage);
    }
  };

  // Voice assistant handled globally in navbar

  const handleEnableNotifications = async () => {
    await registerPushNotifications();
    alert(t('notifications.enabled_message'));
  };

  useEffect(() => {
    setIsLoaded(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Smooth-scroll to #about when landing on /#about from any route
  useEffect(() => {
    // Run after initial load animations are ready
    if (typeof window !== 'undefined' && window.location.hash === '#about') {
      // slight delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const aboutEl = document.getElementById('about');
        if (aboutEl) {
          aboutEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      isDark 
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950' 
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
      {/* Advanced Canvas Animation */}
      <CanvasAnimation />

      {/* Ticker */}
      <motion.div 
        className="fixed top-20 left-0 right-0 z-40 px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <Ticker />
      </motion.div>

      <motion.main 
        className={`relative z-10 max-w-7xl mx-auto px-6 py-20 pt-40 ${
          isDark ? 'text-slate-200' : 'text-slate-800'
        }`}
        variants={containerVariants}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh] relative z-10">
          {/* Left Content */}
          <motion.div variants={itemVariants} className="space-y-8 z-10">
            {/* Hero Title */}
            <motion.div className="space-y-4">
              <motion.h1 
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight"
                variants={itemVariants}
              >
                <motion.span 
                  className="block bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ['0%', '100%', '0%']
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    backgroundSize: '200% 200%'
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('landing.title')}
                </motion.span>
              </motion.h1>
              
              <motion.p 
                className={`text-xl leading-relaxed max-w-2xl ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
                variants={itemVariants}
              >
                {t('landing.subtitle')}
              </motion.p>
            </motion.div>
          
          {/* Decorative Accent (replaces removed 3D element) */}
          <motion.div 
            variants={itemVariants}
            className="hidden lg:block"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="h-2 w-40 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/20" />
          </motion.div>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-wrap gap-4"
              variants={itemVariants}
            >
              {isAuthenticated ? (
                <>
                  <motion.button 
                    onClick={() => handleNavigation('/dashboard')}
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-semibold text-lg shadow-xl overflow-hidden"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Go to Dashboard"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-700 to-cyan-700"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="relative z-10 flex items-center gap-2">
                      Go to Dashboard
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </span>
                  </motion.button>

                  <motion.button 
                    onClick={() => handleNavigation('/assess')}
                    className={`group px-8 py-4 border-2 border-blue-600 backdrop-blur-sm rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg ${
                      isDark 
                        ? 'text-blue-400 bg-slate-800/80 hover:bg-slate-700/80' 
                        : 'text-blue-700 bg-white/80 hover:bg-blue-50'
                    }`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Start Assessment"
                  >
                    <span className="flex items-center gap-2">
                      Start Assessment
                      <motion.span
                        className="text-2xl"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        💧
                      </motion.span>
                    </span>
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button 
                    onClick={() => handleNavigation('/auth?mode=register')}
                    className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-semibold text-lg shadow-xl overflow-hidden"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Sign Up"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-700 to-cyan-700"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="relative z-10 flex items-center gap-2">
                      Sign Up
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </span>
                  </motion.button>

                  <motion.button 
                    onClick={() => handleNavigation('/auth?mode=login')}
                    className={`group px-8 py-4 border-2 border-blue-600 backdrop-blur-sm rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg ${
                      isDark 
                        ? 'text-blue-400 bg-slate-800/80 hover:bg-slate-700/80' 
                        : 'text-blue-700 bg-white/80 hover:bg-blue-50'
                    }`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Login"
                  >
                    <span className="flex items-center gap-2">
                      Login
                      <motion.span
                        className="text-2xl"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        🔑
                      </motion.span>
                    </span>
                  </motion.button>
                </>
              )}

              <motion.a 
                href="#features"
                className={`px-8 py-4 backdrop-blur-sm border rounded-2xl font-medium transition-all duration-300 shadow-lg ${
                  isDark 
                    ? 'text-slate-300 bg-slate-800/60 border-slate-600 hover:bg-slate-700/80' 
                    : 'text-slate-700 bg-white/60 border-slate-300 hover:bg-white/80'
                }`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.a>
            </motion.div>

            {/* Stats Cards */}
            <motion.div 
              className="grid grid-cols-3 gap-4"
              variants={itemVariants}
            >
              {[
                { title: t('landing.feature_1_title'), subtitle: t('landing.feature_1_subtitle') },
                { title: t('landing.feature_2_title'), subtitle: t('landing.feature_2_subtitle') },
                { title: t('landing.feature_3_title'), subtitle: t('landing.feature_3_subtitle') }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="relative group"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className={`relative backdrop-blur-sm border rounded-xl p-4 shadow-lg ${
                    isDark 
                      ? 'bg-slate-800/70 border-slate-600/50' 
                      : 'bg-white/70 border-white/50'
                  }`}>
                    <div className="flex items-baseline gap-2">
                      <motion.span 
                        className={`text-2xl font-bold ${
                          isDark ? 'text-slate-100' : 'text-slate-900'
                        }`}
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        {feature.title}
                      </motion.span>
                    </div>
                    <div className={`text-xs mt-1 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>{feature.subtitle}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Visual */}
          <motion.div 
            className="relative"
            variants={itemVariants}
          >
            <motion.div 
              className="relative rounded-3xl overflow-hidden border border-white/50 bg-"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <div className="relative aspect-square flex items-center justify-center p-8">
                <motion.div
                  className="w-64 h-64 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 flex items-center justify-center"
                  variants={floatingVariants}
                  animate="animate"
                >
                  <motion.div
                    className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-300/40 to-cyan-300/40 flex items-center justify-center"
                    variants={floatingVariants}
                    animate="animate"
                    transition={{ delay: 0.5 }}
                  >
                    <motion.div
                      className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-200/50 to-cyan-200/50 flex items-center justify-center"
                      variants={floatingVariants}
                      animate="animate"
                      transition={{ delay: 1 }}
                    >
                      <motion.div
                        className="text-5xl"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      >
                        💧
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div 
          id="features"
          className="mt-32"
          variants={itemVariants}
        >
          <motion.h2 
            className="text-4xl font-bold text-center mb-16"
            variants={itemVariants}
          >
            Features
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Rainfall Prediction',
                description: 'Advanced AI-powered rainfall forecasting with 94% accuracy using satellite data and machine learning algorithms.',
                icon: '🌧️'
              },
              {
                title: 'Groundwater Visualization',
                description: 'Interactive 3D maps showing groundwater levels, aquifer depths, and water quality metrics across different regions.',
                icon: '🗺️'
              },
              {
                title: 'Assessment Engine',
                description: 'Comprehensive water source assessment tools with real-time data collection and automated analysis.',
                icon: '📊'
              },
              {
                title: 'Gamification',
                description: 'Achievement system with badges, leaderboards, and challenges to encourage sustainable water practices.',
                icon: '🏆'
              },
              {
                title: 'Location Mapping',
                description: 'GPS-enabled mapping system for precise location tracking and regional water resource analysis.',
                icon: '📍'
              },
              {
                title: 'Efficiency Metrics',
                description: 'Real-time monitoring of water usage, conservation efforts, and environmental impact measurements.',
                icon: '⚡'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-8 shadow-xl"
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="text-4xl mb-4"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {feature.icon}
                </motion.div>
                <motion.h3 
                  className={`text-xl font-bold mb-2 ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                  variants={itemVariants}
                >
                  {feature.title}
                </motion.h3>
                <motion.p 
                  className={`${
                    isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                  variants={itemVariants}
                >
                  {feature.description}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* About Us Section */}
        <motion.div 
          id="about"
          className="mt-32"
          variants={itemVariants}
        >
          <motion.h2 
            className="text-4xl font-bold text-center mb-16"
            variants={itemVariants}
          >
            About Us
          </motion.h2>
          
          <div className="max-w-4xl mx-auto">
            <motion.div
              className="bg-white/60 backdrop-blur-sm border border-white/50 rounded-2xl p-8 shadow-xl"
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="text-6xl mb-6 text-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                💧
              </motion.div>
              <motion.h3 
                className={`text-2xl font-bold mb-4 text-center ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}
                variants={itemVariants}
              >
                RTRWH - Roof-Top Rainwater Harvesting Assessment Platform
              </motion.h3>
              <motion.p 
                className={`text-lg leading-relaxed mb-6 ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
                variants={itemVariants}
              >
                We are dedicated to revolutionizing water resource management through cutting-edge technology. 
                Our platform combines AI-powered rainfall prediction, comprehensive groundwater analysis, and 
                interactive visualization tools to help communities make informed decisions about water conservation.
              </motion.p>
              <motion.p 
                className={`text-lg leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}
                variants={itemVariants}
              >
                With over 10,000 assessments completed and 2.3 million liters of water saved, we're committed 
                to building a sustainable future through innovative water management solutions.
              </motion.p>
            </motion.div>
          </div>
        </motion.div>

        {/* Voice assistant UI available globally in navbar */}
      </motion.main>
    </div>
  );
}

export default Landing;
