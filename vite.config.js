import { defineConfig } from 'vite';

// base './' para funcionar dentro do aplicativo Android (Capacitor) e offline.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', chunkSizeWarningLimit: 2000 },
  server: { port: 5173 },
});
