// Machine Learning & Predictive Analytics Test Suite
// Tests advanced AI algorithms for influencer recommendation and performance prediction

interface MLModelResult {
  prediction: number;
  confidence: number;
  feature_importance: Record<string, number>;
  model_version: string;
}

interface PredictiveAnalytics {
  engagement_prediction: MLModelResult;
  conversion_prediction: MLModelResult;
  viral_potential: MLModelResult;
  audience_growth_forecast: MLModelResult;
}

class MockMLService {
  private models: Map<string, any> = new Map();

  constructor() {
    this.initializeModels();
  }

  private initializeModels() {
    // Mock trained models
    this.models.set('engagement_predictor', {
      version: 'v2.1',
      accuracy: 0.87,
      features: ['follower_count', 'engagement_rate', 'content_quality', 'posting_time', 'hashtag_relevance']
    });

    this.models.set('conversion_predictor', {
      version: 'v1.8',
      accuracy: 0.82,
      features: ['audience_demographics', 'brand_alignment', 'historical_performance', 'market_trends']
    });

    this.models.set('viral_predictor', {
      version: 'v1.3',
      accuracy: 0.78,
      features: ['content_novelty', 'emotional_impact', 'trend_alignment', 'network_reach']
    });
  }

  async predictEngagement(influencerData: any, campaignContext: any): Promise<MLModelResult> {
    // Simulate ML model prediction
    const features = {
      follower_count: influencerData.followersCount / 100000,
      engagement_rate: influencerData.engagementRate,
      content_quality: influencerData.contentQualityScore || 0.75,
      posting_time_alignment: this.calculateTimeAlignment(campaignContext.optimalTimes),
      hashtag_relevance: this.calculateHashtagRelevance(influencerData.categories, campaignContext.categories)
    };

    const prediction = this.computeWeightedScore(features, {
      follower_count: 0.15,
      engagement_rate: 0.35,
      content_quality: 0.25,
      posting_time_alignment: 0.15,
      hashtag_relevance: 0.10
    });

    return {
      prediction: Math.min(Math.max(prediction, 0), 1),
      confidence: this.calculateConfidence(features),
      feature_importance: {
        engagement_rate: 0.35,
        content_quality: 0.25,
        follower_count: 0.15,
        posting_time_alignment: 0.15,
        hashtag_relevance: 0.10
      },
      model_version: 'v2.1'
    };
  }

  async predictConversion(influencerData: any, campaignContext: any): Promise<MLModelResult> {
    const features = {
      audience_alignment: this.calculateAudienceAlignment(influencerData.audienceDemographics, campaignContext.targetAudience),
      brand_alignment: this.calculateBrandAlignment(influencerData.brandCollaborations, campaignContext.brandCategory),
      historical_performance: influencerData.conversionHistory?.avgRate || 0.02,
      market_trends: this.getMarketTrendScore(campaignContext.industry),
      price_sensitivity: this.calculatePriceSensitivity(influencerData.audienceDemographics)
    };

    const prediction = this.computeWeightedScore(features, {
      audience_alignment: 0.30,
      brand_alignment: 0.25,
      historical_performance: 0.25,
      market_trends: 0.10,
      price_sensitivity: 0.10
    });

    return {
      prediction: Math.min(Math.max(prediction, 0), 0.15), // Max 15% conversion rate
      confidence: this.calculateConfidence(features),
      feature_importance: {
        audience_alignment: 0.30,
        brand_alignment: 0.25,
        historical_performance: 0.25,
        market_trends: 0.10,
        price_sensitivity: 0.10
      },
      model_version: 'v1.8'
    };
  }

  async predictViralPotential(contentData: any, marketContext: any): Promise<MLModelResult> {
    const features = {
      content_novelty: this.assessContentNovelty(contentData.theme, marketContext.recentTrends),
      emotional_impact: contentData.emotionalScore || 0.6,
      trend_alignment: this.calculateTrendAlignment(contentData.hashtags, marketContext.trendingHashtags),
      network_reach: this.calculateNetworkReach(contentData.influencerNetwork),
      timing_factor: this.calculateTimingFactor(contentData.plannedPostTime, marketContext.optimalTimes)
    };

    const prediction = this.computeWeightedScore(features, {
      content_novelty: 0.25,
      emotional_impact: 0.25,
      trend_alignment: 0.20,
      network_reach: 0.20,
      timing_factor: 0.10
    });

    return {
      prediction: Math.min(Math.max(prediction, 0), 1),
      confidence: this.calculateConfidence(features),
      feature_importance: {
        content_novelty: 0.25,
        emotional_impact: 0.25,
        trend_alignment: 0.20,
        network_reach: 0.20,
        timing_factor: 0.10
      },
      model_version: 'v1.3'
    };
  }

