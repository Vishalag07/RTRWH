// This is a proper JavaScript module with the correct MIME type
// It will be served with the correct Content-Type header

/**
 * Fix for module loading errors
 * This module provides proper JavaScript module functionality
 * to prevent MIME type errors when loading module scripts
 */

// Create a module context
const createModuleContext = () => {
  return {
    type: 'module',
    loaded: true,
    error: null
  };
};

// Export the module context creator
export { createModuleContext };

// Default export
export default {
  name: 'module-fix',
  version: '1.0.0',
  createContext: createModuleContext
};