import * as express from 'express';
const groupMemberRouter = express.Router();

import sql from '../utils/db.ts';

// Add a member to a group
groupMemberRouter.post('/:groupId/members', async function (req, res, next) {
  const { groupId } = req.params;
  const { memberId, memberType } = req.body;
  const result = await sql`
    INSERT INTO group_members (group_id, member_id, member_type)
    VALUES (${groupId}, ${memberId}, ${memberType})
    RETURNING *
  `;
  res.json(result[0]);
});

// List all members of a group
groupMemberRouter.get('/:groupId/members', async function (req, res, next) {
  const { groupId } = req.params;
  const result = await sql`
    SELECT *
    FROM group_members
    WHERE group_id = ${groupId}
  `;
  res.json(result);
});

// Remove a member from a group
groupMemberRouter.delete(
  '/:groupId/members/:memberId',
  async function (req, res, next) {
    const { groupId, memberId } = req.params;
    await sql`
    DELETE FROM group_members
    WHERE group_id = ${groupId} AND member_id = ${memberId}
  `;
    res.status(204).send();
  }
);

export default groupMemberRouter;
