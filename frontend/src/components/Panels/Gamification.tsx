import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { FiTarget, FiAward, FiTrendingUp, FiStar } from 'react-icons/fi';

interface GamificationProps {
  className?: string;
}

const Gamification: React.FC<GamificationProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const achievements = [
    {
      id: 1,
      title: 'Water Warrior',
      description: 'Complete 10 assessments',
      icon: '🏆',
      progress: 8,
      max: 10,
      unlocked: false,
      rarity: 'common'
    },
    {
      id: 2,
      title: 'Conservation Champion',
      description: 'Save 1M liters of water',
      icon: '💧',
      progress: 750000,
      max: 1000000,
      unlocked: false,
      rarity: 'rare'
    },
    {
      id: 3,
      title: 'Data Detective',
      description: 'Analyze 50 groundwater sources',
      icon: '🔍',
      progress: 50,
      max: 50,
      unlocked: true,
      rarity: 'epic'
    },
    {
      id: 4,
      title: 'Prediction Master',
      description: 'Achieve 95% accuracy in rainfall prediction',
      icon: '🌧️',
      progress: 94.2,
      max: 95,
      unlocked: false,
      rarity: 'legendary'
    }
  ];

  const leaderboard = [
    { rank: 1, name: 'Sarah M.', score: 2847, badge: '🥇' },
    { rank: 2, name: 'Raj K.', score: 2634, badge: '🥈' },
    { rank: 3, name: 'Priya S.', score: 2456, badge: '🥉' },
    { rank: 4, name: 'You', score: 1892, badge: '👤' },
    { rank: 5, name: 'Amit P.', score: 1756, badge: '👤' }
  ];

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-slate-500';
      case 'rare': return 'text-blue-500';
      case 'epic': return 'text-purple-500';
      case 'legendary': return 'text-yellow-500';
      default: return 'text-slate-400';
    }
  };

  const getRarityBg = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-slate-500/20';
      case 'rare': return 'bg-blue-500/20';
      case 'epic': return 'bg-purple-500/20';
      case 'legendary': return 'bg-yellow-500/20';
      default: return 'bg-slate-500/20';
    }
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-xl">🏆</span>
            </motion.div>
            <div>
              <h3 className={`text-lg font-semibold ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                Gamification
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Achievements & leaderboard
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

        {/* User Stats */}
        <div className={`p-4 rounded-xl mb-6 ${
          isDark 
            ? 'bg-slate-700/30 border border-slate-600/30' 
            : 'bg-slate-100/50 border border-slate-200/50'
        }`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
              Y
            </div>
            <div className="flex-1">
              <div className={`font-semibold ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}>
                Your Progress
              </div>
              <div className={`text-sm ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Level 5 • 1,892 points
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${
                isDark ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                #4
              </div>
              <div className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Global Rank
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className={`w-full h-2 rounded-full ${
              isDark ? 'bg-slate-700' : 'bg-slate-200'
            }`}>
              <motion.div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <div className={`text-xs mt-1 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              75% to Level 6
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="space-y-3">
          {achievements.slice(0, isExpanded ? achievements.length : 2).map((achievement, index) => (
            <motion.div
              key={achievement.id}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                achievement.unlocked
                  ? isDark
                    ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                    : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200/50'
                  : isDark
                    ? 'bg-slate-700/30 border-slate-600/30'
                    : 'bg-slate-100/30 border-slate-200/30'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  achievement.unlocked 
                    ? getRarityBg(achievement.rarity)
                    : isDark 
                      ? 'bg-slate-700/50' 
                      : 'bg-slate-200/50'
                }`}>
                  {achievement.unlocked ? achievement.icon : '🔒'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      {achievement.title}
                    </h4>
                    {achievement.unlocked && (
                      <span className={`text-xs px-2 py-1 rounded-full ${getRarityBg(achievement.rarity)} ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {achievement.description}
                  </p>
                  {!achievement.unlocked && (
                    <div className="mt-2">
                      <div className={`w-full h-1.5 rounded-full ${
                        isDark ? 'bg-slate-700' : 'bg-slate-200'
                      }`}>
                        <motion.div
                          className={`h-1.5 rounded-full ${
                            achievement.rarity === 'legendary' 
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                              : achievement.rarity === 'epic'
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                              : achievement.rarity === 'rare'
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                              : 'bg-gradient-to-r from-slate-500 to-slate-600'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${(achievement.progress / achievement.max) * 100}%` 
                          }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        />
                      </div>
                      <div className={`text-xs mt-1 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {achievement.progress} / {achievement.max}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
                  Leaderboard
                </h4>
                <div className="space-y-2">
                  {leaderboard.map((player, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{player.badge}</span>
                        <span className={`font-medium ${
                          player.name === 'You' 
                            ? isDark ? 'text-blue-400' : 'text-blue-600'
                            : isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          {player.name}
                        </span>
                      </div>
                      <span className={`font-semibold ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        {player.score.toLocaleString()}
                      </span>
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
            onClick={() => navigate('/gamification')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-500/30' 
                : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-200'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <FiStar className="w-4 h-4" />
              View All
            </div>
          </motion.button>
          <motion.button
            onClick={() => navigate('/gamification')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300' 
                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center gap-2">
              <FiTarget className="w-4 h-4" />
              Challenges
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default Gamification;
