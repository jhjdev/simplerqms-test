import * as express from 'express';
import {
  Request,
  Response,
  NextFunction,
  Router,
  RequestHandler,
} from 'express';
import { Row } from 'postgres';
import type { Sql } from 'postgres';
const router: Router = express.Router();

import sql from '../utils/sql.js';

interface Group {
  id: number;
  name: string;
  parent_id: number | null;
  members?: Array<{ id: number; type: string }>;
}

interface GroupHierarchy extends Group {
  parent_id: number | null;
  level: number;
  users: Array<{ id: number; name: string; type: string }>;
}

interface GroupParams {
  id: string;
}

interface GroupMember {
  id: number;
  name: string;
  email?: string;
  type: 'user' | 'group';
}

interface GroupWithCounts {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
  user_count: string;
  group_count: string;
  users: GroupMember[];
  children: GroupWithCounts[];
  userCount: number;
  groupCount: number;
  totalCount: number;
}

// Get all groups
router.get('/', (async (_req: Request, res: Response) => {
  try {
    const groups = await sql`
      SELECT id, name, parent_id
      FROM groups
      ORDER BY id
    `;
    res.json(groups);
  } catch (error) {
    console.error('Error getting groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

// Create a new group
router.post('/', (async (req: Request, res: Response) => {
  const { name, parent_id } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    let level = 0;
    // If parent_id is provided, check if it exists and get its level
    if (parent_id !== undefined && parent_id !== null) {
      const [parentGroup] = await sql`
        SELECT id, level FROM groups WHERE id = ${parent_id}
      `;
      if (!parentGroup) {
        return res.status(404).json({ error: 'Parent group not found' });
      }
      level = parentGroup.level + 1;
    }

    // Start a transaction
    const result = await sql.begin(async (sql: Sql) => {
      // Create the new group
      const [newGroup] = await sql`
        INSERT INTO groups (name, parent_id, level)
        VALUES (${name}, ${parent_id ?? null}, ${level})
        RETURNING id, name, parent_id, level
      `;

      // If this is a child group, add it to the group_members table
      if (parent_id !== undefined && parent_id !== null) {
        await sql`
          INSERT INTO group_members (group_id, member_id, member_type)
          VALUES (${parent_id}, ${newGroup.id}, 'group')
        `;
      }

      return newGroup;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

// Update a group
router.patch('/:id', (async (req: Request<GroupParams>, res: Response) => {
  const { id } = req.params;
  const { name, parent_id } = req.body;

  if (!name && parent_id === undefined) {
    return res
      .status(400)
      .json({ error: 'At least one field (name or parent_id) is required' });
  }

  try {
    // Check if group exists
    const [group] = await sql`
      SELECT id FROM groups WHERE id = ${id}
    `;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // If parent_id is provided, check if it exists
    if (parent_id !== undefined) {
      const [parentGroup] = await sql`
        SELECT id FROM groups WHERE id = ${parent_id}
      `;
      if (!parentGroup) {
        return res.status(404).json({ error: 'Parent group not found' });
      }
    }

    const [updatedGroup] = await sql`
      UPDATE groups
      SET 
        name = COALESCE(${name}, name),
        parent_id = COALESCE(${parent_id}, parent_id)
      WHERE id = ${id}
      RETURNING id, name, parent_id
    `;

    res.json(updatedGroup);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler<GroupParams>);

// Get all members of a group (from groupMembers.ts)
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

// Add a member to a group (from groupMembers.ts)
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

// Remove a member from a group (from groupMembers.ts)
router.delete('/:id/members/:memberId', (async (
  req: Request<GroupParams & { memberId: string }>,
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

    const result = await sql`
      DELETE FROM group_members
      WHERE group_id = ${id}
      AND member_id = ${memberId}
      RETURNING *
    `;

    res
      .status(200)
      .json({ message: 'Member removed successfully', deleted: result[0] });
  } catch (error) {
    console.error('Error removing group member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler<GroupParams & { memberId: string }>);

// Delete a group
router.delete('/:id', (async (req: Request<GroupParams>, res: Response) => {
  const { id } = req.params;

  try {
    // Check if group exists
    const [group] = await sql`
      SELECT id FROM groups WHERE id = ${id}
    `;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    await sql`
      DELETE FROM groups WHERE id = ${id}
    `;

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler<GroupParams>);

// Get group hierarchy
router.get('/hierarchy', (async (_req: Request, res: Response) => {
  try {
    // Get all groups with their users and counts
    const groups = await sql`
      WITH RECURSIVE group_hierarchy AS (
        SELECT 
          g.id,
          g.name,
          g.parent_id,
          g.level,
          COALESCE(
            json_agg(
              jsonb_build_object(
                'id', u.id,
                'name', u.name,
                'email', u.email,
                'type', 'user'
              )
            ) FILTER (WHERE u.id IS NOT NULL),
            '[]'::json
          ) as users,
          COUNT(DISTINCT CASE WHEN gm.member_type = 'user' THEN gm.member_id END) as user_count,
          COUNT(DISTINCT CASE WHEN gm.member_type = 'group' THEN gm.member_id END) as group_count
        FROM groups g
        LEFT JOIN group_members gm ON g.id = gm.group_id
        LEFT JOIN users u ON gm.member_id = u.id AND gm.member_type = 'user'
        GROUP BY g.id, g.name, g.parent_id, g.level
      )
      SELECT * FROM group_hierarchy
      ORDER BY name
    `;

    // Build hierarchy
    const groupMap = new Map();
    const rootGroups = [];

    // First pass: create group objects
    for (const group of groups) {
      const userCount = parseInt(group.user_count) || 0;
      const groupCount = parseInt(group.group_count) || 0;
      groupMap.set(group.id, {
        ...group,
        children: [],
        users: group.users || [],
        userCount,
        groupCount,
        totalCount: userCount + groupCount,
      });
    }

    // Second pass: build hierarchy and calculate total counts
    for (const group of groups) {
      const groupObj = groupMap.get(group.id);
      if (group.parent_id) {
        const parent = groupMap.get(group.parent_id);
        if (parent) {
          parent.children.push(groupObj);
          // Add this group's total count to parent's total count
          parent.totalCount += groupObj.totalCount;
        }
      } else {
        rootGroups.push(groupObj);
      }
    }

    res.json(rootGroups);
  } catch (error) {
    console.error('Error getting group hierarchy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

// Check if a member is in a group hierarchy
router.post('/:id/check-membership', (async (
  req: Request<GroupParams>,
  res: Response
) => {
  const { id } = req.params;
  const { memberId, memberType } = req.body;

  if (!memberId || !memberType) {
    return res
      .status(400)
      .json({ error: 'memberId and memberType are required' });
  }

  if (!['user', 'group'].includes(memberType)) {
    return res
      .status(400)
      .json({ error: 'memberType must be either "user" or "group"' });
  }

  try {
    // Check if group exists
    const [group] = await sql`
      SELECT id FROM groups WHERE id = ${id}
    `;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const result = await sql`
      WITH RECURSIVE group_hierarchy AS (
        SELECT g.id, g.parent_id
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.member_id = ${memberId} AND gm.member_type = ${memberType}
        UNION
        SELECT g.id, g.parent_id
        FROM groups g
        JOIN group_hierarchy gh ON g.id = gh.parent_id
      )
      SELECT EXISTS (SELECT 1 FROM group_hierarchy WHERE id = ${id}) as is_member
    `;

    res.json({ isMember: result[0].is_member });
  } catch (error) {
    console.error('Error checking membership:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler<GroupParams>);

// Get all members in a group hierarchy
router.get('/:id/all-members', (async (
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

    // This CTE gets all descendant groups including the selected group
    const members = await sql`
      WITH RECURSIVE group_hierarchy AS (
        SELECT id FROM groups WHERE id = ${id}
        UNION ALL
        SELECT g.id FROM groups g JOIN group_hierarchy gh ON g.parent_id = gh.id
      )
      SELECT DISTINCT
        gm.member_id as id,
        CASE 
          WHEN gm.member_type = 'user' THEN u.name
          WHEN gm.member_type = 'group' THEN g2.name
        END as name,
        CASE 
          WHEN gm.member_type = 'user' THEN u.email
          ELSE NULL
        END as email,
        gm.member_type as type
      FROM group_hierarchy gh
      JOIN group_members gm ON gm.group_id = gh.id
      LEFT JOIN users u ON gm.member_type = 'user' AND gm.member_id = u.id
      LEFT JOIN groups g2 ON gm.member_type = 'group' AND gm.member_id = g2.id
      ORDER BY gm.member_type DESC, name
    `;

    // Format the response to match what the frontend expects
    const formattedResponse = {
      users: (members as unknown as GroupMember[])
        .filter((m) => m.type === 'user')
        .map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          type: u.type,
        })),
      groups: (members as unknown as GroupMember[]).filter(
        (m) => m.type === 'group'
      ),
    };

    res.json(formattedResponse);
  } catch (error) {
    console.error('Error getting all members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler<GroupParams>);

// Get all groups for select boxes
router.get('/all', (async (_req: Request, res: Response) => {
  try {
    const groups = await sql`
      WITH RECURSIVE group_hierarchy AS (
        SELECT id, name, parent_id, 0 as level, created_at, updated_at
        FROM groups
        WHERE parent_id IS NULL
        UNION ALL
        SELECT g.id, g.name, g.parent_id, gh.level + 1, g.created_at, g.updated_at
        FROM groups g
        JOIN group_hierarchy gh ON g.parent_id = gh.id
      )
      SELECT 
        id,
        name,
        parent_id,
        level,
        created_at,
        updated_at
      FROM group_hierarchy 
      ORDER BY level, name
    `;

    // Format the response to include the full path for each group
    const formattedGroups = groups.map((group: Row) => {
      const parent = groups.find((g: Row) => g.id === group.parent_id);
      const name = group.parent_id
        ? `${parent?.name} > ${group.name} (ID: ${group.id})`
        : `${group.name} (ID: ${group.id})`;
      return {
        ...group,
        name,
      };
    });

    res.json(formattedGroups);
  } catch (error) {
    console.error('Error getting all groups:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}) as RequestHandler);

export default router;
