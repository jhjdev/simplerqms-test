import { Router, Request, Response, RequestHandler } from 'express';
import { Row } from 'postgres';
import sql from '../utils/sql.js';

const router = Router();

interface UserParams {
  id: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  type: string;
  created_at: Date;
  updated_at: Date;
}

interface CreateUserRequest {
  name: string;
  email: string;
  type: string;
  groupId?: number;
}

// Get all users
router.get('/', (async (_req: Request, res: Response) => {
  try {
    const users = await sql`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.type, 
        u.created_at, 
        u.updated_at,
        g.id as group_id,
        g.name as group_name
      FROM users u
      LEFT JOIN group_members gm ON u.id = gm.member_id AND gm.member_type = 'user'
      LEFT JOIN groups g ON gm.group_id = g.id
      ORDER BY u.id
    `;

    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

// Create a new user
router.post('/', (async (req: Request, res: Response) => {
  const { name, email, type = 'user' } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const result = await sql`
      INSERT INTO users (name, email)
      VALUES (${name}, ${email})
      RETURNING id, name, email, created_at
    `;

    const user = result[0];

    // If a group is specified, add the user to that group
    if (req.body.groupId) {
      await sql`
        INSERT INTO group_members (group_id, member_id, member_type)
        VALUES (${req.body.groupId}, ${user.id}, 'user')
      `;
    }

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

// Update a user
router.patch('/:id', (async (req: Request<UserParams>, res: Response) => {
  const { id } = req.params;
  const { name, email, groupId } = req.body;

  if (!name && !email && !groupId) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  try {
    // Check if user exists
    const [user] = await sql`
      SELECT id FROM users WHERE id = ${id}
    `;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user fields
    if (name || email) {
      await sql`
        UPDATE users
        SET 
          name = COALESCE(${name}, name),
          email = COALESCE(${email}, email),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
    }

    // Handle group membership
    if (groupId) {
      // Check if group exists
      const [group] = await sql`
        SELECT id FROM groups WHERE id = ${groupId}
      `;
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Remove user from all groups
      await sql`
        DELETE FROM group_members
        WHERE member_id = ${id}
        AND member_type = 'user'
      `;

      // Add user to new group
      await sql`
        INSERT INTO group_members (group_id, member_id, member_type)
        VALUES (${groupId}, ${id}, 'user')
      `;
    }

    // Get updated user with group
    const [updatedUser] = await sql`
      SELECT u.*, g.id as group_id, g.name as group_name
      FROM users u
      LEFT JOIN group_members gm ON gm.member_id = u.id AND gm.member_type = 'user'
      LEFT JOIN groups g ON g.id = gm.group_id
      WHERE u.id = ${id}
    `;

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler<UserParams>);

// Delete a user
router.delete('/:id', (async (req: Request<UserParams>, res: Response) => {
  const { id } = req.params;

  try {
    // Check if user exists
    const [user] = await sql`
      SELECT id FROM users WHERE id = ${id}
    `;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // First remove the user from all groups
    await sql`
      DELETE FROM group_members 
      WHERE member_id = ${id} 
      AND member_type = 'user'
    `;

    // Then delete the user
    await sql`
      DELETE FROM users WHERE id = ${id}
    `;

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler<UserParams>);

// Get user's groups
router.get('/:id/groups', (async (req: Request<UserParams>, res: Response) => {
  const { id } = req.params;

  try {
    // Check if user exists
    const [user] = await sql`
      SELECT id FROM users WHERE id = ${id}
    `;
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const groups = await sql`
      SELECT g.id, g.name
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.member_id = ${id}
      AND gm.member_type = 'user'
      ORDER BY g.id
    `;

    res.json(groups);
  } catch (error) {
    console.error('Error getting user groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler<UserParams>);

export default router;
