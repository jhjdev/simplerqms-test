import * as express from 'express';
const router = express.Router();

import sql from '../utils/db.js';

// Create a new group
// Update a group
router.patch('/:id', async function (req, res, next) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const result = await sql`
      UPDATE groups
      SET name = ${name}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name
    `;

    if (result.length === 0) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    res.json(result[0]);
  } catch (error: any) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: error?.message || 'Failed to update group' });
  }
});

// Delete a group
router.delete('/:id', async function (req, res, next) {
  try {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM groups
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    res.json({ message: 'Group deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: error?.message || 'Failed to delete group' });
  }
});

// Create a new group
router.post('/', async function (req, res, next) {
  try {
    const { name, parentId } = req.body;

    // First create the group
    const newGroup = await sql`
      INSERT INTO groups (name)
      VALUES (${name})
      RETURNING id, name
    `;

    if (!newGroup || newGroup.length === 0) {
      throw new Error('Failed to create group');
    }

    // If there's a parent ID, create the relationship
    if (parentId) {
      try {
        await sql`
          INSERT INTO group_members (group_id, member_id, member_type)
          VALUES (${parentId}, ${newGroup[0].id}, 'group')
        `;
      } catch (err) {
        // If creating the relationship fails, delete the group
        await sql`DELETE FROM groups WHERE id = ${newGroup[0].id}`;
        throw new Error('Failed to create group relationship');
      }
    }

    res.json({
      id: newGroup[0].id,
      name: newGroup[0].name
    });
  } catch (error: any) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: error?.message || 'Failed to create group' });
  }
});

// List all groups
router.get('/', async function (req, res, next) {
  try {
    const result = await sql`
      SELECT g.*, 
             COALESCE(json_agg(
               json_build_object(
                 'id', m.member_id,
                 'type', m.member_type
               )
             ) FILTER (WHERE m.member_id IS NOT NULL), '[]') as members
      FROM groups g
      LEFT JOIN group_members m ON g.id = m.group_id
      GROUP BY g.id
    `;
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: error?.message || 'Failed to fetch groups' });
  }
});

// Get group hierarchy
router.get('/hierarchy', async function (req, res, next) {
  const result = await sql`
    WITH RECURSIVE group_tree AS (
      -- Base case: groups that are not members of any other group
      SELECT g.id, g.name, NULL::integer as parent_id, 0 as level
      FROM groups g
      WHERE NOT EXISTS (
        SELECT 1 FROM group_members gm 
        WHERE gm.member_id = g.id AND gm.member_type = 'group'
      )
      
      UNION ALL
      
      -- Recursive case: get child groups and users
      SELECT g.id, g.name, gm.group_id as parent_id, gt.level + 1
      FROM groups g
      JOIN group_members gm ON g.id = gm.member_id AND gm.member_type = 'group'
      JOIN group_tree gt ON gm.group_id = gt.id
    )
    SELECT 
      t.id,
      t.name,
      t.parent_id,
      t.level,
      COALESCE(json_agg(
        json_build_object(
          'id', u.id,
          'name', u.name,
          'type', 'user'
        )
        ORDER BY u.name
      ) FILTER (WHERE u.id IS NOT NULL), '[]') as users
    FROM group_tree t
    LEFT JOIN group_members gm ON t.id = gm.group_id AND gm.member_type = 'user'
    LEFT JOIN users u ON gm.member_id = u.id
    GROUP BY t.id, t.name, t.parent_id, t.level
    ORDER BY t.level, t.name;
  `;
  res.json(result);
});

// Get a group by ID
router.get('/:id', async function (req, res, next) {
  const { id } = req.params;
  const result = await sql`
    SELECT g.*, 
           COALESCE(json_agg(
             json_build_object(
               'id', m.member_id,
               'type', m.member_type
             )
           ) FILTER (WHERE m.member_id IS NOT NULL), '[]') as members
    FROM groups g
    LEFT JOIN group_members m ON g.id = m.group_id
    WHERE g.id = ${id}
    GROUP BY g.id
  `;
  res.json(result[0]);
});

// Update a group
router.patch('/:id', async function (req, res, next) {
  const { id } = req.params;
  const { name } = req.body;
  const result = await sql`
    UPDATE groups
    SET name = ${name}
    WHERE id = ${id}
    RETURNING *
  `;
  res.json(result[0]);
});

// Delete a group
router.delete('/:id', async function (req, res, next) {
  const { id } = req.params;
  await sql`
    WITH RECURSIVE group_tree AS (
      SELECT id FROM groups WHERE id = ${id}
      UNION ALL
      SELECT g.id
      FROM groups g
      JOIN group_members gm ON g.id = gm.member_id
      JOIN group_tree gt ON gm.group_id = gt.id
      WHERE gm.member_type = 'group'
    )
    DELETE FROM groups
    WHERE id IN (SELECT id FROM group_tree)
  `;
  res.status(204).send();
});

