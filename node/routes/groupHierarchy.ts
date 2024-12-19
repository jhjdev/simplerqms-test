import * as express from 'express';
const groupHierarchyRouter = express.Router();

import sql from '../utils/db.ts';

// Get all members within a group hierarchy
groupHierarchyRouter.get('/:groupId/members', async function (req, res, next) {
  const { groupId } = req.params;
  const result = await sql`
    WITH RECURSIVE group_hierarchy AS (
      SELECT id, parent_id, 0 AS level
      FROM group_members
      WHERE group_id = ${groupId}
      UNION ALL
      SELECT gm.id, gm.parent_id, level + 1
      FROM group_members gm
      JOIN group_hierarchy gh ON gm.parent_id = gh.id
    )
    SELECT *
    FROM group_hierarchy
  `;
  res.json(result);
});

export default groupHierarchyRouter;
