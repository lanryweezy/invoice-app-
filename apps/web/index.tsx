import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { registerSW } from 'virtual:pwa-register';
import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './src/index.css';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE || 'development',
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.5,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  enabled: import.meta.env.MODE === 'production' && !!import.meta.env.VITE_SENTRY_DSN,
});

// Register service worker for PWA
registerSW({ immediate: true });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={({error, resetError}) => <div className="p-8 text-center"><h2 className="text-xl font-bold text-red-600 mb-2">Crash: {error?.message}</h2><pre className="text-left bg-slate-100 p-4 text-xs overflow-auto">{error?.stack}</pre></div>}>
      <HelmetProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <Toaster richColors position="bottom-center" theme="light" />
            <Analytics />
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
