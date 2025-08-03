import authService from '../../services/authService';
import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  credential: {
    cert: jest.fn(),
  },
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    createUser: jest.fn(),
    updateUser: jest.fn(),
    setCustomUserClaims: jest.fn(),
    getUserByEmail: jest.fn(),
    generateEmailVerificationLink: jest.fn(),
  })),
}));

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

const mockAuth = {
  createUser: jest.fn(),
  updateUser: jest.fn(),
  setCustomUserClaims: jest.fn(),
  getUserByEmail: jest.fn(),
  generateEmailVerificationLink: jest.fn(),
};

const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

// Setup mocks
(admin.auth as jest.Mock).mockReturnValue(mockAuth);
(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

describe('AuthService Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        role: 'INFLUENCER' as const,
      };

      const firebaseUser = {
        uid: 'firebase-uid-123',
        email: userData.email,
        displayName: userData.displayName,
      };

      const dbUser = {
        id: 'user-123',
        firebaseUid: firebaseUser.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuth.createUser.mockResolvedValue(firebaseUser);
      mockAuth.setCustomUserClaims.mockResolvedValue(undefined);
      mockPrisma.user.create.mockResolvedValue(dbUser);

      // Act
      const result = await authService.registerUser(userData);

      // Assert
      expect(mockAuth.createUser).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        emailVerified: false,
      });

      expect(mockAuth.setCustomUserClaims).toHaveBeenCalledWith(firebaseUser.uid, {
        role: userData.role,
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          firebaseUid: firebaseUser.uid,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          isActive: true,
        },
      });

      expect(result).toEqual({
        user: dbUser,
        firebaseUser: firebaseUser,
      });
    });

    it('should handle Firebase user creation error', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        displayName: 'Test User',
        role: 'INFLUENCER' as const,
      };

      mockAuth.createUser.mockRejectedValue(new Error('Email already exists'));

      // Act & Assert
      await expect(authService.registerUser(userData)).rejects.toThrow('Email already exists');
      expect(mockAuth.createUser).toHaveBeenCalled();
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const firebaseUser = {
        uid: 'firebase-uid-123',
        email: email,
        emailVerified: true,
      };

      const dbUser = {
        id: 'user-123',
        firebaseUid: firebaseUser.uid,
        email: email,
        displayName: 'Test User',
        role: 'INFLUENCER',
        isActive: true,
      };

      mockAuth.getUserByEmail.mockResolvedValue(firebaseUser);
      mockPrisma.user.findUnique.mockResolvedValue(dbUser);

      // Act
      const result = await authService.loginUser(email, password);

      // Assert
      expect(mockAuth.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { firebaseUid: firebaseUser.uid },
      });

      expect(result).toEqual({
        user: dbUser,
        firebaseUser: firebaseUser,
      });
    });

    it('should throw error if user not found in Firebase', async () => {
      // Arrange
      const email = 'notfound@example.com';
      const password = 'password123';
      mockAuth.getUserByEmail.mockRejectedValue(new Error('User not found'));

      // Act & Assert
      await expect(authService.loginUser(email, password)).rejects.toThrow('User not found');
      expect(mockAuth.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should throw error if user not found in database', async () => {
      // Arrange
      const email = 'test@example.com';
      const firebaseUser = {
        uid: 'firebase-uid-123',
        email: email,
        emailVerified: true,
      };

      mockAuth.getUserByEmail.mockResolvedValue(firebaseUser);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(loginUser(email)).rejects.toThrow('User not found in database');
      expect(mockAuth.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { firebaseUid: firebaseUser.uid },
      });
    });

    it('should throw error if user is inactive', async () => {
      // Arrange
      const email = 'test@example.com';
      const firebaseUser = {
        uid: 'firebase-uid-123',
        email: email,
        emailVerified: true,
      };

      const inactiveUser = {
        id: 'user-123',
        firebaseUid: firebaseUser.uid,
        email: email,
        displayName: 'Test User',
        role: 'INFLUENCER',
        isActive: false,
      };

      mockAuth.getUserByEmail.mockResolvedValue(firebaseUser);
      mockPrisma.user.findUnique.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(loginUser(email)).rejects.toThrow('Account is inactive');
      expect(mockAuth.getUserByEmail).toHaveBeenCalledWith(email);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { firebaseUid: firebaseUser.uid },
      });
    });
  });

  describe('sendEmailVerification', () => {
    it('should send email verification successfully', async () => {
      // Arrange
      const email = 'test@example.com';
      const verificationLink = 'https://example.com/verify?token=abc123';

      mockAuth.generateEmailVerificationLink.mockResolvedValue(verificationLink);

      // Act
      const result = await sendEmailVerification(email);

      // Assert
      expect(mockAuth.generateEmailVerificationLink).toHaveBeenCalledWith(email);
      expect(result).toEqual({ verificationLink });
    });

    it('should handle email verification error', async () => {
      // Arrange
      const email = 'invalid@example.com';
      mockAuth.generateEmailVerificationLink.mockRejectedValue(new Error('Invalid email'));

      // Act & Assert
      await expect(sendEmailVerification(email)).rejects.toThrow('Invalid email');
      expect(mockAuth.generateEmailVerificationLink).toHaveBeenCalledWith(email);
    });
  });

  describe('Firebase Integration', () => {
    it('should properly mock Firebase Admin SDK', () => {
      // Test that our mocks are working correctly
      expect(admin.auth).toBeDefined();
      expect(admin.auth()).toBe(mockAuth);
      expect(mockAuth.createUser).toBeDefined();
      expect(mockAuth.getUserByEmail).toBeDefined();
      expect(mockAuth.generateEmailVerificationLink).toBeDefined();
    });

    it('should properly mock Prisma Client', () => {
      // Test that our Prisma mocks are working correctly
      const prisma = new PrismaClient();
      expect(prisma.user.create).toBeDefined();
      expect(prisma.user.findUnique).toBeDefined();
      expect(prisma.user.update).toBeDefined();
    });
  });
});
