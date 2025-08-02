import { recommendationService } from '../../src/services/recommendationService';
import { logger } from '../../src/utils/logger';
import type { RecommendationCriteria } from '../../src/services/recommendationService';

// Mock external dependencies
jest.mock('../../src/utils/logger');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    influencerProfile: {
      findMany: jest.fn(),
    },
    campaign: {
      findUnique: jest.fn(),
    },
    campaignAnalytics: {
      findMany: jest.fn(),
    },
    recommendation: {
      createMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

describe('Recommendation Service Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockInfluencers = (count: number) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `influencer_${index}`,
      userId: `user_${index}`,
      displayName: `Influencer ${index}`,
      bio: `Bio for influencer ${index}`,
      categories: index % 2 === 0 ? ['beauty', 'fashion'] : ['tech', 'gaming'],
      followersCount: Math.floor(Math.random() * 100000) + 10000,
      engagementRate: Math.random() * 0.1 + 0.02,
      averageViews: Math.floor(Math.random() * 50000) + 5000,
      location: index % 3 === 0 ? 'Ho Chi Minh City' : index % 3 === 1 ? 'Hanoi' : 'Da Nang',
      contentTypes: ['photo', 'video'],
      rateCard: {
        photoPost: Math.floor(Math.random() * 5000000) + 1000000,
        videoPost: Math.floor(Math.random() * 10000000) + 2000000,
      },
      audienceDemographics: {
        ageGroups: {
          '18-25': Math.random() * 0.4 + 0.1,
          '26-35': Math.random() * 0.4 + 0.1,
          '36-45': Math.random() * 0.3 + 0.1,
        },
        gender: {
          female: Math.random() * 0.6 + 0.2,
          male: Math.random() * 0.6 + 0.2,
        },
        topInterests: ['beauty', 'fashion', 'lifestyle'],
      },
      collaborationHistory: [],
      lastActiveAt: new Date(),
      isVerified: Math.random() > 0.5,
      user: {
        id: `user_${index}`,
        email: `influencer${index}@test.com`,
        username: `influencer${index}`,
        fullName: `Full Name ${index}`,
        avatar: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  };

  const mockCampaign = {
    id: 'campaign_123',
    title: 'Test Campaign',
    description: 'Test Description',
    brandId: 'brand_123',
    budget: 10000000,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'active',
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
    collaborationDetails: {
      deliverables: ['1 photo post', '1 story'],
      timeline: '7 days',
      compensation: '5000000 VND',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Small Dataset Performance (10-100 influencers)', () => {
    it('should process 10 influencers within 100ms', async () => {
      const mockInfluencers = createMockInfluencers(10);
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      
      mockPrisma.influencerProfile.findMany.mockResolvedValue(mockInfluencers);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.campaignAnalytics.findMany.mockResolvedValue([]);

      const startTime = performance.now();
      const recommendations = await recommendationService.generateRecommendations({
        campaignId: 'campaign_123',
        budget: 10000000,
        targetAudience: mockCampaign.targetAudience,
        requirements: mockCampaign.requirements,
        categories: mockCampaign.categories,
        locations: mockCampaign.locations,
      });
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(100); // Should complete within 100ms
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should process 100 influencers within 500ms', async () => {
      const mockInfluencers = createMockInfluencers(100);
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      
      mockPrisma.influencerProfile.findMany.mockResolvedValue(mockInfluencers);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.campaignAnalytics.findMany.mockResolvedValue([]);

      const startTime = performance.now();
      const recommendations = await recommendationService.generateRecommendations(
        'campaign_123',
        {
          budget: '10000000',
          targetAudience: mockCampaign.targetAudience,
          requirements: mockCampaign.requirements,
          categories: mockCampaign.categories,
          locations: mockCampaign.locations,
        }
      );
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(500); // Should complete within 500ms
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Medium Dataset Performance (500-1000 influencers)', () => {
    it('should process 500 influencers within 2 seconds', async () => {
      const mockInfluencers = createMockInfluencers(500);
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      
      mockPrisma.influencerProfile.findMany.mockResolvedValue(mockInfluencers);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.campaignAnalytics.findMany.mockResolvedValue([]);

      const startTime = performance.now();
      const recommendations = await recommendationService.generateRecommendations(
        'campaign_123',
        {
          budget: '10000000',
          targetAudience: mockCampaign.targetAudience,
          requirements: mockCampaign.requirements,
          categories: mockCampaign.categories,
          locations: mockCampaign.locations,
        }
      );
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(recommendations.length).toBeGreaterThan(0);
    }, 5000); // 5 second test timeout

    it('should process 1000 influencers within 5 seconds', async () => {
      const mockInfluencers = createMockInfluencers(1000);
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      
      mockPrisma.influencerProfile.findMany.mockResolvedValue(mockInfluencers);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.campaignAnalytics.findMany.mockResolvedValue([]);

      const startTime = performance.now();
      const recommendations = await recommendationService.generateRecommendations(
        'campaign_123',
        {
          budget: '10000000',
          targetAudience: mockCampaign.targetAudience,
          requirements: mockCampaign.requirements,
          categories: mockCampaign.categories,
          locations: mockCampaign.locations,
        }
      );
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(recommendations.length).toBeGreaterThan(0);
    }, 10000); // 10 second test timeout
  });

  describe('Large Dataset Performance (5000+ influencers)', () => {
    it('should process 5000 influencers within 10 seconds', async () => {
      const mockInfluencers = createMockInfluencers(5000);
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      
      mockPrisma.influencerProfile.findMany.mockResolvedValue(mockInfluencers);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.campaignAnalytics.findMany.mockResolvedValue([]);

      const startTime = performance.now();
      const recommendations = await recommendationService.generateRecommendations(
        'campaign_123',
        {
          budget: '10000000',
          targetAudience: mockCampaign.targetAudience,
          requirements: mockCampaign.requirements,
          categories: mockCampaign.categories,
          locations: mockCampaign.locations,
        }
      );
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Performance logging
      console.log(`Processed 5000 influencers in ${executionTime.toFixed(2)}ms`);
      console.log(`Average time per influencer: ${(executionTime / 5000).toFixed(4)}ms`);
    }, 15000); // 15 second test timeout
  });

  describe('Memory Usage Tests', () => {
    it('should handle large datasets without memory leaks', async () => {
      const initialMemory = process.memoryUsage();
      
      for (let i = 0; i < 5; i++) {
        const mockInfluencers = createMockInfluencers(1000);
        const { PrismaClient } = require('@prisma/client');
        const mockPrisma = new PrismaClient();
        
        mockPrisma.influencerProfile.findMany.mockResolvedValue(mockInfluencers);
        mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
        mockPrisma.campaignAnalytics.findMany.mockResolvedValue([]);

        await recommendationService.generateRecommendations(
          `campaign_${i}`,
          {
            budget: '10000000',
            targetAudience: mockCampaign.targetAudience,
            requirements: mockCampaign.requirements,
            categories: mockCampaign.categories,
            locations: mockCampaign.locations,
          }
        );

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
    }, 30000); // 30 second timeout
  });

  describe('Concurrent Request Performance', () => {
    it('should handle 10 concurrent requests efficiently', async () => {
      const mockInfluencers = createMockInfluencers(500);
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      
      mockPrisma.influencerProfile.findMany.mockResolvedValue(mockInfluencers);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.campaignAnalytics.findMany.mockResolvedValue([]);

      const startTime = performance.now();
      
      const promises = Array.from({ length: 10 }, (_, index) =>
        recommendationService.generateRecommendations(
          `campaign_${index}`,
          {
            budget: '10000000',
            targetAudience: mockCampaign.targetAudience,
            requirements: mockCampaign.requirements,
            categories: mockCampaign.categories,
            locations: mockCampaign.locations,
          }
        )
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });

      console.log(`10 concurrent requests completed in ${executionTime.toFixed(2)}ms`);
    }, 10000); // 10 second timeout
  });

  describe('Algorithm Efficiency Tests', () => {
    it('should maintain scoring accuracy with large datasets', async () => {
      const mockInfluencers = createMockInfluencers(1000);
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      
      mockPrisma.influencerProfile.findMany.mockResolvedValue(mockInfluencers);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.campaignAnalytics.findMany.mockResolvedValue([]);

      const recommendations = await recommendationService.generateRecommendations(
        'campaign_123',
        {
          budget: '10000000',
          targetAudience: mockCampaign.targetAudience,
          requirements: mockCampaign.requirements,
          categories: mockCampaign.categories,
          locations: mockCampaign.locations,
        }
      );

      // Check that recommendations are properly sorted by score
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].score).toBeGreaterThanOrEqual(recommendations[i].score);
      }

      // Check that all scores are within valid range
      recommendations.forEach(rec => {
        expect(rec.score).toBeGreaterThanOrEqual(0);
        expect(rec.score).toBeLessThanOrEqual(1);
      });

      // Check that matching factors are calculated
      recommendations.forEach(rec => {
        expect(rec.matchingFactors).toBeDefined();
        expect(typeof rec.matchingFactors.categoryMatch).toBe('number');
        expect(typeof rec.matchingFactors.audienceMatch).toBe('number');
        expect(typeof rec.matchingFactors.budgetFit).toBe('number');
      });
    });

    it('should return top recommendations within reasonable limits', async () => {
      const mockInfluencers = createMockInfluencers(10000);
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      
      mockPrisma.influencerProfile.findMany.mockResolvedValue(mockInfluencers);
      mockPrisma.campaign.findUnique.mockResolvedValue(mockCampaign);
      mockPrisma.campaignAnalytics.findMany.mockResolvedValue([]);

      const recommendations = await recommendationService.generateRecommendations(
        'campaign_123',
        {
          budget: '10000000',
          targetAudience: mockCampaign.targetAudience,
          requirements: mockCampaign.requirements,
          categories: mockCampaign.categories,
          locations: mockCampaign.locations,
        }
      );

      // Should return a reasonable number of recommendations (not all 10,000)
      expect(recommendations.length).toBeLessThanOrEqual(50);
      expect(recommendations.length).toBeGreaterThan(0);

      // Top recommendations should have high scores
      if (recommendations.length > 0) {
        expect(recommendations[0].score).toBeGreaterThan(0.5);
      }
    }, 20000); // 20 second timeout
  });
});
