import { RecommendationService } from '../../../src/services/recommendationService';
import {
  mockPrismaClient,
  mockInfluencerProfile,
  mockRecommendationCriteria,
  mockRecommendationResult,
} from '../../helpers/testUtils';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('RecommendationService', () => {
  let recommendationService: RecommendationService;

  beforeEach(() => {
    recommendationService = new RecommendationService();
    jest.clearAllMocks();
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations successfully', async () => {
      // Mock influencers data
      const mockInfluencers = [
        {
          ...mockInfluencerProfile,
          id: 'influencer_1',
          categories: ['beauty', 'skincare'],
          location: 'Ho Chi Minh City',
          engagementRate: 0.08,
          followersCount: 25000,
        },
        {
          ...mockInfluencerProfile,
          id: 'influencer_2',
          categories: ['fashion', 'lifestyle'],
          location: 'Hanoi',
          engagementRate: 0.06,
          followersCount: 15000,
        },
      ];

      mockPrismaClient.influencerProfile.findMany = jest.fn().mockResolvedValue(mockInfluencers);
      mockPrismaClient.recommendationResult.createMany = jest.fn().mockResolvedValue({ count: 2 });

      const result = await recommendationService.generateRecommendations(mockRecommendationCriteria);

      expect(result).toHaveLength(2);
      expect(result[0].influencerId).toBe('influencer_1');
      expect(result[0].score).toBeGreaterThan(0.3);
      expect(result[0].reasons).toBeInstanceOf(Array);
      expect(result[0].matchingFactors).toHaveProperty('categoryMatch');
      expect(result[0].matchingFactors).toHaveProperty('audienceMatch');
      expect(result[0].matchingFactors).toHaveProperty('budgetFit');

      // Verify database calls
      expect(mockPrismaClient.influencerProfile.findMany).toHaveBeenCalledWith({
        where: {
          followersCount: { gte: 1000 }
        },
        include: {
          user: true,
          analytics: {
            orderBy: { createdAt: 'desc' },
            take: 30
          },
          socialMediaAccounts: true
        }
      });

      expect(mockPrismaClient.recommendationResult.createMany).toHaveBeenCalled();
    });

    it('should filter out low-score recommendations', async () => {
      const mockInfluencers = [
        {
          ...mockInfluencerProfile,
          id: 'influencer_low',
          categories: ['food'], // Different category - should score lower
          location: 'Da Nang',
          engagementRate: 0.01, // Low engagement
          followersCount: 1500,
        },
      ];

      mockPrismaClient.influencerProfile.findMany = jest.fn().mockResolvedValue(mockInfluencers);
      mockPrismaClient.recommendationResult.createMany = jest.fn().mockResolvedValue({ count: 0 });

      const result = await recommendationService.generateRecommendations(mockRecommendationCriteria);

      // Should filter out recommendations below 0.3 threshold
      expect(result).toHaveLength(0);
    });

    it('should handle empty influencer list', async () => {
      mockPrismaClient.influencerProfile.findMany = jest.fn().mockResolvedValue([]);
      mockPrismaClient.recommendationResult.createMany = jest.fn().mockResolvedValue({ count: 0 });

      const result = await recommendationService.generateRecommendations(mockRecommendationCriteria);

      expect(result).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      mockPrismaClient.influencerProfile.findMany = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        recommendationService.generateRecommendations(mockRecommendationCriteria)
      ).rejects.toThrow('Database error');
    });
  });

  describe('getRecommendationExplanation', () => {
    it('should return recommendation explanation successfully', async () => {
      mockPrismaClient.recommendationResult.findFirst = jest.fn().mockResolvedValue(mockRecommendationResult);

      const result = await recommendationService.getRecommendationExplanation('campaign_123', 'influencer_123');

      expect(result).toHaveProperty('influencer');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reasons');
      expect(result).toHaveProperty('matchingFactors');
      expect(result).toHaveProperty('explanation');
      expect(result.score).toBe(0.85);
      expect(result.explanation).toContain('85.0% compatibility');

      expect(mockPrismaClient.recommendationResult.findFirst).toHaveBeenCalledWith({
        where: {
          campaignId: 'campaign_123',
          influencerId: 'influencer_123',
        },
        include: {
          influencer: {
            include: {
              user: true,
            },
          },
          campaign: true,
        },
      });
    });

    it('should throw error when recommendation not found', async () => {
      mockPrismaClient.recommendationResult.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        recommendationService.getRecommendationExplanation('campaign_123', 'influencer_999')
      ).rejects.toThrow('Recommendation not found');
    });
  });

  describe('category matching algorithm', () => {
    let service: RecommendationService;

    beforeEach(() => {
      service = new RecommendationService();
    });

    it('should calculate perfect category match', () => {
      const influencer = {
        contentCategories: ['beauty', 'skincare', 'fashion'],
      };
      const criteria = {
        categories: ['beauty', 'skincare'],
      };

      // Use reflection to access private method for testing
      const calculateCategoryMatch = (service as any).calculateCategoryMatch;
      const score = calculateCategoryMatch.call(service, influencer, criteria);

      expect(score).toBe(1.0); // Perfect match
    });

    it('should calculate partial category match', () => {
      const influencer = {
        contentCategories: ['beauty', 'tech'],
      };
      const criteria = {
        categories: ['beauty', 'skincare', 'fashion'],
      };

      const calculateCategoryMatch = (service as any).calculateCategoryMatch;
      const score = calculateCategoryMatch.call(service, influencer, criteria);

      expect(score).toBeCloseTo(0.33, 2); // 1/3 match
    });

    it('should return 0.5 for no criteria', () => {
      const influencer = {
        contentCategories: ['beauty'],
      };
      const criteria = {
        categories: [],
      };

      const calculateCategoryMatch = (service as any).calculateCategoryMatch;
      const score = calculateCategoryMatch.call(service, influencer, criteria);

      expect(score).toBe(0.5);
    });
  });

  describe('engagement quality calculation', () => {
    let service: RecommendationService;

    beforeEach(() => {
      service = new RecommendationService();
    });

    it('should score excellent engagement rate', () => {
      const influencer = {
        engagementRate: 0.10, // 10%
        followersCount: 50000,
      };

      const calculateEngagementQuality = (service as any).calculateEngagementQuality;
      const score = calculateEngagementQuality.call(service, influencer);

      expect(score).toBe(1.0); // Excellent
    });

    it('should score good engagement rate', () => {
      const influencer = {
        engagementRate: 0.06, // 6%
        followersCount: 50000,
      };

      const calculateEngagementQuality = (service as any).calculateEngagementQuality;
      const score = calculateEngagementQuality.call(service, influencer);

      expect(score).toBe(0.8); // Good
    });

    it('should boost micro-influencers', () => {
      const influencer = {
        engagementRate: 0.06, // 6%
        followersCount: 8000, // Micro-influencer
      };

      const calculateEngagementQuality = (service as any).calculateEngagementQuality;
      const score = calculateEngagementQuality.call(service, influencer);

      expect(score).toBeCloseTo(0.88, 2); // 0.8 * 1.1 boost
    });

    it('should slightly penalize mega-influencers', () => {
      const influencer = {
        engagementRate: 0.06, // 6%
        followersCount: 500000, // Mega-influencer
      };

      const calculateEngagementQuality = (service as any).calculateEngagementQuality;
      const score = calculateEngagementQuality.call(service, influencer);

      expect(score).toBeCloseTo(0.72, 2); // 0.8 * 0.9 penalty
    });
  });

  describe('Vietnamese market fit calculation', () => {
    let service: RecommendationService;

    beforeEach(() => {
      service = new RecommendationService();
    });

    it('should boost for Vietnamese location', () => {
      const influencer = {
        location: 'Ho Chi Minh City, Vietnam',
        bio: 'Fashion blogger in Vietnam',
      };

      const calculateVietnameseMarketFit = (service as any).calculateVietnameseMarketFit;
      const score = calculateVietnameseMarketFit.call(service, influencer);

      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should boost for Vietnamese content', () => {
      const influencer = {
        location: 'Singapore',
        bio: 'Tôi là một beauty blogger tại Việt Nam',
      };

      const calculateVietnameseMarketFit = (service as any).calculateVietnameseMarketFit;
      const score = calculateVietnameseMarketFit.call(service, influencer);

      expect(score).toBeGreaterThan(0.5);
    });

    it('should return base score for non-Vietnamese', () => {
      const influencer = {
        location: 'New York, USA',
        bio: 'Fashion blogger based in NYC',
      };

      const calculateVietnameseMarketFit = (service as any).calculateVietnameseMarketFit;
      const score = calculateVietnameseMarketFit.call(service, influencer);

      expect(score).toBe(0.5);
    });
  });

  describe('budget compatibility calculation', () => {
    let service: RecommendationService;

    beforeEach(() => {
      service = new RecommendationService();
    });

    it('should score high for very affordable influencer', () => {
      const influencer = {
        averageRate: 1000000, // 1M VND
      };
      const criteria = {
        budget: 10000000, // 10M VND budget
      };

      const calculateBudgetFit = (service as any).calculateBudgetFit;
      const score = calculateBudgetFit.call(service, influencer, criteria);

      expect(score).toBe(1.0); // Very affordable (10% of budget)
    });

    it('should score medium for reasonable rate', () => {
      const influencer = {
        averageRate: 6000000, // 6M VND
      };
      const criteria = {
        budget: 10000000, // 10M VND budget
      };

      const calculateBudgetFit = (service as any).calculateBudgetFit;
      const score = calculateBudgetFit.call(service, influencer, criteria);

      expect(score).toBe(0.6); // Reasonable (60% of budget)
    });

    it('should score low for over budget', () => {
      const influencer = {
        averageRate: 15000000, // 15M VND
      };
      const criteria = {
        budget: 10000000, // 10M VND budget
      };

      const calculateBudgetFit = (service as any).calculateBudgetFit;
      const score = calculateBudgetFit.call(service, influencer, criteria);

      expect(score).toBe(0.1); // Over budget
    });

    it('should return neutral score for unknown rate', () => {
      const influencer = {
        averageRate: 0,
      };
      const criteria = {
        budget: 10000000,
      };

      const calculateBudgetFit = (service as any).calculateBudgetFit;
      const score = calculateBudgetFit.call(service, influencer, criteria);

      expect(score).toBe(0.7); // Neutral score
    });
  });
});
