import { mockDb } from './mocks/db';

// Reset the mock database before each test
beforeEach(() => {
  mockDb.reset();
});

// No cleanup needed after tests since we're using in-memory data
afterEach(() => {
  // Nothing to do
});
