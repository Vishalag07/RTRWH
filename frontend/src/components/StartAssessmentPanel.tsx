import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { useNavigate } from 'react-router-dom';
import { FiPlay, FiCamera, FiX, FiZap } from 'react-icons/fi';
import { api } from '../services/api';

interface StartAssessmentPanelProps {
  className?: string;
}

const StartAssessmentPanel: React.FC<StartAssessmentPanelProps> = ({ className = '' }) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [estimatedArea, setEstimatedArea] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const handleStartAssessment = () => {
    navigate('/assess');
  };

  // Open/close camera for rooftop scan
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        console.warn('Camera access denied or unavailable', e);
      }
    };
    const stopCamera = () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
    if (showScanner) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [showScanner]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = video.videoWidth;
      const h = video.videoHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const img = ctx.getImageData(0, 0, w, h);
      // Simple heuristic: classify dark-ish pixels as rooftop surface
      let dark = 0;
      const total = w * h;
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (luminance < 140) dark++;
      }
      const coverage = Math.min(1, Math.max(0, dark / total));
      // Assume phone height and FOV give ~200 m² max in frame; scale by coverage
      const areaM2 = Math.round(coverage * 200);
      setEstimatedArea(areaM2);
    } finally {
      setIsCapturing(false);
    }
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

        {/* Rooftop Scan Button */}
        <motion.button
          onClick={() => setShowScanner(true)}
          className={`w-full mt-3 p-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
            isDark 
              ? 'bg-fuchsia-300/90 hover:bg-fuchsia-400/95 text-fuchsia-900 shadow-lg shadow-fuchsia-500/25' 
              : 'bg-fuchsia-200/90 hover:bg-fuchsia-300/95 text-fuchsia-800 shadow-lg shadow-fuchsia-500/25'
          }`}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiCamera className="w-5 h-5" />
          <span>Rooftop Scan</span>
          <FiZap className="w-4 h-4" />
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

      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl ${
            isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'
          }`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/50">
              <div className={`${isDark ? 'text-slate-100' : 'text-slate-900'} font-semibold`}>Rooftop Scanner (Beta)</div>
              <button onClick={() => setShowScanner(false)} className={`${isDark ? 'text-slate-300 hover:text-slate-100' : 'text-slate-600 hover:text-slate-900'}`}>
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="relative rounded-lg overflow-hidden border border-slate-200/60">
                <video ref={videoRef} className="w-full h-64 object-cover bg-black" playsInline muted />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}">
                Tip: Stand above or at an angle with the rooftop in view. Ensure good lighting.
              </div>
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleCapture}
                  disabled={isCapturing}
                  className={`px-4 py-2 rounded-lg font-medium ${isDark ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'} disabled:opacity-60`}
                >
                  {isCapturing ? 'Processing…' : 'Capture & Estimate'}
                </button>
                {estimatedArea != null && (
                  <div className={`${isDark ? 'text-emerald-300' : 'text-emerald-700'} text-sm font-semibold`}>
                    Estimated Size: {estimatedArea} m²
                  </div>
                )}
              </div>
              {estimatedArea != null && (
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  This is a rough on-device estimate. For accuracy, refine in the assessment.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartAssessmentPanel;
