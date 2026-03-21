import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  // Root is the frontend folder — vite.config.js lives here
  root: '.',

  // Load .env from the project root (one level up from frontend/)
  envDir: path.resolve(__dirname, '..'),

  server: {
    port: 5173,
    proxy: {
      // Forward /api requests to the Express backend during development
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Output built assets to frontend/dist
    outDir: 'dist',
    emptyOutDir: true,
  },
});
