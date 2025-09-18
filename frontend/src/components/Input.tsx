import React, { forwardRef } from 'react';
import { useTheme } from './ThemeProvider';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'outline';
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    label,
    helperText,
    error,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    variant = 'default',
    className = '',
    disabled,
    ...props
  },
  ref
) => {
  const { colors, isDark } = useTheme();
  
  // Get variant styles based on theme
  const getVariantClasses = () => {
    const baseClasses = 'rounded-lg px-4 py-2.5 text-sm transition-all duration-200 focus:ring-2 focus:ring-offset-0';
    
    switch (variant) {
      case 'default':
        return isDark 
          ? `${baseClasses} bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-blue-500/20` 
          : `${baseClasses} bg-white border border-slate-300 focus:border-blue-500 focus:ring-blue-500/20`;
      case 'filled':
        return isDark 
          ? `${baseClasses} bg-slate-700 border-transparent focus:bg-slate-800 focus:ring-blue-500/20` 
          : `${baseClasses} bg-slate-100 border-transparent focus:bg-white focus:ring-blue-500/20`;
      case 'outline':
        return isDark 
          ? `${baseClasses} bg-transparent border-2 border-slate-700 focus:border-blue-500 focus:ring-blue-500/20` 
          : `${baseClasses} bg-transparent border-2 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20`;
      default:
        return isDark 
          ? `${baseClasses} bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-blue-500/20` 
          : `${baseClasses} bg-white border border-slate-300 focus:border-blue-500 focus:ring-blue-500/20`;
    }
  };
  
  // Disabled styles
  const disabledClasses = 'opacity-60 cursor-not-allowed';
  
  // Error styles
  const errorClasses = isDark 
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
    : 'border-red-500 focus:border-red-500 focus:ring-red-500/20';
  
  // Text color based on theme
  const textColor = isDark ? 'text-white' : 'text-slate-900';
  const labelColor = isDark ? 'text-slate-300' : 'text-slate-700';
  const helperTextColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const errorColor = 'text-red-500';
  
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        
        <input
          ref={ref}
          className={`
            ${getVariantClasses()}
            ${error ? errorClasses : ''}
            ${disabled ? disabledClasses : ''}
            ${icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${textColor}
            ${fullWidth ? 'w-full' : ''}
          `}
          disabled={disabled}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
      </div>
      
      {(helperText || error) && (
        <p className={`mt-1.5 text-xs ${error ? errorColor : helperTextColor}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;