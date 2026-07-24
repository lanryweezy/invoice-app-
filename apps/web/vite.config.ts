import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/blog': {
            target: 'http://localhost:4000',
            changeOrigin: true,
          },
          '/templates': {
            target: 'http://localhost:4000',
            changeOrigin: true,
          }
        }
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,json}'],
            navigateFallbackDenylist: [/^\/blog/, /^\/templates/],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'gstatic-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              },
              {
                urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'unsplash-images-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30 // <== 30 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          },
          manifest: {
            name: 'InvoiceApp',
            short_name: 'InvoiceApp',
            description: 'Professional invoices for Nigerian freelancers and small businesses.',
            theme_color: '#0f172a',
            icons: [
              {
                src: 'favicon.svg',
                sizes: '192x192',
                type: 'image/svg+xml'
              },
              {
                src: 'favicon.svg',
                sizes: '512x512',
                type: 'image/svg+xml'
              }
            ]
          }
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
