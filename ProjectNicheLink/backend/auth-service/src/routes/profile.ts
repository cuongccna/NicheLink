import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import authService from '../services/authService';
import { authenticateToken, requireSME, requireInfluencer } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Validation middleware for profile updates
const validateProfileUpdate = [
  body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number')
];

/**
 * @route GET /api/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const profile = await authService.getUserProfile(user.userId);
    
    res.json({
      success: true,
      data: {
        profile
      }
    });
  } catch (error: any) {
    logger.error('Get profile failed:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to get profile'
    });
  }
});

/**
 * @route GET /api/profile/search
 * @desc Search user profiles
 * @access Public
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query, role, page = 1, limit = 10 } = req.query;
    
    // Basic implementation - in real app this would query the database
    return res.json({
      success: true,
      message: 'Profile search endpoint ready',
      data: {
        profiles: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          pages: 0
        }
      }
    });
  } catch (error: any) {
    logger.error('Profile search failed:', error);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to search profiles'
    });
  }
});

/**
 * @route GET /api/profile/:userId
 * @desc Get user profile by ID (public info only)
 * @access Public
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profile = await authService.getUserProfile(userId);
    
    // Return only public information
    const publicProfile = {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: profile.role,
      createdAt: profile.createdAt,
      smeProfile: profile.role === 'SME' ? profile.smeProfile : undefined,
      influencerProfile: profile.role === 'INFLUENCER' ? profile.influencerProfile : undefined
    };
    
    return res.json({
      success: true,
      data: {
        profile: publicProfile
      }
    });
  } catch (error: any) {
    logger.error('Get public profile failed:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'NotFound',
        message: 'User not found'
      });
    }
    
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to get profile'
    });
  }
});

/**
 * @route PUT /api/profile
 * @desc Update current user basic profile
 * @access Private
 */
router.put('/', [authenticateToken, ...validateProfileUpdate], async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid input data',
        details: errors.array()
      });
    }

    const profile = await authService.updateUserProfile(user.userId, req.body);
    
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile
      }
    });
  } catch (error: any) {
    logger.error('Update profile failed:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'NotFound',
        message: 'User not found'
      });
    }
    
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to update profile'
    });
  }
});

export default router;
