import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';

interface TickerItem {
  id: string;
  text: string;
  emoji?: string;
  type: 'success' | 'info' | 'warning' | 'achievement';
}

interface TickerProps {
  items?: TickerItem[];
  className?: string;
  label?: string;
}

const defaultItems: TickerItem[] = [
  { id: '1', text: 'Welcome to RTRWH! Start your water assessment journey', emoji: '💧', type: 'info' },
  { id: '2', text: 'New user registered: Sarah from Mumbai', emoji: '👋', type: 'success' },
  { id: '3', text: 'Assessment completed: 1,247 water sources analyzed', emoji: '📊', type: 'achievement' },
  { id: '4', text: 'Rainfall prediction accuracy: 94.2%', emoji: '🌧️', type: 'success' },
  { id: '5', text: 'Water saved this month: 2.3M liters', emoji: '💚', type: 'achievement' },
  { id: '6', text: 'New groundwater data available for 15 districts', emoji: '🗺️', type: 'info' },
  { id: '7', text: 'Gamification milestone: 50 users reached Level 5', emoji: '🏆', type: 'achievement' },
  { id: '8', text: 'System maintenance scheduled for tonight at 2 AM', emoji: '🔧', type: 'warning' },
];

const Ticker: React.FC<TickerProps> = ({ items = defaultItems, className = '', label = 'Live Updates' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [interval, setInterval] = useState(500); // Start fast
  const { isDark } = useTheme();
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused || items.length === 0) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
      setCycles((prev) => prev + 1);
      
      // After 3 cycles, slow down to 15 seconds
      if (cycles >= 2) {
        setInterval(15000);
      }
    }, interval);

    return () => clearTimeout(timer);
  }, [currentIndex, isPaused, items.length, interval, cycles]);

  const currentItem = items[currentIndex];

  const getTypeStyles = (type: TickerItem['type']) => {
    const baseStyles = 'px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border';
    
    switch (type) {
      case 'success':
        return `${baseStyles} ${
          isDark 
            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
            : 'bg-green-50 text-green-700 border-green-200'
        }`;
      case 'warning':
        return `${baseStyles} ${
          isDark 
            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
        }`;
      case 'achievement':
        return `${baseStyles} ${
          isDark 
            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' 
            : 'bg-purple-50 text-purple-700 border-purple-200'
        }`;
      default: // info
        return `${baseStyles} ${
          isDark 
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`;
    }
  };

  return (
    <div 
      ref={tickerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      role="marquee"
      aria-live="polite"
      aria-label="Live updates and notifications"
    >
      <div className="flex items-center gap-2">
        <motion.div
          className="flex items-center gap-2"
          animate={{ x: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-lg">📢</span>
          <span className={`text-xs font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {label}
          </span>
        </motion.div>
        
        <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
        
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={getTypeStyles(currentItem.type)}
            >
              <div className="flex items-center gap-2">
                {currentItem.emoji && (
                  <motion.span
                    className="text-base"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.5 }}
                  >
                    {currentItem.emoji}
                  </motion.span>
                )}
                <span className="truncate">{currentItem.text}</span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-1">
          {items.map((_, index) => (
            <motion.div
              key={index}
              className={`w-1.5 h-1.5 rounded-full ${
                index === currentIndex
                  ? isDark ? 'bg-blue-400' : 'bg-blue-600'
                  : isDark ? 'bg-slate-600' : 'bg-slate-300'
              }`}
              animate={{
                scale: index === currentIndex ? [1, 1.2, 1] : 1,
                opacity: index === currentIndex ? 1 : 0.5,
              }}
              transition={{ duration: 0.5, repeat: index === currentIndex ? Infinity : 0 }}
            />
          ))}
        </div>
      </div>
      
      {/* Pause indicator */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            className={`absolute inset-0 flex items-center justify-center ${
              isDark ? 'bg-slate-800/80' : 'bg-white/80'
            } backdrop-blur-sm rounded-lg`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex items-center gap-2 text-sm font-medium"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <span>⏸️</span>
              <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                Paused
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Ticker;
