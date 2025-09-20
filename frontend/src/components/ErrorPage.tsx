import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { motion } from 'framer-motion';

function ErrorPage() {
  const error = useRouteError();
  console.error('ErrorPage - Full error details:', error);
  
  // Extract more detailed error information
  const getErrorDetails = () => {
    if (isRouteErrorResponse(error)) {
      return {
        type: 'Route Error',
        status: error.status,
        statusText: error.statusText,
        message: error.data?.message || 'Route error occurred',
        data: error.data
      };
    }
    
    if (error instanceof Error) {
      return {
        type: 'JavaScript Error',
        name: error.name,
        message: error.message,
        stack: error.stack
      };
    }
    
    // Handle React errors (including minified ones)
    if (typeof error === 'string') {
      return {
        type: 'String Error',
        message: error
      };
    }
    
    if (typeof error === 'object' && error !== null) {
      return {
        type: 'Object Error',
        message: JSON.stringify(error, null, 2)
      };
    }
    
    return {
      type: 'Unknown Error',
      message: String(error)
    };
  };
  
  const errorDetails = getErrorDetails();

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full border border-blue-100"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <motion.div 
          className="w-16 h-16 mx-auto mb-4 bg-red-100 text-red-500 rounded-full flex items-center justify-center"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </motion.div>
        
        <motion.h1 
          className="text-2xl font-bold text-center text-gray-800 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {errorDetails.type}
        </motion.h1>
        
        <motion.p 
          className="text-gray-600 text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {errorDetails.message}
        </motion.p>
        
        {/* Show additional error details in development */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div 
            className="bg-gray-100 rounded-lg p-4 mb-6 text-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <h3 className="font-semibold text-gray-800 mb-2">Debug Information:</h3>
            <pre className="text-xs text-gray-600 overflow-auto max-h-40">
              {JSON.stringify(errorDetails, null, 2)}
            </pre>
          </motion.div>
        )}
        
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <a 
            href="/"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg"
          >
            Return to Home
          </a>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default ErrorPage;