  async forecastAudienceGrowth(influencerData: any, timeHorizon: number): Promise<MLModelResult> {
    const historicalGrowth = influencerData.growthHistory || [];
    const features = {
      current_growth_rate: this.calculateGrowthRate(historicalGrowth),
      content_consistency: influencerData.postingFrequency || 0.8,
      engagement_trend: this.calculateEngagementTrend(historicalGrowth),
      market_saturation: this.assessMarketSaturation(influencerData.niche),
      collaboration_impact: this.assessCollaborationImpact(influencerData.recentCollaborations)
    };

    const baseGrowthRate = features.current_growth_rate;
    const growthModifier = this.computeWeightedScore(features, {
      content_consistency: 0.25,
      engagement_trend: 0.25,
      market_saturation: 0.20,
      collaboration_impact: 0.20,
      current_growth_rate: 0.10
    });

    const projectedGrowth = baseGrowthRate * growthModifier * timeHorizon;

    return {
      prediction: Math.min(Math.max(projectedGrowth, -0.5), 2.0), // -50% to +200% growth
      confidence: this.calculateConfidence(features),
      feature_importance: {
        content_consistency: 0.25,
        engagement_trend: 0.25,
        market_saturation: 0.20,
        collaboration_impact: 0.20,
        current_growth_rate: 0.10
      },
      model_version: 'v1.5'
    };
  }

  // Utility methods for calculations
  private calculateTimeAlignment(optimalTimes: string[]): number {
    // Mock calculation
    return Math.random() * 0.3 + 0.7; // 0.7 to 1.0
  }

  private calculateHashtagRelevance(influencerCategories: string[] = [], campaignCategories: string[] = []): number {
    if (!influencerCategories || !campaignCategories) return 0;
    const overlap = influencerCategories.filter(cat => campaignCategories.includes(cat)).length;
    return overlap / Math.max(influencerCategories.length, campaignCategories.length, 1);
  }

  private calculateAudienceAlignment(influencerAudience: any, targetAudience: any): number {
    // Simplified audience alignment calculation
    let alignment = 0;
    
    // Age group alignment
    if (influencerAudience.ageGroups && targetAudience.ageGroups) {
      const ageOverlap = Object.keys(influencerAudience.ageGroups)
        .filter(age => targetAudience.ageGroups.includes(age))
        .reduce((sum, age) => sum + influencerAudience.ageGroups[age], 0);
      alignment += ageOverlap * 0.4;
    }

    // Gender alignment
    if (influencerAudience.gender && targetAudience.gender) {
      if (targetAudience.gender === 'all') {
        alignment += 0.3;
      } else {
        alignment += (influencerAudience.gender[targetAudience.gender] || 0) * 0.3;
      }
    }

    // Interest alignment
    if (influencerAudience.interests && targetAudience.interests) {
      const interestOverlap = influencerAudience.interests
        .filter((interest: string) => targetAudience.interests.includes(interest)).length;
      alignment += (interestOverlap / targetAudience.interests.length) * 0.3;
    }

    return Math.min(alignment, 1);
  }

  private calculateBrandAlignment(brandCollaborations: any[], brandCategory: string): number {
    if (!brandCollaborations || brandCollaborations.length === 0) return 0.5;
    
    const relevantCollabs = brandCollaborations.filter(collab => 
      collab.category === brandCategory || collab.sentiment > 0.8
    );
    
    return Math.min(relevantCollabs.length / brandCollaborations.length + 0.3, 1);
  }

  private getMarketTrendScore(industry: string): number {
    const trendScores: Record<string, number> = {
      beauty: 0.85,
      fashion: 0.78,
      tech: 0.72,
      lifestyle: 0.80,
      food: 0.75
    };
    
    return trendScores[industry] || 0.65;
  }

