import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'gradient' | 'outline' | 'glass';
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  icon,
  footer,
  className = '',
  hoverEffect = false,
  onClick,
  variant = 'default',
}) => {
  const { colors, isDark } = useTheme();
  
  // Get variant styles based on theme
  const getVariantClasses = () => {
    switch (variant) {
      case 'default':
        return isDark 
          ? 'bg-slate-800 border border-slate-700' 
          : 'bg-white border border-slate-200';
      case 'gradient':
        return 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20';
      case 'outline':
        return isDark 
          ? 'bg-transparent border-2 border-slate-700' 
          : 'bg-transparent border-2 border-slate-300';
      case 'glass':
        return 'bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl';
      default:
        return isDark 
          ? 'bg-slate-800 border border-slate-700' 
          : 'bg-white border border-slate-200';
    }
  };
  
  const cardClasses = `
    rounded-xl p-5 shadow-sm
    ${getVariantClasses()}
    ${hoverEffect ? 'hover:shadow-md transition-all duration-300 transform hover:-translate-y-1' : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;
  
  return (
    <motion.div
      className={cardClasses}
      onClick={onClick}
      whileHover={hoverEffect ? { y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {(title || icon) && (
        <div className="flex items-center mb-4">
          {icon && (
            <div className="mr-3 text-blue-500">
              {icon}
            </div>
          )}
          <div>
            {title && (
              <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      
      <div className={`${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        {children}
      </div>
      
      {footer && (
        <div className={`mt-4 pt-4 ${isDark ? 'border-t border-slate-700' : 'border-t border-slate-200'}`}>
          {footer}
        </div>
      )}
    </motion.div>
  );
};

export default Card;