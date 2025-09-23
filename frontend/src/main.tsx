import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';
import { ThemeProvider } from './components/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import ErrorPage from './components/ErrorPage';
import ErrorBoundary from './components/ErrorBoundary';
import './services/i18n';
import './styles.css';

// Lazy-loaded pages
const Landing = lazy(() => import('./pages/Landing'));
const Assessment = lazy(() => import('./pages/Assessment'));
const Results = lazy(() => import('./pages/Results'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PredictionDashboard = lazy(() => import('./pages/PredictionDashboard'));
const Auth = lazy(() => import('./pages/Auth'));
const User = lazy(() => import('./pages/User'));
const Chat = lazy(() => import('./pages/Chat'));
// Removed heatmapanalysis page
const VisualAquiferDepthDisplay = lazy(() => import('./pages/VisualAquiferDepthDisplay'));
const Gamification = lazy(() => import('./pages/Gamification'));
const GroundwaterApiDemo = lazy(() => import('./components/GroundwaterApiDemo'));
const Subsidy = lazy(() => import('./pages/Subsidy'));
 

const router = createBrowserRouter(
  [
    {
      element: <Layout />,
      errorElement: <ErrorPage />,
      children: [
        { path: '/', element: <Suspense fallback={<div>Loading...</div>}><Landing /></Suspense> },
        { path: '/assess', element: <Suspense fallback={<div>Loading...</div>}><Assessment /></Suspense> },
        { path: '/results/:id', element: <Suspense fallback={<div>Loading...</div>}><Results /></Suspense> },
        { path: '/results', element: <Suspense fallback={<div>Loading...</div>}><Results /></Suspense> },
        { 
          path: '/dashboard', 
          element: <DashboardLayout />,
          children: [
            { path: '', element: <Suspense fallback={<div>Loading...</div>}><Dashboard /></Suspense> },
            { path: 'predict', element: <Suspense fallback={<div>Loading...</div>}><PredictionDashboard /></Suspense> },
            { path: 'results/:id', element: <Suspense fallback={<div>Loading...</div>}><Results /></Suspense> },
            { path: 'assess', element: <Suspense fallback={<div>Loading...</div>}><Assessment /></Suspense> },
            { path: 'chat', element: <Suspense fallback={<div>Loading...</div>}><Chat /></Suspense> },
            { path: 'user', element: <Suspense fallback={<div>Loading...</div>}><User /></Suspense> },
            { path: 'subsidy', element: <Suspense fallback={<div>Loading...</div>}><Subsidy /></Suspense> },
            { path: 'aquifer-visualization', element: <Suspense fallback={<div>Loading...</div>}><VisualAquiferDepthDisplay /></Suspense> },
          ]
        },
        { path: '/predict', element: <Suspense fallback={<div>Loading...</div>}><PredictionDashboard /></Suspense> },
        { path: '/auth', element: <Suspense fallback={<div>Loading...</div>}><Auth /></Suspense> },
        { path: '/user', element: <Suspense fallback={<div>Loading...</div>}><User /></Suspense> },
        { path: '/chat', element: <Suspense fallback={<div>Loading...</div>}><Chat /></Suspense> },
        { path: '/subsidy', element: <Suspense fallback={<div>Loading...</div>}><Subsidy /></Suspense> },
        { path: '/aquifer-visualization', element: <Suspense fallback={<div>Loading...</div>}><VisualAquiferDepthDisplay /></Suspense> },
        { path: '/gamification', element: <Suspense fallback={<div>Loading...</div>}><Gamification /></Suspense> },
        { path: '/api-demo', element: <Suspense fallback={<div>Loading...</div>}><GroundwaterApiDemo /></Suspense> },
        // Additional routes for footer links
        { path: '/contact', element: <Suspense fallback={<div>Loading...</div>}><div className="p-8 text-center"><h1 className="text-2xl font-bold">Contact Us</h1><p className="mt-4">Contact page coming soon...</p></div></Suspense> },
        { path: '/privacy', element: <Suspense fallback={<div>Loading...</div>}><div className="p-8 text-center"><h1 className="text-2xl font-bold">Privacy Policy</h1><p className="mt-4">Privacy policy coming soon...</p></div></Suspense> },
        { path: '/terms', element: <Suspense fallback={<div>Loading...</div>}><div className="p-8 text-center"><h1 className="text-2xl font-bold">Terms of Service</h1><p className="mt-4">Terms of service coming soon...</p></div></Suspense> },
        { path: '/docs', element: <Suspense fallback={<div>Loading...</div>}><div className="p-8 text-center"><h1 className="text-2xl font-bold">Documentation</h1><p className="mt-4">Documentation coming soon...</p></div></Suspense> },
        { path: '/api', element: <Suspense fallback={<div>Loading...</div>}><div className="p-8 text-center"><h1 className="text-2xl font-bold">API Reference</h1><p className="mt-4">API reference coming soon...</p></div></Suspense> },
        { path: '/help', element: <Suspense fallback={<div>Loading...</div>}><div className="p-8 text-center"><h1 className="text-2xl font-bold">Help Center</h1><p className="mt-4">Help center coming soon...</p></div></Suspense> },
        { path: '/community', element: <Suspense fallback={<div>Loading...</div>}><div className="p-8 text-center"><h1 className="text-2xl font-bold">Community</h1><p className="mt-4">Community page coming soon...</p></div></Suspense> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_fetcherPersist: true
    }
  }
);

function App() {
  return <RouterProvider router={router} />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
