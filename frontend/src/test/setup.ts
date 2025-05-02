import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch for tests
global.fetch = vi.fn();

// Setup any global mocks or configurations here
beforeAll(() => {
  // Setup code that runs before all tests
});

afterAll(() => {
  // Cleanup code that runs after all tests
});
