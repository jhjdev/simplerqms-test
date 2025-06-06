import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sql from './utils/sql.js';
import { setupSwagger } from './swagger-setup.js';
import { initializeDatabase } from './utils/db-init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Express = express();

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://your-production-domain.com']
        : ['https://localhost:5173', 'https://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

// Setup Swagger
setupSwagger(app);

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
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Test database connection
    await sql`SELECT 1`;
    res.json({
      status: 'ok',
      services: {
        api: {
          status: 'ok',
          uptime: process.uptime(),
        },
        database: {
          status: 'ok',
        },
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      services: {
        api: {
          status: 'ok',
          uptime: process.uptime(),
        },
        database: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    });
  }
});

// Import routes
import groupsRouter from './routes/groups.js';
import usersRouter from './routes/users.js';

// Use routes
app.use('/api/groups', groupsRouter);
app.use('/api/users', usersRouter);

// SSL configuration
const httpsOptions = {
  key: fs.readFileSync(path.resolve(__dirname, '../ssl/localhost-key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, '../ssl/localhost.pem')),
  requestCert: process.env.NODE_ENV === 'production',
  rejectUnauthorized: process.env.NODE_ENV === 'production',
};

const server = https.createServer(httpsOptions, app);

const PORT = process.env.PORT || 3000;

// Initialize database before starting server
initializeDatabase().catch(console.error);

server.listen(PORT, () => {
  console.log(`Server is running on https://localhost:${PORT}`);
  console.log(
    `Swagger documentation available at https://localhost:${PORT}/api-docs`
  );
});
