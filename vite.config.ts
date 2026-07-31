import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'app-icon.svg',
        'app-icon-maskable.svg',
        'app-icon-192.png',
        'app-icon-512.png',
      ],
      manifest: {
        name: 'Mission to Abs',
        short_name: 'AbsMission',
        description: '15-week body recomposition mission.',
        theme_color: '#F4F1E6',
        background_color: '#F4F1E6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'app-icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
          { src: 'app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: {
    host: true,
    // PORT lets a second dev server (e.g. another editor session) pick a free
    // port; defaults to Vite's 5173 otherwise.
    port: Number(process.env.PORT) || 5173,
  },
});
