import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      
      manifest: {
        name: 'JewelCalc - Jewelry Business Calculator',
        short_name: 'JewelCalc',
        description: 'Professional multi-tenant jewelry business calculation and pricing system for managing gold and silver inventory',
        theme_color: '#f59e0b',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ],
        
        categories: ['business', 'finance', 'productivity', 'utilities'],
        
        shortcuts: [
          {
            name: 'Calculator',
            short_name: 'Calc',
            description: 'Open jewelry calculator',
            url: '/calculator',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192'
              }
            ]
          }
        ]
      },
      
      workbox: {
        // Cache static assets only
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        
        // Add manifest to precache
        additionalManifestEntries: [
          { url: '/manifest.json', revision: null }
        ],
        
        // Runtime caching strategies
        runtimeCaching: [
          {
            // Cache static assets from CDN
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // DO NOT cache API calls - online-only requirement
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            // Cache images with network-first strategy
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ],
        
        // Skip waiting and claim clients
        skipWaiting: true,
        clientsClaim: true,
        
        // Clean old caches
        cleanupOutdatedCaches: true,
        
        // Navigation fallback
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/]
      },
      
      devOptions: {
        enabled: true, // Enable PWA in dev mode for testing
        type: 'module'
      }
    })
  ],
  
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  build: {
    // Optimize build
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-hot-toast']
        }
      }
    },
    // Source maps for production debugging
    sourcemap: false,
    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  }
})