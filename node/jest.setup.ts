// This file configures the testing environment for Jest

// These are already defined by Jest, so we don't need to redefine them
// The TypeScript errors are just because TypeScript doesn't know they exist

import sql from './utils/sql';
import { mockDb } from './__tests__/mocks/db';

// Export sql and mockDb for use in tests
(global as any).sql = sql;
(global as any).mockDb = mockDb;

// Reset the mock database before each test
beforeEach(async () => {
  await sql`TRUNCATE users, groups, group_members CASCADE`;
});

// No cleanup needed after tests since we're using in-memory data
afterEach(() => {
  // Nothing to do
});

// Close the database connection after all tests
afterAll(async () => {
  await sql.end();
});
