import React from 'react';
import { useTheme } from './ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const { colors, isDark } = useTheme();
  
  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  // Get variant styles based on theme
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return `bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-600/30`;
      case 'secondary':
        return `bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-600/30`;
      case 'outline':
        return `border-2 ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-300 hover:bg-gray-100'} bg-transparent`;
      case 'ghost':
        return `bg-transparent hover:bg-opacity-10 ${isDark ? 'hover:bg-white' : 'hover:bg-black'}`;
      case 'danger':
        return `bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-600/30`;
      default:
        return `bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-600/30`;
    }
  };
  
  // Disabled styles
  const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';
  
  // Loading spinner
  const LoadingSpinner = () => (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
  
  return (
    <button
      className={`
        relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200
        ${sizeClasses[size]}
        ${getVariantClasses()}
        ${disabled || isLoading ? disabledClasses : ''}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner />}
      {icon && iconPosition === 'left' && !isLoading && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
};

export default Button;