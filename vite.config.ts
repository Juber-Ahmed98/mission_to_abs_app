import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['app-icon.svg'],
      manifest: {
        name: 'Mission to Abs',
        short_name: 'AbsMission',
        description: '15-week body recomposition mission.',
        theme_color: '#FFFFFF',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
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
