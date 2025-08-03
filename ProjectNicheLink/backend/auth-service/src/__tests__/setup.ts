import * as admin from 'firebase-admin';

// Mock Firebase Admin globally for tests
jest.mock('firebase-admin', () => ({
  credential: {
    cert: jest.fn(),
  },
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
    getUserByEmail: jest.fn(),
    generateEmailVerificationLink: jest.fn(),
  })),
}));

// Mock Prisma Client globally for tests
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

// Global test timeout
jest.setTimeout(30000);

// Clear all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
