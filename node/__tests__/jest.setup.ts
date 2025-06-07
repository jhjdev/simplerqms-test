import { mock } from './mocks/mock';

// Reset mock data before each test
beforeEach(() => {
  mock.reset();
});

// Mock the database module
jest.mock('../db', () => ({
  sql: mock,
}));
