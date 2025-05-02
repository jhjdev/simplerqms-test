import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import sql from '../utils/db.js';

interface CreateUserRequest {
  name: string;
  email: string;
  type: string;
  groupId?: string;
}

const router = express.Router();

// Get all users
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
  try {
    // Get all users with their groups
    const usersWithGroups = await sql`
      SELECT 
        u.*,
        array_agg(g.id) FILTER (WHERE g.id IS NOT NULL) as group_ids,
        array_agg(g.name) FILTER (WHERE g.name IS NOT NULL) as group_names
      FROM users u
      LEFT JOIN group_members gm ON u.id = gm.member_id AND gm.member_type = 'user'
      LEFT JOIN groups g ON gm.group_id = g.id
      GROUP BY u.id
    `;
    
    // Transform the result to match the expected format
    const users = usersWithGroups.map(user => {
      // If user has groups, use the first one consistently
      const hasGroups = user.group_ids && user.group_ids.length > 0;
      return {
        ...user,
        group_id: hasGroups ? user.group_ids[0] : null,
        group_name: hasGroups ? user.group_names[0] : null,
        // Remove the arrays to keep the response clean
        group_ids: undefined,
        group_names: undefined
      };
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
  })().catch(next);
});

// Update a user
router.patch('/:id', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
  try {
    const { id } = req.params;
    const { name, email, groupId } = req.body;
    console.log('Updating user:', { id, name, email, groupId });

    // Update user details
    const result = await sql`
      UPDATE users
      SET name = ${name}, email = ${email}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, email
    `;

    if (result.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Handle group membership
    // First, remove any existing group memberships
    await sql`
      DELETE FROM group_members
      WHERE member_id = ${id} AND member_type = 'user'
    `;

    // If a group is specified, add the user to that group
    if (groupId) {
      console.log('Adding user to group:', groupId);
      await sql`
        INSERT INTO group_members (group_id, member_id, member_type)
        VALUES (${groupId}, ${id}, 'user')
      `;
    }

    // Get updated user with group info
    const updatedUser = await sql`
      SELECT 
        u.*,
        g.id as group_id,
        g.name as group_name
      FROM users u
      LEFT JOIN group_members gm ON u.id = gm.member_id AND gm.member_type = 'user'
      LEFT JOIN groups g ON gm.group_id = g.id
      WHERE u.id = ${id}
    `;

    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
  })().catch(next);
});

// Delete a user
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
  try {
    const { id } = req.params;

    // First delete from group_members
    await sql`
      DELETE FROM group_members
      WHERE member_id = ${id} AND member_type = 'user'
    `;

    // Then delete the user
    const result = await sql`
      DELETE FROM users
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
  })().catch(next);
});

// Create a new user
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
  try {
    const { name, email, type, groupId } = req.body;
    
    if (!name || !email || !type) {
      return res.status(400).json({ error: 'Name, email, and type are required' });
    }

    if (type !== 'user') {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Create the user first
    const result = await sql`
      INSERT INTO users (name, email, type)
      VALUES (${name}, ${email}, ${type})
      RETURNING *
    `;

    // If a group is specified, add the user to that group
    if (groupId) {
      await sql`
        INSERT INTO group_members (group_id, member_id, member_type)
        VALUES (${groupId}, ${result[0].id}, 'user')
      `;
    }

    // Return the created user
    res.json(result[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
  })().catch(next);
});

// Check if a user is within a group hierarchy
router.get('/:id/groups', (req: Request, res: Response, next: NextFunction) => {
  (async () => {
  try {
    const { id } = req.params;
    const result = await sql`
      WITH RECURSIVE group_hierarchy AS (
        SELECT id, parent_id, 0 AS level
        FROM group_members
        WHERE member_id = ${id} AND member_type = 'user'
        UNION ALL
        SELECT gm.id, gm.parent_id, level + 1
        FROM group_members gm
        JOIN group_hierarchy gh ON gm.parent_id = gh.id
      )
      SELECT *
      FROM group_hierarchy
    `;
    res.json(result);
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ error: 'Failed to fetch user groups' });
  }
  })().catch(next);
});

export default router;