  private calculatePriceSensitivity(audienceDemographics: any): number {
    // Mock price sensitivity based on demographics
    const ageGroups = audienceDemographics.ageGroups || {};
    const youngAudience = (ageGroups['18-25'] || 0) + (ageGroups['26-35'] || 0);
    
    return Math.max(0.3, 1 - youngAudience * 0.5); // Younger audience = higher price sensitivity
  }

  private assessContentNovelty(theme: string, recentTrends: string[]): number {
    const isNovel = !recentTrends.includes(theme);
    return isNovel ? Math.random() * 0.4 + 0.6 : Math.random() * 0.6 + 0.2;
  }

  private calculateTrendAlignment(hashtags: string[], trendingHashtags: string[]): number {
    const trendingCount = hashtags.filter(tag => trendingHashtags.includes(tag)).length;
    return Math.min(trendingCount / hashtags.length, 1);
  }

  private calculateNetworkReach(influencerNetwork: any): number {
    return Math.random() * 0.3 + 0.5; // Mock network reach score
  }

  private calculateTimingFactor(plannedTime: string, optimalTimes: string[] = []): number {
    if (!optimalTimes || optimalTimes.length === 0) return 0.6;
    return optimalTimes.includes(plannedTime) ? 1.0 : 0.6;
  }

  private calculateGrowthRate(growthHistory: any[]): number {
    if (growthHistory.length < 2) return 0.05; // Default 5% growth
    
    const recentGrowth = growthHistory.slice(-3);
    const avgGrowth = recentGrowth.reduce((sum, period) => sum + period.growthRate, 0) / recentGrowth.length;
    return avgGrowth;
  }

  private calculateEngagementTrend(growthHistory: any[]): number {
    if (growthHistory.length < 2) return 0.5;
    
    const engagementTrend = growthHistory.slice(-2);
    return engagementTrend[1].engagementRate > engagementTrend[0].engagementRate ? 0.8 : 0.4;
  }

  private assessMarketSaturation(niche: string): number {
    const saturationLevels: Record<string, number> = {
      beauty: 0.7, // High saturation
      tech: 0.4,   // Medium saturation
      lifestyle: 0.8, // Very high saturation
      gaming: 0.3    // Low saturation
    };
    
    return 1 - (saturationLevels[niche] || 0.5);
  }

  private assessCollaborationImpact(recentCollaborations: any[]): number {
    if (!recentCollaborations || recentCollaborations.length === 0) return 0.5;
    
    const avgImpact = recentCollaborations.reduce((sum, collab) => 
      sum + (collab.growthImpact || 0.05), 0) / recentCollaborations.length;
    
    return Math.min(avgImpact * 10, 1); // Normalize to 0-1
  }

  private computeWeightedScore(features: Record<string, number>, weights: Record<string, number>): number {
    return Object.entries(features).reduce((score, [feature, value]) => {
      return score + (value * (weights[feature] || 0));
    }, 0);
  }

