import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGlobe, FiChevronDown, FiCheck } from 'react-icons/fi';
import { useTheme } from './ThemeProvider';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
];

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
          isDark 
            ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 border-slate-700/50' 
            : 'bg-white text-black border-slate-300 hover:bg-slate-50'
        } backdrop-blur-sm border shadow-soft hover:shadow-medium`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Select language"
      >
        <FiGlobe className="w-4 h-4" />
        <span className="hidden sm:block">{currentLanguage.nativeName}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown className="w-3 h-3" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`absolute right-0 top-full mt-2 w-64 rounded-xl shadow-strong border backdrop-blur-md z-50 ${
              isDark 
                ? 'bg-slate-800/95 border-slate-700/50' 
                : 'bg-white/95 border-slate-200/50'
            }`}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2">
              <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                {t('language.choose_language', 'Choose Language')}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {languages.map((lang) => (
                  <motion.button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      i18n.language === lang.code
                        ? isDark
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-blue-50 text-blue-600'
                        : isDark
                          ? 'hover:bg-slate-700/50 text-slate-200'
                          : 'hover:bg-slate-100 text-slate-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{lang.nativeName}</span>
                      <span className={`text-xs ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {lang.name}
                      </span>
                    </div>
                    {i18n.language === lang.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FiCheck className="w-4 h-4" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
