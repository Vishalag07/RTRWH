import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { FiTrendingUp, FiUsers, FiMapPin, FiZap } from 'react-icons/fi';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  emoji: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  trend, 
  icon, 
  emoji, 
  description 
}) => {
  const { isDark } = useTheme();

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-slate-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '→';
    }
  };

  return (
    <motion.div
      className={`p-6 rounded-2xl shadow-soft border backdrop-blur-sm ${
        isDark 
          ? 'bg-slate-800/50 border-slate-700/50' 
          : 'bg-white/50 border-slate-200/50'
      }`}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
          >
            {icon}
          </motion.div>
          <div>
            <h3 className={`text-sm font-medium ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {title}
            </h3>
            <p className={`text-xs ${
              isDark ? 'text-slate-500' : 'text-slate-500'
            }`}>
              {description}
            </p>
          </div>
        </div>
        <motion.span
          className="text-2xl"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 3 }}
        >
          {emoji}
        </motion.span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <motion.div
            className={`text-3xl font-bold ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {value}
          </motion.div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor(trend)}`}>
            <span>{getTrendIcon(trend)}</span>
            <span>{change}</span>
          </div>
          <div className={`text-xs ${
            isDark ? 'text-slate-500' : 'text-slate-500'
          }`}>
            vs last month
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface StatCardsProps {
  className?: string;
}

const StatCards: React.FC<StatCardsProps> = ({ className = '' }) => {
  const stats = [
    {
      title: 'Active Assessments',
      value: '1,247',
      change: '+12.5%',
      trend: 'up' as const,
      icon: <FiTrendingUp className="w-5 h-5 text-white" />,
      emoji: '📊',
      description: 'Ongoing water source evaluations'
    },
    {
      title: 'Water Saved',
      value: '2.3M L',
      change: '+18.2%',
      trend: 'up' as const,
      icon: <FiZap className="w-5 h-5 text-white" />,
      emoji: '💧',
      description: 'Total water conservation achieved'
    },
    {
      title: 'Efficiency Rate',
      value: '94.2%',
      change: '+2.1%',
      trend: 'up' as const,
      icon: <FiTrendingUp className="w-5 h-5 text-white" />,
      emoji: '⚡',
      description: 'System performance accuracy'
    },
    {
      title: 'Locations Mapped',
      value: '15,678',
      change: '+8.7%',
      trend: 'up' as const,
      icon: <FiMapPin className="w-5 h-5 text-white" />,
      emoji: '🗺️',
      description: 'Geographic coverage areas'
    }
  ];

  return (
    <div className={`${className} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  );
};

export default StatCards;
