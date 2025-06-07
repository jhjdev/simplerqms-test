// This file configures the testing environment for Jest

// These are already defined by Jest, so we don't need to redefine them
// The TypeScript errors are just because TypeScript doesn't know they exist

import { mock } from './__tests__/mocks/mock';

// Reset the mock database before each test
beforeEach(() => {
  mock.reset();
});

// No cleanup needed after tests since we're using in-memory data

// Close the database connection after all tests
afterAll(async () => {
  await mock.end();
});
