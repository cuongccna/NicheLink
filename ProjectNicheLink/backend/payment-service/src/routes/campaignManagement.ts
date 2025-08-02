import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { CampaignWizardService } from '../services/campaignWizard';
import { SmartKOCMatchingService } from '../services/kocMatching';
import TaskManagementService from '../services/taskManagement';
import ContentReviewService from '../services/contentReview';
import { AppError } from '../middleware/errorHandler';

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Simple auth middleware for demo purposes
const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }
  
  // For demo purposes, extract user info from token
  // In production, verify JWT and decode user info
  try {
    // Mock user data - replace with actual JWT verification
    req.user = {
      id: 'user-123',
      email: 'demo@example.com',
      role: 'SME'
    };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
};

const router = express.Router();
const prisma = new PrismaClient();

// Initialize services
const campaignWizardService = new CampaignWizardService(prisma);
const kocMatchingService = new SmartKOCMatchingService(prisma);
const taskService = new TaskManagementService(prisma);
const contentService = new ContentReviewService(prisma);

// Campaign Wizard Routes
router.post('/wizard/start', authenticateJWT, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User ID required', 400, 'USER_ID_REQUIRED');
    }

    const session = await campaignWizardService.startCampaignWizard(userId);
    const currentStep = await campaignWizardService.getCurrentStep(session.id);
    
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        currentStep: currentStep.id,
        question: currentStep.question,
        options: currentStep.options,
        type: currentStep.type,
        description: currentStep.description,
        progress: 0
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/wizard/:sessionId/answer', authenticateJWT, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { sessionId } = req.params;
    const { answer } = req.body;

    if (!sessionId) {
      throw new AppError('Session ID is required', 400, 'SESSION_ID_REQUIRED');
    }

    const nextStep = await campaignWizardService.processWizardStep(sessionId, answer);
    
    if (!nextStep) {
      // Wizard completed
      const campaignDraft = await campaignWizardService.completeCampaignWizard(sessionId);
      res.json({
        success: true,
        data: {
          completed: true,
          campaignDraft
        }
      });
    } else {
      // Continue to next step
      const session = await campaignWizardService.getWizardSession(sessionId);
      res.json({
        success: true,
        data: {
          completed: false,
          currentStep: nextStep.id,
          question: nextStep.question,
          options: nextStep.options,
          type: nextStep.type,
          description: nextStep.description,
          progress: (Object.keys(session.responses).length / 8) * 100
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

// KOC Matching Route
router.post('/campaigns/:campaignId/koc-matching', authenticateJWT, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { campaignId } = req.params;
    const criteria = req.body;

    if (!campaignId) {
      throw new AppError('Campaign ID is required', 400, 'CAMPAIGN_ID_REQUIRED');
    }

    const recommendations = await kocMatchingService.generateRecommendations(criteria);
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
});

// Task Management Routes
router.post('/milestones/:milestoneId/tasks', authenticateJWT, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { milestoneId } = req.params;
    const taskData = req.body;

    if (!milestoneId) {
      throw new AppError('Milestone ID is required', 400, 'MILESTONE_ID_REQUIRED');
    }

    const task = await taskService.createTask(milestoneId, taskData);
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

router.get('/tasks/user/:userId', authenticateJWT, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new AppError('User ID is required', 400, 'USER_ID_REQUIRED');
    }

    const tasks = await taskService.getTasksByUser(userId, req.query as any);
    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
});

router.put('/tasks/:taskId/status', authenticateJWT, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!taskId) {
      throw new AppError('Task ID is required', 400, 'TASK_ID_REQUIRED');
    }

    const task = await taskService.updateTaskStatus(taskId, status);
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
});

// Content Review Routes
router.post('/milestones/:milestoneId/content', authenticateJWT, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { milestoneId } = req.params;
    const content = req.body;
    const userId = req.user?.id;

    if (!milestoneId) {
      throw new AppError('Milestone ID is required', 400, 'MILESTONE_ID_REQUIRED');
    }

    if (!userId) {
      throw new AppError('User ID required', 400, 'USER_ID_REQUIRED');
    }

    const submission = await contentService.submitContent(milestoneId, userId, content);
    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
});

router.post('/content/:submissionId/review', authenticateJWT, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { submissionId } = req.params;
    const { criteria, notes, suggestions } = req.body;
    const userId = req.user?.id;

    if (!submissionId) {
      throw new AppError('Submission ID is required', 400, 'SUBMISSION_ID_REQUIRED');
    }

    if (!userId) {
      throw new AppError('User ID required', 400, 'USER_ID_REQUIRED');
    }

    const review = await contentService.reviewContent(
      submissionId, 
      userId, 
      criteria, 
      notes, 
      suggestions
    );
    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
});

// Analytics Routes
router.get('/tasks/analytics', authenticateJWT, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { userId, campaignId } = req.query;

    const analytics = await taskService.getTaskAnalytics(
      userId as string, 
      campaignId as string
    );
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

router.get('/content/analytics', authenticateJWT, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { campaignId, startDate, endDate } = req.query;

    const analytics = await contentService.getContentAnalytics(
      campaignId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

// Campaign List Route
router.get('/campaigns', authenticateJWT, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User ID required', 400, 'USER_ID_REQUIRED');
    }

    // For demo purposes, return mock campaigns
    const campaigns = [
      {
        id: 'campaign-1',
        title: 'Summer Fashion Collection 2024',
        description: 'Quảng bá bộ sưu tập thời trang mùa hè mới',
        status: 'ACTIVE',
        budget: 50000000,
        currency: 'VND',
        kocCount: 3,
        completedMilestones: 2,
        totalMilestones: 5,
        createdAt: new Date('2024-01-15'),
        targetAudience: 'Women 18-35',
        category: ['Fashion', 'Lifestyle']
      },
      {
        id: 'campaign-2', 
        title: 'Tech Product Launch',
        description: 'Giới thiệu sản phẩm công nghệ mới',
        status: 'PLANNING',
        budget: 30000000,
        currency: 'VND',
        kocCount: 0,
        completedMilestones: 0,
        totalMilestones: 3,
        createdAt: new Date('2024-01-20'),
        targetAudience: 'Tech enthusiasts 20-40',
        category: ['Technology', 'Innovation']
      }
    ];

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    next(error);
  }
});

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Campaign Management API is running',
    timestamp: new Date().toISOString(),
    services: {
      campaignWizard: true,
      kocMatching: true,
      taskManagement: true,
      contentReview: true
    }
  });
});

export default router;
