import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// In development mode, if a legacy browser is detected, switch style to legacy
if (import.meta.env.DEV) {
  if (typeof window !== 'undefined' && window.__MADRASETY_BROWSER_MODE__ === 'legacy') {
    document.querySelectorAll('style[data-vite-dev-id*="index.css"]').forEach((el) => {
      el.remove();
    });
    import('./legacy.css');
  }
}

// Register PWA service worker in production only.
// In development, vite-plugin-pwa injects registerDevSW() automatically
// (see the <script id="vite-plugin-pwa:register-dev-sw"> tag in index.html).
// Calling registerSW() here as well causes duplicate SW registration in dev mode,
// which can lead to blank/white page issues.
if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      // Automatically claim and update to latest version seamlessly
    },
    onOfflineReady() {
      // App assets ready for offline caching
    },
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
