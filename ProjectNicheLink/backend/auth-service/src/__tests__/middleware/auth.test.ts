import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole, requireSME, requireInfluencer, optionalAuth } from '../../middleware/auth';
import * as admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

// Mock Firebase Admin and Prisma
jest.mock('firebase-admin');
jest.mock('@prisma/client');

const mockAuth = {
  verifyIdToken: jest.fn(),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

// Setup mocks
(admin.auth as jest.Mock).mockReturnValue(mockAuth);
(PrismaClient as jest.Mock).mockImplementation(() => mockPrisma);

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      user: undefined
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    const mockAuth = {
      verifyIdToken: jest.fn()
    };

    beforeEach(() => {
      mockGetAuth.mockReturnValue(mockAuth as any);
    });

    it('should authenticate valid token successfully', async () => {
      // Arrange
      const mockToken = 'valid-firebase-token';
      const mockDecodedToken = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        email_verified: true
      };
      const mockUser = {
        id: 'user-123',
        firebaseUid: 'firebase-uid-123',
        email: 'test@example.com',
        role: 'SME',
        status: 'ACTIVE',
        smeProfile: null,
        influencerProfile: null
      };

      mockRequest.headers!.authorization = `Bearer ${mockToken}`;
      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith(mockToken);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { firebaseUid: mockDecodedToken.uid },
        include: {
          smeProfile: true,
          influencerProfile: true
        }
      });
      expect(mockRequest.user).toEqual({
        uid: mockDecodedToken.uid,
        email: mockDecodedToken.email,
        emailVerified: true,
        role: 'SME',
        userId: 'user-123',
        customClaims: mockDecodedToken
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No valid authorization header found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization header format', async () => {
      // Arrange
      mockRequest.headers!.authorization = 'InvalidFormat token123';

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No valid authorization header found'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with empty token', async () => {
      // Arrange
      mockRequest.headers!.authorization = 'Bearer ';

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No token provided'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid Firebase token', async () => {
      // Arrange
      const mockToken = 'invalid-token';
      mockRequest.headers!.authorization = `Bearer ${mockToken}`;
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Token verification failed'));

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Token verification failed'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      // Arrange
      const mockToken = 'expired-token';
      mockRequest.headers!.authorization = `Bearer ${mockToken}`;
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Token expired'));

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'TokenExpired',
        message: 'Token has expired'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject user not found in database', async () => {
      // Arrange
      const mockToken = 'valid-token';
      const mockDecodedToken = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        email_verified: true
      };

      mockRequest.headers!.authorization = `Bearer ${mockToken}`;
      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(null);

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'User not found in database'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject inactive user', async () => {
      // Arrange
      const mockToken = 'valid-token';
      const mockDecodedToken = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        email_verified: true
      };
      const mockUser = {
        id: 'user-123',
        firebaseUid: 'firebase-uid-123',
        email: 'test@example.com',
        role: 'SME',
        status: 'SUSPENDED', // Inactive status
        smeProfile: null,
        influencerProfile: null
      };

      mockRequest.headers!.authorization = `Bearer ${mockToken}`;
      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'User account is not active'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access for user with required role', () => {
      // Arrange
      mockRequest.user = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        emailVerified: true,
        role: 'SME',
        userId: 'user-123',
        customClaims: {}
      };

      const middleware = requireRole('SME', 'ADMIN');

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for user without required role', () => {
      // Arrange
      mockRequest.user = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        emailVerified: true,
        role: 'INFLUENCER',
        userId: 'user-123',
        customClaims: {}
      };

      const middleware = requireRole('SME', 'ADMIN');

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Access denied. Required roles: SME, ADMIN'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access for unauthenticated user', () => {
      // Arrange
      mockRequest.user = undefined;

      const middleware = requireRole('SME');

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireSME', () => {
    it('should allow access for SME user', () => {
      // Arrange
      mockRequest.user = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        emailVerified: true,
        role: 'SME',
        userId: 'user-123',
        customClaims: {}
      };

      // Act
      requireSME(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for non-SME user', () => {
      // Arrange
      mockRequest.user = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        emailVerified: true,
        role: 'INFLUENCER',
        userId: 'user-123',
        customClaims: {}
      };

      // Act
      requireSME(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireInfluencer', () => {
    it('should allow access for Influencer user', () => {
      // Arrange
      mockRequest.user = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        emailVerified: true,
        role: 'INFLUENCER',
        userId: 'user-123',
        customClaims: {}
      };

      // Act
      requireInfluencer(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access for non-Influencer user', () => {
      // Arrange
      mockRequest.user = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        emailVerified: true,
        role: 'SME',
        userId: 'user-123',
        customClaims: {}
      };

      // Act
      requireInfluencer(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    const mockAuth = {
      verifyIdToken: jest.fn()
    };

    beforeEach(() => {
      mockGetAuth.mockReturnValue(mockAuth as any);
    });

    it('should continue without authentication when no token provided', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should authenticate valid token and continue', async () => {
      // Arrange
      const mockToken = 'valid-token';
      const mockDecodedToken = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        email_verified: true
      };
      const mockUser = {
        id: 'user-123',
        firebaseUid: 'firebase-uid-123',
        email: 'test@example.com',
        role: 'SME',
        status: 'ACTIVE'
      };

      mockRequest.headers!.authorization = `Bearer ${mockToken}`;
      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      // Act
      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toEqual({
        uid: mockDecodedToken.uid,
        email: mockDecodedToken.email,
        emailVerified: true,
        role: 'SME',
        userId: 'user-123',
        customClaims: mockDecodedToken
      });
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication when token is invalid', async () => {
      // Arrange
      const mockToken = 'invalid-token';
      mockRequest.headers!.authorization = `Bearer ${mockToken}`;
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      // Act
      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should continue without authentication when user is not active', async () => {
      // Arrange
      const mockToken = 'valid-token';
      const mockDecodedToken = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        email_verified: true
      };
      const mockUser = {
        id: 'user-123',
        firebaseUid: 'firebase-uid-123',
        email: 'test@example.com',
        role: 'SME',
        status: 'SUSPENDED' // Not active
      };

      mockRequest.headers!.authorization = `Bearer ${mockToken}`;
      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);
      mockPrisma.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      // Act
      await optionalAuth(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
