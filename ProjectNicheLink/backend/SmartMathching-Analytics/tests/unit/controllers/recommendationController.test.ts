import { Request, Response } from 'express';
import { recommendationController } from '../../../src/controllers/recommendationController';
import {
  mockRequest,
  mockResponse,
  authenticatedRequest,
  mockRecommendationCriteria,
} from '../../helpers/testUtils';

// Mock recommendation service
const mockRecommendationService = {
  generateRecommendations: jest.fn(),
  getRecommendationExplanation: jest.fn(),
};

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock recommendation service
jest.mock('../../src/services/recommendationService', () => ({
  recommendationService: mockRecommendationService,
}));

describe('RecommendationController', () => {
  let controller: RecommendationController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    controller = new RecommendationController();
    jest.clearAllMocks();
  });

  describe('generateRecommendations', () => {
    beforeEach(() => {
      res = mockResponse();
    });

    it('should generate recommendations successfully', async () => {
      const mockRecommendations = [
        {
          influencerId: 'influencer_1',
          score: 0.85,
          reasons: ['Excellent content category match', 'High engagement quality'],
          matchingFactors: {
            categoryMatch: 0.9,
            audienceMatch: 0.8,
            budgetFit: 0.7,
            locationMatch: 1.0,
            engagementQuality: 0.85,
            pastPerformance: 0.8,
            vietnameseMarketFit: 0.9,
          },
        },
      ];

      req = authenticatedRequest('sme_123', 'SME', {
        body: {
          campaignId: 'campaign_123',
          budget: '10000000',
          targetAudience: {
            ageGroups: ['18-25', '26-35'],
            gender: 'female',
            interests: ['beauty', 'skincare'],
          },
          requirements: {
            minFollowers: 10000,
            contentTypes: ['photo', 'video'],
          },
          categories: ['beauty', 'skincare'],
          locations: ['Ho Chi Minh City'],
        },
      });

      mockRecommendationService.generateRecommendations.mockResolvedValue(mockRecommendations);

      await controller.generateRecommendations(req as Request, res as Response);

      expect(mockRecommendationService.generateRecommendations).toHaveBeenCalledWith({
        campaignId: 'campaign_123',
        budget: 10000000,
        targetAudience: req.body.targetAudience,
        requirements: req.body.requirements,
        categories: ['beauty', 'skincare'],
        locations: ['Ho Chi Minh City'],
      });

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          campaignId: 'campaign_123',
          recommendations: mockRecommendations,
          generatedAt: expect.any(String),
          algorithm: 'AI_VIETNAMESE_V1',
        },
        message: 'Generated 1 recommendations',
      });
    });

    it('should return 400 for missing required fields', async () => {
      req = authenticatedRequest('sme_123', 'SME', {
        body: {
          campaignId: 'campaign_123',
          // Missing budget, targetAudience, requirements
        },
      });

      await controller.generateRecommendations(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Missing required fields: campaignId, budget, targetAudience, requirements',
      });
    });

    it('should handle service errors gracefully', async () => {
      req = authenticatedRequest('sme_123', 'SME', {
        body: {
          campaignId: 'campaign_123',
          budget: '10000000',
          targetAudience: { ageGroups: ['18-25'] },
          requirements: { minFollowers: 10000 },
        },
      });

      mockRecommendationService.generateRecommendations.mockRejectedValue(
        new Error('Database connection failed')
      );

      await controller.generateRecommendations(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to generate recommendations',
        error: 'Database connection failed',
      });
    });

    it('should parse budget as float', async () => {
      req = authenticatedRequest('sme_123', 'SME', {
        body: {
          campaignId: 'campaign_123',
          budget: '15500000.50', // String with decimal
          targetAudience: { ageGroups: ['18-25'] },
          requirements: { minFollowers: 10000 },
          categories: ['beauty'],
          locations: ['Hanoi'],
        },
      });

      mockRecommendationService.generateRecommendations.mockResolvedValue([]);

      await controller.generateRecommendations(req as Request, res as Response);

      expect(mockRecommendationService.generateRecommendations).toHaveBeenCalledWith({
        campaignId: 'campaign_123',
        budget: 15500000.5,
        targetAudience: req.body.targetAudience,
        requirements: req.body.requirements,
        categories: ['beauty'],
        locations: ['Hanoi'],
      });
    });

    it('should handle empty categories and locations', async () => {
      req = authenticatedRequest('sme_123', 'SME', {
        body: {
          campaignId: 'campaign_123',
          budget: '10000000',
          targetAudience: { ageGroups: ['18-25'] },
          requirements: { minFollowers: 10000 },
          // No categories or locations
        },
      });

      mockRecommendationService.generateRecommendations.mockResolvedValue([]);

      await controller.generateRecommendations(req as Request, res as Response);

      expect(mockRecommendationService.generateRecommendations).toHaveBeenCalledWith({
        campaignId: 'campaign_123',
        budget: 10000000,
        targetAudience: req.body.targetAudience,
        requirements: req.body.requirements,
        categories: [],
        locations: [],
      });
    });
  });

  describe('getRecommendationExplanation', () => {
    beforeEach(() => {
      res = mockResponse();
    });

    it('should get recommendation explanation successfully', async () => {
      const mockExplanation = {
        influencer: {
          id: 'influencer_123',
          displayName: 'Test Influencer',
          user: {
            firstName: 'Test',
            lastName: 'User',
          },
        },
        score: 0.85,
        reasons: ['Excellent content category match', 'High engagement quality'],
        matchingFactors: {
          categoryMatch: 0.9,
          audienceMatch: 0.8,
          budgetFit: 0.7,
          engagementQuality: 0.85,
          pastPerformance: 0.8,
        },
        explanation: 'This influencer scored 85.0% compatibility. Strong points: Content Category Match: 90.0%, Engagement Quality: 85.0%.',
      };

      req = authenticatedRequest('sme_123', 'SME', {
        params: {
          campaignId: 'campaign_123',
          influencerId: 'influencer_123',
        },
      });

      mockRecommendationService.getRecommendationExplanation.mockResolvedValue(mockExplanation);

      await controller.getRecommendationExplanation(req as Request, res as Response);

      expect(mockRecommendationService.getRecommendationExplanation).toHaveBeenCalledWith(
        'campaign_123',
        'influencer_123'
      );

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockExplanation,
        message: 'Recommendation explanation retrieved successfully',
      });
    });

    it('should return 400 for missing parameters', async () => {
      req = authenticatedRequest('sme_123', 'SME', {
        params: {
          campaignId: 'campaign_123',
          // Missing influencerId
        },
      });

      await controller.getRecommendationExplanation(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Campaign ID and Influencer ID are required',
      });
    });

    it('should return 404 for recommendation not found', async () => {
      req = authenticatedRequest('sme_123', 'SME', {
        params: {
          campaignId: 'campaign_123',
          influencerId: 'influencer_999',
        },
      });

      mockRecommendationService.getRecommendationExplanation.mockRejectedValue(
        new Error('Recommendation not found')
      );

      await controller.getRecommendationExplanation(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Recommendation not found for this campaign and influencer',
      });
    });

    it('should handle other service errors', async () => {
      req = authenticatedRequest('sme_123', 'SME', {
        params: {
          campaignId: 'campaign_123',
          influencerId: 'influencer_123',
        },
      });

      mockRecommendationService.getRecommendationExplanation.mockRejectedValue(
        new Error('Database connection failed')
      );

      await controller.getRecommendationExplanation(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to get recommendation explanation',
        error: 'Database connection failed',
      });
    });
  });

  describe('healthCheck', () => {
    beforeEach(() => {
      res = mockResponse();
    });

    it('should return health status successfully', async () => {
      req = mockRequest();

      await controller.healthCheck(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Recommendation service is healthy',
        timestamp: expect.any(String),
        service: 'Smart Matching & Analytics',
      });
    });

    it('should handle health check errors', async () => {
      req = mockRequest();
      
      // Mock a situation where res.json throws an error
      const mockError = new Error('Response error');
      (res.json as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      await controller.healthCheck(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Input validation', () => {
    beforeEach(() => {
      res = mockResponse();
    });

    it('should validate numeric budget', async () => {
      req = authenticatedRequest('sme_123', 'SME', {
        body: {
          campaignId: 'campaign_123',
          budget: 'invalid_number',
          targetAudience: { ageGroups: ['18-25'] },
          requirements: { minFollowers: 10000 },
        },
      });

      mockRecommendationService.generateRecommendations.mockResolvedValue([]);

      await controller.generateRecommendations(req as Request, res as Response);

      // Should still call with NaN, which the service should handle
      expect(mockRecommendationService.generateRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          budget: NaN,
        })
      );
    });

    it('should handle zero budget', async () => {
      req = authenticatedRequest('sme_123', 'SME', {
        body: {
          campaignId: 'campaign_123',
          budget: '0',
          targetAudience: { ageGroups: ['18-25'] },
          requirements: { minFollowers: 10000 },
        },
      });

      mockRecommendationService.generateRecommendations.mockResolvedValue([]);

      await controller.generateRecommendations(req as Request, res as Response);

      expect(mockRecommendationService.generateRecommendations).toHaveBeenCalledWith(
        expect.objectContaining({
          budget: 0,
        })
      );
    });
  });

  describe('Authentication context', () => {
    beforeEach(() => {
      res = mockResponse();
    });

    it('should work without authenticated user', async () => {
      req = mockRequest({
        body: {
          campaignId: 'campaign_123',
          budget: '10000000',
          targetAudience: { ageGroups: ['18-25'] },
          requirements: { minFollowers: 10000 },
        },
      });

      mockRecommendationService.generateRecommendations.mockResolvedValue([]);

      await controller.generateRecommendations(req as Request, res as Response);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
        })
      );
    });

    it('should include user context in logs when authenticated', async () => {
      req = authenticatedRequest('sme_123', 'SME', {
        body: {
          campaignId: 'campaign_123',
          budget: '10000000',
          targetAudience: { ageGroups: ['18-25'] },
          requirements: { minFollowers: 10000 },
        },
      });

      mockRecommendationService.generateRecommendations.mockResolvedValue([]);

      await controller.generateRecommendations(req as Request, res as Response);

      // Verify logger was called with user context (via mocked logger)
      const { logger } = require('../../src/utils/logger');
      expect(logger.info).toHaveBeenCalledWith(
        'Generating recommendations',
        expect.objectContaining({
          userId: 'sme_123',
        })
      );
    });
  });
});
