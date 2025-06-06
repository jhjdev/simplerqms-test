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

// Health check endpoint with comprehensive metrics
app.get('/health', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Test database connection and get metrics
    const dbStartTime = Date.now();
    const dbResult = await sql`SELECT 
      COUNT(*) as connection_count,
      current_database() as database_name,
      version() as database_version
    `;
    const dbResponseTime = Date.now() - dbStartTime;
    
    // Get database table statistics
    const tableStats = await sql`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
      FROM pg_stat_user_tables
      ORDER BY schemaname, tablename
    `;
    
    // Get user and group counts
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const groupCount = await sql`SELECT COUNT(*) as count FROM groups`;
    const membershipCount = await sql`SELECT COUNT(*) as count FROM group_members`;
    
    // System metrics
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();
    
    // Environment info
    const environmentInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'simplerqms-api',
      responseTime: `${responseTime}ms`,
      services: {
        api: {
          status: 'healthy',
          uptime: Math.floor(uptime),
          uptimeFormatted: formatUptime(uptime),
          memory: {
            rss: formatBytes(memoryUsage.rss),
            heapTotal: formatBytes(memoryUsage.heapTotal),
            heapUsed: formatBytes(memoryUsage.heapUsed),
            external: formatBytes(memoryUsage.external),
            heapUsedPercentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
          },
          cpu: {
            user: Math.round(cpuUsage.user / 1000), // Convert to milliseconds
            system: Math.round(cpuUsage.system / 1000)
          }
        },
        database: {
          status: 'healthy',
          responseTime: `${dbResponseTime}ms`,
          name: dbResult[0].database_name,
          version: dbResult[0].database_version?.split(' ')[0] + ' ' + dbResult[0].database_version?.split(' ')[1],
          connectionCount: parseInt(dbResult[0].connection_count),
          statistics: {
            tables: tableStats.length,
            totalInserts: tableStats.reduce((sum, table) => sum + parseInt(table.inserts || 0), 0),
            totalUpdates: tableStats.reduce((sum, table) => sum + parseInt(table.updates || 0), 0),
            totalDeletes: tableStats.reduce((sum, table) => sum + parseInt(table.deletes || 0), 0)
          }
        }
      },
      data: {
        users: parseInt(userCount[0].count),
        groups: parseInt(groupCount[0].count),
        memberships: parseInt(membershipCount[0].count)
      },
      environment: environmentInfo,
      version: {
        api: process.env.npm_package_version || '1.0.0',
        node: process.version
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    const responseTime = Date.now() - startTime;
    
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'simplerqms-api',
      responseTime: `${responseTime}ms`,
      services: {
        api: {
          status: 'healthy',
          uptime: Math.floor(process.uptime()),
          uptimeFormatted: formatUptime(process.uptime()),
        },
        database: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown database error',
        },
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to format uptime
function formatUptime(uptimeSeconds: number): string {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

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
