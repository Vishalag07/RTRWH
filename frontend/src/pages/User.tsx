import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../components/ThemeProvider';
import { FiUser, FiMail, FiCalendar, FiMapPin, FiSettings, FiKey, FiBell, FiShield, FiDownload, FiEdit3, FiCheckCircle, FiAlertTriangle, FiLoader } from 'react-icons/fi';
import { getCurrentLocation, getLocationErrorText, GeolocationError } from '../utils/geolocation';

const User: React.FC = () => {
  const { user, updateUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editLocation, setEditLocation] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [toast, setToast] = useState<{ visible: boolean; message: string; variant: 'success' | 'error' }>({ visible: false, message: '', variant: 'success' });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState<boolean>(false);

  // Redirect if not authenticated (only after auth loading is complete)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?mode=login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditLocation(user?.location || '');
  }, [user]);

  const handleFetchLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const locationData = await getCurrentLocation();
      setEditLocation(locationData.city);
    } catch (error) {
      const errorMessage = getLocationErrorText(error as GeolocationError);
      setToast({ visible: true, message: errorMessage, variant: 'error' });
      setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark 
          ? 'bg-slate-900' 
          : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg font-medium ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'settings', label: 'Settings', icon: FiSettings },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'billing', label: 'Billing', icon: FiKey }
  ];

  const handleSaveProfile = async () => {
    setEmailError('');
    // If email changed, validate and make mandatory
    const originalEmail = user?.email || '';
    const emailChanged = editEmail.trim() !== originalEmail;
    if (emailChanged) {
      const email = editEmail.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        setEmailError('Email is required when changing email');
        return;
      }
      if (!emailRegex.test(email)) {
        setEmailError('Please enter a valid email address');
        return;
      }
    }

    try {
      setIsSaving(true);
      // 1) send changes to DB (updateUser) which persists and then fetches fresh user
      const updated = await updateUser({ name: editName, email: editEmail, location: editLocation });
      // 2) update local inputs from DB response
      // Sync local edit fields with saved values to ensure UI shows latest
      setEditName(updated.name || editName);
      setEditEmail(updated.email || editEmail);
      setEditLocation(updated.location || editLocation);
      // 3) show success toast after DB update + fetch
      setToast({ visible: true, message: 'Changes saved', variant: 'success' });
      setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
      setIsEditing(false);
    } catch (e: any) {
      // If backend fails, show an error toast
      const msg = e?.response?.data?.detail || 'Failed to save changes';
      setToast({ visible: true, message: msg, variant: 'error' });
      setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`min-h-screen ${
      isDark 
        ? 'bg-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'
    }`}>
      {/* Global top toast */}
      {toast.visible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-3 ${
            toast.variant === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {toast.variant === 'success' ? (
              <FiCheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <FiAlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className={`text-4xl font-bold mb-3 ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}>
            User Profile
          </h1>
          <p className={`text-lg ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Manage your account settings and preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className={`p-6 rounded-2xl shadow-soft border backdrop-blur-sm ${
              isDark 
                ? 'bg-slate-800/50 border-slate-700/50' 
                : 'bg-white/50 border-slate-200/50'
            }`}>
              {/* User Info */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 className={`text-lg font-semibold ${
                  isDark ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  {user?.name || 'User'}
                </h3>
                <p className={`text-sm ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {user?.email || 'user@example.com'}
                </p>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-2">
                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        activeTab === tab.id
                          ? isDark
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                          : isDark
                            ? 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </motion.button>
                  );
                })}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className={`p-6 rounded-2xl shadow-soft border backdrop-blur-sm ${
              isDark 
                ? 'bg-slate-800/50 border-slate-700/50' 
                : 'bg-white/50 border-slate-200/50'
            }`}>
              <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className={`text-2xl font-bold ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                      }`}>
                        Profile Information
                      </h2>
                      {/* header title only, toast moved to global top */}
                      <motion.button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isDark 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="flex items-center gap-2">
                          <FiEdit3 className="w-4 h-4" />
                          {isEditing ? 'Cancel' : 'Edit Profile'}
                        </div>
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          disabled={!isEditing}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                            isEditing
                              ? isDark
                                ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-blue-500'
                                : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                              : isDark
                                ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                                : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => { setEditEmail(e.target.value); setEmailError(''); }}
                          disabled={!isEditing}
                          className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                            isEditing
                              ? isDark
                                ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-blue-500'
                                : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                              : isDark
                                ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                                : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                        />
                        {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          Location
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                            placeholder="Enter your city"
                            disabled={!isEditing}
                            className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-200 ${
                              isEditing
                                ? isDark
                                  ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-blue-500'
                                  : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                                : isDark
                                  ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                                  : 'bg-slate-100 border-slate-200 text-slate-500'
                            }`}
                          />
                          {isEditing && (
                            <button
                              type="button"
                              onClick={handleFetchLocation}
                              disabled={isFetchingLocation}
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              aria-label="Auto-fetch location"
                            >
                              {isFetchingLocation ? (
                                <FiLoader className="w-4 h-4 animate-spin" />
                              ) : (
                                <FiMapPin className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                        {isEditing && (
                          <p className="mt-1 text-xs text-slate-500">Click the location icon to auto-detect your city</p>
                        )}
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          Member Since
                        </label>
                        <input
                          type="text"
                          value="January 2024"
                          disabled
                          className={`w-full px-4 py-3 rounded-xl border ${
                            isDark
                              ? 'bg-slate-800/50 border-slate-700 text-slate-400'
                              : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <motion.div
                        className="flex gap-3 mt-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                      <motion.button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                          isDark 
                            ? 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 disabled:cursor-not-allowed' 
                            : 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 disabled:cursor-not-allowed'
                        }`}
                        whileHover={{ scale: isSaving ? 1 : 1.05 }}
                        whileTap={{ scale: isSaving ? 1 : 0.95 }}
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </motion.button>
                        <motion.button
                          onClick={() => setIsEditing(false)}
                          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                            isDark 
                              ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' 
                              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Cancel
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className={`text-2xl font-bold mb-6 ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      Application Settings
                    </h2>

                    <div className="space-y-6">
                      <div className={`p-4 rounded-xl ${
                        isDark 
                          ? 'bg-slate-700/30 border border-slate-600/30' 
                          : 'bg-slate-100/50 border border-slate-200/50'
                      }`}>
                        <h3 className={`font-semibold mb-3 ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          Theme Preferences
                        </h3>
                        <p className={`text-sm mb-4 ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          Customize the appearance of your dashboard
                        </p>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            Current theme: {isDark ? 'Dark' : 'Light'}
                          </span>
                        </div>
                      </div>

                      <div className={`p-4 rounded-xl ${
                        isDark 
                          ? 'bg-slate-700/30 border border-slate-600/30' 
                          : 'bg-slate-100/50 border border-slate-200/50'
                      }`}>
                        <h3 className={`font-semibold mb-3 ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          Data Export
                        </h3>
                        <p className={`text-sm mb-4 ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          Download your assessment data and reports
                        </p>
                        <motion.button
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isDark 
                              ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30' 
                              : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="flex items-center gap-2">
                            <FiDownload className="w-4 h-4" />
                            Export Data
                          </div>
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className={`text-2xl font-bold mb-6 ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      Security Settings
                    </h2>

                    <div className="space-y-6">
                      <div className={`p-4 rounded-xl ${
                        isDark 
                          ? 'bg-slate-700/30 border border-slate-600/30' 
                          : 'bg-slate-100/50 border border-slate-200/50'
                      }`}>
                        <h3 className={`font-semibold mb-3 ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          Change Password
                        </h3>
                        <p className={`text-sm mb-4 ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          Update your password to keep your account secure
                        </p>
                        <motion.button
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isDark 
                              ? 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 border border-yellow-500/30' 
                              : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border border-yellow-200'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="flex items-center gap-2">
                            <FiKey className="w-4 h-4" />
                            Change Password
                          </div>
                        </motion.button>
                      </div>

                      <div className={`p-4 rounded-xl ${
                        isDark 
                          ? 'bg-slate-700/30 border border-slate-600/30' 
                          : 'bg-slate-100/50 border border-slate-200/50'
                      }`}>
                        <h3 className={`font-semibold mb-3 ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          Two-Factor Authentication
                        </h3>
                        <p className={`text-sm mb-4 ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          Add an extra layer of security to your account
                        </p>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            Status: Disabled
                          </span>
                          <motion.button
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isDark 
                                ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30' 
                                : 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-200'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Enable 2FA
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className={`text-2xl font-bold mb-6 ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      Notification Preferences
                    </h2>

                    <div className="space-y-4">
                      {[
                        { label: 'Assessment Reminders', description: 'Get notified about upcoming assessments' },
                        { label: 'Rainfall Alerts', description: 'Receive weather updates for your area' },
                        { label: 'System Updates', description: 'Important platform announcements' },
                        { label: 'Weekly Reports', description: 'Summary of your water conservation progress' }
                      ].map((item, index) => (
                        <div key={index} className={`p-4 rounded-xl ${
                          isDark 
                            ? 'bg-slate-700/30 border border-slate-600/30' 
                            : 'bg-slate-100/50 border border-slate-200/50'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className={`font-semibold ${
                                isDark ? 'text-slate-200' : 'text-slate-800'
                              }`}>
                                {item.label}
                              </h3>
                              <p className={`text-sm ${
                                isDark ? 'text-slate-400' : 'text-slate-600'
                              }`}>
                                {item.description}
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'billing' && (
                  <motion.div
                    key="billing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className={`text-2xl font-bold mb-6 ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}>
                      Billing & Subscription
                    </h2>

                    <div className={`p-6 rounded-xl ${
                      isDark 
                        ? 'bg-slate-700/30 border border-slate-600/30' 
                        : 'bg-slate-100/50 border border-slate-200/50'
                    }`}>
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                          <span className="text-2xl">✓</span>
                        </div>
                        <h3 className={`text-xl font-semibold mb-2 ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          Free Plan
                        </h3>
                        <p className={`text-sm mb-4 ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          You're currently on our free plan with basic features
                        </p>
                        <motion.button
                          className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                            isDark 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Upgrade to Pro
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default User;
