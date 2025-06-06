import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../ssl/localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, '../ssl/localhost.pem')),
    },
    proxy: {
      '/api': {
        target: 'https://node:3000',
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/health': {
        target: 'https://node:3000',
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production',
      },
    },
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 5173,
      clientPort: 5173
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
