import React from 'react';
import { useTheme } from './ThemeProvider';
import { motion } from 'framer-motion';
import { FiSun, FiMoon, FiMonitor } from 'react-icons/fi';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, setTheme, isDark, resolvedTheme } = useTheme();
  const nextMode = (mode: 'light'|'dark'|'system'): 'light'|'dark'|'system' => {
    if (mode === 'light') return 'dark';
    if (mode === 'dark') return 'system';
    return 'light';
  };
  const iconFor = (mode: 'light'|'dark'|'system') => {
    if (mode === 'light') return <FiSun className="w-5 h-5" />;
    if (mode === 'dark') return <FiMoon className="w-5 h-5" />;
    return <FiMonitor className="w-5 h-5" />;
  };

  return (
    <motion.button
      onClick={() => setTheme(nextMode(theme))}
      className={`p-2.5 rounded-xl transition-all duration-300 ${
        isDark 
          ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 border-slate-700/50' 
          : 'bg-white text-black border-slate-300 hover:bg-slate-50'
      } backdrop-blur-sm border shadow-soft hover:shadow-medium ${className}`}
      title={`Theme: ${theme} (click to switch)`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Theme: ${theme} (click to switch)`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: 0, opacity: 0, scale: 0.9 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {iconFor(theme)}
      </motion.div>
    </motion.button>
  );
};

export default ThemeToggle;