/**
 * @swagger
 * tags:
 *   name: Health
 *   description: System health check API
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Get comprehensive system health status with enterprise monitoring data
 *     description: |
 *       Returns detailed system health information including:
 *       - API server metrics (memory, CPU, uptime)
 *       - Database status and performance metrics
 *       - Request statistics and error rates
 *       - Recent activity and alert history
 *       - Performance trends for monitoring dashboards
 *       - Environment and version information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Comprehensive system health status with enterprise monitoring data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                   description: Overall system status
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of the health check
 *                 service:
 *                   type: string
 *                   description: Service name
 *                   example: simplerqms-api
 *                 responseTime:
 *                   type: string
 *                   description: Response time for this health check
 *                   example: "15ms"
 *                 services:
 *                   type: object
 *                   properties:
 *                     api:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                           description: API service status
 *                         uptime:
 *                           type: number
 *                           description: API service uptime in seconds
 *                         uptimeFormatted:
 *                           type: string
 *                           description: Human-readable uptime
 *                           example: "2h 30m 45s"
 *                         memory:
 *                           type: object
 *                           properties:
 *                             rss:
 *                               type: string
 *                               description: Resident set size
 *                               example: "88.17 MB"
 *                             heapTotal:
 *                               type: string
 *                               description: Total heap size
 *                               example: "48.14 MB"
 *                             heapUsed:
 *                               type: string
 *                               description: Used heap size
 *                               example: "13.74 MB"
 *                             external:
 *                               type: string
 *                               description: External memory usage
 *                               example: "2.43 MB"
 *                             heapUsedPercentage:
 *                               type: number
 *                               description: Percentage of heap used
 *                               example: 29
 *                         cpu:
 *                           type: object
 *                           properties:
 *                             user:
 *                               type: number
 *                               description: User CPU time in milliseconds
 *                             system:
 *                               type: number
 *                               description: System CPU time in milliseconds
 *                         requests:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: number
 *                               description: Total number of requests processed
 *                             today:
 *                               type: number
 *                               description: Number of requests processed today
 *                             errors4xx:
 *                               type: number
 *                               description: Number of 4xx errors
 *                             errors5xx:
 *                               type: number
 *                               description: Number of 5xx errors
 *                             errorRate:
 *                               type: string
 *                               description: Error rate percentage
 *                               example: "2.5%"
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy, unhealthy]
 *                           description: Database service status
 *                         responseTime:
 *                           type: string
 *                           description: Database response time
 *                           example: "5ms"
 *                         name:
 *                           type: string
 *                           description: Database name
 *                         version:
 *                           type: string
 *                           description: Database version
 *                           example: "PostgreSQL 17.0"
 *                         connectionCount:
 *                           type: number
 *                           description: Current connection count
 *                         size:
 *                           type: string
 *                           description: Database size
 *                           example: "7779 kB"
 *                         activeConnections:
 *                           type: number
 *                           description: Number of active connections
 *                         statistics:
 *                           type: object
 *                           properties:
 *                             tables:
 *                               type: number
 *                               description: Number of tables
 *                             totalInserts:
 *                               type: number
 *                               description: Total insert operations
 *                             totalUpdates:
 *                               type: number
 *                               description: Total update operations
 *                             totalDeletes:
 *                               type: number
 *                               description: Total delete operations
 *                         error:
 *                           type: string
 *                           nullable: true
 *                           description: Error message if database check failed
 *                 data:
 *                   type: object
 *                   description: Application data counts
 *                   properties:
 *                     users:
 *                       type: number
 *                       description: Number of users in the system
 *                     groups:
 *                       type: number
 *                       description: Number of groups in the system
 *                     memberships:
 *                       type: number
 *                       description: Number of group memberships
 *                 recentActivity:
 *                   type: object
 *                   description: Recent system activity
 *                   properties:
 *                     lastUserCreated:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         name:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     lastGroupModified:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         name:
 *                           type: string
 *                         modifiedAt:
 *                           type: string
 *                           format: date-time
 *                 docker:
 *                   type: object
 *                   description: Docker container information
 *                   properties:
 *                     containerId:
 *                       type: string
 *                       description: Container ID
 *                     cpuPercentage:
 *                       type: string
 *                       description: CPU usage percentage
 *                     memoryUsage:
 *                       type: string
 *                       description: Memory usage
 *                     networkIO:
 *                       type: string
 *                       description: Network I/O statistics
 *                     status:
 *                       type: string
 *                       description: Status message if Docker stats unavailable
 *                 environment:
 *                   type: object
 *                   description: System environment information
 *                   properties:
 *                     nodeVersion:
 *                       type: string
 *                       description: Node.js version
 *                       example: "v23.0.0"
 *                     platform:
 *                       type: string
 *                       description: Operating system platform
 *                       example: "linux"
 *                     arch:
 *                       type: string
 *                       description: System architecture
 *                       example: "x64"
 *                     environment:
 *                       type: string
 *                       description: Application environment
 *                       example: "development"
 *                     pid:
 *                       type: number
 *                       description: Process ID
 *                     timezone:
 *                       type: string
 *                       description: System timezone
 *                 version:
 *                   type: object
 *                   description: Version information
 *                   properties:
 *                     api:
 *                       type: string
 *                       description: API version
 *                       example: "1.0.0"
 *                     node:
 *                       type: string
 *                       description: Node.js version
 *                       example: "v23.0.0"
 *                 performance:
 *                   type: object
 *                   description: Performance metrics for monitoring dashboards
 *                   properties:
 *                     history:
 *                       type: array
 *                       description: Historical performance data points
 *                       items:
 *                         type: object
 *                         properties:
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           responseTime:
 *                             type: number
 *                             description: Response time in milliseconds
 *                           memoryUsage:
 *                             type: number
 *                             description: Memory usage percentage
 *                           cpuUsage:
 *                             type: number
 *                             description: CPU usage in milliseconds
 *                           activeConnections:
 *                             type: number
 *                             description: Database active connections
 *                     current:
 *                       type: object
 *                       description: Current performance metrics
 *                       properties:
 *                         responseTime:
 *                           type: number
 *                         memoryUsage:
 *                           type: number
 *                         cpuUsage:
 *                           type: number
 *                         activeConnections:
 *                           type: number
 *                 alerts:
 *                   type: object
 *                   description: System alerts and monitoring
 *                   properties:
 *                     recent:
 *                       type: array
 *                       description: Recent alerts (last 10)
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Alert ID
 *                           type:
 *                             type: string
 *                             enum: [error, warning, info]
 *                             description: Alert type
 *                           message:
 *                             type: string
 *                             description: Alert message
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             description: Alert timestamp
 *                           resolved:
 *                             type: boolean
 *                             description: Whether the alert has been resolved
 *                     summary:
 *                       type: object
 *                       description: Alert summary statistics
 *                       properties:
 *                         total:
 *                           type: number
 *                           description: Total number of alerts
 *                         unresolved:
 *                           type: number
 *                           description: Number of unresolved alerts
 *                         lastAlert:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           description: Timestamp of the last alert
 *             examples:
 *               healthy_system:
 *                 summary: Example of a healthy system response
 *                 value:
 *                   status: "healthy"
 *                   timestamp: "2025-06-06T21:00:00.000Z"
 *                   service: "simplerqms-api"
 *                   responseTime: "15ms"
 *                   services:
 *                     api:
 *                       status: "healthy"
 *                       uptime: 7200
 *                       uptimeFormatted: "2h 0m 0s"
 *                       memory:
 *                         rss: "88.17 MB"
 *                         heapTotal: "48.14 MB"
 *                         heapUsed: "13.74 MB"
 *                         external: "2.43 MB"
 *                         heapUsedPercentage: 29
 *                       requests:
 *                         total: 150
 *                         today: 45
 *                         errors4xx: 2
 *                         errors5xx: 0
 *                         errorRate: "1.33%"
 *                     database:
 *                       status: "healthy"
 *                       responseTime: "5ms"
 *                       name: "simplerqms_test_db"
 *                       version: "PostgreSQL 17.0"
 *                       size: "7779 kB"
 *                       activeConnections: 2
 *                   data:
 *                     users: 5
 *                     groups: 8
 *                     memberships: 12
 *                   alerts:
 *                     summary:
 *                       total: 0
 *                       unresolved: 0
 *                       lastAlert: null
 *       500:
 *         description: Server error with system health details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 service:
 *                   type: string
 *                 responseTime:
 *                   type: string
 *                 services:
 *                   type: object
 *                   properties:
 *                     api:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [healthy]
 *                         uptime:
 *                           type: number
 *                         uptimeFormatted:
 *                           type: string
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [unhealthy]
 *                         error:
 *                           type: string
 *                 error:
 *                   type: string
 *                   description: Overall error message
 */
