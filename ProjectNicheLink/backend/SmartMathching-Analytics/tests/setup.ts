// Test setup file
import { jest } from '@jest/globals';

// Extend Jest timeout for long-running tests
jest.setTimeout(30000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/nichelink_test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.PORT = '3007'; // Different port for testing

// Global test utilities
global.console = {
  ...console,
  // Uncomment to silence console.log during tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
