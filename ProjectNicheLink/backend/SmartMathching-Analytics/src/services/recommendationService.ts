import { PrismaClient } from '@prisma/client';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export interface RecommendationCriteria {
  campaignId: string;
  budget: number;
  targetAudience: any;
  requirements: any;
  categories: string[];
  locations?: string[];
}

export interface InfluencerScore {
  influencerId: string;
  score: number;
  reasons: string[];
  matchingFactors: {
    categoryMatch: number;
    audienceMatch: number;
    budgetFit: number;
    locationMatch: number;
    engagementQuality: number;
    pastPerformance: number;
    vietnameseMarketFit: number;
  };
}

export class RecommendationService {
  /**
   * Generate AI-powered recommendations for a campaign
   * Optimized for Vietnamese market characteristics
   */
  async generateRecommendations(criteria: RecommendationCriteria): Promise<InfluencerScore[]> {
    try {
      logger.info('Generating recommendations for campaign', { campaignId: criteria.campaignId });

      // Get all active influencers
      const influencers = await this.getEligibleInfluencers(criteria);
      
      // Calculate scores for each influencer
      const scoredInfluencers = await Promise.all(
        influencers.map(influencer => this.calculateInfluencerScore(influencer, criteria))
      );

      // Sort by score and return top recommendations
      const sortedRecommendations = scoredInfluencers
        .filter(score => score.score > 0.3) // Minimum threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, 20); // Top 20 recommendations

      // Save recommendations to database
      await this.saveRecommendations(criteria.campaignId, sortedRecommendations);

      logger.info('Generated recommendations', { 
        campaignId: criteria.campaignId,
        count: sortedRecommendations.length 
      });

      return sortedRecommendations;
    } catch (error) {
      logger.error('Error generating recommendations', { error, campaignId: criteria.campaignId });
      throw error;
    }
  }

  /**
   * Get eligible influencers based on basic criteria
   */
  private async getEligibleInfluencers(criteria: RecommendationCriteria) {
    return await prisma.influencerProfile.findMany({
      where: {
        followersCount: {
          gte: 1000 // Minimum followers
        }
      },
      include: {
        user: true,
        analytics: {
          orderBy: { createdAt: 'desc' },
          take: 30 // Last 30 days of analytics
        },
        socialMediaAccounts: true
      }
    });
  }

  /**
   * Calculate comprehensive score for an influencer
   * Uses multiple factors optimized for Vietnamese market
   */
  private async calculateInfluencerScore(influencer: any, criteria: RecommendationCriteria): Promise<InfluencerScore> {
    const factors = {
      categoryMatch: this.calculateCategoryMatch(influencer, criteria),
      audienceMatch: this.calculateAudienceMatch(influencer, criteria),
      budgetFit: this.calculateBudgetFit(influencer, criteria),
      locationMatch: this.calculateLocationMatch(influencer, criteria),
      engagementQuality: this.calculateEngagementQuality(influencer),
      pastPerformance: this.calculatePastPerformance(influencer),
      vietnameseMarketFit: this.calculateVietnameseMarketFit(influencer)
    };

    // Weighted score calculation
    const weights = {
      categoryMatch: 0.25,
      audienceMatch: 0.20,
      budgetFit: 0.15,
      locationMatch: 0.10,
      engagementQuality: 0.15,
      pastPerformance: 0.10,
      vietnameseMarketFit: 0.05
    };

    const score = Object.entries(factors).reduce((sum, [key, value]) => {
      return sum + (value * weights[key as keyof typeof weights]);
    }, 0);

    const reasons = this.generateReasons(factors, influencer);

    return {
      influencerId: influencer.id,
      score,
      reasons,
      matchingFactors: factors
    };
  }

  /**
   * Calculate how well influencer's content categories match campaign
   */
  private calculateCategoryMatch(influencer: any, criteria: RecommendationCriteria): number {
    const influencerCategories = influencer.contentCategories || [];
    const campaignCategories = criteria.categories || [];

    if (campaignCategories.length === 0) return 0.5;

    const matches = campaignCategories.filter(cat => 
      influencerCategories.some((infCat: string) => 
        infCat.toLowerCase().includes(cat.toLowerCase()) ||
        cat.toLowerCase().includes(infCat.toLowerCase())
      )
    );

    return matches.length / campaignCategories.length;
  }

