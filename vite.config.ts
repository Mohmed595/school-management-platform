import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import esbuild from 'esbuild';

function dualCssPlugin(): Plugin {
  return {
    name: 'vite-plugin-dual-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(options, bundle) {
      // Read our dedicated, clean legacy stylesheet
      const legacyRawPath = path.resolve(__dirname, 'src/legacy.css');
      let legacySource = '';
      if (fs.existsSync(legacyRawPath)) {
        const rawContent = fs.readFileSync(legacyRawPath, 'utf-8');
        // Minify using esbuild targeting older browsers (chrome87 / edge88)
        const transformed = esbuild.transformSync(rawContent, {
          loader: 'css',
          minify: true,
          target: ['chrome87', 'edge88', 'firefox78', 'safari14'],
        });
        legacySource = transformed.code;
      }

      for (const [fileName, asset] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && !fileName.includes('-legacy') && asset.type === 'asset') {
          // Modern stylesheet is kept completely untouched with full Tailwind v4 features
          const legacyFileName = fileName.replace(/\.css$/, '-legacy.css');

          // Emit dedicated legacy stylesheet for older browsers
          this.emitFile({
            type: 'asset',
            fileName: legacyFileName,
            source: legacySource,
          });
        }
      }
    },
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const appCssRegex = /<link\b(?=[^>]*\brel=["']stylesheet["'])(?=[^>]*\bhref=["']((?:\/|\.\/)?assets\/[^"']+\.css)["'])[^>]*>/i;
        const match = html.match(appCssRegex);
        if (!match) {
          return html;
        }

        const modernCssUrl = match[1];
        const legacyCssUrl = modernCssUrl.replace(/\.css$/, '-legacy.css');

        // Early detection bootstrapper:
        // Runs in <head> BEFORE main app starts.
        // Decides which stylesheet to load and injects ONLY that stylesheet.
        // Edge 95-97 NEVER downloads or parses modernCssUrl.
        const bootstrapScript = `<script>
      (function() {
        var isModern = (function() {
          try {
            // 1. Feature check: Cascade layers (@layer) support in CSS OM (Chromium 99+, Safari 15.4+, Firefox 97+)
            if (!('CSSLayerBlockRule' in window)) return false;
            // 2. Feature check: window.CSS and CSS.supports
            if (!window.CSS || typeof window.CSS.supports !== 'function') return false;
            // 3. User-Agent isolated check for Edge < 99 and Chrome < 99
            var ua = navigator.userAgent || '';
            var edgeMatch = ua.match(/Edg(?:e)?\\/(\\d+)/);
            if (edgeMatch && parseInt(edgeMatch[1], 10) < 99) return false;
            var chromeMatch = ua.match(/Chrome\\/(\\d+)/);
            if (chromeMatch && !ua.match(/Edg/) && parseInt(chromeMatch[1], 10) < 99) return false;
            return true;
          } catch (e) {
            return false;
          }
        })();

        var mode = isModern ? 'modern' : 'legacy';
        window.__MADRASETY_BROWSER_MODE__ = mode;
        document.documentElement.setAttribute('data-browser-mode', mode);

        var href = isModern ? '${modernCssUrl}' : '${legacyCssUrl}';
        try {
          document.write('<link rel="stylesheet" href="' + href + '">');
        } catch (e) {
          var link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = href;
          document.head.appendChild(link);
        }
      })();
    </script>
    <noscript><link rel="stylesheet" crossorigin href="${modernCssUrl}"></noscript>`;

        // Remove the matched modern stylesheet link tag so it is never loaded unconditionally
        const cleanHtml = html.replace(match[0], '');

        // Insert the early bootstrapper BEFORE any <script type="module" in <head>
        const moduleScriptRegex = /<script\b[^>]*type=["']module["'][^>]*>/i;
        const moduleMatch = cleanHtml.match(moduleScriptRegex);
        if (moduleMatch) {
          return cleanHtml.replace(moduleMatch[0], `${bootstrapScript}\n    ${moduleMatch[0]}`);
        } else {
          return cleanHtml.replace('</head>', `    ${bootstrapScript}\n  </head>`);
        }
      },
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      dualCssPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg', 'icon-maskable.svg'],
        manifest: {
          id: '/',
          name: 'Madrasety',
          short_name: 'Madrasety',
          description: 'منصة مدرستي المتكاملة لإدارة المدارس والطلاب وأولياء الأمور والمعلمين',
          lang: 'ar',
          dir: 'rtl',
          start_url: '/?source=pwa',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait-primary',
          theme_color: '#1E40AF',
          background_color: '#F8FAFC',
          related_applications: [
            {
              platform: 'webapp',
              url: '/manifest.webmanifest',
              id: '/',
            },
          ],
          prefer_related_applications: false,
          launch_handler: {
            client_mode: ['focus-existing', 'auto'],
          },
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,mp3}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: ['es2020', 'chrome87', 'edge88', 'firefox78', 'safari14'],
      cssTarget: ['chrome87', 'edge88', 'firefox78', 'safari14'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
