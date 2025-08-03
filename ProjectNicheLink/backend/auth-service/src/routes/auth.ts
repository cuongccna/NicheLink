import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import authService from '../services/authService';
import { logger } from '../utils/logger';

const router = Router();

// Validation middleware
const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('role').isIn(['SME', 'INFLUENCER']).withMessage('Role must be SME or INFLUENCER'),
  body('phoneNumber').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('companyName').optional().trim().isLength({ min: 2 }),
  body('businessType').optional().trim(),
  body('industry').optional().trim(),
  body('website').optional().isURL(),
  body('displayName').optional().trim(),
  body('bio').optional().trim(),
  body('categories').optional().isArray(),
  body('languages').optional().isArray()
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const validateProfileUpdate = [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('phoneNumber').optional().isMobilePhone('any'),
  body('companyName').optional().trim(),
  body('businessType').optional().trim(),
  body('industry').optional().trim(),
  body('website').optional().isURL(),
  body('displayName').optional().trim(),
  body('bio').optional().trim(),
  body('categories').optional().isArray(),
  body('languages').optional().isArray()
];

/**
 * @route POST /api/auth/register
 * @desc Register new user
 * @access Public
 */
router.post('/register', validateRegister, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid input data',
        details: errors.array()
      });
      return;
    }

    const result = await authService.registerUser(req.body);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        user: result.user,
        firebaseUid: result.firebaseUser.uid
      }
    });

  } catch (error: any) {
    logger.error('Registration error:', error);
    res.status(400).json({
      error: error.name || 'RegistrationError',
      message: error.message
    });
  }
});

/**
 * @route POST /api/auth/verify-token
 * @desc Verify Firebase ID token and return user data
 * @access Public
 */
router.post('/verify-token', [
  body('idToken').notEmpty().withMessage('Firebase ID token is required')
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid input data',
        details: errors.array()
      });
      return;
    }

    const { idToken } = req.body;
    
    // Verify the Firebase ID token
    const result = await authService.verifyFirebaseToken(idToken);

    res.json({
      success: true,
      message: 'Token verified successfully',
      data: {
        user: result.user,
        isNewUser: result.isNewUser
      }
    });

  } catch (error: any) {
    logger.error('Token verification error:', error);
    res.status(401).json({
      error: error.name || 'TokenVerificationError',
      message: error.message
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc DEPRECATED: Use client-side Firebase auth + /verify-token instead
 * @access Public
 */
router.post('/login', validateLogin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Return error message explaining the correct flow
    res.status(400).json({
      error: 'DeprecatedEndpoint',
      message: 'This endpoint is deprecated. Please use Firebase Client SDK for authentication, then call /verify-token with the ID token.',
      correctFlow: {
        step1: 'Use Firebase Client SDK: signInWithEmailAndPassword(email, password)',
        step2: 'Get ID token: user.getIdToken()',
        step3: 'Send to backend: POST /api/auth/verify-token with idToken'
      }
    });

  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(401).json({
      error: error.name || 'LoginError',
      message: error.message
    });
  }
});

/**
 * @route GET /api/auth/profile/:userId
 * @desc Get user profile by ID
 * @access Public
 */
router.get('/profile/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await authService.getUserProfile(userId);

    res.json({
      success: true,
      data: user
    });

  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(404).json({
      error: 'UserNotFound',
      message: error.message
    });
  }
});

/**
 * @route PUT /api/auth/profile/:userId
 * @desc Update user profile
 * @access Private
 */
router.put('/profile/:userId', validateProfileUpdate, async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid input data',
        details: errors.array()
      });
      return;
    }

    const { userId } = req.params;
    const updatedUser = await authService.updateUserProfile(userId, req.body);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error: any) {
    logger.error('Update profile error:', error);
    res.status(400).json({
      error: error.name || 'UpdateError',
      message: error.message
    });
  }
});

/**
 * @route POST /api/auth/verify-email
 * @desc Verify email and activate user account
 * @access Public
 */
router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const { firebaseUid } = req.body;
    
    if (!firebaseUid) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Firebase UID is required'
      });
      return;
    }

    const user = await authService.verifyEmailAndActivateUser(firebaseUid);

    res.json({
      success: true,
      message: 'Email verified and account activated successfully',
      data: user
    });

  } catch (error: any) {
    logger.error('Email verification error:', error);
    res.status(400).json({
      error: error.name || 'VerificationError',
      message: error.message
    });
  }
});

/**
 * @route POST /api/auth/send-verification
 * @desc Send email verification
 * @access Public
 */
router.post('/send-verification', async (req: Request, res: Response): Promise<void> => {
  try {
    const { firebaseUid } = req.body;
    
    if (!firebaseUid) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Firebase UID is required'
      });
      return;
    }

    await authService.sendEmailVerification(firebaseUid);

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error: any) {
    logger.error('Send verification error:', error);
    res.status(400).json({
      error: error.name || 'SendVerificationError',
      message: error.message
    });
  }
});

/**
 * @route GET /api/auth/users/:role
 * @desc Get users by role with pagination
 * @access Public
 */
router.get('/users/:role', async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!['SME', 'INFLUENCER', 'ADMIN'].includes(role.toUpperCase())) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid role. Must be SME, INFLUENCER, or ADMIN'
      });
      return;
    }

    const result = await authService.getUsersByRole(
      role.toUpperCase() as any,
      Number(page),
      Number(limit)
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    logger.error('Get users by role error:', error);
    res.status(400).json({
      error: error.name || 'GetUsersError',
      message: error.message
    });
  }
});

/**
 * @route DELETE /api/auth/user/:userId
 * @desc Delete user account
 * @access Private
 */
router.delete('/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    await authService.deleteUser(userId);

    res.json({
      success: true,
      message: 'User account deleted successfully'
    });

  } catch (error: any) {
    logger.error('Delete user error:', error);
    res.status(400).json({
      error: error.name || 'DeleteError',
      message: error.message
    });
  }
});

export default router;