// Check if a member is within a group hierarchy
router.post('/:id/check-membership', (req, res, next) => {
  (async () => {
  try {
    const { id } = req.params;
    const { memberId, memberType } = req.body;
    
    if (!memberId || !memberType) {
      return res.status(400).json({ error: 'memberId and memberType are required' });
    }
    
    if (memberType !== 'user' && memberType !== 'group') {
      return res.status(400).json({ error: 'memberType must be either \'user\' or \'group\'' });
    }
    
    // First check if the group exists
    const groupExists = await sql`
      SELECT id FROM groups WHERE id = ${id}
    `;
    
    if (groupExists.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if the member exists
    if (memberType === 'user') {
      const userExists = await sql`
        SELECT id FROM users WHERE id = ${memberId}
      `;
      
      if (userExists.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
    } else {
      const groupExists = await sql`
        SELECT id FROM groups WHERE id = ${memberId}
      `;
      
      if (groupExists.length === 0) {
        return res.status(404).json({ error: 'Member group not found' });
      }
    }
    
    // Use a recursive CTE to get all groups in the hierarchy
    const result = await sql`
      WITH RECURSIVE group_hierarchy AS (
        -- Base case: the starting group
        SELECT g.id, g.name, g.parent_id, ARRAY[g.name::text] AS path
        FROM groups g
        WHERE g.id = ${id}
        
        UNION ALL
        
        -- Recursive case: all child groups
        SELECT g.id, g.name, g.parent_id, gh.path || g.name::text
        FROM groups g
        JOIN group_members gm ON g.id = gm.member_id AND gm.member_type = 'group'
        JOIN group_hierarchy gh ON gm.group_id = gh.id
      )
      -- Check if the member is in any of these groups
      SELECT EXISTS (
        SELECT 1
        FROM group_members gm
        JOIN group_hierarchy gh ON gm.group_id = gh.id
        WHERE gm.member_id = ${memberId} AND gm.member_type = ${memberType}
      ) AS is_member,
      (
        SELECT gh.path
        FROM group_members gm
        JOIN group_hierarchy gh ON gm.group_id = gh.id
        WHERE gm.member_id = ${memberId} AND gm.member_type = ${memberType}
        LIMIT 1
      ) AS path
    `;
    
    const isMember = result[0]?.is_member || false;
    const path = result[0]?.path || [];
    
    res.json({
      isMember,
      path
    });
  } catch (error) {
    console.error('Error checking membership:', error);
    res.status(500).json({ error: 'Failed to check membership' });
  }
  })().catch(next);
});

// Get all members within a group hierarchy
router.get('/:id/all-members', (req, res, next) => {
  (async () => {
  try {
    const { id } = req.params;
    
    // First check if the group exists
    const groupExists = await sql`
      SELECT id FROM groups WHERE id = ${id}
    `;
    
    if (groupExists.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Use a recursive CTE to get all groups in the hierarchy
    const result = await sql`
      WITH RECURSIVE group_hierarchy AS (
        -- Base case: the starting group
        SELECT g.id, g.name, g.parent_id, ARRAY[g.name::text] AS path
        FROM groups g
        WHERE g.id = ${id}
        
        UNION ALL
        
        -- Recursive case: all child groups
        SELECT g.id, g.name, g.parent_id, gh.path || g.name::text
        FROM groups g
        JOIN group_members gm ON g.id = gm.member_id AND gm.member_type = 'group'
        JOIN group_hierarchy gh ON gm.group_id = gh.id
      ),
      -- Get all users in these groups
      users_in_hierarchy AS (
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          gh.path
        FROM users u
        JOIN group_members gm ON u.id = gm.member_id AND gm.member_type = 'user'
        JOIN group_hierarchy gh ON gm.group_id = gh.id
      ),
      -- Get all groups in the hierarchy (excluding the starting group)
      groups_in_hierarchy AS (
        SELECT 
          gh.id, 
          gh.name, 
          gh.path[1:array_length(gh.path, 1)-1] AS path
        FROM group_hierarchy gh
        WHERE gh.id != ${id}
      )
      -- Combine the results
      SELECT 
        json_build_object(
          'users', COALESCE(json_agg(u.*) FILTER (WHERE u.id IS NOT NULL), '[]'),
          'groups', COALESCE(json_agg(g.*) FILTER (WHERE g.id IS NOT NULL), '[]')
        ) AS result
      FROM (
        SELECT NULL::integer AS id, NULL::varchar AS name, NULL::varchar AS email, NULL::text[] AS path
      ) dummy_u
      CROSS JOIN (
        SELECT NULL::integer AS id, NULL::varchar AS name, NULL::text[] AS path
      ) dummy_g
      LEFT JOIN users_in_hierarchy u ON true
      LEFT JOIN groups_in_hierarchy g ON true
    `;
    
    res.json(result[0]?.result || { users: [], groups: [] });
  } catch (error) {
    console.error('Error getting all members:', error);
    res.status(500).json({ error: 'Failed to get all members' });
  }
  })().catch(next);
});

export default router;
