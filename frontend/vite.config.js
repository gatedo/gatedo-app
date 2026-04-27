import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      manifest: {
        name: 'Gatedo',
        short_name: 'Gatedo',
        description: 'Seu app de gestão felina',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#8B4AFF', // Cor da barra de status no mobile
        background_color: '#eeeeff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            bg_color: '#823fff' // Cor de fundo do ícone no Android
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            bg_color: '#823fff' // Cor de fundo do ícone no Android
          }
        ]
      }
    })
  ]
});
