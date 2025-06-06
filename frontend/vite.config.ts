import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import fs from 'fs';
import path from 'path';
import history from 'connect-history-api-fallback';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  appType: 'spa',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    https: {
      key: fs.readFileSync('/app/ssl/localhost-key.pem'),
      cert: fs.readFileSync('/app/ssl/localhost.pem'),
    },
    proxy: {
      '/api': {
        target: 'https://node:3000',
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production',
      },
      '^/health$': {
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
    },
    fs: {
      allow: ['..', '/app']
    },
    cors: true
  },
  preview: {
    port: 5173,
    strictPort: true,
    https: {
      key: fs.readFileSync('/app/ssl/localhost-key.pem'),
      cert: fs.readFileSync('/app/ssl/localhost.pem'),
    }
  },
  configureServer(server) {
    const historyMiddleware = history({
      index: '/index.html',
      rewrites: [
        { from: /^\/api\/.*$/, to: function(context) { return context.parsedUrl.pathname; } },
        { from: /^\/health$/, to: function(context) { return context.parsedUrl.pathname; } },
      ],
      verbose: true
    });
    
    server.middlewares.use(historyMiddleware);
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