  /**
   * Calculate audience demographic match
   */
  private calculateAudienceMatch(influencer: any, criteria: RecommendationCriteria): number {
    const targetAudience = criteria.targetAudience;
    const influencerAudience = influencer.audienceDemographics || {};

    let score = 0;
    let factors = 0;

    // Age match
    if (targetAudience.ageGroups && influencerAudience.ageGroups) {
      const ageOverlap = this.calculateArrayOverlap(targetAudience.ageGroups, influencerAudience.ageGroups);
      score += ageOverlap;
      factors++;
    }

    // Gender match
    if (targetAudience.gender && influencerAudience.gender) {
      if (targetAudience.gender === influencerAudience.gender || targetAudience.gender === 'all') {
        score += 1;
      }
      factors++;
    }

    // Interest match
    if (targetAudience.interests && influencerAudience.interests) {
      const interestOverlap = this.calculateArrayOverlap(targetAudience.interests, influencerAudience.interests);
      score += interestOverlap;
      factors++;
    }

    return factors > 0 ? score / factors : 0.5;
  }

  /**
   * Calculate budget compatibility
   */
  private calculateBudgetFit(influencer: any, criteria: RecommendationCriteria): number {
    const avgRate = influencer.averageRate || 0;
    if (avgRate === 0) return 0.7; // No rate info, neutral score

    const budget = criteria.budget;
    const ratio = avgRate / budget;

    if (ratio <= 0.3) return 1.0; // Very affordable
    if (ratio <= 0.5) return 0.8; // Affordable
    if (ratio <= 0.8) return 0.6; // Reasonable
    if (ratio <= 1.0) return 0.4; // At budget limit
    return 0.1; // Over budget
  }

  /**
   * Calculate location/geographical match
   */
  private calculateLocationMatch(influencer: any, criteria: RecommendationCriteria): number {
    if (!criteria.locations || criteria.locations.length === 0) return 0.5;
    
    const influencerLocation = influencer.location || '';
    const targetLocations = criteria.locations;

    const hasMatch = targetLocations.some(loc => 
      influencerLocation.toLowerCase().includes(loc.toLowerCase()) ||
      loc.toLowerCase().includes(influencerLocation.toLowerCase())
    );

    return hasMatch ? 1.0 : 0.3;
  }

  /**
   * Calculate engagement quality score
   */
  private calculateEngagementQuality(influencer: any): number {
    const engagementRate = influencer.engagementRate || 0;
    const followersCount = influencer.followersCount || 0;

    // Vietnamese market typical engagement rates
    let engagementScore = 0;
    if (engagementRate >= 0.08) engagementScore = 1.0; // Excellent (8%+)
    else if (engagementRate >= 0.05) engagementScore = 0.8; // Good (5-8%)
    else if (engagementRate >= 0.03) engagementScore = 0.6; // Average (3-5%)
    else if (engagementRate >= 0.01) engagementScore = 0.4; // Below average (1-3%)
    else engagementScore = 0.2; // Poor (<1%)

    // Adjust for follower count (micro-influencers often have better engagement)
    if (followersCount < 10000) engagementScore *= 1.1; // Boost micro-influencers
    else if (followersCount > 100000) engagementScore *= 0.9; // Slight penalty for mega-influencers

    return Math.min(engagementScore, 1.0);
  }

  /**
   * Calculate past performance score
   */
  private calculatePastPerformance(influencer: any): number {
    const analytics = influencer.analytics || [];
    if (analytics.length === 0) return 0.5; // No data, neutral score

    // Calculate average performance metrics from recent analytics
    const avgViews = analytics.reduce((sum: number, a: any) => sum + (a.totalViews || 0), 0) / analytics.length;
    const avgEngagement = analytics.reduce((sum: number, a: any) => sum + (a.totalEngagement || 0), 0) / analytics.length;
    
    // Score based on consistency and growth
    const viewsScore = Math.min(avgViews / (influencer.followersCount * 0.1), 1.0); // 10% reach is good
    const engagementScore = Math.min(avgEngagement / (avgViews * 0.05), 1.0); // 5% engagement on views is good

    return (viewsScore + engagementScore) / 2;
  }

