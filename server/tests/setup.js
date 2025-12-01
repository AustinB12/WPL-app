import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.PORT = '0'; // Use random port for tests
});

afterAll(() => {
  // Cleanup after all tests
});

// Optional: Clear state between tests
beforeEach(() => {
  // Reset any global state if needed
});

afterEach(() => {
  // Cleanup after each test
});
