import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Not the default `assets`: that would collide with the Asset Library's
    // /assets route, so reloading that page would hit the directory instead.
    assetsDir: 'static',
    rollupOptions: {
      output: {
        // Recharts and React change far less often than app code, so they get
        // their own chunks and stay cached across deploys.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
