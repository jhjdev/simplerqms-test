import * as express from 'express';
import sql from '../utils/sql.js';
import { execSync } from 'child_process';
const router = express.Router();

// Request tracking
let requestStats = {
  total: 0,
  today: 0,
  errors4xx: 0,
  errors5xx: 0,
  lastReset: new Date().toDateString()
};

// Alert history tracking
interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

let alertHistory: Alert[] = [];
let alertIdCounter = 1;

// Performance metrics for sparklines
interface PerformanceMetric {
  timestamp: Date;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

let performanceHistory: PerformanceMetric[] = [];
const MAX_PERFORMANCE_HISTORY = 20; // Keep last 20 data points

// Helper function to add alert
function addAlert(type: Alert['type'], message: string) {
  const alert: Alert = {
    id: `alert_${alertIdCounter++}`,
    type,
    message,
    timestamp: new Date(),
    resolved: false
  };
  
  alertHistory.unshift(alert); // Add to beginning
  
  // Keep only last 50 alerts
  if (alertHistory.length > 50) {
    alertHistory = alertHistory.slice(0, 50);
  }
  
  console.log(`🚨 Alert [${type.toUpperCase()}]: ${message}`);
}

// Middleware to track requests
router.use((req, res, next) => {
  const today = new Date().toDateString();
  if (requestStats.lastReset !== today) {
    requestStats.today = 0;
    requestStats.lastReset = today;
  }
  
  requestStats.total++;
  requestStats.today++;
  
  // Track response status codes
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      requestStats.errors4xx++;
    } else if (res.statusCode >= 500) {
      requestStats.errors5xx++;
    }
    return originalSend.call(this, data);
  };
  
  next();
});

/* Hello World function. */
router.get('/', function(req, res, next) {
  res.json({ title: 'Hello World!' });
});

/* Enhanced Health check endpoint with comprehensive metrics */
router.get('/health', async function(req, res, next) {
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
        relname as tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
      FROM pg_stat_user_tables
      ORDER BY schemaname, relname
    `;
    
    // Get user and group counts
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    const groupCount = await sql`SELECT COUNT(*) as count FROM groups`;
    const membershipCount = await sql`SELECT COUNT(*) as count FROM group_members`;
    
    // Get recent activity
    const recentUser = await sql`SELECT name, created_at FROM users ORDER BY created_at DESC LIMIT 1`;
    const recentGroup = await sql`SELECT name, updated_at FROM groups ORDER BY updated_at DESC LIMIT 1`;
    
    // Get database size and connection info
    const dbSize = await sql`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as size,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as active_connections
    `;
    
    // Get Docker container info (if running in Docker)
    let dockerInfo = null;
    try {
      const containerId = execSync('hostname', { encoding: 'utf8' }).trim();
      const dockerStats = execSync(`docker stats ${containerId} --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"`, { encoding: 'utf8' });
      const statsLines = dockerStats.split('\n');
      if (statsLines.length > 1) {
        const stats = statsLines[1].split('\t');
        dockerInfo = {
          containerId: containerId,
          cpuPercentage: stats[0] || 'N/A',
          memoryUsage: stats[1] || 'N/A',
          networkIO: stats[2] || 'N/A'
        };
      }
    } catch (e) {
      // Not running in Docker or docker command not available
      dockerInfo = { status: 'Not running in Docker or stats unavailable' };
    }
    
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
    
    // Add performance data point for sparklines
    const performancePoint: PerformanceMetric = {
      timestamp: new Date(),
      responseTime: responseTime,
      memoryUsage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
      cpuUsage: Math.round((cpuUsage.user + cpuUsage.system) / 1000),
      activeConnections: parseInt(dbSize[0].active_connections)
    };
    
    performanceHistory.push(performancePoint);
    
    // Keep only recent data points
    if (performanceHistory.length > MAX_PERFORMANCE_HISTORY) {
      performanceHistory = performanceHistory.slice(-MAX_PERFORMANCE_HISTORY);
    }
    
    // Check for alert conditions
    const errorRate = ((requestStats.errors4xx + requestStats.errors5xx) / requestStats.total * 100);
    const memoryPercentage = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
    
    // Generate alerts based on thresholds
    if (errorRate > 5 && requestStats.total > 10) {
      addAlert('warning', `High error rate detected: ${errorRate.toFixed(2)}%`);
    }
    
    if (memoryPercentage > 80) {
      addAlert('warning', `High memory usage: ${memoryPercentage}%`);
    }
    
    if (responseTime > 1000) {
      addAlert('warning', `Slow response time: ${responseTime}ms`);
    }
    
    if (dbResponseTime > 500) {
      addAlert('warning', `Slow database response: ${dbResponseTime}ms`);
    }
    
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
            user: Math.round(cpuUsage.user / 1000),
            system: Math.round(cpuUsage.system / 1000)
          },
          requests: {
            total: requestStats.total,
            today: requestStats.today,
            errors4xx: requestStats.errors4xx,
            errors5xx: requestStats.errors5xx,
            errorRate: ((requestStats.errors4xx + requestStats.errors5xx) / requestStats.total * 100).toFixed(2) + '%'
          }
        },
        database: {
          status: 'healthy',
          responseTime: `${dbResponseTime}ms`,
          name: dbResult[0].database_name,
          version: dbResult[0].database_version?.split(' ')[0] + ' ' + dbResult[0].database_version?.split(' ')[1],
          connectionCount: parseInt(dbResult[0].connection_count),
          size: dbSize[0].size,
          activeConnections: parseInt(dbSize[0].active_connections),
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
      recentActivity: {
        lastUserCreated: recentUser[0] ? {
          name: recentUser[0].name,
          createdAt: recentUser[0].created_at
        } : null,
        lastGroupModified: recentGroup[0] ? {
          name: recentGroup[0].name,
          modifiedAt: recentGroup[0].updated_at
        } : null
      },
      docker: dockerInfo,
      environment: environmentInfo,
      version: {
        api: process.env.npm_package_version || '1.0.0',
        node: process.version
      },
      performance: {
        history: performanceHistory.map(point => ({
          timestamp: point.timestamp.toISOString(),
          responseTime: point.responseTime,
          memoryUsage: point.memoryUsage,
          cpuUsage: point.cpuUsage,
          activeConnections: point.activeConnections
        })),
        current: {
          responseTime: responseTime,
          memoryUsage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
          cpuUsage: Math.round((cpuUsage.user + cpuUsage.system) / 1000),
          activeConnections: parseInt(dbSize[0].active_connections)
        }
      },
      alerts: {
        recent: alertHistory.slice(0, 10).map(alert => ({
          id: alert.id,
          type: alert.type,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
          resolved: alert.resolved
        })),
        summary: {
          total: alertHistory.length,
          unresolved: alertHistory.filter(a => !a.resolved).length,
          lastAlert: alertHistory.length > 0 ? alertHistory[0].timestamp.toISOString() : null
        }
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


export default router;
