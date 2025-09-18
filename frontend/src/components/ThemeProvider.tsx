import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  resolvedTheme: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('rtrwh-theme') as ThemeMode | null;
      return savedTheme || defaultTheme;
    }
    return defaultTheme;
  });
  
  const [isDark, setIsDark] = useState<boolean>(false);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  
  // Enhanced color palette with better contrast and accessibility
  const lightColors = {
    primary: '#2563eb',      // Blue 600
    secondary: '#0ea5e9',    // Sky 500
    accent: '#06b6d4',       // Cyan 500
    background: '#ffffff',   // White
    surface: '#f8fafc',      // Slate 50
    text: '#1e293b',         // Slate 800
    textSecondary: '#64748b', // Slate 500
    border: '#e2e8f0',       // Slate 200
    success: '#059669',      // Emerald 600
    warning: '#d97706',      // Amber 600
    error: '#dc2626',        // Red 600
    info: '#0284c7',         // Sky 600
  };
  
  const darkColors = {
    primary: '#3b82f6',      // Blue 500
    secondary: '#0284c7',    // Sky 600
    accent: '#06b6d4',       // Cyan 500
    background: '#0f172a',   // Slate 900
    surface: '#1e293b',      // Slate 800
    text: '#f1f5f9',         // Slate 100
    textSecondary: '#94a3b8', // Slate 400
    border: '#334155',       // Slate 700
    success: '#10b981',      // Emerald 500
    warning: '#f59e0b',      // Amber 500
    error: '#ef4444',        // Red 500
    info: '#0ea5e9',         // Sky 500
  };
  
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('rtrwh-theme', newTheme);
    }
  };
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    let resolved: 'light' | 'dark' = 'light';
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      resolved = systemTheme;
    } else {
      resolved = theme;
    }
    
    root.classList.add(resolved);
    setIsDark(resolved === 'dark');
    setResolvedTheme(resolved);
    
    // Update CSS custom properties for dynamic theming
    const colors = resolved === 'dark' ? darkColors : lightColors;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-surface', colors.surface);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-border', colors.border);
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(newSystemTheme);
        setIsDark(newSystemTheme === 'dark');
        setResolvedTheme(newSystemTheme);
        
        // Update CSS custom properties
        const newColors = newSystemTheme === 'dark' ? darkColors : lightColors;
        root.style.setProperty('--color-primary', newColors.primary);
        root.style.setProperty('--color-secondary', newColors.secondary);
        root.style.setProperty('--color-accent', newColors.accent);
        root.style.setProperty('--color-background', newColors.background);
        root.style.setProperty('--color-surface', newColors.surface);
        root.style.setProperty('--color-text', newColors.text);
        root.style.setProperty('--color-text-secondary', newColors.textSecondary);
        root.style.setProperty('--color-border', newColors.border);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  
  const value = {
    theme,
    setTheme,
    isDark,
    resolvedTheme,
    colors: isDark ? darkColors : lightColors,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};