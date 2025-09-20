import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';

interface SimpleGroundwaterAnimationProps {
  waterLevel?: number;
  className?: string;
}

const SimpleGroundwaterAnimation: React.FC<SimpleGroundwaterAnimationProps> = ({ 
  waterLevel = 12.5, 
  className = '' 
}) => {
  const { isDark } = useTheme();
  const [animationTime, setAnimationTime] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const animate = () => {
      setAnimationTime(prev => prev + 0.02);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Calculate water level position (inverted - higher water level = lower position)
  const waterLevelPercent = Math.max(0, Math.min(100, (waterLevel / 30) * 100));
  const waterTop = 100 - waterLevelPercent;

  return (
    <div className={`relative w-full h-48 overflow-hidden rounded-lg ${className}`}>
      {/* Ground Surface */}
      <div className={`absolute top-0 left-0 right-0 h-4 ${
        isDark ? 'bg-amber-800' : 'bg-amber-600'
      }`} />
      
      {/* Soil Layers */}
      <div className={`absolute top-4 left-0 right-0 h-16 ${
        isDark ? 'bg-amber-700' : 'bg-amber-500'
      }`} />
      <div className={`absolute top-20 left-0 right-0 h-12 ${
        isDark ? 'bg-amber-600' : 'bg-amber-400'
      }`} />
      <div className={`absolute top-32 left-0 right-0 h-16 ${
        isDark ? 'bg-amber-500' : 'bg-amber-300'
      }`} />
      
      {/* Water Table */}
      <div 
        className={`absolute left-0 right-0 bottom-0 ${
          isDark ? 'bg-blue-600' : 'bg-blue-500'
        }`}
        style={{ 
          height: `${waterLevelPercent}%`,
          background: `linear-gradient(to top, ${
            isDark ? '#1e40af, #3b82f6' : '#2563eb, #3b82f6'
          })`
        }}
      >
        {/* Water Surface Animation */}
        <div className="absolute top-0 left-0 right-0 h-2 overflow-hidden">
          <motion.div
            className={`w-full h-full ${
              isDark ? 'bg-blue-400' : 'bg-blue-300'
            } opacity-60`}
            animate={{
              x: [0, 100, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              background: `linear-gradient(90deg, transparent, ${
                isDark ? '#60a5fa' : '#93c5fd'
              }, transparent)`
            }}
          />
        </div>
        
        {/* Water Droplets Animation */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${
              isDark ? 'bg-blue-300' : 'bg-blue-200'
            } opacity-70`}
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 15}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.7, 0.3, 0.7],
            }}
            transition={{
              duration: 2 + i * 0.2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Borewell Shaft */}
      <div className={`absolute top-0 bottom-0 left-1/2 w-2 -translate-x-1/2 ${
        isDark ? 'bg-gray-600' : 'bg-gray-400'
      }`} />
      
      {/* Water Level Indicator */}
      <div 
        className={`absolute left-0 right-0 h-0.5 ${
          isDark ? 'bg-blue-300' : 'bg-blue-200'
        } border-t-2 border-dashed`}
        style={{ top: `${waterTop}%` }}
      >
        <motion.div
          className={`absolute -top-2 -right-1 w-2 h-2 rounded-full ${
            isDark ? 'bg-blue-300' : 'bg-blue-200'
          }`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      {/* Water Level Text */}
      <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
        isDark 
          ? 'bg-slate-800/80 text-blue-300' 
          : 'bg-white/80 text-blue-600'
      }`}>
        {waterLevel.toFixed(1)}m
      </div>
      
      {/* Groundwater Flow Animation */}
      <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              isDark ? 'bg-blue-400' : 'bg-blue-300'
            } opacity-60`}
            style={{
              left: `${-20 + (animationTime * 50 + i * 20) % 120}%`,
              bottom: `${10 + (i % 2) * 8}px`,
            }}
            animate={{
              x: [0, 100],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
      
      {/* Ripples on Water Surface */}
      <div className="absolute left-0 right-0 overflow-hidden" style={{ top: `${waterTop - 1}%` }}>
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-8 h-8 rounded-full border ${
              isDark ? 'border-blue-300' : 'border-blue-200'
            } opacity-40`}
            style={{
              left: `${20 + i * 30}%`,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
            animate={{
              scale: [0.5, 1.5, 0.5],
              opacity: [0.4, 0.1, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 1,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SimpleGroundwaterAnimation;
