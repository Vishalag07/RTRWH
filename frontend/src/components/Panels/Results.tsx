import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiDownload, FiShare2, FiEye } from 'react-icons/fi';

interface ResultsProps {
  className?: string;
}

const Results: React.FC<ResultsProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const recentResults = [
    {
      id: 1,
      title: 'Mumbai Assessment #1247',
      date: '2024-01-15',
      status: 'completed',
      score: 87,
      waterSaved: '2.3M L',
      efficiency: '94%'
    },
    {
      id: 2,
      title: 'Delhi Assessment #1246',
      date: '2024-01-14',
      status: 'completed',
      score: 92,
      waterSaved: '1.8M L',
      efficiency: '96%'
    },
    {
      id: 3,
      title: 'Bangalore Assessment #1245',
      date: '2024-01-13',
      status: 'in-progress',
      score: 0,
      waterSaved: '0 L',
      efficiency: '0%'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'in-progress': return 'text-yellow-500';
      case 'pending': return 'text-blue-500';
      default: return 'text-slate-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className={`${className} p-6 rounded-2xl shadow-soft border backdrop-blur-sm ${
      isDark 
        ? 'bg-slate-800/50 border-slate-700/50' 
        : 'bg-white/50 border-slate-200/50'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-xl">📊</span>
            </motion.div>
            <div>
              <h3 className={`text-lg font-semibold ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                Assessment Results
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Recent assessment outcomes
              </p>
            </div>
          </div>
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isDark 
                ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300' 
                : 'bg-slate-200/50 hover:bg-slate-300/50 text-slate-600'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </motion.button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-xl text-center ${
            isDark 
              ? 'bg-slate-700/30 border border-slate-600/30' 
              : 'bg-slate-100/50 border border-slate-200/50'
          }`}>
            <div className={`text-2xl font-bold ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`}>
              1,247
            </div>
            <div className={`text-xs ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Total Assessments
            </div>
          </div>
          <div className={`p-4 rounded-xl text-center ${
            isDark 
              ? 'bg-slate-700/30 border border-slate-600/30' 
              : 'bg-slate-100/50 border border-slate-200/50'
          }`}>
            <div className={`text-2xl font-bold ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              2.3M
            </div>
            <div className={`text-xs ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Liters Saved
            </div>
          </div>
          <div className={`p-4 rounded-xl text-center ${
            isDark 
              ? 'bg-slate-700/30 border border-slate-600/30' 
              : 'bg-slate-100/50 border border-slate-200/50'
          }`}>
            <div className={`text-2xl font-bold ${
              isDark ? 'text-purple-400' : 'text-purple-600'
            }`}>
              94.2%
            </div>
            <div className={`text-xs ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Avg Efficiency
            </div>
          </div>
        </div>

        {/* Recent Results */}
        <div className="space-y-3">
          {recentResults.slice(0, isExpanded ? recentResults.length : 2).map((result, index) => (
            <motion.div
              key={result.id}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                isDark 
                  ? 'bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50' 
                  : 'bg-slate-100/30 border-slate-200/30 hover:bg-slate-100/50'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      {result.title}
                    </h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      result.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  <div className={`text-sm ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {result.date}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${getScoreColor(result.score)}`}>
                    {result.score > 0 ? `${result.score}%` : '--'}
                  </div>
                  <div className={`text-xs ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Score
                  </div>
                </div>
              </div>
              
              {result.status === 'completed' && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200/20">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">💧</span>
                    <span className={`text-sm font-medium ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {result.waterSaved}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⚡</span>
                    <span className={`text-sm font-medium ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {result.efficiency}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Expanded View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="mt-4 space-y-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className={`p-4 rounded-xl ${
                isDark 
                  ? 'bg-slate-700/20 border border-slate-600/20' 
                  : 'bg-slate-100/30 border border-slate-200/30'
              }`}>
                <h4 className={`font-semibold mb-3 ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  Performance Trends
                </h4>
                <div className="space-y-2">
                  {[
                    { metric: 'Assessment Accuracy', value: '94.2%', trend: '+2.1%' },
                    { metric: 'Water Conservation', value: '2.3M L', trend: '+15.3%' },
                    { metric: 'User Satisfaction', value: '4.8/5', trend: '+0.2' },
                    { metric: 'System Uptime', value: '99.7%', trend: '+0.1%' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className={`text-sm ${
                        isDark ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        {item.metric}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          {item.value}
                        </span>
                        <span className={`text-xs ${
                          item.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {item.trend}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <motion.button
            onClick={() => navigate('/dashboard')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30' 
                : 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-200'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <FiDownload className="w-4 h-4" />
              Export
            </div>
          </motion.button>
          <motion.button
            onClick={() => navigate('/dashboard')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300' 
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <FiShare2 className="w-4 h-4" />
              Share
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Results;
