import { EventEmitter } from 'events';

// Mock Real-time Analytics Service
class MockRealTimeAnalyticsService extends EventEmitter {
  private campaignMetrics: Map<string, any> = new Map();
  private alertThresholds: Map<string, any> = new Map();

  constructor() {
    super();
    this.setupMockData();
  }

  private setupMockData() {
    // Mock campaign performance data
    this.campaignMetrics.set('campaign_123', {
      live_metrics: {
        impressions: 250000,
        engagements: 20000,
        clicks: 7500,
        conversions: 450,
        spend: 15000000,
        ctr: 0.03,
        conversion_rate: 0.06,
        cpc: 2000,
        cpa: 33333
      },
      influencer_breakdown: [
        {
          influencer_id: 'inf_1',
          metrics: {
            impressions: 100000,
            engagements: 8500,
            engagement_rate: 0.085,
            reach: 85000,
            frequency: 1.18
          },
          content_performance: [
            {
              post_id: 'post_1',
              timestamp: new Date('2025-08-02T10:00:00Z'),
              views: 45000,
              likes: 3800,
              comments: 320,
              shares: 150,
              saves: 580,
              viral_score: 0.78
            }
          ]
        }
      ],
      trending_hashtags: ['#beauty2025', '#viraltrend', '#trending'],
      audience_insights: {
        active_hours: ['10-12', '19-21'],
        peak_engagement_time: '20:30',
        device_breakdown: { mobile: 0.85, desktop: 0.15 },
        location_hotspots: ['HCMC', 'Hanoi', 'Da Nang']
      }
    });

    // Mock alert thresholds
    this.alertThresholds.set('campaign_123', {
      engagement_rate: { min: 0.02, max: 0.15 },
      conversion_rate: { min: 0.01, max: 0.1 },
      cpa: { max: 50000 },
      fraud_score: { max: 0.3 }
    });
  }

  async getLiveMetrics(campaignId: string) {
    return this.campaignMetrics.get(campaignId);
  }

  async detectAnomalies(campaignId: string, timeWindow: string = '1h') {
    const mockAnomalies = [
      {
        timestamp: new Date().toISOString(),
        type: 'engagement_spike',
        influencer_id: 'inf_1',
        metric: 'engagement_rate',
        current_value: 0.12,
        expected_range: [0.02, 0.08],
        severity: 'medium',
        probable_causes: ['viral_content', 'trending_hashtag'],
        recommended_actions: ['monitor_closely', 'prepare_budget_increase']
      },
      {
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: 'conversion_drop',
        influencer_id: 'inf_2',
        metric: 'conversion_rate',
        current_value: 0.005,
        expected_range: [0.02, 0.08],
        severity: 'high',
        probable_causes: ['audience_fatigue', 'content_quality_drop'],
        recommended_actions: ['pause_campaign', 'review_creative']
      }
    ];

    return mockAnomalies;
  }

  async generateOptimizationSuggestions(campaignId: string) {
    const metrics = await this.getLiveMetrics(campaignId);
    
    const suggestions = [
      {
        type: 'budget_reallocation',
        priority: 'high',
        description: 'Reallocate budget from underperforming to high-performing influencers',
        expected_impact: '+25% ROI',
        implementation: {
          from_influencer: 'inf_2',
          to_influencer: 'inf_1',
          amount: 5000000
        }
      },
      {
        type: 'content_optimization',
        priority: 'medium',
        description: 'Post during peak engagement hours (19:00-21:00)',
        expected_impact: '+15% engagement',
        implementation: {
          optimal_posting_times: ['19:00', '20:00', '20:30'],
          content_format_recommendations: ['video', 'carousel']
        }
      },
      {
        type: 'audience_expansion',
        priority: 'low',
        description: 'Expand to similar audience segments with high conversion potential',
        expected_impact: '+30% reach',
        implementation: {
          new_demographics: ['26-35 age group'],
          lookalike_audiences: ['high_value_customers'],
          budget_requirement: 3000000
        }
      }
    ];

    return suggestions;
  }

  startRealTimeMonitoring(campaignId: string) {
    const interval = setInterval(async () => {
      const anomalies = await this.detectAnomalies(campaignId);
      if (anomalies.length > 0) {
        this.emit('anomaly_detected', { campaignId, anomalies });
      }

      const metrics = await this.getLiveMetrics(campaignId);
      this.emit('metrics_update', { campaignId, metrics });
    }, 5000); // Update every 5 seconds

    return interval;
  }

