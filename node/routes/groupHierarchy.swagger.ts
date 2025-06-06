/**
 * @swagger
 * tags:
 *   name: Group Hierarchy
 *   description: Group hierarchy management API
 */

/**
 * @swagger
 * /groups/hierarchy:
 *   get:
 *     summary: Get the complete group hierarchy with users
 *     tags: [Group Hierarchy]
 *     responses:
 *       200:
 *         description: The complete group hierarchy with users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: Group ID
 *                   name:
 *                     type: string
 *                     description: Group name
 *                   parent_id:
 *                     type: integer
 *                     nullable: true
 *                     description: Parent group ID
 *                   level:
 *                     type: integer
 *                     description: Group's level in the hierarchy (0 for root)
 *                   users:
 *                     type: array
 *                     description: Users directly assigned to this group
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           description: User ID
 *                         name:
 *                           type: string
 *                           description: User name
 *                         email:
 *                           type: string
 *                           description: User email
 *                         type:
 *                           type: string
 *                           enum: ['admin', 'regular']
 *                           description: User type
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /groups/{groupId}/parent:
 *   get:
 *     summary: Get the parent group of a group
 *     tags: [Group Hierarchy]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Group ID
 *     responses:
 *       200:
 *         description: The parent group
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Set the parent group of a group
 *     tags: [Group Hierarchy]
 *     parameters:
 *       - in: path
 *         name: groupId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parentId
 *             properties:
 *               parentId:
 *                 type: integer
 *                 nullable: true
 *                 description: ID of the parent group (null to remove parent)
 *     responses:
 *       200:
 *         description: Parent group updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Group not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
