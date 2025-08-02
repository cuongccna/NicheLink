import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import EscrowWalletService from '../services/escrowWallet';
import DisputeService from '../services/dispute';
import AutoReleaseService from '../services/autoRelease';
import TransactionHistoryService from '../services/transactionHistory';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth';

const router = Router();

// Initialize services
const escrowWalletService = new EscrowWalletService(prisma);
const disputeService = new DisputeService(prisma);
const autoReleaseService = new AutoReleaseService(prisma);
const transactionHistoryService = new TransactionHistoryService(prisma);

// GET /api/wallet/summary - Lấy tổng quan ví
router.get('/summary', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const summary = await escrowWalletService.getWalletSummary(userId);
    res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
});

// GET /api/wallet/contracts - Lấy danh sách contracts
router.get('/contracts', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const { status, role, page, limit } = req.query;
    const filter: any = {
      status: status as string,
      role: role as 'payer' | 'payee'
    };

    // Only add page/limit if they have values to avoid undefined issues
    if (page) filter.page = parseInt(page as string);
    if (limit) filter.limit = parseInt(limit as string);

    const result = await escrowWalletService.getContractOverviews(userId, filter);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/wallet/activity - Lấy hoạt động gần đây
router.get('/activity', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const activities = await escrowWalletService.getRecentActivity(userId, limit);
    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
});

// GET /api/wallet/disputes - Lấy danh sách disputes
router.get('/disputes', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const filter: any = {
      userId,
      status: req.query.status as string
    };

    // Only add page/limit if they have values to avoid undefined issues
    if (req.query.page) filter.page = parseInt(req.query.page as string);
    if (req.query.limit) filter.limit = parseInt(req.query.limit as string);

    const result = await disputeService.getDisputes(filter);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/wallet/disputes - Tạo dispute mới
router.post('/disputes', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    const disputeData = {
      ...req.body,
      initiatorId: userId
    };

    const dispute = await disputeService.createDispute(disputeData);
    res.status(201).json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
});

export default router;
