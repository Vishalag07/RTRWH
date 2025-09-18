import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color,
  variant = 'spinner',
  text,
  fullScreen = false,
  className = '',
}) => {
  const { colors, isDark } = useTheme();
  
  // Size classes
  const sizeValues = {
    sm: { spinner: 24, dot: 8, text: 'text-sm' },
    md: { spinner: 40, dot: 10, text: 'text-base' },
    lg: { spinner: 60, dot: 12, text: 'text-lg' },
  };
  
  // Default color based on theme
  const defaultColor = color || colors.primary;
  
  // Spinner Variant
  const SpinnerVariant = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      style={{
        width: sizeValues[size].spinner,
        height: sizeValues[size].spinner,
        borderRadius: '50%',
        border: `3px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        borderTopColor: defaultColor,
      }}
      className={className}
    />
  );
  
  // Dots Variant
  const DotsVariant = () => {
    const dotSize = sizeValues[size].dot;
    const containerSize = sizeValues[size].spinner;
    
    return (
      <div 
        style={{ width: containerSize, height: containerSize }}
        className={`flex items-center justify-center space-x-2 ${className}`}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              repeatType: 'loop',
              delay: i * 0.2,
              ease: 'easeInOut'
            }}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              backgroundColor: defaultColor,
            }}
          />
        ))}
      </div>
    );
  };
  
  // Pulse Variant
  const PulseVariant = () => {
    const pulseSize = sizeValues[size].spinner;
    
    return (
      <div className={`relative ${className}`}>
        <motion.div
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.6, 0.2, 0.6]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'easeInOut'
          }}
          style={{
            width: pulseSize,
            height: pulseSize,
            borderRadius: '50%',
            backgroundColor: defaultColor,
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
        <motion.div
          style={{
            width: pulseSize,
            height: pulseSize,
            borderRadius: '50%',
            backgroundColor: defaultColor,
            opacity: 0.8,
          }}
        />
      </div>
    );
  };
  
  // Render the selected variant
  const renderVariant = () => {
    switch (variant) {
      case 'spinner':
        return <SpinnerVariant />;
      case 'dots':
        return <DotsVariant />;
      case 'pulse':
        return <PulseVariant />;
      default:
        return <SpinnerVariant />;
    }
  };
  
  // Full screen wrapper
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-opacity-80 backdrop-blur-sm"
        style={{ backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)' }}
      >
        {renderVariant()}
        {text && (
          <p className={`mt-4 font-medium ${sizeValues[size].text} ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {text}
          </p>
        )}
      </div>
    );
  }
  
  // Regular spinner with optional text
  return (
    <div className="flex flex-col items-center justify-center">
      {renderVariant()}
      {text && (
        <p className={`mt-2 font-medium ${sizeValues[size].text} ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;