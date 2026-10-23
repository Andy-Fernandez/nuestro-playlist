import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/nuestro-playlist/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false,
      registerType: 'prompt',
      manifest: {
        id: './',
        name: 'Loveline — Cassette Player',
        short_name: 'Loveline',
        description: 'Tu colección de mixtapes en una casetera que se siente real.',
        lang: 'es',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#222831',
        theme_color: '#222831',
        categories: ['music', 'entertainment'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        // Full local media is downloaded at installation, including every cassette layer.
        globPatterns: ['**/*.{js,css,html,svg,png,mp3,webmanifest}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
      devOptions: { enabled: false },
    }),
  ],
});
