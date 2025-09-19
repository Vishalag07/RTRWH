
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';
import LoadingSpinner from './LoadingSpinner';

const Layout: React.FC = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for smooth page transitions
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Ensure new pages open scrolled to top (prevents landing on footer)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-gradient-to-br from-blue-900/80 to-slate-900/80 backdrop-blur-sm"
          >
            <LoadingSpinner 
              variant="dots" 
              size="lg" 
              text="Loading application..." 
            />
          </motion.div>
        ) : (
          <PageTransition transitionType="slide" duration={0.4}>
            <motion.main 
              key="content"
              className="flex-1 pt-20"
            >
              <Outlet />
            </motion.main>
          </PageTransition>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
};

export default Layout;
