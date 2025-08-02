import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import EscrowService, { CreateEscrowContractParams } from '../services/escrow';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { body, param, validationResult } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();
const escrowService = new EscrowService(prisma);

// Validation middleware
const validateCreateEscrow = [
  body('payeeId').isString().notEmpty().withMessage('Payee ID is required'),
  body('projectTitle').isString().isLength({ min: 1, max: 200 }).withMessage('Project title is required and must be less than 200 characters'),
  body('projectDescription').isString().isLength({ min: 1, max: 2000 }).withMessage('Project description is required and must be less than 2000 characters'),
  body('totalAmount').isNumeric().isFloat({ min: 0.01 }).withMessage('Total amount must be a positive number'),
  body('currency').isString().isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-character code'),
  body('paymentMethod').isIn(['STRIPE', 'PAYPAL', 'CRYPTO']).withMessage('Invalid payment method'),
  body('milestones').isArray({ min: 1 }).withMessage('At least one milestone is required'),
  body('milestones.*.title').isString().notEmpty().withMessage('Milestone title is required'),
  body('milestones.*.description').isString().notEmpty().withMessage('Milestone description is required'),
  body('milestones.*.amount').isNumeric().isFloat({ min: 0.01 }).withMessage('Milestone amount must be positive'),
  body('milestones.*.dueDate').isISO8601().withMessage('Valid due date is required'),
  body('milestones.*.deliverables').isArray().withMessage('Deliverables must be an array'),
  body('terms').isString().notEmpty().withMessage('Terms are required'),
];

const validateMilestoneCompletion = [
  param('contractId').isUUID().withMessage('Valid contract ID is required'),
  param('milestoneId').isUUID().withMessage('Valid milestone ID is required'),
  body('deliverableUrls').isArray().withMessage('Deliverable URLs must be an array'),
  body('deliverableUrls.*').isURL().withMessage('Each deliverable must be a valid URL'),
];

// Check validation results
const checkValidation = (req: Request, res: Response, next: any): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
    return;
  }
  next();
};

// GET /api/escrow - Get user's escrow contracts
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { role, status, page = 1, limit = 10 } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  const whereCondition: any = {
    OR: [
      { smeId: userId },
      { influencerId: userId }
    ]
  };

  if (status) {
    whereCondition.status = status;
  }

  if (role === 'payer') {
    whereCondition.OR = [{ smeId: userId }]; // SME is typically the payer
  } else if (role === 'payee') {
    whereCondition.OR = [{ influencerId: userId }]; // Influencer is typically the payee
  }

  const [contracts, total] = await Promise.all([
    prisma.escrowContract.findMany({
      where: whereCondition,
      select: {
        id: true,
        smeId: true,
        influencerId: true,
        totalAmount: true,
        currency: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Number(limit)
    }),
    prisma.escrowContract.count({ where: whereCondition })
  ]);

  // Get related data separately to avoid type issues
  const contractsWithRelations = await Promise.all(
    contracts.map(async (contract) => {
      const [sme, influencer, milestones] = await Promise.all([
        prisma.user.findUnique({
          where: { id: contract.smeId },
          select: { id: true, email: true, firstName: true, lastName: true, role: true }
        }),
        prisma.user.findUnique({
          where: { id: contract.influencerId },
          select: { id: true, email: true, firstName: true, lastName: true, role: true }
        }),
        prisma.escrowMilestone.findMany({
          where: { escrowContractId: contract.id },
          select: { id: true, orderIndex: true, title: true, amount: true, status: true, dueDate: true },
          orderBy: { orderIndex: 'asc' }
        })
      ]);

      const [paymentsCount, milestonesCount] = await Promise.all([
        prisma.payment.count({ where: { escrowContractId: contract.id } }),
        prisma.escrowMilestone.count({ where: { escrowContractId: contract.id } })
      ]);

      return {
        ...contract,
        sme,
        influencer,
        milestones,
        _count: {
          milestones: milestonesCount,
          payments: paymentsCount
        }
      };
    })
  );

  res.json({
    success: true,
    data: {
      contracts: contractsWithRelations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

// POST /api/escrow - Create new escrow contract
router.post('/', validateCreateEscrow, checkValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const contractData: CreateEscrowContractParams = {
    payerId: userId,
    ...req.body
  };

  // Validate total amount equals sum of milestone amounts
  const totalMilestoneAmount = contractData.milestones.reduce((sum, milestone) => sum + milestone.amount, 0);
  if (Math.abs(totalMilestoneAmount - contractData.totalAmount) > 0.01) {
    throw new AppError('Total amount must equal sum of milestone amounts', 400, 'AMOUNT_MISMATCH');
  }

  const contract = await escrowService.createEscrowContract(contractData);

  res.status(201).json({
    success: true,
    message: 'Escrow contract created successfully',
    data: contract
  });
}));

// GET /api/escrow/:contractId - Get specific escrow contract
router.get('/:contractId', [param('contractId').isUUID()], checkValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const contractId = req.params.contractId as string;
  const userId = req.user!.id;

  // Get contract to verify access
  const contract = await prisma.escrowContract.findUnique({
    where: { id: contractId },
    select: { smeId: true, influencerId: true }
  });

  if (!contract) {
    throw new AppError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
  }

  // Verify user has access to this contract
  if (contract.smeId !== userId && contract.influencerId !== userId && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied to this contract', 403, 'ACCESS_DENIED');
  }

  const contractDetails = await escrowService.getEscrowContract(contractId);

  res.json({
    success: true,
    data: contractDetails
  });
}));

