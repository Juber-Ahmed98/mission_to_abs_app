import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // The workbox glob below already precaches the icons from dist, so
      // neither includeAssets nor the plugin's manifest-icon auto-include may
      // add them again — duplicate manifest entries are benign while the
      // revisions match, install-breaking if they ever drift.
      includeManifestIcons: false,
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
        // The latin woff2 joins the precache so an offline cold start renders
        // on-brand — it covers every string the app itself draws (English +
        // general punctuation, 48 kB). The other six Inter subsets stay
        // runtime-fetched: they only matter for user-typed notes in non-Latin
        // scripts, which fall back to system fonts offline.
        globPatterns: [
          '**/*.{js,css,html,svg,png,ico}',
          'assets/inter-latin-wght-normal-*.woff2',
        ],
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
