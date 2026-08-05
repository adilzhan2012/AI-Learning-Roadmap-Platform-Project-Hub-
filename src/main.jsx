import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/app.css';
import { initTheme } from './theme.js';
import * as Sentry from '@sentry/react';
import { initGA, initClarity } from './lib/analytics.js';

// Initialize Sentry
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Initialize Analytics
initGA();
initClarity();

initTheme();

// Suppress benign internal Firebase IndexedDB errors from bubbling up to Sentry
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message) {
    const msg = event.reason.message;
    if (msg.includes("Failed to execute 'transaction' on 'IDBDatabase': The database connection is closing") || msg === 'Aa') {
      event.preventDefault(); // Stop the error from surfacing or breaking the app
    }
  }
});
ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
