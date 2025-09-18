import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
  transitionType?: 'fade' | 'slide' | 'scale' | 'none';
  duration?: number;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  transitionType = 'fade',
  duration = 0.3,
}) => {
  const location = useLocation();
  
  // Define different transition variants
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.05 },
    },
    none: {
      initial: {},
      animate: {},
      exit: {},
    },
  };
  
  // Select the appropriate variant
  const selectedVariant = variants[transitionType];
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={selectedVariant.initial}
        animate={selectedVariant.animate}
        exit={selectedVariant.exit}
        transition={{
          duration,
          ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier for smooth transitions
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;