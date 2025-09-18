
import { Link, NavLink, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { FiMenu, FiX, FiHome, FiBarChart2, FiClipboard, FiUsers, FiMic } from 'react-icons/fi';
import { LanguageSwitcher } from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import UserDropdown from './UserDropdown';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { isDark } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  
  // Enhanced scroll animation using framer-motion
  const { scrollY } = useScroll();
  const navBackground = useTransform(
    scrollY,
    [0, 50],
    isDark 
      ? ["rgba(15, 23, 42, 0.95)", "rgba(15, 23, 42, 0.6)"]
      : ["rgba(30, 41, 59, 0.9)", "rgba(30, 41, 59, 0.6)"]
  );
  const navShadow = useTransform(
    scrollY,
    [0, 50],
    ["0 0 0 rgba(0, 0, 0, 0)", "0 8px 24px rgba(0, 0, 0, 0.25)"]
  );

  const [isListening, setIsListening] = useState(false);
  const toggleVoiceAssistant = () => setIsListening(prev => !prev);
  const toggleChatbot = () => setIsChatbotOpen(prev => !prev);

  const sendMessageToChat = (message: string) => {
    // Store the message in sessionStorage to be picked up by the chat page
    sessionStorage.setItem('predefinedMessage', message);
    // Navigate to chat page (use nested route if authenticated)
    window.location.href = isAuthenticated ? '/dashboard/chat' : '/chat';
  };

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/', label: t('navbar.home'), icon: <FiHome className="mr-2" /> },
    { to: isAuthenticated ? '/dashboard/assess' : '/assess', label: t('navbar.assessment'), icon: <FiClipboard className="mr-2" /> },
    { to: '/dashboard', label: t('navbar.dashboard'), icon: <FiBarChart2 className="mr-2" /> },
    // About link uses a hash route and custom click handler to avoid NavLink active highlight
    { to: '/#about', label: t('navbar.about_us'), icon: <FiUsers className="mr-2" />, isHash: true },
  ];

  // About section scroll behavior (no active highlight)
  const scrollToAbout = (e: React.MouseEvent) => {
    e.preventDefault();
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If not on landing, navigate home then scroll after a tick
      if (location.pathname !== '/') {
        window.location.href = '/#about';
      }
    }
  };

  return (
    <>
      <motion.nav
        ref={navRef}
        style={{ 
          backgroundColor: navBackground,
          boxShadow: navShadow,
          borderBottom: isDark ? '1px solid rgba(51, 65, 85, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)'
        }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md text-white"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Name with Eye-Catching Style */}
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/" className="flex items-center group">
                <motion.span 
                  className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent"
                  animate={{ 
                    backgroundPosition: ['0%', '100%', '0%']
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    backgroundSize: '200% 200%'
                  }}
                >
                  RTRWH
                </motion.span>
                <motion.span 
                  className={`ml-2 text-xs font-medium ${
                    isDark ? 'text-slate-400' : 'text-slate-300'
                  }`}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Assessment Platform
                </motion.span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {link.isHash ? (
                    <a
                      href={link.to}
                      onClick={scrollToAbout}
                      className={`relative flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                        isDark
                          ? 'text-slate-300 hover:text-blue-400 hover:bg-slate-700/50'
                          : 'text-slate-100 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="flex items-center">
                        {link.icon}
                        {link.label}
                      </span>
                    </a>
                  ) : (
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        `relative flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                          isActive
                            ? isDark
                              ? 'text-blue-300 bg-slate-700/60 shadow-sm'
                              : 'text-white bg-white/10 shadow-sm'
                            : isDark
                              ? 'text-slate-200 hover:text-white hover:bg-slate-700/60'
                              : 'text-slate-100 hover:text-white hover:bg-white/10'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className="flex items-center">
                            {link.icon}
                            {link.label}
                          </span>
                          {isActive && (
                            <motion.div
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                              layoutId="activeTab"
                              transition={{ duration: 0.3, type: "spring", stiffness: 500 }}
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* AI Chatbot */}
              <motion.button
                onClick={toggleChatbot}
                className={`p-2.5 rounded-xl transition-all duration-300 ${
                  isDark 
                    ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 border-slate-700/50' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                } backdrop-blur-sm border shadow-soft hover:shadow-medium`}
                title={t('navbar.ai_assistant')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={t('navbar.ai_assistant')}
              >
                <span className="text-lg">🤖</span>
              </motion.button>

              {/* Voice Assistant */}
              <motion.button
                onClick={toggleVoiceAssistant}
                className={`p-2.5 rounded-xl transition-all duration-300 ${
                  isListening 
                    ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-lg shadow-red-500/20' 
                    : isDark 
                      ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 border-slate-700/50' 
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                } backdrop-blur-sm border shadow-soft hover:shadow-medium`}
                title={t('navbar.voice_assistant')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={isListening ? { 
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    '0 0 0 0 rgba(239, 68, 68, 0.7)',
                    '0 0 0 8px rgba(239, 68, 68, 0)',
                    '0 0 0 0 rgba(239, 68, 68, 0)'
                  ]
                } : {}}
                transition={{ duration: 1, repeat: isListening ? Infinity : 0 }}
                aria-label={t('navbar.voice_assistant')}
              >
                <FiMic className="w-5 h-5" />
              </motion.button>

              {/* Theme Toggle (to the left of Language) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <ThemeToggle />
              </motion.div>
              
              {/* Language Switcher (to the left of Auth) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <LanguageSwitcher />
              </motion.div>

              {/* Auth Buttons or User Dropdown (rightmost in desktop) */}
              {isAuthenticated && user ? (
                <UserDropdown user={user} onLogout={logout} />
              ) : (
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => window.location.href = '/auth?mode=login'}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 border shadow ${
                      isDark 
                        ? 'bg-white/90 text-slate-900 border-slate-300 hover:bg-white' 
                        : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t('navbar.login')}
                  </motion.button>
                  <motion.button
                    onClick={() => window.location.href = '/auth?mode=register'}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isDark 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } shadow-soft hover:shadow-medium`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t('navbar.sign_up')}
                  </motion.button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-200' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiX className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiMenu className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu - Enhanced with better animations */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className={`md:hidden backdrop-blur-md border-t ${
                isDark 
                  ? 'bg-slate-800/95 border-slate-700/50' 
                  : 'bg-slate-800/90 text-white border-white/10'
              }`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col space-y-3">
                  {navLinks.map((link, index) => (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {link.isHash ? (
                        <a
                          href={link.to}
                          onClick={(e) => { scrollToAbout(e); setIsMobileMenuOpen(false); }}
                          className={`flex items-center px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-300 ${
                            isDark
                              ? 'text-slate-300 hover:text-blue-400 hover:bg-slate-700/50'
                              : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
                          }`}
                        >
                          {link.icon}
                          {link.label}
                        </a>
                      ) : (
                        <NavLink
                          to={link.to}
                          className={({ isActive }) =>
                            `flex items-center px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-300 ${
                              isActive
                                ? isDark
                                  ? 'text-blue-400 bg-blue-500/20 shadow-sm'
                                  : 'text-blue-600 bg-blue-50/80 shadow-sm'
                                : isDark
                                  ? 'text-slate-300 hover:text-blue-400 hover:bg-slate-700/50'
                                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
                            }`
                          }
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.icon}
                          {link.label}
                        </NavLink>
                      )}
                    </motion.div>
                  ))}
                  
                  {/* Mobile Theme + Language + Auth (ordered: Theme, Language, Auth at far right) */}
                  <div className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('navbar.preferences') || 'Preferences'}
                    </div>
                    <div className="px-3 flex items-center gap-3">
                      {/* Theme first */}
                      <ThemeToggle />
                      {/* Language second */}
                      <div className="ml-1">
                        <LanguageSwitcher />
                      </div>
                      {/* Auth section at the far right */}
                      <div className="ml-auto flex items-center gap-2">
                        {isAuthenticated && user ? (
                          <>
                            <button
                              onClick={() => window.location.href = '/dashboard/user'}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                isDark ? 'bg-slate-700/60 text-slate-200' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {user.name?.split(' ')[0] || 'Profile'}
                            </button>
                            <button
                              onClick={logout}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                isDark ? 'bg-red-600/80 text-white' : 'bg-red-600 text-white'
                              }`}
                            >
                              {t('navbar.logout') || 'Logout'}
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => window.location.href = '/auth?mode=login'}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                isDark ? 'text-slate-200 bg-slate-700/60' : 'text-slate-700 bg-slate-100'
                              }`}
                            >
                              {t('navbar.login')}
                            </button>
                            <button
                              onClick={() => window.location.href = '/auth?mode=register'}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                                isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
                              }`}
                            >
                              {t('navbar.sign_up')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile AI/Voice buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <motion.button
                      onClick={toggleChatbot}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                        isDark 
                          ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-lg">🤖</span>
                      <span>AI Chat</span>
                    </motion.button>
                    <motion.button
                      onClick={toggleVoiceAssistant}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                        isListening
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : isDark 
                            ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-lg">🗣️</span>
                      <span>Voice</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* AI Chatbot Modal */}
      <AnimatePresence>
        {isChatbotOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsChatbotOpen(false)}
            />
            
            {/* Modal */}
            <motion.div
              className={`relative w-full max-w-md rounded-2xl shadow-strong border backdrop-blur-md ${
                isDark 
                  ? 'bg-slate-800/95 border-slate-700/50' 
                  : 'bg-white/95 border-slate-200/50'
              }`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">🤖</span>
                  <h3 className={`text-lg font-semibold ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}>
                    {t('navbar.ai_assistant')}
                  </h3>
                </div>
                <p className={`text-sm mb-4 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Choose a question to start chatting with our AI assistant:
                </p>
                <div className="space-y-3">
                  <motion.button
                    onClick={() => sendMessageToChat("How do I start a water assessment?")}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    💧 How do I start a water assessment?
                  </motion.button>
                  <motion.button
                    onClick={() => sendMessageToChat("What's the rainfall prediction for my area?")}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🌧️ What's the rainfall prediction for my area?
                  </motion.button>
                  <motion.button
                    onClick={() => sendMessageToChat("How do I interpret groundwater data?")}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    📊 How do I interpret groundwater data?
                  </motion.button>
                  <motion.button
                    onClick={() => sendMessageToChat("What are the best practices for rainwater harvesting?")}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🌱 What are the best practices for rainwater harvesting?
                  </motion.button>
                  <motion.button
                    onClick={() => sendMessageToChat("How can I improve my water conservation efforts?")}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    💡 How can I improve my water conservation efforts?
                  </motion.button>
                </div>
                <div className="flex gap-3 mt-4">
                  <motion.button
                    onClick={() => window.location.href = isAuthenticated ? '/dashboard/chat' : '/chat'}
                    className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isDark 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Open Full Chat
                  </motion.button>
                  <motion.button
                    onClick={() => setIsChatbotOpen(false)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t('navbar.close')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Assistant Modal */}
      <AnimatePresence>
        {isVoiceAssistantOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsVoiceAssistantOpen(false)}
            />
            
            {/* Modal */}
            <motion.div
              className={`relative w-full max-w-sm rounded-2xl shadow-strong border backdrop-blur-md ${
                isDark 
                  ? 'bg-slate-800/95 border-slate-700/50' 
                  : 'bg-white/95 border-slate-200/50'
              }`}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-6 text-center">
                <motion.div
                  className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    isListening 
                      ? 'bg-red-500/20 border-2 border-red-500/50' 
                      : 'bg-blue-500/20 border-2 border-blue-500/50'
                  }`}
                  animate={isListening ? { 
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      '0 0 0 0 rgba(239, 68, 68, 0.7)',
                      '0 0 0 20px rgba(239, 68, 68, 0)',
                      '0 0 0 0 rgba(239, 68, 68, 0)'
                    ]
                  } : {}}
                  transition={{ duration: 1, repeat: isListening ? Infinity : 0 }}
                >
                  <span className="text-3xl">🗣️</span>
                </motion.div>
                
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  {isListening ? t('navbar.listening') : t('navbar.voice_assistant')}
                </h3>
                
                <p className={`text-sm mb-4 ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {isListening 
                    ? t('navbar.speak_command') 
                    : t('navbar.click_microphone')
                  }
                </p>
                
                <motion.button
                  onClick={toggleVoiceAssistant}
                  className={`w-full px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : isDark 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isListening ? t('navbar.stop_listening') : t('navbar.start_voice_command')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