  private calculateConfidence(features: Record<string, number>): number {
    // Calculate confidence based on feature completeness and variance
    const completeness = Object.values(features).filter(v => v > 0).length / Object.keys(features).length;
    const variance = this.calculateVariance(Object.values(features));
    
    return Math.min(completeness * (1 - variance * 0.5), 0.95);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
}

describe('Machine Learning & Predictive Analytics Tests', () => {
  let mlService: MockMLService;

  beforeEach(() => {
    mlService = new MockMLService();
  });

  describe('Engagement Prediction', () => {
    it('should predict engagement rates with high accuracy', async () => {
      const influencerData = {
        followersCount: 150000,
        engagementRate: 0.065,
        contentQualityScore: 0.82,
        categories: ['beauty', 'skincare']
      };

      const campaignContext = {
        optimalTimes: ['19:00', '20:00', '21:00'],
        categories: ['beauty', 'skincare', 'wellness']
      };

      const prediction = await mlService.predictEngagement(influencerData, campaignContext);

      expect(prediction).toMatchObject({
        prediction: expect.any(Number),
        confidence: expect.any(Number),
        feature_importance: expect.any(Object),
        model_version: 'v2.1'
      });

      expect(prediction.prediction).toBeGreaterThan(0);
      expect(prediction.prediction).toBeLessThanOrEqual(1);
      expect(prediction.confidence).toBeGreaterThan(0.5);
      expect(prediction.confidence).toBeLessThanOrEqual(1);

      // Feature importance should add up to 1
      const totalImportance = Object.values(prediction.feature_importance)
        .reduce((sum, importance) => sum + importance, 0);
      expect(totalImportance).toBeCloseTo(1, 1);

      // Engagement rate should be the most important feature
      expect(prediction.feature_importance.engagement_rate).toBe(0.35);
    });

    it('should handle influencers with varying follower counts', async () => {
      const testCases = [
        { followersCount: 5000, expectedRange: [0.4, 0.8] },    // Micro-influencer
        { followersCount: 50000, expectedRange: [0.5, 0.9] },   // Mid-tier
        { followersCount: 500000, expectedRange: [0.3, 0.7] },  // Macro-influencer
        { followersCount: 2000000, expectedRange: [0.2, 0.6] }  // Celebrity-tier
      ];

      for (const testCase of testCases) {
        const influencerData = {
          followersCount: testCase.followersCount,
          engagementRate: 0.05,
          categories: ['lifestyle']
        };

        const prediction = await mlService.predictEngagement(influencerData, {
          optimalTimes: ['20:00'],
          categories: ['lifestyle']
        });

        expect(prediction.prediction).toBeGreaterThanOrEqual(testCase.expectedRange[0]);
        expect(prediction.prediction).toBeLessThanOrEqual(testCase.expectedRange[1]);
      }
    });

    it('should consider posting time alignment in predictions', async () => {
      const baseInfluencer = {
        followersCount: 100000,
        engagementRate: 0.06,
        categories: ['fashion']
      };

      // Optimal timing
      const optimalPrediction = await mlService.predictEngagement(baseInfluencer, {
        optimalTimes: ['19:00', '20:00'],
        categories: ['fashion']
      });

      // Poor timing
      const poorTimingPrediction = await mlService.predictEngagement(baseInfluencer, {
        optimalTimes: ['06:00', '07:00'], // Early morning
        categories: ['fashion']
      });

      expect(optimalPrediction.prediction).toBeGreaterThan(poorTimingPrediction.prediction);
    });
  });

  describe('Conversion Prediction', () => {
    it('should predict conversion rates accurately', async () => {
      const influencerData = {
        audienceDemographics: {
          ageGroups: { '25-34': 0.6, '35-44': 0.3 },
          gender: { female: 0.75, male: 0.25 },
          interests: ['beauty', 'skincare', 'wellness']
        },
        brandCollaborations: [
          { category: 'beauty', sentiment: 0.9 },
          { category: 'skincare', sentiment: 0.85 }
        ],
        conversionHistory: { avgRate: 0.045 }
      };

      const campaignContext = {
        targetAudience: {
          ageGroups: ['25-34', '35-44'],
          gender: 'female',
          interests: ['beauty', 'anti-aging']
        },
        brandCategory: 'beauty',
        industry: 'beauty'
      };

      const prediction = await mlService.predictConversion(influencerData, campaignContext);

      expect(prediction.prediction).toBeGreaterThan(0);
      expect(prediction.prediction).toBeLessThanOrEqual(0.15);
      expect(prediction.confidence).toBeGreaterThan(0.6);
      expect(prediction.model_version).toBe('v1.8');

      // Audience alignment should be the most important factor
      expect(prediction.feature_importance.audience_alignment).toBe(0.30);
    });

    it('should account for audience-brand alignment', async () => {
      const perfectAlignment = {
        audienceDemographics: {
          ageGroups: { '25-34': 0.8 },
          gender: { female: 0.9 },
          interests: ['luxury', 'beauty']
        },
        brandCollaborations: [{ category: 'luxury', sentiment: 0.95 }]
      };

      const poorAlignment = {
        audienceDemographics: {
          ageGroups: { '18-24': 0.8 },
          gender: { male: 0.7 },
          interests: ['gaming', 'tech']
        },
        brandCollaborations: [{ category: 'gaming', sentiment: 0.6 }]
      };

      const luxuryCampaign = {
        targetAudience: {
          ageGroups: ['25-34'],
          gender: 'female',
          interests: ['luxury', 'beauty']
        },
        brandCategory: 'luxury',
        industry: 'beauty'
      };

      const perfectPrediction = await mlService.predictConversion(perfectAlignment, luxuryCampaign);
      const poorPrediction = await mlService.predictConversion(poorAlignment, luxuryCampaign);

      expect(perfectPrediction.prediction).toBeGreaterThan(poorPrediction.prediction);
      expect(perfectPrediction.confidence).toBeGreaterThan(poorPrediction.confidence);
    });
  });

  describe('Viral Potential Prediction', () => {
    it('should assess viral potential of content', async () => {
      const contentData = {
        theme: 'sustainable_beauty',
        emotionalScore: 0.85,
        hashtags: ['#sustainablebeauty', '#ecofriendly', '#greenliving'],
        influencerNetwork: { reach: 500000, interconnectedness: 0.7 },
        plannedPostTime: '20:00'
      };

      const marketContext = {
        recentTrends: ['fastfashion', 'luxury'],
        trendingHashtags: ['#sustainablebeauty', '#ecofriendly', '#viral2025'],
        optimalTimes: ['19:00', '20:00', '21:00']
      };

      const viralPrediction = await mlService.predictViralPotential(contentData, marketContext);

      expect(viralPrediction.prediction).toBeGreaterThan(0);
      expect(viralPrediction.prediction).toBeLessThanOrEqual(1);
      expect(viralPrediction.confidence).toBeGreaterThan(0.5);
      expect(viralPrediction.model_version).toBe('v1.3');

      // Content novelty and emotional impact should be key factors
      expect(viralPrediction.feature_importance.content_novelty).toBe(0.25);
      expect(viralPrediction.feature_importance.emotional_impact).toBe(0.25);
    });

    it('should favor novel content themes', async () => {
      const novelContent = {
        theme: 'ai_beauty_recommendations',
        emotionalScore: 0.8,
        hashtags: ['#aibeauty', '#techtrends'],
        influencerNetwork: { reach: 300000 },
        plannedPostTime: '20:00'
      };

      const oversaturatedContent = {
        theme: 'makeup_tutorial',
        emotionalScore: 0.8,
        hashtags: ['#makeup', '#beauty'],
        influencerNetwork: { reach: 300000 },
        plannedPostTime: '20:00'
      };

      const marketContext = {
        recentTrends: ['makeup_tutorial', 'skincare_routine'],
        trendingHashtags: ['#beauty', '#makeup'],
        optimalTimes: ['20:00']
      };

      const novelPrediction = await mlService.predictViralPotential(novelContent, marketContext);
      const oversaturatedPrediction = await mlService.predictViralPotential(oversaturatedContent, marketContext);

      expect(novelPrediction.prediction).toBeGreaterThan(oversaturatedPrediction.prediction);
    });

    it('should consider trending hashtags alignment', async () => {
      const trendingContent = {
        theme: 'trending_topic',
        hashtags: ['#viral2025', '#trending', '#beauty'],
        emotionalScore: 0.7
      };

      const nonTrendingContent = {
        theme: 'regular_topic',
        hashtags: ['#oldtrend', '#outdated'],
        emotionalScore: 0.7
      };

      const marketContext = {
        trendingHashtags: ['#viral2025', '#trending', '#newbeauty'],
        recentTrends: ['other_topic']
      };

      const trendingPrediction = await mlService.predictViralPotential(trendingContent, marketContext);
      const nonTrendingPrediction = await mlService.predictViralPotential(nonTrendingContent, marketContext);

      expect(trendingPrediction.prediction).toBeGreaterThan(nonTrendingPrediction.prediction);
    });
  });

  describe('Audience Growth Forecasting', () => {
    it('should forecast influencer audience growth', async () => {
      const influencerData = {
        growthHistory: [
          { month: '2025-06', growthRate: 0.08, engagementRate: 0.065 },
          { month: '2025-07', growthRate: 0.12, engagementRate: 0.072 },
          { month: '2025-08', growthRate: 0.15, engagementRate: 0.078 }
        ],
        postingFrequency: 0.85,
        niche: 'beauty',
        recentCollaborations: [
          { growthImpact: 0.06 },
          { growthImpact: 0.08 }
        ]
      };

      const timeHorizon = 3; // 3 months

      const growthForecast = await mlService.forecastAudienceGrowth(influencerData, timeHorizon);

      expect(growthForecast.prediction).toBeGreaterThan(-0.5);
      expect(growthForecast.prediction).toBeLessThanOrEqual(2.0);
      expect(growthForecast.confidence).toBeGreaterThan(0.5);
      expect(growthForecast.model_version).toBe('v1.5');

      // With positive growth history, should predict positive growth
      expect(growthForecast.prediction).toBeGreaterThan(0);
    });

    it('should consider market saturation effects', async () => {
      const saturatedNiche = {
        growthHistory: [{ month: '2025-08', growthRate: 0.1, engagementRate: 0.05 }],
        niche: 'lifestyle', // High saturation
        postingFrequency: 0.8
      };

      const emergingNiche = {
        growthHistory: [{ month: '2025-08', growthRate: 0.1, engagementRate: 0.05 }],
        niche: 'gaming', // Low saturation
        postingFrequency: 0.8
      };

      const saturatedForecast = await mlService.forecastAudienceGrowth(saturatedNiche, 6);
      const emergingForecast = await mlService.forecastAudienceGrowth(emergingNiche, 6);

      expect(emergingForecast.prediction).toBeGreaterThan(saturatedForecast.prediction);
    });

    it('should factor in collaboration impact', async () => {
      const highImpactCollabs = {
        growthHistory: [{ month: '2025-08', growthRate: 0.1, engagementRate: 0.05 }],
        recentCollaborations: [
          { growthImpact: 0.15 }, // High impact collaborations
          { growthImpact: 0.12 }
        ],
        niche: 'tech'
      };

      const lowImpactCollabs = {
        growthHistory: [{ month: '2025-08', growthRate: 0.1, engagementRate: 0.05 }],
        recentCollaborations: [
          { growthImpact: 0.02 }, // Low impact collaborations
          { growthImpact: 0.03 }
        ],
        niche: 'tech'
      };

      const highImpactForecast = await mlService.forecastAudienceGrowth(highImpactCollabs, 3);
      const lowImpactForecast = await mlService.forecastAudienceGrowth(lowImpactCollabs, 3);

      expect(highImpactForecast.prediction).toBeGreaterThan(lowImpactForecast.prediction);
    });
  });

  describe('Model Performance & Validation', () => {
    it('should provide confidence scores for all predictions', async () => {
      const testData = {
        followersCount: 100000,
        engagementRate: 0.06,
        audienceDemographics: {
          ageGroups: { '25-34': 0.6 },
          interests: ['beauty']
        }
      };

      const campaignContext = {
        targetAudience: { ageGroups: ['25-34'], interests: ['beauty'] },
        categories: ['beauty']
      };

      const engagementPrediction = await mlService.predictEngagement(testData, campaignContext);
      const conversionPrediction = await mlService.predictConversion(testData, campaignContext);

      expect(engagementPrediction.confidence).toBeGreaterThan(0.5);
      expect(conversionPrediction.confidence).toBeGreaterThan(0.5);

      // Higher data completeness should yield higher confidence
      expect(engagementPrediction.confidence).toBeLessThanOrEqual(0.95);
      expect(conversionPrediction.confidence).toBeLessThanOrEqual(0.95);
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        { followersCount: 0, engagementRate: 0 }, // New account
        { followersCount: 10000000, engagementRate: 0.15 }, // Extremely high engagement
        { followersCount: 1000, engagementRate: 0.001 }, // Very low engagement
      ];

      for (const edgeCase of edgeCases) {
        const prediction = await mlService.predictEngagement(edgeCase, {
          categories: ['test'],
          optimalTimes: ['20:00']
        });

        expect(prediction.prediction).toBeGreaterThanOrEqual(0);
        expect(prediction.prediction).toBeLessThanOrEqual(1);
        expect(prediction.confidence).toBeGreaterThan(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should provide feature importance rankings', async () => {
      const prediction = await mlService.predictEngagement(
        { followersCount: 50000, engagementRate: 0.05, categories: ['beauty'] },
        { categories: ['beauty'], optimalTimes: ['20:00'] }
      );

      const importanceEntries = Object.entries(prediction.feature_importance);
      const sortedByImportance = importanceEntries.sort((a, b) => b[1] - a[1]);

      // Most important feature should be engagement_rate
      expect(sortedByImportance[0][0]).toBe('engagement_rate');
      expect(sortedByImportance[0][1]).toBe(0.35);

      // All importance values should be positive and sum to 1
      const totalImportance = importanceEntries.reduce((sum, [_, importance]) => sum + importance, 0);
      expect(totalImportance).toBeCloseTo(1, 1);
    });
  });
});
