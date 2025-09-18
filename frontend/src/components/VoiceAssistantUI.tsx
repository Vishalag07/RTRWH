
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiMicOff, FiX, FiVolume2, FiSettings } from 'react-icons/fi';

interface VoiceAssistantUIProps {
  isListening: boolean;
  setIsListening: (listening: boolean) => void;
  feedback?: string;
  onClose?: () => void;
}

export const VoiceAssistantUI: React.FC<VoiceAssistantUIProps> = ({ 
  isListening, 
  setIsListening, 
  feedback,
  onClose 
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setIsExpanded(true);
    }
  };

  const handleClose = () => {
    setIsListening(false);
    setIsExpanded(false);
    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3 }}
      >
        {/* Expanded Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="absolute bottom-20 right-0 w-80 bg-white/95 backdrop-blur-lg border border-white/50 rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-white/20">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-3 h-3 bg-green-500 rounded-full"
                    animate={isListening ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="font-semibold text-slate-800">
                    {t('voice_assistant.title')}
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-white/50 rounded-lg transition-colors"
                  aria-label={t('voice_assistant.close')}
                >
                  <FiX className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Status */}
                <div className="text-center">
                  <motion.div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      isListening 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    animate={isListening ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    {isListening ? (
                      <>
                        <FiMic className="w-4 h-4" />
                        {t('voice_assistant.listening')}
                      </>
                    ) : (
                      <>
                        <FiMicOff className="w-4 h-4" />
                        {t('voice_assistant.not_listening')}
                      </>
                    )}
                  </motion.div>
                </div>

                {/* Transcript */}
                {transcript && (
                  <motion.div
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="text-sm text-blue-800 font-medium mb-1">
                      {t('voice_assistant.transcript')}
                    </div>
                    <div className="text-blue-700">{transcript}</div>
                    {confidence > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <span>{t('voice_assistant.confidence')}</span>
                          <div className="flex-1 bg-blue-200 rounded-full h-1">
                            <motion.div
                              className="bg-blue-500 h-1 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${confidence * 100}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                          <span>{Math.round(confidence * 100)}%</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Feedback */}
                {feedback && (
                  <motion.div
                    className="bg-green-50 border border-green-200 rounded-lg p-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2 text-green-700">
                      <FiVolume2 className="w-4 h-4" />
                      <span className="text-sm font-medium">{feedback}</span>
                    </div>
                  </motion.div>
                )}

                {/* Commands Help */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    {t('voice_assistant.available_commands')}
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>• "{t('voice_commands.navigate_to_dashboard')}"</div>
                    <div>• "{t('voice_commands.navigate_to_assessment')}"</div>
                    <div>• "{t('voice_commands.login')}"</div>
                    <div>• "{t('voice_commands.register')}"</div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <button
                    onClick={toggleListening}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <FiMicOff className="w-4 h-4" />
                        {t('voice_assistant.stop')}
                      </>
                    ) : (
                      <>
                        <FiMic className="w-4 h-4" />
                        {t('voice_assistant.start')}
                      </>
                    )}
                  </button>
                  
                  <button
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label={t('voice_assistant.settings')}
                  >
                    <FiSettings className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Button */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
            isListening
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label={t('voice_assistant.toggle')}
        >
          {/* Pulse Animation */}
          {isListening && (
            <motion.div
              className="absolute inset-0 rounded-full bg-red-400"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.7, 0, 0.7],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
          
          <motion.div
            animate={isListening ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {isListening ? (
              <FiMicOff className="w-6 h-6" />
            ) : (
              <FiMic className="w-6 h-6" />
            )}
          </motion.div>
        </motion.button>

        {/* Quick Status Indicator */}
        {!isExpanded && feedback && (
          <motion.div
            className="absolute bottom-20 right-0 bg-black/80 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap max-w-xs"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {feedback}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
