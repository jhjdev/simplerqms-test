import { mock } from './mocks/mock';

// Reset the mock database before each test
beforeEach(() => {
  mock.reset();
});

// No cleanup needed after tests since we're using in-memory data
afterEach(() => {
  // Nothing to do
});