  /**
   * Calculate Vietnamese market specific factors
   */
  private calculateVietnameseMarketFit(influencer: any): number {
    let score = 0.5; // Base score

    // Location in Vietnam
    const location = (influencer.location || '').toLowerCase();
    if (location.includes('vietnam') || location.includes('việt nam') || 
        location.includes('hanoi') || location.includes('ho chi minh') ||
        location.includes('saigon') || location.includes('da nang')) {
      score += 0.3;
    }

    // Vietnamese language content
    const bio = (influencer.bio || '').toLowerCase();
    if (this.containsVietnamese(bio)) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Generate human-readable reasons for recommendation
   */
  private generateReasons(factors: any, influencer: any): string[] {
    const reasons: string[] = [];

    if (factors.categoryMatch > 0.7) {
      reasons.push('Excellent content category match');
    }
    if (factors.audienceMatch > 0.7) {
      reasons.push('Strong audience demographic alignment');
    }
    if (factors.budgetFit > 0.8) {
      reasons.push('Cost-effective within budget');
    }
    if (factors.engagementQuality > 0.8) {
      reasons.push('High engagement quality');
    }
    if (factors.pastPerformance > 0.7) {
      reasons.push('Proven track record');
    }
    if (factors.vietnameseMarketFit > 0.7) {
      reasons.push('Strong Vietnamese market presence');
    }
    if (influencer.isVerified) {
      reasons.push('Verified influencer profile');
    }

    return reasons;
  }

  /**
   * Save recommendations to database
   */
  private async saveRecommendations(campaignId: string, recommendations: InfluencerScore[]) {
    const recommendationData = recommendations.map(rec => ({
      campaignId,
      influencerId: rec.influencerId,
      overallScore: rec.score,
      relevanceScore: rec.matchingFactors.categoryMatch,
      audienceScore: rec.matchingFactors.audienceMatch,
      engagementScore: rec.matchingFactors.engagementQuality,
      reliabilityScore: rec.matchingFactors.pastPerformance,
      budgetScore: rec.matchingFactors.budgetFit,
      matchReasons: rec.reasons,
      concerns: [], // Will be populated by separate analysis
      algorithmVersion: 'AI_VIETNAMESE_V1',
      confidence: rec.score,
      createdAt: new Date()
    }));

    await prisma.recommendationResult.createMany({
      data: recommendationData
    });
  }

  /**
   * Utility function to calculate array overlap
   */
  private calculateArrayOverlap(arr1: string[], arr2: string[]): number {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;

    const matches = arr1.filter(item => 
      arr2.some(item2 => 
        item.toLowerCase().includes(item2.toLowerCase()) ||
        item2.toLowerCase().includes(item.toLowerCase())
      )
    );

    return matches.length / arr1.length;
  }

  /**
   * Check if text contains Vietnamese characters
   */
  private containsVietnamese(text: string): boolean {
    const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/;
    return vietnamesePattern.test(text);
  }

  /**
   * Get recommendation explanation for a specific influencer
   */
  async getRecommendationExplanation(campaignId: string, influencerId: string) {
    const recommendation = await prisma.recommendationResult.findFirst({
      where: {
        campaignId,
        influencerId
      },
      include: {
        influencer: {
          include: {
            user: true
          }
        },
        campaign: true
      }
    });

    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    return {
      influencer: recommendation.influencer,
      score: recommendation.overallScore,
      reasons: recommendation.matchReasons,
      matchingFactors: {
        categoryMatch: recommendation.relevanceScore,
        audienceMatch: recommendation.audienceScore,
        budgetFit: recommendation.budgetScore,
        engagementQuality: recommendation.engagementScore,
        pastPerformance: recommendation.reliabilityScore
      },
      explanation: this.generateDetailedExplanation(recommendation)
    };
  }

  /**
   * Generate detailed explanation for recommendation
   */
  private generateDetailedExplanation(recommendation: any): string {
    const factors = {
      categoryMatch: recommendation.relevanceScore,
      audienceMatch: recommendation.audienceScore,
      budgetFit: recommendation.budgetScore,
      engagementQuality: recommendation.engagementScore,
      pastPerformance: recommendation.reliabilityScore
    };
    const score = recommendation.overallScore;
    
    let explanation = `This influencer scored ${(score * 100).toFixed(1)}% compatibility. `;
    
    const strengths: string[] = [];
    const improvements: string[] = [];

    Object.entries(factors).forEach(([key, value]) => {
      const percentage = ((value as number) * 100).toFixed(1);
      if (value as number > 0.7) {
        strengths.push(`${this.getFactorName(key)}: ${percentage}%`);
      } else if (value as number < 0.4) {
        improvements.push(`${this.getFactorName(key)}: ${percentage}%`);
      }
    });

    if (strengths.length > 0) {
      explanation += `Strong points: ${strengths.join(', ')}. `;
    }

    if (improvements.length > 0) {
      explanation += `Areas for consideration: ${improvements.join(', ')}.`;
    }

    return explanation;
  }

  private getFactorName(key: string): string {
    const names: { [key: string]: string } = {
      categoryMatch: 'Content Category Match',
      audienceMatch: 'Audience Alignment',
      budgetFit: 'Budget Compatibility',
      locationMatch: 'Geographic Relevance',
      engagementQuality: 'Engagement Quality',
      pastPerformance: 'Historical Performance',
      vietnameseMarketFit: 'Vietnamese Market Fit'
    };
    return names[key] || key;
  }
}

export const recommendationService = new RecommendationService();
