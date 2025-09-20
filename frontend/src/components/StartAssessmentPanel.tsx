import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { FiPlay } from 'react-icons/fi';
import { api } from '../services/api';

interface StartAssessmentPanelProps {
  className?: string;
}

const StartAssessmentPanel: React.FC<StartAssessmentPanelProps> = ({ className = '' }) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleStartAssessment = () => {
    navigate('/assess');
  };

  return (
    <div className={`${className} p-6 rounded-2xl shadow-strong border backdrop-blur-sm ${
      isDark 
        ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20' 
        : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-2xl">💧</span>
          </motion.div>
          <div>
            <h3 className={`text-xl font-bold ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}>
              Start Water Assessment
            </h3>
            <p className={`text-sm ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Start your water assessment journey
            </p>
          </div>
        </div>

        {/* Start Assessment Button */}
        <motion.button
          onClick={handleStartAssessment}
          className={`w-full p-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
            isDark 
              ? 'bg-blue-300/90 hover:bg-blue-400/95 text-blue-900 shadow-lg shadow-blue-500/25' 
              : 'bg-blue-200/90 hover:bg-blue-300/95 text-blue-800 shadow-lg shadow-blue-500/25'
          }`}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-center gap-3">
            <FiPlay className="w-5 h-5" />
            <span>Start Assessment</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </div>
        </motion.button>

        {/* Show Results Button */}
        <motion.button
          onClick={async () => {
            try {
              const res = await api.get('/assessments');
              const list = Array.isArray(res.data) ? res.data : [];
              if (list.length > 0 && list[0]?.id != null) {
                navigate(`/results/${list[0].id}`);
              } else {
                // No assessments found, navigate to assessment page instead
                navigate('/assess');
              }
            } catch (e) {
              // API failed, navigate to assessment page instead
              navigate('/assess');
            }
          }}
          className={`w-full mt-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
            isDark 
              ? 'bg-emerald-200/80 hover:bg-emerald-300/90 text-emerald-900' 
              : 'bg-emerald-100/80 hover:bg-emerald-200/90 text-emerald-800'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Show Results
        </motion.button>

        {/* Stats */}
        <div className={`mt-6 p-4 rounded-xl ${
          isDark 
            ? 'bg-slate-800/30 border border-slate-700/50' 
            : 'bg-white/50 border border-slate-200/50'
        }`}>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className={`text-2xl font-bold ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}>
                1,247
              </div>
              <div className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Assessments
              </div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`}>
                94.2%
              </div>
              <div className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Accuracy
              </div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${
                isDark ? 'text-cyan-400' : 'text-cyan-600'
              }`}>
                2.3M
              </div>
              <div className={`text-xs ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Liters Saved
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StartAssessmentPanel;
