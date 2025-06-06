import sql from './sql.js';

// Database data seeding function
export async function initializeDatabase() {
  try {
    console.log('Checking for test data...');

    // Check if test data exists
    const existingUsers =
      await sql`SELECT COUNT(*) as count FROM users WHERE email = 'test@user.com'`;
    const userCount =
      existingUsers.length > 0 ? parseInt(existingUsers[0].count) : 0;

    if (userCount === 0) {
      console.log('Seeding database with test data...');

      // Create test user
      await sql`INSERT INTO users(name, email) VALUES ('Test User', 'test@user.com')`;

      // Create parent group
      await sql`INSERT INTO groups(name, parent_id, level) VALUES ('Test Group', NULL, 0)`;

      // Create child groups
      await sql`
        INSERT INTO groups(name, parent_id, level) 
        SELECT 'Test Users', id, 1 
        FROM groups 
        WHERE name = 'Test Group'
      `;

      await sql`
        INSERT INTO groups(name, parent_id, level) 
        SELECT 'Test Sub Groups', id, 1 
        FROM groups 
        WHERE name = 'Test Group'
      `;

      // Add child groups to parent group
      await sql`
        INSERT INTO group_members(group_id, member_id, member_type)
        SELECT p.id, c.id, 'group'
        FROM groups p, groups c
        WHERE p.name = 'Test Group' AND c.name = 'Test Users'
      `;

      await sql`
        INSERT INTO group_members(group_id, member_id, member_type)
        SELECT p.id, c.id, 'group'
        FROM groups p, groups c
        WHERE p.name = 'Test Group' AND c.name = 'Test Sub Groups'
      `;

      // Add test user to Test Users group
      await sql`
        INSERT INTO group_members(group_id, member_id, member_type)
        SELECT g.id, u.id, 'user'
        FROM groups g, users u
        WHERE g.name = 'Test Users' AND u.email = 'test@user.com'
      `;

      console.log('Test data seeded successfully.');
    } else {
      console.log('Test data already exists, skipping seeding.');
    }

    console.log('Database initialization completed.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}
