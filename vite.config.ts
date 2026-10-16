
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  const base = '/BritsFit/';

  return {
    base,

    plugins: [
      react(),
      tailwindcss(),

      VitePWA({
        registerType: 'autoUpdate',

        includeAssets: [
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'assets/britsfit-logo.svg',
          'assets/britsfit-logo.png',
          'assets/britsfit-icon.png',
          'assets/britsfit-splash.png',
        ],

        manifest: {
          id: base,
          name: 'BritsFit - Personal & Family Fitness Tracker',
          short_name: 'BritsFit',
          description:
            'Comprehensive personal and family fitness tracker for workouts, running, walking, body measurements, daily habits, and progress analytics.',
          theme_color: '#102B55',
          background_color: '#102B55',
          display: 'standalone',
          start_url: base,
          scope: base,

          icons: [
            {
              src: `${base}pwa-192x192.png`,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${base}pwa-512x512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: `${base}pwa-maskable-512x512.png`,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },

        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
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

    server: {
      // Preserve the AI Studio HMR configuration.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