// POST /api/escrow/:contractId/payment - Initiate payment for contract
router.post('/:contractId/payment', [param('contractId').isUUID()], checkValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const contractId = req.params.contractId as string;
  const userId = req.user!.id;

  const paymentResult = await escrowService.initiatePayment(contractId, userId);

  res.json({
    success: true,
    message: 'Payment initiated successfully',
    data: paymentResult
  });
}));

// POST /api/escrow/:contractId/payment/confirm - Confirm payment received
router.post('/:contractId/payment/confirm', [param('contractId').isUUID()], checkValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const contractId = req.params.contractId as string;
  const paymentData = req.body;

  await escrowService.confirmPayment(contractId, paymentData);

  res.json({
    success: true,
    message: 'Payment confirmed successfully'
  });
}));

// POST /api/escrow/:contractId/milestones/:milestoneId/complete - Mark milestone as completed
router.post('/:contractId/milestones/:milestoneId/complete', validateMilestoneCompletion, checkValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const contractId = req.params.contractId as string;
  const milestoneId = req.params.milestoneId as string;
  const { deliverableUrls } = req.body;
  const userId = req.user!.id;

  await escrowService.completeMilestone(contractId, milestoneId, userId, deliverableUrls);

  res.json({
    success: true,
    message: 'Milestone marked as completed'
  });
}));

// POST /api/escrow/:contractId/milestones/:milestoneId/approve - Approve completed milestone
router.post('/:contractId/milestones/:milestoneId/approve', [
  param('contractId').isUUID(),
  param('milestoneId').isUUID()
], checkValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const contractId = req.params.contractId as string;
  const milestoneId = req.params.milestoneId as string;
  const userId = req.user!.id;

  await escrowService.approveMilestone(contractId, milestoneId, userId);

  res.json({
    success: true,
    message: 'Milestone approved and funds released'
  });
}));