  stopRealTimeMonitoring(intervalId: NodeJS.Timeout) {
    clearInterval(intervalId);
  }
}

describe('Real-time Analytics & Monitoring Tests', () => {
  let analyticsService: MockRealTimeAnalyticsService;

  beforeEach(() => {
    analyticsService = new MockRealTimeAnalyticsService();
  });

  afterEach(() => {
    analyticsService.removeAllListeners();
  });

  describe('Live Metrics Tracking', () => {
    it('should provide real-time campaign metrics', async () => {
      const campaignId = 'campaign_123';
      const liveMetrics = await analyticsService.getLiveMetrics(campaignId);

      expect(liveMetrics).toBeDefined();
      expect(liveMetrics.live_metrics).toMatchObject({
        impressions: expect.any(Number),
        engagements: expect.any(Number),
        clicks: expect.any(Number),
        conversions: expect.any(Number),
        ctr: expect.any(Number),
        conversion_rate: expect.any(Number)
      });

      expect(liveMetrics.influencer_breakdown).toBeInstanceOf(Array);
      expect(liveMetrics.influencer_breakdown[0]).toMatchObject({
        influencer_id: expect.any(String),
        metrics: expect.objectContaining({
          engagement_rate: expect.any(Number),
          reach: expect.any(Number)
        })
      });

      expect(liveMetrics.audience_insights).toMatchObject({
        active_hours: expect.any(Array),
        peak_engagement_time: expect.any(String),
        device_breakdown: expect.any(Object)
      });
    });

    it('should track influencer-level performance in real-time', async () => {
      const campaignId = 'campaign_123';
      const metrics = await analyticsService.getLiveMetrics(campaignId);
      
      const influencerMetrics = metrics.influencer_breakdown[0];
      
      expect(influencerMetrics).toMatchObject({
        influencer_id: 'inf_1',
        metrics: {
          impressions: 100000,
          engagements: 8500,
          engagement_rate: 0.085,
          reach: 85000,
          frequency: 1.18
        },
        content_performance: expect.arrayContaining([
          expect.objectContaining({
            post_id: expect.any(String),
            viral_score: expect.any(Number),
            views: expect.any(Number),
            engagement: expect.any(Number)
          })
        ])
      });
    });

    it('should provide audience behavior insights', async () => {
      const campaignId = 'campaign_123';
      const metrics = await analyticsService.getLiveMetrics(campaignId);
      
      const audienceInsights = metrics.audience_insights;
      
      expect(audienceInsights).toMatchObject({
        active_hours: expect.arrayContaining(['10-12', '19-21']),
        peak_engagement_time: '20:30',
        device_breakdown: {
          mobile: 0.85,
          desktop: 0.15
        },
        location_hotspots: expect.arrayContaining(['HCMC', 'Hanoi'])
      });

      // Validate that mobile usage is higher (typical for Vietnamese market)
      expect(audienceInsights.device_breakdown.mobile).toBeGreaterThan(0.8);
    });
  });

  describe('Anomaly Detection', () => {
    it('should detect performance anomalies', async () => {
      const campaignId = 'campaign_123';
      const anomalies = await analyticsService.detectAnomalies(campaignId);

      expect(anomalies).toBeInstanceOf(Array);
      expect(anomalies.length).toBeGreaterThan(0);

      const engagementSpike = anomalies.find(a => a.type === 'engagement_spike');
      expect(engagementSpike).toMatchObject({
        type: 'engagement_spike',
        influencer_id: 'inf_1',
        metric: 'engagement_rate',
        current_value: 0.12,
        expected_range: [0.02, 0.08],
        severity: 'medium',
        probable_causes: expect.arrayContaining(['viral_content']),
        recommended_actions: expect.arrayContaining(['monitor_closely'])
      });

      const conversionDrop = anomalies.find(a => a.type === 'conversion_drop');
      expect(conversionDrop).toMatchObject({
        type: 'conversion_drop',
        severity: 'high',
        recommended_actions: expect.arrayContaining(['pause_campaign', 'review_creative'])
      });
    });

    it('should categorize anomalies by severity', async () => {
      const anomalies = await analyticsService.detectAnomalies('campaign_123');
      
      const severityLevels = anomalies.map(a => a.severity);
      expect(severityLevels).toContain('high');
      expect(severityLevels).toContain('medium');

      const highSeverityAnomalies = anomalies.filter(a => a.severity === 'high');
      expect(highSeverityAnomalies.length).toBeGreaterThan(0);
      
      // High severity should have immediate action recommendations
      highSeverityAnomalies.forEach(anomaly => {
        expect(anomaly.recommended_actions).toContain('pause_campaign');
      });
    });

    it('should provide probable causes for anomalies', async () => {
      const anomalies = await analyticsService.detectAnomalies('campaign_123');
      
      anomalies.forEach(anomaly => {
        expect(anomaly.probable_causes).toBeInstanceOf(Array);
        expect(anomaly.probable_causes.length).toBeGreaterThan(0);
        expect(anomaly.recommended_actions).toBeInstanceOf(Array);
        expect(anomaly.recommended_actions.length).toBeGreaterThan(0);
      });

      const possibleCauses = [
        'viral_content', 'trending_hashtag', 'audience_fatigue', 
        'content_quality_drop', 'algorithm_change', 'competitor_activity'
      ];

      const detectedCauses = anomalies.flatMap(a => a.probable_causes);
      expect(detectedCauses.some(cause => possibleCauses.includes(cause))).toBe(true);
    });
  });

  describe('Optimization Suggestions', () => {
    it('should generate actionable optimization recommendations', async () => {
      const suggestions = await analyticsService.generateOptimizationSuggestions('campaign_123');

      expect(suggestions).toBeInstanceOf(Array);
      expect(suggestions.length).toBeGreaterThan(0);

      suggestions.forEach(suggestion => {
        expect(suggestion).toMatchObject({
          type: expect.any(String),
          priority: expect.stringMatching(/^(high|medium|low)$/),
          description: expect.any(String),
          expected_impact: expect.any(String),
          implementation: expect.any(Object)
        });
      });

      // Check for budget reallocation suggestion
      const budgetSuggestion = suggestions.find(s => s.type === 'budget_reallocation');
      expect(budgetSuggestion).toBeDefined();
      expect(budgetSuggestion?.implementation).toMatchObject({
        from_influencer: expect.any(String),
        to_influencer: expect.any(String),
        amount: expect.any(Number)
      });

      // Check for content optimization suggestion
      const contentSuggestion = suggestions.find(s => s.type === 'content_optimization');
      expect(contentSuggestion).toBeDefined();
      expect(contentSuggestion?.implementation).toMatchObject({
        optimal_posting_times: expect.any(Array),
        content_format_recommendations: expect.any(Array)
      });
    });

    it('should prioritize suggestions by impact and feasibility', async () => {
      const suggestions = await analyticsService.generateOptimizationSuggestions('campaign_123');

      const highPriority = suggestions.filter(s => s.priority === 'high');
      const mediumPriority = suggestions.filter(s => s.priority === 'medium');
      const lowPriority = suggestions.filter(s => s.priority === 'low');

      expect(highPriority.length).toBeGreaterThan(0);

      // High priority suggestions should have immediate implementation potential
      highPriority.forEach(suggestion => {
        expect(suggestion.expected_impact).toMatch(/\+\d+%/);
        expect(suggestion.implementation).toBeDefined();
      });

      // Verify priority ordering makes sense
      expect(highPriority[0].type).toBe('budget_reallocation');
      expect(mediumPriority[0].type).toBe('content_optimization');
    });

    it('should provide specific implementation details', async () => {
      const suggestions = await analyticsService.generateOptimizationSuggestions('campaign_123');

      const budgetSuggestion = suggestions.find(s => s.type === 'budget_reallocation');
      expect(budgetSuggestion?.implementation).toMatchObject({
        from_influencer: 'inf_2',
        to_influencer: 'inf_1',
        amount: 5000000
      });

      const contentSuggestion = suggestions.find(s => s.type === 'content_optimization');
      expect(contentSuggestion?.implementation).toMatchObject({
        optimal_posting_times: expect.arrayContaining(['19:00', '20:00', '20:30']),
        content_format_recommendations: expect.arrayContaining(['video', 'carousel'])
      });

      const audienceSuggestion = suggestions.find(s => s.type === 'audience_expansion');
      expect(audienceSuggestion?.implementation).toMatchObject({
        new_demographics: expect.arrayContaining(['26-35 age group']),
        lookalike_audiences: expect.arrayContaining(['high_value_customers']),
        budget_requirement: expect.any(Number)
      });
    });
  });

  describe('Real-time Event Monitoring', () => {
    it('should emit events for real-time updates', (done) => {
      const campaignId = 'campaign_123';
      let metricsReceived = false;
      let anomalyReceived = false;

      analyticsService.on('metrics_update', (data) => {
        expect(data.campaignId).toBe(campaignId);
        expect(data.metrics).toBeDefined();
        metricsReceived = true;
        
        if (metricsReceived && anomalyReceived) {
          done();
        }
      });

      analyticsService.on('anomaly_detected', (data) => {
        expect(data.campaignId).toBe(campaignId);
        expect(data.anomalies).toBeInstanceOf(Array);
        anomalyReceived = true;
        
        if (metricsReceived && anomalyReceived) {
          done();
        }
      });

      const intervalId = analyticsService.startRealTimeMonitoring(campaignId);
      
      // Clean up after test
      setTimeout(() => {
        analyticsService.stopRealTimeMonitoring(intervalId);
        if (!metricsReceived || !anomalyReceived) {
          done();
        }
      }, 10000);
    }, 15000);

    it('should handle monitoring lifecycle correctly', () => {
      const campaignId = 'campaign_123';
      
      // Start monitoring
      const intervalId = analyticsService.startRealTimeMonitoring(campaignId);
      expect(intervalId).toBeDefined();

      // Stop monitoring
      analyticsService.stopRealTimeMonitoring(intervalId);
      
      // Verify no further events are emitted
      let eventCount = 0;
      analyticsService.on('metrics_update', () => eventCount++);
      
      setTimeout(() => {
        expect(eventCount).toBe(0);
      }, 6000);
    });

    it('should support multiple concurrent campaign monitoring', (done) => {
      const campaigns = ['campaign_1', 'campaign_2', 'campaign_3'];
      const receivedUpdates = new Set();

      campaigns.forEach(campaignId => {
        analyticsService.on('metrics_update', (data) => {
          receivedUpdates.add(data.campaignId);
          
          if (receivedUpdates.size === campaigns.length) {
            campaigns.forEach(id => {
              analyticsService.stopRealTimeMonitoring(
                analyticsService.startRealTimeMonitoring(id)
              );
            });
            done();
          }
        });

        analyticsService.startRealTimeMonitoring(campaignId);
      });
    }, 20000);
  });

  describe('Performance Benchmarking', () => {
    it('should compare current performance against benchmarks', async () => {
      const campaignMetrics = await analyticsService.getLiveMetrics('campaign_123');
      
      const industryBenchmarks = {
        beauty_industry: {
          avg_engagement_rate: 0.045,
          avg_conversion_rate: 0.025,
          avg_cpc: 2500,
          avg_cpa: 40000
        },
        vietnamese_market: {
          avg_engagement_rate: 0.055,
          avg_conversion_rate: 0.03,
          peak_hours: ['19:00-21:00'],
          mobile_usage: 0.88
        }
      };

      const performanceAnalysis = {
        vs_industry: {
          engagement_rate: campaignMetrics.influencer_breakdown[0].metrics.engagement_rate / industryBenchmarks.beauty_industry.avg_engagement_rate,
          conversion_rate: campaignMetrics.live_metrics.conversion_rate / industryBenchmarks.beauty_industry.avg_conversion_rate
        },
        vs_market: {
          engagement_rate: campaignMetrics.influencer_breakdown[0].metrics.engagement_rate / industryBenchmarks.vietnamese_market.avg_engagement_rate,
          mobile_alignment: campaignMetrics.audience_insights.device_breakdown.mobile / industryBenchmarks.vietnamese_market.mobile_usage
        }
      };

      expect(performanceAnalysis.vs_industry.engagement_rate).toBeGreaterThan(1.5); // 50% above industry average
      expect(performanceAnalysis.vs_market.mobile_alignment).toBeCloseTo(1.0, 1); // Close to market norm
    });
  });
});
