// This file is used to fix the module loading error
// It provides a proper JavaScript module that can be imported

// Apollo client message handler
const handleApolloMessage = (message) => {
  console.log('Apollo DevTools message handled properly', message);
  return true;
};

// Connection handler to prevent "Receiving end does not exist" error
const connectToDevTools = () => {
  // Create a mock connection object to prevent errors
  const connection = {
    onMessage: { addListener: () => {} },
    onDisconnect: { addListener: () => {} },
    postMessage: () => {}
  };
  return connection;
};

// Export the handler functions
export { handleApolloMessage, connectToDevTools };

// Default export
export default {
  version: '1.0.0',
  name: 'RTRWH Content Module',
  connect: connectToDevTools
};