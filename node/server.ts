import express from 'express';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './utils/sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// SSL certificate options with error handling
let httpsOptions;
try {
  httpsOptions = {
    key: fs.readFileSync('/app/ssl/key.pem'),
    cert: fs.readFileSync('/app/ssl/cert.pem'),
    requestCert: false,
    rejectUnauthorized: false,
  };
  console.log('SSL certificates loaded successfully');
} catch (error) {
  console.error('Error loading SSL certificates:', error);
  process.exit(1);
}

// CORS configuration
app.use(
  cors({
    origin: ['https://localhost:5173', 'https://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

interface HealthCheck {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  services: {
    api: {
      status: 'ok';
      uptime: number;
      memory: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
        arrayBuffers: number;
      };
    };
    database: {
      status: 'ok' | 'error' | 'unknown';
      error: string | null;
      lastCheck?: string;
      version?: string;
    };
  };
}

// Health check endpoint
app.get('/health', async (req, res) => {
  console.log('Health check requested');
  const memoryUsage = process.memoryUsage();
  console.log('Memory usage:', memoryUsage);

  const health: HealthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: {
        status: 'ok',
        uptime: process.uptime(),
        memory: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
          arrayBuffers: memoryUsage.arrayBuffers,
        },
      },
      database: {
        status: 'unknown',
        error: null,
      },
    },
  };

  try {
    console.log('Testing database connection...');
    // Test database connection with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    );

    const dbPromise = pool.unsafe('SELECT NOW(), version()');
    const result = await Promise.race([dbPromise, timeoutPromise]);
    console.log('Database result:', result);

    if (result && Array.isArray(result) && result.length > 0) {
      health.services.database.status = 'ok';
      health.services.database.lastCheck = result[0].now;
      health.services.database.version = result[0].version;
    } else {
      throw new Error('Invalid database response');
    }
  } catch (error) {
    console.error('Database health check error:', error);
    health.services.database.status = 'error';
    health.services.database.error =
      error instanceof Error ? error.message : 'Unknown error';
    health.status = 'degraded';
  }

  console.log('Sending health check response:', health);
  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// Import routes
import groupsRouter from './routes/groups.js';
import usersRouter from './routes/users.js';

// Use routes
app.use('/api/groups', groupsRouter);
app.use('/api/users', usersRouter);

const PORT = process.env.PORT || 3000;

// Create HTTPS server with error handling
const server = https.createServer(httpsOptions, app);

// Error handling for the server
server.on('error', (error: NodeJS.ErrnoException) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Start the server
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on https://0.0.0.0:${PORT}`);
  console.log('CORS enabled for:', [
    'https://localhost:5173',
    'https://127.0.0.1:5173',
  ]);
});