// POST /api/escrow/:contractId/milestones/:milestoneId/reject - Reject completed milestone
router.post('/:contractId/milestones/:milestoneId/reject', [
  param('contractId').isUUID(),
  param('milestoneId').isUUID(),
  body('reason').isString().notEmpty().withMessage('Rejection reason is required')
], checkValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const contractId = req.params.contractId as string;
  const milestoneId = req.params.milestoneId as string;
  const { reason } = req.body;
  const userId = req.user!.id;

  // Get contract to verify user access
  const contract = await prisma.escrowContract.findUnique({
    where: { id: contractId },
    select: { smeId: true, influencerId: true }
  });

  if (!contract) {
    throw new AppError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
  }

  if (contract.smeId !== userId) {
    throw new AppError('Only the payer can reject milestones', 403, 'UNAUTHORIZED_MILESTONE_REJECTION');
  }

  // Update milestone status back to pending with rejection note
  await prisma.escrowMilestone.update({
    where: { id: milestoneId },
    data: {
      status: 'PENDING',
      rejectionReason: reason,
      rejectedAt: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Milestone rejected'
  });
}));

// GET /api/escrow/:contractId/milestones - Get contract milestones
router.get('/:contractId/milestones', [param('contractId').isUUID()], checkValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const contractId = req.params.contractId as string;
  const userId = req.user!.id;

  // Verify user has access to this contract
  const contract = await prisma.escrowContract.findUnique({
    where: { id: contractId },
    select: { smeId: true, influencerId: true }
  });

  if (!contract) {
    throw new AppError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
  }

  if (contract.smeId !== userId && contract.influencerId !== userId && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied to this contract', 403, 'ACCESS_DENIED');
  }

  const milestones = await prisma.escrowMilestone.findMany({
    where: { escrowContractId: contractId },
    orderBy: { orderIndex: 'asc' }
  });

  // Get fund releases count for each milestone separately
  const milestonesWithCounts = await Promise.all(
    milestones.map(async (milestone) => {
      const fundReleasesCount = await prisma.fundRelease.count({
        where: { milestoneId: milestone.id }
      });
      return {
        ...milestone,
        _count: {
          fundReleases: fundReleasesCount
        }
      };
    })
  );

  res.json({
    success: true,
    data: milestonesWithCounts
  });
}));

// GET /api/escrow/:contractId/payments - Get contract payment history
router.get('/:contractId/payments', [param('contractId').isUUID()], checkValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const contractId = req.params.contractId as string;
  const userId = req.user!.id;

  // Verify user has access to this contract
  const contract = await prisma.escrowContract.findUnique({
    where: { id: contractId },
    select: { smeId: true, influencerId: true }
  });

  if (!contract) {
    throw new AppError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
  }

  if (contract.smeId !== userId && contract.influencerId !== userId && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied to this contract', 403, 'ACCESS_DENIED');
  }

  const payments = await prisma.payment.findMany({
    where: { escrowContractId: contractId },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: payments
  });
}));

// GET /api/escrow/:contractId/releases - Get fund release history
router.get('/:contractId/releases', [param('contractId').isUUID()], checkValidation, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const contractId = req.params.contractId as string;
  const userId = req.user!.id;

  // Verify user has access to this contract
  const contract = await prisma.escrowContract.findUnique({
    where: { id: contractId },
    select: { smeId: true, influencerId: true }
  });

  if (!contract) {
    throw new AppError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
  }

  if (contract.smeId !== userId && contract.influencerId !== userId && req.user!.role !== 'ADMIN') {
    throw new AppError('Access denied to this contract', 403, 'ACCESS_DENIED');
  }

  const releases = await prisma.fundRelease.findMany({
    where: { escrowContractId: contractId },
    orderBy: { createdAt: 'desc' }
  });

  // Get milestone data separately for each release
  const releasesWithMilestones = await Promise.all(
    releases.map(async (release) => {
      const milestone = release.milestoneId ? await prisma.escrowMilestone.findUnique({
        where: { id: release.milestoneId },
        select: { orderIndex: true, title: true }
      }) : null;

      return {
        ...release,
        milestone
      };
    })
  );

  res.json({
    success: true,
    data: releasesWithMilestones
  });
}));

export default router;
