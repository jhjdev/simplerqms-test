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
 *     summary: Get system health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [ok, degraded, error]
 *                   description: Overall system status
 *                 services:
 *                   type: object
 *                   properties:
 *                     api:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [ok]
 *                           description: API service status
 *                         uptime:
 *                           type: number
 *                           description: API service uptime in seconds
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [ok, error, unknown]
 *                           description: Database service status
 *                         error:
 *                           type: string
 *                           nullable: true
 *                           description: Error message if database check failed
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
