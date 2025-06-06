import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import fs from 'fs';
import path from 'path';
import history from 'connect-history-api-fallback';

// Check if SSL certificates exist (for Docker environment)
const sslKeyPath = '/app/ssl/localhost-key.pem';
const sslCertPath = '/app/ssl/localhost.pem';
const hasSSL = fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  appType: 'spa',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    ...(hasSSL && {
      https: {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
      },
    }),
    proxy: {
      '/api': {
        target: 'https://node:3000',
        changeOrigin: true,
        secure: false, // Accept self-signed certificates
      },
      '^/health$': {
        target: 'https://node:3000',
        changeOrigin: true,
        secure: false, // Accept self-signed certificates
      },
    },
    hmr: {
      protocol: hasSSL ? 'wss' : 'ws',
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
    ...(hasSSL && {
      https: {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath),
      },
    })
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
