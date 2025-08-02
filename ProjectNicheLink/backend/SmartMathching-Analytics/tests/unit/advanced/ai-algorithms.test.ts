import { recommendationService } from '../../../src/services/recommendationService';
import { logger } from '../../../src/utils/logger';
import type { RecommendationCriteria } from '../../../src/services/recommendationService';

// Mock external dependencies
jest.mock('../../../src/utils/logger');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    influencerProfile: { findMany: jest.fn() },
    campaign: { findUnique: jest.fn() },
    campaignAnalytics: { findMany: jest.fn() },
    recommendation: { createMany: jest.fn() },
    recommendationResult: { 
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    analytics: { findMany: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

describe('Advanced Recommendation Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Vietnamese Market Intelligence', () => {
    it('should detect Vietnamese language content and boost score', async () => {
      const mockInfluencers = [
        {
          id: 'influencer_1',
          bio: 'Chào mọi người! Mình là beauty blogger Việt Nam',
          categories: ['beauty'],
          location: 'Ho Chi Minh City',
          followersCount: 50000,
          engagementRate: 0.05,
          contentTypes: ['photo', 'video'],
          audienceDemographics: {
            ageGroups: { '18-25': 0.6, '26-35': 0.3 },
            gender: { female: 0.8, male: 0.2 },
            locations: { 'Vietnam': 0.9, 'Other': 0.1 }
          },
          recentPosts: [
            { content: 'Review son môi mới cực xinh!', engagement: 1500 },
            { content: 'Skincare routine buổi sáng', engagement: 2000 }
          ]
        },
        {
          id: 'influencer_2', 
          bio: 'International beauty influencer based in Vietnam',
          categories: ['beauty'],
          location: 'Ho Chi Minh City',
          followersCount: 50000,
          engagementRate: 0.05,
          contentTypes: ['photo', 'video'],
          audienceDemographics: {
            ageGroups: { '18-25': 0.6, '26-35': 0.3 },
            gender: { female: 0.8, male: 0.2 },
            locations: { 'Vietnam': 0.5, 'International': 0.5 }
          },
          recentPosts: [
            { content: 'New lipstick review!', engagement: 1200 },
            { content: 'Morning skincare routine', engagement: 1800 }
          ]
        }
      ];

      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();
      mockPrisma.influencerProfile.findMany.mockResolvedValue(mockInfluencers);
      mockPrisma.recommendation.createMany.mockResolvedValue({ count: 2 });

      const criteria: RecommendationCriteria = {
        campaignId: 'campaign_vn',
        budget: 5000000,
        targetAudience: {
          ageGroups: ['18-25'],
          gender: 'female',
          languages: ['vietnamese'],
          culturalPreferences: ['local_brands', 'vietnamese_content']
        },
        requirements: { minFollowers: 10000 },
        categories: ['beauty'],
        locations: ['Ho Chi Minh City']
      };

      const recommendations = await recommendationService.generateRecommendations(criteria);

      // Vietnamese content creator should score higher
      expect(recommendations[0].influencerId).toBe('influencer_1');
      expect(recommendations[0].matchingFactors.vietnameseMarketFit).toBeGreaterThan(0.8);
      expect(recommendations[1].matchingFactors.vietnameseMarketFit).toBeLessThan(0.7);
    });

    it('should analyze Vietnamese cultural preferences', async () => {
      const mockInfluencer = {
        id: 'vn_influencer',
        categories: ['fashion', 'lifestyle'],
        recentCollaborations: [
          { brandType: 'local_vietnamese', sentiment: 0.9 },
          { brandType: 'korean_beauty', sentiment: 0.8 },
          { brandType: 'western_luxury', sentiment: 0.6 }
        ],
        audienceInsights: {
          preferredBrandTypes: ['local', 'asian'],
          shoppingBehavior: 'mobile_first',
          socialPlatformUsage: { 'facebook': 0.7, 'instagram': 0.8, 'tiktok': 0.9 }
        }
      };

      const culturalScore = await recommendationService.calculateVietnameseCulturalFit(
        mockInfluencer,
        { 
          brandType: 'local_vietnamese',
          targetPlatforms: ['tiktok', 'instagram'],
          culturalAlignment: 'high'
        }
      );

      expect(culturalScore).toBeGreaterThan(0.85);
    });

    it('should handle Tet holiday seasonal adjustments', async () => {
      // Mock Tet holiday period
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-01-25').getTime()); // Near Tet

      const mockInfluencer = {
        id: 'tet_specialist',
        seasonalPerformance: {
          tet_performance: { engagement_boost: 2.5, reach_increase: 1.8 },
          regular_performance: { engagement_boost: 1.0, reach_increase: 1.0 }
        },
        contentThemes: ['traditional', 'family', 'celebration']
      };

      const seasonalScore = await recommendationService.calculateSeasonalRelevance(
        mockInfluencer,
        { campaignPeriod: 'tet_2025', themes: ['traditional', 'celebration'] }
      );

      expect(seasonalScore).toBeGreaterThan(0.9);
      
      jest.restoreAllMocks();
    });
  });

  describe('Advanced AI Algorithms', () => {
    it('should use machine learning for audience similarity scoring', async () => {
      const mockInfluencer = {
        id: 'ml_test',
        audienceVector: [0.8, 0.3, 0.9, 0.2, 0.7], // Feature vector
        audienceDemographics: {
          ageGroups: { '18-25': 0.4, '26-35': 0.6 },
          interests: ['tech', 'gaming', 'lifestyle'],
          behaviorPatterns: {
            engagement_time: 'evening',
            platform_preference: 'instagram',
            purchase_behavior: 'influenced_by_reviews'
          }
        }
      };

      const targetAudienceVector = [0.7, 0.4, 0.8, 0.3, 0.6];

      const similarityScore = await recommendationService.calculateAudienceSimilarity(
        mockInfluencer.audienceVector,
        targetAudienceVector,
        'cosine' // Algorithm type
      );

      expect(similarityScore).toBeGreaterThan(0.8);
      expect(similarityScore).toBeLessThanOrEqual(1.0);
    });

    it('should predict engagement rates using historical data', async () => {
      const historicalData = [
        { date: '2024-12-01', engagement_rate: 0.05, reach: 10000, campaign_type: 'beauty' },
        { date: '2024-12-15', engagement_rate: 0.07, reach: 12000, campaign_type: 'beauty' },
        { date: '2025-01-01', engagement_rate: 0.06, reach: 11000, campaign_type: 'beauty' },
        { date: '2025-01-15', engagement_rate: 0.08, reach: 13000, campaign_type: 'lifestyle' }
      ];

      const predictedEngagement = await recommendationService.predictEngagementRate(
        'influencer_123',
        {
          campaign_type: 'beauty',
          budget_range: 'medium',
          content_format: 'video',
          target_audience: 'young_female'
        },
        historicalData
      );

      expect(predictedEngagement.rate).toBeGreaterThan(0.04);
      expect(predictedEngagement.confidence).toBeGreaterThan(0.7);
      expect(predictedEngagement.factors).toHaveProperty('trend_analysis');
      expect(predictedEngagement.factors).toHaveProperty('seasonal_adjustment');
    });

    it('should optimize budget allocation across multiple influencers', async () => {
      const influencerPool = [
        { 
          id: 'micro_1', 
          tier: 'micro', 
          rate: 2000000, 
          estimated_reach: 50000, 
          engagement_rate: 0.08,
          roi_history: 3.2
        },
        { 
          id: 'macro_1', 
          tier: 'macro', 
          rate: 10000000, 
          estimated_reach: 200000, 
          engagement_rate: 0.04,
          roi_history: 2.1
        },
        { 
          id: 'mega_1', 
          tier: 'mega', 
          rate: 50000000, 
          estimated_reach: 1000000, 
          engagement_rate: 0.02,
          roi_history: 1.8
        }
      ];

      const budgetOptimization = await recommendationService.optimizeBudgetAllocation({
        total_budget: 20000000,
        optimization_goal: 'max_engagement',
        constraints: {
          min_reach: 300000,
          max_influencers: 5,
          tier_distribution: { micro: 0.6, macro: 0.3, mega: 0.1 }
        },
        influencer_pool: influencerPool
      });

      expect(budgetOptimization.selected_influencers).toHaveLength(3);
      expect(budgetOptimization.total_cost).toBeLessThanOrEqual(20000000);
      expect(budgetOptimization.estimated_reach).toBeGreaterThanOrEqual(300000);
      expect(budgetOptimization.roi_projection).toBeGreaterThan(2.0);
    });
  });

  describe('Real-time Analytics & Monitoring', () => {
    it('should track campaign performance in real-time', async () => {
      const mockCampaignMetrics = {
        campaign_id: 'campaign_123',
        live_metrics: {
          total_impressions: 150000,
          total_engagements: 12000,
          click_through_rate: 0.03,
          conversion_rate: 0.008,
          sentiment_score: 0.75
        },
        influencer_performance: [
          {
            influencer_id: 'inf_1',
            post_performance: { views: 50000, likes: 4000, shares: 200, comments: 150 },
            audience_quality: 0.85,
            brand_safety_score: 0.9
          }
        ],
        updated_at: new Date().toISOString()
      };

      const realTimeAnalytics = await recommendationService.getRealTimeAnalytics('campaign_123');

      expect(realTimeAnalytics).toMatchObject({
        campaign_id: 'campaign_123',
        performance_summary: expect.objectContaining({
          overall_engagement_rate: expect.any(Number),
          roi_current: expect.any(Number),
          brand_sentiment: expect.any(Number)
        }),
        trending_content: expect.any(Array),
        optimization_suggestions: expect.any(Array)
      });
    });

    it('should detect anomalies in campaign performance', async () => {
      const performanceData = [
        { timestamp: '2025-08-01T10:00:00Z', engagement_rate: 0.05 },
        { timestamp: '2025-08-01T11:00:00Z', engagement_rate: 0.04 },
        { timestamp: '2025-08-01T12:00:00Z', engagement_rate: 0.45 }, // Anomaly - too high
        { timestamp: '2025-08-01T13:00:00Z', engagement_rate: 0.001 }, // Anomaly - too low
        { timestamp: '2025-08-01T14:00:00Z', engagement_rate: 0.05 }
      ];

      const anomalies = await recommendationService.detectPerformanceAnomalies(
        'campaign_123',
        performanceData,
        { sensitivity: 'high', algorithm: 'isolation_forest' }
      );

      expect(anomalies).toHaveLength(2);
      expect(anomalies[0]).toMatchObject({
        timestamp: '2025-08-01T12:00:00Z',
        anomaly_type: 'spike',
        severity: 'high',
        probable_cause: expect.any(String)
      });
      expect(anomalies[1]).toMatchObject({
        timestamp: '2025-08-01T13:00:00Z',
        anomaly_type: 'drop',
        severity: 'critical'
      });
    });

    it('should provide automated optimization recommendations', async () => {
      const campaignData = {
        current_performance: {
          engagement_rate: 0.03,
          conversion_rate: 0.005,
          cost_per_engagement: 500,
          audience_quality_score: 0.7
        },
        benchmarks: {
          industry_avg_engagement: 0.045,
          industry_avg_conversion: 0.008,
          target_cpe: 400
        },
        influencer_breakdown: [
          { id: 'inf_1', performance: 'underperforming', issues: ['low_engagement', 'off_brand'] },
          { id: 'inf_2', performance: 'excellent', strengths: ['high_conversion', 'audience_quality'] }
        ]
      };

      const optimizations = await recommendationService.generateOptimizationRecommendations(
        'campaign_123',
        campaignData
      );

      expect(optimizations).toHaveProperty('immediate_actions');
      expect(optimizations).toHaveProperty('strategic_adjustments');
      expect(optimizations.immediate_actions).toContainEqual(
        expect.objectContaining({
          action_type: 'pause_underperformer',
          target: 'inf_1',
          expected_impact: expect.any(String)
        })
      );
      expect(optimizations.strategic_adjustments).toContainEqual(
        expect.objectContaining({
          adjustment_type: 'budget_reallocation',
          from: 'inf_1',
          to: 'inf_2',
          amount: expect.any(Number)
        })
      );
    });
  });

  describe('Enterprise Features', () => {
    it('should handle multi-brand campaign coordination', async () => {
      const multiBrandCampaign = {
        campaign_id: 'multi_brand_123',
        participating_brands: [
          { brand_id: 'brand_a', budget_allocation: 0.6, target_audience: 'young_professionals' },
          { brand_id: 'brand_b', budget_allocation: 0.4, target_audience: 'students' }
        ],
        coordination_rules: {
          content_approval_flow: 'sequential',
          brand_safety_requirements: 'strict',
          exclusivity_periods: { duration: 7, overlap_allowed: false }
        }
      };

      const coordinatedRecommendations = await recommendationService.generateMultiBrandRecommendations(
        multiBrandCampaign
      );

      expect(coordinatedRecommendations).toHaveProperty('brand_a_influencers');
      expect(coordinatedRecommendations).toHaveProperty('brand_b_influencers');
      expect(coordinatedRecommendations).toHaveProperty('shared_influencers');
      expect(coordinatedRecommendations).toHaveProperty('timeline_coordination');
      
      // Ensure no scheduling conflicts
      const allSchedules = [
        ...coordinatedRecommendations.brand_a_influencers,
        ...coordinatedRecommendations.brand_b_influencers
      ];
      
      const hasConflicts = recommendationService.detectSchedulingConflicts(allSchedules);
      expect(hasConflicts).toBe(false);
    });

    it('should implement advanced fraud detection', async () => {
      const suspiciousInfluencer = {
        id: 'suspicious_123',
        follower_growth: [
          { date: '2025-07-01', count: 10000 },
          { date: '2025-07-02', count: 50000 }, // Sudden spike
          { date: '2025-07-03', count: 55000 }
        ],
        engagement_patterns: {
          like_velocity: 'too_fast',
          comment_quality: 'low',
          geographic_distribution: 'suspicious'
        },
        audience_authenticity: {
          bot_percentage: 0.35,
          inactive_accounts: 0.25,
          duplicate_accounts: 0.15
        }
      };

      const fraudAnalysis = await recommendationService.analyzeFraudRisk(suspiciousInfluencer);

      expect(fraudAnalysis.risk_level).toBe('high');
      expect(fraudAnalysis.fraud_indicators).toContain('follower_spike');
      expect(fraudAnalysis.fraud_indicators).toContain('high_bot_percentage');
      expect(fraudAnalysis.recommendation).toBe('exclude');
      expect(fraudAnalysis.confidence_score).toBeGreaterThan(0.8);
    });

    it('should support white-label platform customization', async () => {
      const whiteLabelConfig = {
        client_id: 'agency_xyz',
        branding: {
          algorithm_name: 'SmartMatch Pro',
          scoring_weights: { 
            engagement: 0.4, 
            audience_fit: 0.3, 
            brand_safety: 0.2, 
            cost_efficiency: 0.1 
          },
          excluded_metrics: ['competitor_analysis'],
          custom_filters: ['agency_approved_only', 'premium_tier_only']
        },
        compliance_settings: {
          data_retention: 90,
          privacy_level: 'enhanced',
          audit_trail: true
        }
      };

      const customizedRecommendations = await recommendationService.generateWhiteLabelRecommendations(
        {
          campaignId: 'wl_campaign_123',
          budget: 10000000,
          targetAudience: { ageGroups: ['25-35'] },
          requirements: { minFollowers: 50000 },
          categories: ['luxury']
        },
        whiteLabelConfig
      );

      expect(customizedRecommendations.algorithm_info.name).toBe('SmartMatch Pro');
      expect(customizedRecommendations.recommendations[0].score_breakdown).not.toHaveProperty('competitor_analysis');
      expect(customizedRecommendations.compliance_info).toMatchObject({
        data_retention_days: 90,
        privacy_compliant: true,
        audit_enabled: true
      });
    });

    it('should handle enterprise-scale concurrent processing', async () => {
      const concurrentCampaigns = Array.from({ length: 50 }, (_, i) => ({
        campaignId: `enterprise_${i}`,
        budget: Math.random() * 50000000 + 5000000,
        targetAudience: { ageGroups: ['18-35'] },
        requirements: { minFollowers: 10000 },
        categories: ['beauty', 'fashion', 'lifestyle'][i % 3],
        priority: i < 10 ? 'high' : 'normal'
      }));

      const startTime = performance.now();
      
      const allRecommendations = await Promise.all(
        concurrentCampaigns.map(campaign => 
          recommendationService.generateRecommendations(campaign)
        )
      );
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;

      expect(allRecommendations).toHaveLength(50);
      expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Verify all campaigns got results
      allRecommendations.forEach((recommendations, index) => {
        expect(recommendations).toBeInstanceOf(Array);
        expect(recommendations.length).toBeGreaterThan(0);
      });

      console.log(`Processed 50 concurrent campaigns in ${processingTime.toFixed(2)}ms`);
    }, 15000);
  });

  describe('API Rate Limiting & Caching', () => {
    it('should implement intelligent caching for similar requests', async () => {
      const criteria1 = {
        campaignId: 'cache_test_1',
        budget: 10000000,
        targetAudience: { ageGroups: ['18-25'] },
        requirements: { minFollowers: 10000 },
        categories: ['beauty']
      };

      const criteria2 = {
        campaignId: 'cache_test_2', 
        budget: 10500000, // Slightly different budget
        targetAudience: { ageGroups: ['18-25'] },
        requirements: { minFollowers: 10000 },
        categories: ['beauty']
      };

      // First request - should hit database
      const startTime1 = performance.now();
      const result1 = await recommendationService.generateRecommendations(criteria1);
      const endTime1 = performance.now();

      // Second similar request - should use cache
      const startTime2 = performance.now();
      const result2 = await recommendationService.generateRecommendations(criteria2);
      const endTime2 = performance.now();

      const time1 = endTime1 - startTime1;
      const time2 = endTime2 - startTime2;

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(time2).toBeLessThan(time1 * 0.5); // Cache should be at least 50% faster
    });

    it('should handle rate limiting gracefully', async () => {
      const rateLimitConfig = {
        requests_per_minute: 10,
        burst_allowance: 5,
        client_id: 'test_client'
      };

      // Simulate rapid requests
      const rapidRequests = Array.from({ length: 15 }, (_, i) => ({
        campaignId: `rate_limit_test_${i}`,
        budget: 5000000,
        targetAudience: { ageGroups: ['18-25'] },
        requirements: { minFollowers: 5000 },
        categories: ['tech']
      }));

      const results = [];
      const errors = [];

      for (const criteria of rapidRequests) {
        try {
          const result = await recommendationService.generateRecommendations(criteria, rateLimitConfig);
          results.push(result);
        } catch (error) {
          errors.push(error);
        }
      }

      expect(results.length).toBeLessThanOrEqual(15); // Some should be rate limited
      expect(errors.some(e => e.message.includes('rate limit'))).toBe(true);
    });
  });
});
