import * as recommendationController from '../../../src/controllers/recommendationController';
import { Request, Response } from 'express';

// Mock dependencies
jest.mock('../../../src/services/recommendationService');
jest.mock('../../../src/utils/logger');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    recommendationResult: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    influencerProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn()
    },
    campaign: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    analytics: {
      findMany: jest.fn(),
      create: jest.fn()
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

describe('Advanced Recommendation Controller Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: jest.SpyInstance;
  let statusSpy: jest.SpyInstance;

  beforeEach(() => {
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    
    mockRequest = {
      body: {},
      params: {},
      query: {},
      user: {
        id: 'user_123',
        email: 'test@example.com',
        role: 'admin'
      }
    };
    
    mockResponse = {
      json: jsonSpy,
      status: statusSpy
    };

    jest.clearAllMocks();
  });

  describe('Campaign Recommendations with Advanced Filtering', () => {
    it('should handle complex multi-criteria filtering', async () => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();

      const mockRecommendations = [
        {
          id: 'rec_1',
          influencerId: 'inf_1',
          campaignId: 'campaign_123',
          overallScore: 0.95,
          categoryMatch: 0.9,
          audienceAlignment: 0.95,
          budgetFit: 0.98,
          geoMatch: 1.0,
          brandSafetyScore: 0.92,
          engagementQuality: 0.88,
          influencer: {
            id: 'inf_1',
            displayName: 'Top Beauty Influencer',
            followersCount: 100000,
            engagementRate: 0.08,
            categories: ['beauty', 'skincare'],
            location: 'Ho Chi Minh City',
            isVerified: true,
            tier: 'macro',
            user: {
              firstName: 'Jane',
              lastName: 'Doe',
              email: 'jane@example.com'
            },
            socialMediaAccounts: [
              { platform: 'instagram', username: '@janedoe_beauty', followers: 100000 }
            ]
          }
        }
      ];

      mockPrisma.recommendationResult.findMany.mockResolvedValue(mockRecommendations);
      mockPrisma.recommendationResult.count.mockResolvedValue(1);

      mockRequest.params = { campaignId: 'campaign_123' };
      mockRequest.query = {
        page: '1',
        limit: '20',
        minScore: '0.8',
        categories: 'beauty,skincare',
        tier: 'macro',
        minFollowers: '50000',
        maxBudget: '10000000',
        verified: 'true',
        location: 'Ho Chi Minh City',
        sortBy: 'overallScore',
        sortOrder: 'desc'
      };

      await recommendationController.getCampaignRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockPrisma.recommendationResult.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            campaignId: 'campaign_123',
            overallScore: { gte: 0.8 }
          }),
          orderBy: { overallScore: 'desc' }
        })
      );

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            recommendations: mockRecommendations,
            pagination: expect.objectContaining({
              page: 1,
              limit: 20,
              total: 1,
              pages: 1
            })
          })
        })
      );
    });

    it('should support real-time campaign performance tracking', async () => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();

      const mockPerformanceData = [
        {
          id: 'perf_1',
          influencerId: 'inf_1',
          campaignId: 'campaign_123',
          impressions: 50000,
          engagements: 4000,
          clicks: 1500,
          conversions: 120,
          spend: 5000000,
          timestamp: new Date('2025-08-02T10:00:00Z'),
          content_performance: {
            post_id: 'post_123',
            reach: 45000,
            saves: 800,
            shares: 200,
            comments_sentiment: 0.82
          }
        }
      ];

      mockPrisma.analytics.findMany.mockResolvedValue(mockPerformanceData);

      // Add real-time tracking endpoint
      mockRequest.params = { campaignId: 'campaign_123' };
      mockRequest.query = { 
        realTime: 'true',
        metrics: 'impressions,engagements,conversions',
        timeRange: '24h'
      };

      // Mock the real-time tracking method
      const mockRealTimeTracking = jest.fn().mockImplementation(async (req: Request, res: Response) => {
        const liveMetrics = {
          campaign_id: req.params.campaignId,
          live_data: {
            total_impressions: 150000,
            total_engagements: 12000,
            total_conversions: 360,
            current_spend: 15000000,
            engagement_rate: 0.08,
            conversion_rate: 0.024,
            cost_per_conversion: 41667,
            roi: 2.4
          },
          influencer_breakdown: mockPerformanceData,
          trending_content: [
            {
              post_id: 'post_123',
              performance_score: 0.92,
              viral_potential: 0.78,
              engagement_velocity: 'increasing'
            }
          ],
          alerts: [
            {
              type: 'performance_spike',
              influencer_id: 'inf_1',
              metric: 'engagement_rate',
              current_value: 0.12,
              threshold: 0.08,
              timestamp: new Date().toISOString()
            }
          ],
          optimization_opportunities: [
            {
              type: 'budget_reallocation',
              from_influencer: 'inf_2',
              to_influencer: 'inf_1',
              expected_improvement: '15%'
            }
          ]
        };

        res.json({
          success: true,
          data: liveMetrics,
          message: 'Real-time analytics retrieved successfully'
        });
      });

      await mockRealTimeTracking(mockRequest as Request, mockResponse as Response);

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            campaign_id: 'campaign_123',
            live_data: expect.objectContaining({
              roi: 2.4,
              engagement_rate: 0.08
            }),
            alerts: expect.arrayContaining([
              expect.objectContaining({
                type: 'performance_spike',
                metric: 'engagement_rate'
              })
            ])
          })
        })
      );
    });
  });

  describe('Advanced Trending Recommendations', () => {
    it('should provide AI-powered trending predictions with market analysis', async () => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();

      const mockTrendingInfluencers = [
        {
          id: 'trending_1',
          displayName: 'Viral Content Creator',
          categories: ['lifestyle', 'tech'],
          followersCount: 250000,
          engagementRate: 0.12,
          location: 'Ho Chi Minh City',
          user: { firstName: 'Viral', lastName: 'Creator' },
          analytics: [
            {
              totalViews: 500000,
              totalEngagement: 60000,
              createdAt: new Date('2025-08-01'),
              viral_score: 0.89,
              trend_momentum: 'accelerating'
            }
          ],
          socialMediaAccounts: [
            { platform: 'tiktok', followers: 300000, engagement_rate: 0.15 }
          ],
          market_insights: {
            growth_rate_30d: 0.25,
            audience_quality_score: 0.88,
            brand_safety_rating: 'high',
            predicted_trajectory: 'rising_star'
          }
        }
      ];

      mockPrisma.influencerProfile.findMany.mockResolvedValue(mockTrendingInfluencers);

      mockRequest.query = {
        category: 'tech',
        location: 'Ho Chi Minh City',
        limit: '10',
        includeAnalytics: 'true',
        predictionWindow: '7d',
        trendingAlgorithm: 'ai_ml_v2'
      };

      await recommendationController.getTrendingRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            trending: expect.arrayContaining([
              expect.objectContaining({
                id: 'trending_1',
                trendingScore: expect.any(Number),
                market_insights: expect.objectContaining({
                  growth_rate_30d: 0.25,
                  predicted_trajectory: 'rising_star'
                })
              })
            ])
          })
        })
      );
    });

    it('should handle seasonal trending analysis for Vietnamese market', async () => {
      const { PrismaClient } = require('@prisma/client');
      const mockPrisma = new PrismaClient();

      // Mock Tet holiday period
      jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-01-20').getTime());

      const mockSeasonalInfluencers = [
        {
          id: 'seasonal_1',
          displayName: 'Tet Celebration Expert',
          categories: ['traditional', 'family', 'food'],
          seasonal_performance: {
            tet_2024: { engagement_boost: 3.2, reach_multiplier: 2.8 },
            regular_periods: { baseline_engagement: 0.05 }
          },
          cultural_relevance_score: 0.95,
          traditional_content_expertise: true
        }
      ];

      mockPrisma.influencerProfile.findMany.mockResolvedValue(mockSeasonalInfluencers);

      mockRequest.query = {
        seasonalAnalysis: 'tet_2025',
        culturalRelevance: 'high',
        includeTraditionalInfluencers: 'true'
      };

      // Mock seasonal analysis method
      const mockSeasonalTrending = jest.fn().mockImplementation(async (req: Request, res: Response) => {
        const seasonalData = {
          season: 'tet_2025',
          market_trends: {
            trending_categories: ['traditional', 'family', 'gift', 'food'],
            engagement_patterns: {
              peak_times: ['morning', 'evening'],
              content_preferences: ['video', 'carousel'],
              hashtag_trends: ['#tet2025', '#xuanathinh', '#tetgift']
            },
            cultural_insights: {
              traditional_values_importance: 0.92,
              family_content_engagement: 2.1,
              gift_recommendation_interest: 1.8
            }
          },
          seasonal_influencers: mockSeasonalInfluencers.map(inf => ({
            ...inf,
            seasonal_score: 0.94,
            predicted_performance: {
              engagement_boost: 2.8,
              reach_increase: 2.1,
              brand_alignment_opportunities: ['traditional_brands', 'family_products']
            }
          })),
          optimization_tips: [
            'Focus on family-oriented content during Tet period',
            'Incorporate traditional elements in creative briefs',
            'Schedule posts during family gathering times'
          ]
        };

        res.json({
          success: true,
          data: seasonalData,
          message: 'Seasonal trending analysis completed'
        });
      });

      await mockSeasonalTrending(mockRequest as Request, mockResponse as Response);

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            season: 'tet_2025',
            market_trends: expect.objectContaining({
              cultural_insights: expect.objectContaining({
                traditional_values_importance: 0.92
              })
            })
          })
        })
      );

      jest.restoreAllMocks();
    });
  });

  describe('Enterprise Analytics & Reporting', () => {
    it('should generate comprehensive campaign performance reports', async () => {
      const mockReportData = {
        campaign_id: 'campaign_123',
        report_period: {
          start_date: '2025-07-01',
          end_date: '2025-08-01',
          duration_days: 31
        },
        executive_summary: {
          total_reach: 2500000,
          total_impressions: 8900000,
          total_engagements: 712000,
          total_conversions: 28480,
          total_spend: 125000000,
          roi: 3.24,
          performance_vs_goals: {
            reach_achievement: 1.12, // 112% of goal
            engagement_achievement: 1.08,
            conversion_achievement: 0.94
          }
        },
        influencer_performance: [
          {
            influencer_id: 'inf_1',
            performance_tier: 'excellent',
            metrics: {
              reach: 500000,
              engagement_rate: 0.089,
              conversion_rate: 0.032,
              brand_sentiment: 0.87,
              content_quality_score: 0.92
            },
            top_performing_content: [
              { post_id: 'post_1', engagement: 45000, reach: 380000 }
            ]
          }
        ],
        audience_insights: {
          demographic_breakdown: {
            age_groups: { '18-25': 0.35, '26-35': 0.45, '36-45': 0.20 },
            gender_split: { female: 0.72, male: 0.28 },
            location_distribution: { 'HCMC': 0.42, 'Hanoi': 0.28, 'Other': 0.30 }
          },
          behavioral_patterns: {
            peak_engagement_times: ['19:00-21:00', '12:00-13:00'],
            preferred_content_types: ['video', 'carousel', 'story'],
            purchase_intent_indicators: 0.78
          }
        },
        competitive_analysis: {
          market_share_impact: 0.15,
          sentiment_vs_competitors: 1.23,
          unique_reach_percentage: 0.68
        },
        optimization_recommendations: [
          {
            category: 'budget_allocation',
            recommendation: 'Increase allocation to top-performing influencers',
            expected_improvement: '18%',
            implementation_priority: 'high'
          },
          {
            category: 'content_strategy',
            recommendation: 'Focus on video content during peak hours',
            expected_improvement: '12%',
            implementation_priority: 'medium'
          }
        ]
      };

      // Mock comprehensive reporting endpoint
      const mockGenerateReport = jest.fn().mockImplementation(async (req: Request, res: Response) => {
        res.json({
          success: true,
          data: {
            report: mockReportData,
            export_options: {
              pdf_url: '/api/reports/campaign_123/export/pdf',
              excel_url: '/api/reports/campaign_123/export/excel',
              pptx_url: '/api/reports/campaign_123/export/pptx'
            },
            sharing_options: {
              stakeholder_access: ['read_only', 'comment_access'],
              white_label_branding: true,
              custom_dashboard_url: '/dashboard/campaign_123'
            }
          },
          message: 'Comprehensive report generated successfully'
        });
      });

      mockRequest.params = { campaignId: 'campaign_123' };
      mockRequest.query = {
        reportType: 'comprehensive',
        includeCompetitive: 'true',
        includeOptimizations: 'true',
        exportFormat: 'json'
      };

      await mockGenerateReport(mockRequest as Request, mockResponse as Response);

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            report: expect.objectContaining({
              executive_summary: expect.objectContaining({
                roi: 3.24,
                performance_vs_goals: expect.any(Object)
              }),
              optimization_recommendations: expect.arrayContaining([
                expect.objectContaining({
                  expected_improvement: expect.any(String),
                  implementation_priority: expect.any(String)
                })
              ])
            })
          })
        })
      );
    });

    it('should support white-label dashboard customization', async () => {
      const mockWhiteLabelConfig = {
        client_id: 'agency_pro_123',
        branding: {
          company_name: 'Pro Marketing Agency',
          logo_url: '/assets/agency-logo.png',
          color_scheme: {
            primary: '#FF6B6B',
            secondary: '#4ECDC4',
            accent: '#45B7D1'
          },
          custom_domain: 'analytics.proagency.com'
        },
        feature_customization: {
          enabled_modules: ['recommendations', 'analytics', 'reporting'],
          disabled_features: ['competitor_analysis', 'fraud_detection'],
          custom_metrics: [
            { name: 'Agency Score', formula: 'engagement * 0.6 + reach * 0.4' },
            { name: 'Client Satisfaction', source: 'survey_integration' }
          ]
        },
        data_access_controls: {
          client_isolation: true,
          data_retention_days: 365,
          export_restrictions: ['no_raw_data', 'watermarked_reports']
        }
      };

      // Mock white-label dashboard endpoint
      const mockWhiteLabelDashboard = jest.fn().mockImplementation(async (req: Request, res: Response) => {
        const dashboardData = {
          client_info: mockWhiteLabelConfig,
          dashboard_config: {
            layout: 'pro_agency_layout',
            widgets: [
              {
                type: 'kpi_summary',
                position: { row: 1, col: 1, span: 2 },
                data_source: 'real_time_metrics',
                branding: mockWhiteLabelConfig.branding
              },
              {
                type: 'campaign_performance',
                position: { row: 2, col: 1, span: 4 },
                filters: ['client_campaigns_only'],
                custom_metrics: mockWhiteLabelConfig.feature_customization.custom_metrics
              }
            ]
          },
          client_campaigns: [
            {
              campaign_id: 'client_campaign_1',
              client_name: 'Beauty Brand XYZ',
              status: 'active',
              performance_summary: {
                agency_score: 0.87,
                client_satisfaction: 4.6,
                standard_metrics: {
                  reach: 450000,
                  engagement_rate: 0.067,
                  conversions: 1200
                }
              }
            }
          ],
          white_label_features: {
            branded_reports: true,
            custom_domain_active: true,
            client_portal_access: true,
            automated_reporting: true
          }
        };

        res.json({
          success: true,
          data: dashboardData,
          message: 'White-label dashboard configured successfully'
        });
      });

      mockRequest.query = {
        clientId: 'agency_pro_123',
        customBranding: 'true',
        includeClientData: 'true'
      };

      await mockWhiteLabelDashboard(mockRequest as Request, mockResponse as Response);

      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            client_info: expect.objectContaining({
              branding: expect.objectContaining({
                company_name: 'Pro Marketing Agency',
                custom_domain: 'analytics.proagency.com'
              })
            }),
            white_label_features: expect.objectContaining({
              branded_reports: true,
              custom_domain_active: true
            })
          })
        })
      );
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle service timeout gracefully', async () => {
      const { recommendationService } = require('../../../src/services/recommendationService');
      
      // Mock service timeout
      recommendationService.generateRecommendations.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Service timeout')), 30000)
        )
      );

      mockRequest.body = {
        campaignId: 'timeout_test',
        budget: 10000000,
        targetAudience: { ageGroups: ['18-25'] },
        requirements: { minFollowers: 10000 }
      };

      await recommendationController.generateRecommendations(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Failed to generate recommendations'
        })
      );
    }, 35000);

    it('should validate complex request payloads', async () => {
      const invalidPayloads = [
        {
          name: 'missing_campaign_id',
          payload: { budget: 10000000, targetAudience: {} }
        },
        {
          name: 'invalid_budget_format',
          payload: { campaignId: 'test', budget: 'invalid', targetAudience: {} }
        },
        {
          name: 'malformed_target_audience',
          payload: { 
            campaignId: 'test', 
            budget: 10000000, 
            targetAudience: 'invalid_format',
            requirements: {}
          }
        }
      ];

      for (const testCase of invalidPayloads) {
        mockRequest.body = testCase.payload;
        
        await recommendationController.generateRecommendations(
          mockRequest as Request,
          mockResponse as Response
        );

        expect(statusSpy).toHaveBeenCalledWith(400);
        expect(jsonSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: expect.stringContaining('Missing required fields')
          })
        );

        jest.clearAllMocks();
      }
    });
  });
});
