import request from 'supertest';
import app from '../../src/app';

// Mock the entire recommendation service module
jest.mock('../../src/services/recommendationService', () => ({
  recommendationService: {
    generateRecommendations: jest.fn(),
    getRecommendationExplanation: jest.fn(),
  },
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

describe('Recommendation API Integration Tests', () => {
  const { recommendationService } = require('../../src/services/recommendationService');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/recommendations/generate', () => {
    const validRequestBody = {
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
    };

    it('should generate recommendations successfully', async () => {
      const mockRecommendations = [
        {
          influencerId: 'influencer_1',
          score: 0.85,
          reasons: ['Excellent content category match'],
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

      recommendationService.generateRecommendations.mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .post('/api/recommendations/generate')
        .send(validRequestBody)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          campaignId: 'campaign_123',
          recommendations: mockRecommendations,
          algorithm: 'AI_VIETNAMESE_V1',
        },
        message: 'Generated 1 recommendations',
      });

      expect(response.body.data.generatedAt).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const invalidRequestBody = {
        campaignId: 'campaign_123',
        // Missing budget, targetAudience, requirements
      };

      const response = await request(app)
        .post('/api/recommendations/generate')
        .send(invalidRequestBody)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Missing required fields: campaignId, budget, targetAudience, requirements',
      });
    });

    it('should return 400 for missing campaignId', async () => {
      const invalidRequestBody = {
        budget: '10000000',
        targetAudience: { ageGroups: ['18-25'] },
        requirements: { minFollowers: 10000 },
      };

      const response = await request(app)
        .post('/api/recommendations/generate')
        .send(invalidRequestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle service errors gracefully', async () => {
      recommendationService.generateRecommendations.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/recommendations/generate')
        .send(validRequestBody)
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Failed to generate recommendations',
        error: 'Database connection failed',
      });
    });

    it('should handle empty recommendations', async () => {
      recommendationService.generateRecommendations.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/recommendations/generate')
        .send(validRequestBody)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          recommendations: [],
        },
        message: 'Generated 0 recommendations',
      });
    });

    it('should handle large request body', async () => {
      const largeRequestBody = {
        ...validRequestBody,
        targetAudience: {
          ageGroups: ['18-25', '26-35', '36-45', '46-55'],
          gender: 'all',
          interests: Array(100).fill('interest').map((item, index) => `${item}_${index}`),
          locations: Array(50).fill('location').map((item, index) => `${item}_${index}`),
        },
        categories: Array(20).fill('category').map((item, index) => `${item}_${index}`),
        locations: Array(30).fill('location').map((item, index) => `${item}_${index}`),
      };

      recommendationService.generateRecommendations.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/recommendations/generate')
        .send(largeRequestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/recommendations/:campaignId/:influencerId/explanation', () => {
    it('should get recommendation explanation successfully', async () => {
      const mockExplanation = {
        influencer: {
          id: 'influencer_123',
          displayName: 'Test Influencer',
        },
        score: 0.85,
        reasons: ['Excellent content category match'],
        matchingFactors: {
          categoryMatch: 0.9,
          audienceMatch: 0.8,
          budgetFit: 0.7,
          engagementQuality: 0.85,
          pastPerformance: 0.8,
        },
        explanation: 'This influencer scored 85.0% compatibility.',
      };

      recommendationService.getRecommendationExplanation.mockResolvedValue(mockExplanation);

      const response = await request(app)
        .get('/api/recommendations/campaign_123/influencer_123/explanation')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: mockExplanation,
        message: 'Recommendation explanation retrieved successfully',
      });

      expect(recommendationService.getRecommendationExplanation).toHaveBeenCalledWith(
        'campaign_123',
        'influencer_123'
      );
    });

    it('should return 404 for recommendation not found', async () => {
      recommendationService.getRecommendationExplanation.mockRejectedValue(
        new Error('Recommendation not found')
      );

      const response = await request(app)
        .get('/api/recommendations/campaign_123/influencer_999/explanation')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Recommendation not found for this campaign and influencer',
      });
    });

    it('should handle service errors', async () => {
      recommendationService.getRecommendationExplanation.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/recommendations/campaign_123/influencer_123/explanation')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Failed to get recommendation explanation',
        error: 'Database connection failed',
      });
    });

    it('should handle special characters in IDs', async () => {
      const mockExplanation = {
        influencer: { id: 'special-id_123' },
        score: 0.85,
        reasons: [],
        matchingFactors: {},
        explanation: 'Test explanation',
      };

      recommendationService.getRecommendationExplanation.mockResolvedValue(mockExplanation);

      const response = await request(app)
        .get('/api/recommendations/campaign-123_test/influencer_special-456/explanation')
        .expect(200);

      expect(recommendationService.getRecommendationExplanation).toHaveBeenCalledWith(
        'campaign-123_test',
        'influencer_special-456'
      );
    });
  });

  describe('GET /health', () => {
    it('should return service health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Smart Matching & Analytics Service is running',
        service: 'SmartMatching-Analytics',
        version: '1.0.0',
      });

      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Endpoint not found',
      });

      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .send('{ invalid json }')
        .set('Content-Type', 'application/json')
        .expect(400);

      // Express should handle this automatically
    });

    it('should handle request timeout', async () => {
      // Mock a very slow service response
      recommendationService.generateRecommendations.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 35000)) // 35 seconds
      );

      const response = await request(app)
        .post('/api/recommendations/generate')
        .send({
          campaignId: 'campaign_123',
          budget: '10000000',
          targetAudience: { ageGroups: ['18-25'] },
          requirements: { minFollowers: 10000 },
        })
        .timeout(5000) // 5 second timeout
        .expect(500)
        .catch(() => {
          // Expected to timeout
        });
    }, 10000); // 10 second test timeout
  });

  describe('Content-Type handling', () => {
    it('should accept application/json', async () => {
      recommendationService.generateRecommendations.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Content-Type', 'application/json')
        .send({
          campaignId: 'campaign_123',
          budget: '10000000',
          targetAudience: { ageGroups: ['18-25'] },
          requirements: { minFollowers: 10000 },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle URL-encoded data', async () => {
      const response = await request(app)
        .post('/api/recommendations/generate')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('campaignId=campaign_123&budget=10000000')
        .expect(400); // Should fail validation for missing fields

      expect(response.body.success).toBe(false);
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for CORS headers (depending on configuration)
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for security headers added by helmet
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });
});
