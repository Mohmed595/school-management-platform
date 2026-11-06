/**
 * Madrasety Browser Compatibility Layer
 * Detects whether the current browser supports modern CSS features (Tailwind v4, Cascade Layers, modern color spaces)
 * or requires the legacy compatible stylesheet (e.g. Edge 95/96/97, Chrome < 99).
 */

export type BrowserMode = 'modern' | 'legacy';

declare global {
  interface Window {
    __MADRASETY_BROWSER_MODE__?: BrowserMode;
  }
}

/**
 * Early detection function used both in HTML <head> bootstrapper and React runtime.
 */
export function detectBrowserMode(): BrowserMode {
  try {
    // 1. Feature check: Cascade layers (@layer) support in CSS OM (Chromium 99+, Safari 15.4+, Firefox 97+)
    if (!('CSSLayerBlockRule' in window)) {
      return 'legacy';
    }

    // 2. Feature check: window.CSS and CSS.supports
    if (!window.CSS || typeof window.CSS.supports !== 'function') {
      return 'legacy';
    }

    // 3. User-Agent isolated check for Edge < 99 and Chrome < 99
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      const ua = navigator.userAgent;
      
      const edgeMatch = ua.match(/Edg(?:e)?\/(\d+)/);
      if (edgeMatch && parseInt(edgeMatch[1], 10) < 99) {
        return 'legacy';
      }

      const chromeMatch = ua.match(/Chrome\/(\d+)/);
      if (chromeMatch && !ua.match(/Edg/) && parseInt(chromeMatch[1], 10) < 99) {
        return 'legacy';
      }
    }

    return 'modern';
  } catch (e) {
    return 'legacy';
  }
}

/**
 * Returns current browser mode, defaulting to window.__MADRASETY_BROWSER_MODE__ if initialized
 */
export function getBrowserMode(): BrowserMode {
  if (typeof window !== 'undefined' && window.__MADRASETY_BROWSER_MODE__) {
    return window.__MADRASETY_BROWSER_MODE__;
  }
  return detectBrowserMode();
}

/**
 * Hook to read browser mode in React components where UI presentation adjustments are needed.
 */
export function useBrowserMode(): BrowserMode {
  return getBrowserMode();
}
