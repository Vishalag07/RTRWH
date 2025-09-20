import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiSettings, FiLogOut, FiCreditCard, FiChevronDown } from 'react-icons/fi';
import { useTheme } from './ThemeProvider';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  location?: string;
}

interface UserDropdownProps {
  user: User;
  onLogout: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuItemClick = (action: string) => {
    setIsOpen(false);
    switch (action) {
      case 'profile':
        navigate('/user');
        break;
      case 'settings':
        navigate('/user');
        break;
      case 'logout':
        onLogout();
        break;
    }
  };

  const menuItems = [
    { id: 'profile', label: 'My Profile', icon: FiUser, emoji: '👤' },
    { id: 'settings', label: 'User Settings', icon: FiSettings, emoji: '⚙️' },
    { id: 'logout', label: 'Logout', icon: FiLogOut, emoji: '🚪' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ${
          isDark 
            ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 border-slate-700/50' 
            : 'bg-white/50 hover:bg-white/80 text-slate-700 border-slate-200/50'
        } backdrop-blur-sm border shadow-soft hover:shadow-medium`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label={`User menu for ${user.name || 'User'}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="flex items-center gap-2">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium">{user.name || 'User'}</div>
            <div className="text-xs opacity-70">{user.email || 'user@example.com'}</div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FiChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              className={`absolute right-0 top-full mt-2 w-64 rounded-xl shadow-strong border backdrop-blur-md z-20 ${
                isDark 
                  ? 'bg-slate-800/95 border-slate-700/50' 
                  : 'bg-white/95 border-slate-200/50'
              }`}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              role="menu"
              aria-label="User menu"
            >
              {/* User Info Header */}
              <div className={`p-4 border-b ${
                isDark ? 'border-slate-700/50' : 'border-slate-200/50'
              }`}>
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-lg font-semibold">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-sm">{user.name || 'User'}</div>
                    <div className="text-xs opacity-70">{user.email || 'user@example.com'}</div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isLogout = item.id === 'logout';
                  
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => handleMenuItemClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isLogout
                          ? isDark
                            ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                            : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                          : isDark
                            ? 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      role="menuitem"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <Icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserDropdown;
