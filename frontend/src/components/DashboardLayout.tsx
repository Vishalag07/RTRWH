import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../components/ThemeProvider';
import { motion } from 'framer-motion';

const DashboardLayout: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isDark } = useTheme();

  // Show loading while auth is being checked
  if (authLoading) {
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

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect in individual components
  }

  return (
    <div className={`min-h-screen ${
      isDark 
        ? 'bg-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
      <Outlet />
    </div>
  );
};

export default DashboardLayout;
