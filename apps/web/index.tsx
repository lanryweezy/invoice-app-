import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './context/AuthContext';
import App from './App';

// Register service worker for PWA
registerSW({ immediate: true });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <AuthProvider>
        <App />
        <Analytics />
      </AuthProvider>
    </HelmetProvider>
  </React.StrictMode>
);
