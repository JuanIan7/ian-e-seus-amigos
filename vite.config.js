import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// base './' para funcionar dentro do aplicativo Android (Capacitor) e offline.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist', chunkSizeWarningLimit: 2000,
    // viewer.html: página de apoio para conferir os modelos 3D (não é aberta pelo jogo)
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), viewer: resolve(__dirname, 'viewer.html') } },
  },
  server: { port: 5173 },
});
