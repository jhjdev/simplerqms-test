import { Router, Request, Response, RequestHandler } from 'express';
import sql from '../utils/db.js';

const router = Router();

interface GroupParams {
  id: string;
}

interface GroupMemberParams extends GroupParams {
  memberId: string;
}

interface GroupMember {
  id: number;
  group_id: number;
  member_id: number;
  member_type: string;
  name?: string;
}

// Get all members of a group
router.get('/:id/members', (async (
  req: Request<GroupParams>,
  res: Response
) => {
  const { id } = req.params;

  try {
    // Check if group exists
    const [group] = await sql`
      SELECT id FROM groups WHERE id = ${id}
    `;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const members = await sql`
      SELECT 
        gm.id,
        gm.group_id,
        gm.member_id,
        gm.member_type,
        CASE 
          WHEN gm.member_type = 'user' THEN u.name
          WHEN gm.member_type = 'group' THEN g.name
        END as name
      FROM group_members gm
      LEFT JOIN users u ON gm.member_type = 'user' AND gm.member_id = u.id
      LEFT JOIN groups g ON gm.member_type = 'group' AND gm.member_id = g.id
      WHERE gm.group_id = ${id}
      ORDER BY gm.member_type DESC, gm.member_id
    `;

    res.json(members);
  } catch (error) {
    console.error('Error getting group members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler<GroupParams>);

// Add a member to a group
router.post('/:id/members', (async (
  req: Request<GroupParams>,
  res: Response
) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Check if group exists
    const [group] = await sql`
      SELECT id FROM groups WHERE id = ${id}
    `;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if user exists
    const [user] = await sql`
      SELECT id FROM users WHERE id = ${userId}
    `;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already in the group
    const [existingMember] = await sql`
      SELECT id FROM group_members
      WHERE group_id = ${id}
      AND member_id = ${userId}
      AND member_type = 'user'
    `;
    if (existingMember) {
      return res.status(400).json({ error: 'User is already in the group' });
    }

    const [newMember] = await sql`
      INSERT INTO group_members (group_id, member_id, member_type)
      VALUES (${id}, ${userId}, 'user')
      RETURNING id, group_id, member_id, member_type
    `;

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Error adding group member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler<GroupParams>);

// Remove a member from a group
router.delete('/:id/members/:memberId', (async (
  req: Request<GroupMemberParams>,
  res: Response
) => {
  const { id, memberId } = req.params;

  try {
    // Check if group exists
    const [group] = await sql`
      SELECT id FROM groups WHERE id = ${id}
    `;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check if member exists in the group
    const [member] = await sql`
      SELECT id FROM group_members
      WHERE group_id = ${id}
      AND member_id = ${memberId}
    `;
    if (!member) {
      return res.status(404).json({ error: 'Member not found in group' });
    }

    await sql`
      DELETE FROM group_members
      WHERE group_id = ${id}
      AND member_id = ${memberId}
    `;

    res.status(204).send();
  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler<GroupMemberParams>);

export default router;
