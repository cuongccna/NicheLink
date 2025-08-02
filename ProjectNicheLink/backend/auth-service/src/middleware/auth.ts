import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../config/firebase';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// Import types from Prisma client
type UserRole = 'SME' | 'INFLUENCER' | 'ADMIN';
type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';

// Extend Express Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        emailVerified: boolean;
        role: UserRole;
        userId: string;
        customClaims?: any;
        authMethod?: 'firebase' | 'jwt';
      };
      token?: string;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
    email: string;
    emailVerified: boolean;
    role: UserRole;
    userId: string;
    customClaims?: any;
    authMethod?: 'firebase' | 'jwt';
  };
}

/**
 * Middleware to verify Firebase ID token and authenticate users
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid authorization header found'
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided'
      });
      return;
    }

    // Verify the Firebase ID token
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid } as any,
      include: {
        smeProfile: true,
        influencerProfile: true
      } as any
    }) as any;

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found in database'
      });
      return;
    }

    // Check if user account is active
    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'User account is not active'
      });
      return;
    }

    // Attach user data to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || user.email,
      emailVerified: decodedToken.email_verified || false,
      role: user.role as UserRole,
      userId: user.id,
      customClaims: decodedToken
    };

    logger.debug(`User authenticated: ${user.email} (${user.role})`);
    next();
    
  } catch (error) {
    logger.error('Token verification failed:', error);
    
    if (error instanceof Error) {
      // Handle specific Firebase Auth errors
      if (error.message.includes('expired')) {
        res.status(401).json({
          error: 'TokenExpired',
          message: 'Token has expired'
        });
        return;
      }
      
      if (error.message.includes('invalid')) {
        res.status(401).json({
          error: 'InvalidToken',
          message: 'Invalid token provided'
        });
        return;
      }
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token verification failed'
    });
  }
};

/**
 * Middleware to check if user has specific role(s)
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user is SME
 */
export const requireSME = requireRole('SME' as UserRole);

/**
 * Middleware to check if user is KOC/Influencer
 */
export const requireInfluencer = requireRole('INFLUENCER' as UserRole);

/**
 * Middleware to check if user is Admin
 */
export const requireAdmin = requireRole('ADMIN' as UserRole);

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      next();
      return;
    }

    // Try to verify token, but don't fail if it's invalid
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid } as any
    }) as any;

    if (user && user.status === 'ACTIVE') {
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || user.email,
        emailVerified: decodedToken.email_verified || false,
        role: user.role as UserRole,
        userId: user.id,
        customClaims: decodedToken
      };
    }

    next();
    
  } catch (error) {
    // Silently continue without authentication
    logger.debug('Optional auth failed, continuing without user context');
    next();
  }
};
