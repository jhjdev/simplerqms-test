import { mockDb } from './mocks/db.js';

const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
  return mockDb.sql(strings, ...values);
};

describe('PostgreSQL Database', () => {
  beforeEach(async () => {
    // Clean up the database before each test
    await sql`TRUNCATE users, groups, group_members CASCADE`;
  });

  describe('User Operations', () => {
    it('should insert and retrieve a user', async () => {
      const [user] = await sql`
        INSERT INTO users (name, email, type)
        VALUES ('Test User', 'test@example.com', 'user')
        RETURNING *
      `;
      expect(user).toHaveProperty('id');
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.type).toBe('user');

      const [retrievedUser] = await sql`
        SELECT * FROM users WHERE id = ${user.id}
      `;
      expect(retrievedUser).toEqual(user);
    });

    it('should get all users', async () => {
      const [user1] = await sql`
        INSERT INTO users (name, email, type)
        VALUES ('User 1', 'user1@example.com', 'user')
        RETURNING *
      `;
      const [user2] = await sql`
        INSERT INTO users (name, email, type)
        VALUES ('User 2', 'user2@example.com', 'user')
        RETURNING *
      `;

      const users = await sql`SELECT * FROM users ORDER BY id`;
      expect(users).toHaveLength(2);
      expect(users[0]).toEqual(user1);
      expect(users[1]).toEqual(user2);
    });

    it('should update a user', async () => {
      const [user] = await sql`
        INSERT INTO users (name, email, type)
        VALUES ('Test User', 'test@example.com', 'user')
        RETURNING *
      `;

      const [updatedUser] = await sql`
        UPDATE users
        SET name = 'Updated User', email = 'updated@example.com'
        WHERE id = ${user.id}
        RETURNING *
      `;

      expect(updatedUser).toHaveProperty('id', user.id);
      expect(updatedUser).toHaveProperty('name', 'Updated User');
      expect(updatedUser).toHaveProperty('email', 'updated@example.com');
    });

    it('should delete a user', async () => {
      const [user] = await sql`
        INSERT INTO users (name, email, type)
        VALUES ('Test User', 'test@example.com', 'user')
        RETURNING *
      `;

      await sql`DELETE FROM users WHERE id = ${user.id}`;

      const users = await sql`SELECT * FROM users WHERE id = ${user.id}`;
      expect(users).toHaveLength(0);
    });
  });

  describe('Group Operations', () => {
    it('should insert and retrieve a group', async () => {
      const [group] = await sql`
        INSERT INTO groups (name, parent_id)
        VALUES ('Test Group', NULL)
        RETURNING *
      `;
      expect(group).toHaveProperty('id');
      expect(group.name).toBe('Test Group');
      expect(group.parent_id).toBeNull();

      const [retrievedGroup] = await sql`
        SELECT * FROM groups WHERE id = ${group.id}
      `;
      expect(retrievedGroup).toEqual(group);
    });

    it('should get all groups', async () => {
      const [group1] = await sql`
        INSERT INTO groups (name, parent_id)
        VALUES ('Group 1', NULL)
        RETURNING *
      `;
      const [group2] = await sql`
        INSERT INTO groups (name, parent_id)
        VALUES ('Group 2', ${group1.id})
        RETURNING *
      `;

      const groups = await sql`SELECT * FROM groups ORDER BY id`;
      expect(groups).toHaveLength(2);
      expect(groups[0]).toEqual(group1);
      expect(groups[1]).toEqual(group2);
    });

    it('should update a group', async () => {
      const [group] = await sql`
        INSERT INTO groups (name, parent_id)
        VALUES ('Test Group', NULL)
        RETURNING *
      `;

      const [updatedGroup] = await sql`
        UPDATE groups
        SET name = 'Updated Group'
        WHERE id = ${group.id}
        RETURNING *
      `;

      expect(updatedGroup).toHaveProperty('id', group.id);
      expect(updatedGroup).toHaveProperty('name', 'Updated Group');
    });

    it('should delete a group', async () => {
      const [group] = await sql`
        INSERT INTO groups (name, parent_id)
        VALUES ('Test Group', NULL)
        RETURNING *
      `;

      await sql`DELETE FROM groups WHERE id = ${group.id}`;

      const groups = await sql`SELECT * FROM groups WHERE id = ${group.id}`;
      expect(groups).toHaveLength(0);
    });
  });

  describe('Group Member Operations', () => {
    it('should add and check a member', async () => {
      const [group] = await sql`
        INSERT INTO groups (name, parent_id)
        VALUES ('Test Group', NULL)
        RETURNING *
      `;
      const [user] = await sql`
        INSERT INTO users (name, email, type)
        VALUES ('Test User', 'test@example.com', 'user')
        RETURNING *
      `;

      const [member] = await sql`
        INSERT INTO group_members (group_id, member_id, member_type)
        VALUES (${group.id}, ${user.id}, 'user')
        RETURNING *
      `;
      expect(member).toHaveProperty('id');
      expect(member.group_id).toBe(group.id);
      expect(member.member_id).toBe(user.id);
      expect(member.member_type).toBe('user');

      const [isMember] = await sql`
        SELECT EXISTS (
          SELECT 1 FROM group_members
          WHERE group_id = ${group.id}
          AND member_id = ${user.id}
          AND member_type = 'user'
        ) as exists
      `;
      expect(isMember.exists).toBe(true);
    });

    it('should get group members', async () => {
      const [group] = await sql`
        INSERT INTO groups (name, parent_id)
        VALUES ('Test Group', NULL)
        RETURNING *
      `;
      const [user1] = await sql`
        INSERT INTO users (name, email, type)
        VALUES ('User 1', 'user1@example.com', 'user')
        RETURNING *
      `;
      const [user2] = await sql`
        INSERT INTO users (name, email, type)
        VALUES ('User 2', 'user2@example.com', 'user')
        RETURNING *
      `;

      await sql`
        INSERT INTO group_members (group_id, member_id, member_type)
        VALUES (${group.id}, ${user1.id}, 'user')
      `;
      await sql`
        INSERT INTO group_members (group_id, member_id, member_type)
        VALUES (${group.id}, ${user2.id}, 'user')
      `;

      const members = await sql`
        SELECT * FROM group_members
        WHERE group_id = ${group.id}
        ORDER BY id
      `;
      expect(members).toHaveLength(2);
      expect(members[0].member_id).toBe(user1.id);
      expect(members[1].member_id).toBe(user2.id);
    });

    it('should remove a member', async () => {
      const [group] = await sql`
        INSERT INTO groups (name, parent_id)
        VALUES ('Test Group', NULL)
        RETURNING *
      `;
      const [user] = await sql`
        INSERT INTO users (name, email, type)
        VALUES ('Test User', 'test@example.com', 'user')
        RETURNING *
      `;

      await sql`
        INSERT INTO group_members (group_id, member_id, member_type)
        VALUES (${group.id}, ${user.id}, 'user')
      `;

      await sql`
        DELETE FROM group_members
        WHERE group_id = ${group.id}
        AND member_id = ${user.id}
      `;

      const [isMember] = await sql`
        SELECT EXISTS (
          SELECT 1 FROM group_members
          WHERE group_id = ${group.id}
          AND member_id = ${user.id}
          AND member_type = 'user'
        ) as exists
      `;
      expect(isMember.exists).toBe(false);
    });
  });

  describe('Complex Queries', () => {
    it('should get group hierarchy', async () => {
      // Create a hierarchy: Group1 -> Group2 -> Group3
      const [group1] = await sql`
        INSERT INTO groups (name, parent_id)
        VALUES ('Group 1', NULL)
        RETURNING *
      `;
      const [group2] = await sql`
        INSERT INTO groups (name, parent_id)
        VALUES ('Group 2', ${group1.id})
        RETURNING *
      `;
      const [group3] = await sql`
        INSERT INTO groups (name, parent_id)
        VALUES ('Group 3', ${group2.id})
        RETURNING *
      `;

      const hierarchy = await sql`
        WITH RECURSIVE group_hierarchy AS (
          -- Base case: get all groups
          SELECT id, name, parent_id, 1 as level
          FROM groups
          WHERE parent_id IS NULL

          UNION ALL

          -- Recursive case: get children
          SELECT g.id, g.name, g.parent_id, gh.level + 1
          FROM groups g
          JOIN group_hierarchy gh ON g.parent_id = gh.id
        )
        SELECT * FROM group_hierarchy
        ORDER BY level, id
      `;

      expect(hierarchy).toHaveLength(3);
      expect(hierarchy[0].id).toBe(group1.id);
      expect(hierarchy[1].id).toBe(group2.id);
      expect(hierarchy[2].id).toBe(group3.id);
    });

    it('should get all members in group hierarchy', async () => {
      // Create a hierarchy: Group1 -> Group2
      const [group1] = await sql`
        INSERT INTO groups (name, parent_id)
        VALUES ('Group 1', NULL)
        RETURNING *
      `;
      const [group2] = await sql`
        INSERT INTO groups (name, parent_id)
        VALUES ('Group 2', ${group1.id})
        RETURNING *
      `;

      // Create users
      const [user1] = await sql`
        INSERT INTO users (name, email, type)
        VALUES ('User 1', 'user1@example.com', 'user')
        RETURNING *
      `;
      const [user2] = await sql`
        INSERT INTO users (name, email, type)
        VALUES ('User 2', 'user2@example.com', 'user')
        RETURNING *
      `;

      // Add users to groups
      await sql`
        INSERT INTO group_members (group_id, member_id, member_type)
        VALUES (${group1.id}, ${user1.id}, 'user')
      `;
      await sql`
        INSERT INTO group_members (group_id, member_id, member_type)
        VALUES (${group2.id}, ${user2.id}, 'user')
      `;

      const members = await sql`
        WITH RECURSIVE group_hierarchy AS (
          -- Base case: get all groups
          SELECT id, parent_id
          FROM groups
          WHERE id = ${group1.id}

          UNION ALL

          -- Recursive case: get children
          SELECT g.id, g.parent_id
          FROM groups g
          JOIN group_hierarchy gh ON g.parent_id = gh.id
        )
        SELECT DISTINCT gm.member_id, gm.member_type
        FROM group_hierarchy gh
        JOIN group_members gm ON gh.id = gm.group_id
        ORDER BY gm.member_id
      `;

      expect(members).toHaveLength(2);
      expect(members[0].member_id).toBe(user1.id);
      expect(members[1].member_id).toBe(user2.id);
    });
  });
});
