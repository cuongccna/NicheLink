import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export interface KOCMatchingCriteria {
  budget: number;
  category: string[];
  audienceSize: [number, number]; // min, max followers
  engagement: number; // minimum engagement rate
  location: string[];
  contentTypes: string[];
  ageGroups: string[];
  gender?: 'male' | 'female' | 'any';
}

export interface KOCProfile {
  id: string;
  name: string;
  email: string;
  followers: number;
  engagementRate: number;
  categories: string[];
  location: string;
  averageViews: number;
  priceRange: [number, number];
  contentTypes: string[];
  recentCampaigns: number;
  rating: number;
  verificationStatus: 'verified' | 'pending' | 'unverified';
}

export interface KOCMatch {
  koc: KOCProfile;
  compatibilityScore: number;
  matchReasons: string[];
  estimatedReach: number;
  estimatedEngagement: number;
  suggestedBudget: number;
  strengthAreas: string[];
  riskFactors: string[];
}

export interface KOCRecommendation {
  campaignId: string;
  recommendations: KOCMatch[];
  totalBudgetNeeded: number;
  estimatedTotalReach: number;
  campaignStrategy: string;
  timeline: {
    phase: string;
    duration: number;
    kocCount: number;
  }[];
}

export class SmartKOCMatchingService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Find matching KOCs based on criteria
  async findMatchingKOCs(criteria: KOCMatchingCriteria): Promise<KOCMatch[]> {
    try {
      // For MVP, we'll simulate KOC data since we don't have real KOC profiles yet
      const mockKOCs = await this.generateMockKOCs();
      
      const matches: KOCMatch[] = [];
      
      for (const koc of mockKOCs) {
        const score = await this.calculateCompatibilityScore(criteria, koc);
        
        if (score >= 0.6) { // 60% minimum compatibility
          const matchReasons = this.generateMatchReasons(criteria, koc);
          const estimatedMetrics = this.calculateEstimatedMetrics(criteria, koc);
          
          matches.push({
            koc,
            compatibilityScore: score,
            matchReasons,
            estimatedReach: estimatedMetrics.reach,
            estimatedEngagement: estimatedMetrics.engagement,
            suggestedBudget: estimatedMetrics.budget,
            strengthAreas: this.identifyStrengthAreas(criteria, koc),
            riskFactors: this.identifyRiskFactors(criteria, koc)
          });
        }
      }
      
      // Sort by compatibility score
      matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
      
      return matches.slice(0, 10); // Return top 10 matches
    } catch (error) {
      console.error('Find matching KOCs failed:', error);
      throw error;
    }
  }

  // Calculate compatibility score between campaign criteria and KOC
  async calculateCompatibilityScore(criteria: KOCMatchingCriteria, koc: KOCProfile): Promise<number> {
    let score = 0;
    let maxScore = 0;

    // Category match (30% weight)
    const categoryMatch = this.calculateCategoryMatch(criteria.category, koc.categories);
    score += categoryMatch * 0.3;
    maxScore += 0.3;

    // Audience size match (20% weight)
    const audienceMatch = this.calculateAudienceMatch(criteria.audienceSize, koc.followers);
    score += audienceMatch * 0.2;
    maxScore += 0.2;

    // Engagement match (25% weight)
    const engagementMatch = this.calculateEngagementMatch(criteria.engagement, koc.engagementRate);
    score += engagementMatch * 0.25;
    maxScore += 0.25;

    // Location match (10% weight)
    const locationMatch = this.calculateLocationMatch(criteria.location, koc.location);
    score += locationMatch * 0.1;
    maxScore += 0.1;

    // Content type match (10% weight)
    const contentMatch = this.calculateContentTypeMatch(criteria.contentTypes, koc.contentTypes);
    score += contentMatch * 0.1;
    maxScore += 0.1;

    // Quality score (5% weight)
    const qualityScore = koc.rating / 5; // Convert 5-star rating to 0-1 scale
    score += qualityScore * 0.05;
    maxScore += 0.05;

    return score / maxScore;
  }

  // Generate campaign recommendations
  async generateRecommendations(campaignId: string): Promise<KOCRecommendation> {
    try {
      // Get campaign details - using any type for now due to Prisma type issues
      const campaign: any = await (this.prisma as any).campaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      // Create matching criteria from campaign
      const criteria: KOCMatchingCriteria = {
        budget: Number(campaign.budget),
        category: campaign.category,
        audienceSize: this.estimateAudienceSize(Number(campaign.budget)),
        engagement: 0.03, // Default 3% minimum engagement
        location: ['Vietnam'], // Default to Vietnam
        contentTypes: ['instagram_post', 'facebook_post', 'tiktok_video'],
        ageGroups: ['18-24', '25-34']
      };

      // Find matching KOCs
      const matches = await this.findMatchingKOCs(criteria);

      // Calculate budget distribution
      const totalBudgetNeeded = this.calculateTotalBudget(matches);
      const estimatedTotalReach = this.calculateTotalReach(matches);

      // Generate campaign strategy
      const campaignStrategy = this.generateCampaignStrategy(campaign, matches);

      // Create timeline
      const timeline = this.generateTimeline(matches);

      return {
        campaignId,
        recommendations: matches,
        totalBudgetNeeded,
        estimatedTotalReach,
        campaignStrategy,
        timeline
      };
    } catch (error) {
      console.error('Generate recommendations failed:', error);
      throw error;
    }
  }

  // Generate mock KOC data for MVP
  private async generateMockKOCs(): Promise<KOCProfile[]> {
    return [
      {
        id: 'koc_1',
        name: 'Nguyễn Thị An',
        email: 'an.nguyen@email.com',
        followers: 50000,
        engagementRate: 0.045,
        categories: ['Thời trang & Làm đẹp', 'Lifestyle'],
        location: 'Hồ Chí Minh',
        averageViews: 15000,
        priceRange: [2000000, 5000000],
        contentTypes: ['instagram_post', 'instagram_story', 'tiktok_video'],
        recentCampaigns: 3,
        rating: 4.8,
        verificationStatus: 'verified'
      },
      {
        id: 'koc_2',
        name: 'Trần Văn Bình',
        email: 'binh.tran@email.com',
        followers: 120000,
        engagementRate: 0.038,
        categories: ['Công nghệ & Điện tử', 'Gaming'],
        location: 'Hà Nội',
        averageViews: 35000,
        priceRange: [5000000, 12000000],
        contentTypes: ['youtube_video', 'facebook_post', 'live_stream'],
        recentCampaigns: 5,
        rating: 4.6,
        verificationStatus: 'verified'
      },
      {
        id: 'koc_3',
        name: 'Lê Thị Cẩm',
        email: 'cam.le@email.com',
        followers: 80000,
        engagementRate: 0.052,
        categories: ['Ẩm thực & Đồ uống', 'Du lịch'],
        location: 'Đà Nẵng',
        averageViews: 25000,
        priceRange: [3000000, 8000000],
        contentTypes: ['instagram_reel', 'facebook_video', 'blog_post'],
        recentCampaigns: 4,
        rating: 4.9,
        verificationStatus: 'verified'
      }
      // Add more mock KOCs...
    ];
  }

  // Helper methods for compatibility scoring
  private calculateCategoryMatch(campaignCategories: string[], kocCategories: string[]): number {
    const intersection = campaignCategories.filter(cat => kocCategories.includes(cat));
    return intersection.length / campaignCategories.length;
  }

  private calculateAudienceMatch(targetRange: [number, number], kocFollowers: number): number {
    const [min, max] = targetRange;
    if (kocFollowers >= min && kocFollowers <= max) return 1;
    if (kocFollowers < min) return kocFollowers / min;
    return max / kocFollowers;
  }

  private calculateEngagementMatch(minEngagement: number, kocEngagement: number): number {
    return kocEngagement >= minEngagement ? 1 : kocEngagement / minEngagement;
  }

  private calculateLocationMatch(targetLocations: string[], kocLocation: string): number {
    return targetLocations.some(loc => kocLocation.includes(loc)) ? 1 : 0.5;
  }

  private calculateContentTypeMatch(targetTypes: string[], kocTypes: string[]): number {
    const intersection = targetTypes.filter(type => kocTypes.includes(type));
    return intersection.length / targetTypes.length;
  }

  // Helper methods for metrics calculation
  private generateMatchReasons(criteria: KOCMatchingCriteria, koc: KOCProfile): string[] {
    const reasons: string[] = [];
    
    if (this.calculateCategoryMatch(criteria.category, koc.categories) > 0.8) {
      reasons.push(`Chuyên gia trong lĩnh vực ${criteria.category.join(', ')}`);
    }
    
    if (koc.engagementRate > criteria.engagement * 1.2) {
      reasons.push(`Tỷ lệ tương tác cao (${(koc.engagementRate * 100).toFixed(1)}%)`);
    }
    
    if (koc.rating > 4.5) {
      reasons.push(`Đánh giá xuất sắc từ các chiến dịch trước`);
    }
    
    if (koc.verificationStatus === 'verified') {
      reasons.push(`Tài khoản đã được xác thực`);
    }

    return reasons;
  }

  private calculateEstimatedMetrics(criteria: KOCMatchingCriteria, koc: KOCProfile) {
    const reach = Math.floor(koc.followers * 0.8); // 80% reach assumption
    const engagement = Math.floor(reach * koc.engagementRate);
    const budget = Math.floor((koc.priceRange[0] + koc.priceRange[1]) / 2);

    return { reach, engagement, budget };
  }

  private identifyStrengthAreas(criteria: KOCMatchingCriteria, koc: KOCProfile): string[] {
    const strengths: string[] = [];
    
    if (koc.engagementRate > 0.05) strengths.push('Tương tác cao');
    if (koc.followers > 100000) strengths.push('Độ phủ rộng');
    if (koc.rating > 4.7) strengths.push('Chất lượng nội dung');
    if (koc.recentCampaigns > 3) strengths.push('Kinh nghiệm phong phú');

    return strengths;
  }

  private identifyRiskFactors(criteria: KOCMatchingCriteria, koc: KOCProfile): string[] {
    const risks: string[] = [];
    
    if (koc.engagementRate < 0.02) risks.push('Tương tác thấp');
    if (koc.recentCampaigns > 10) risks.push('Có thể quá tải công việc');
    if (koc.verificationStatus !== 'verified') risks.push('Chưa xác thực');

    return risks;
  }

  // Campaign strategy generation
  private estimateAudienceSize(budget: number): [number, number] {
    // Estimate based on budget
    if (budget < 5000000) return [10000, 50000];
    if (budget < 20000000) return [50000, 200000];
    return [200000, 1000000];
  }

  private calculateTotalBudget(matches: KOCMatch[]): number {
    return matches.reduce((total, match) => total + match.suggestedBudget, 0);
  }

  private calculateTotalReach(matches: KOCMatch[]): number {
    return matches.reduce((total, match) => total + match.estimatedReach, 0);
  }

  private generateCampaignStrategy(campaign: any, matches: KOCMatch[]): string {
    const topKOCs = matches.slice(0, 3);
    const categories = [...new Set(topKOCs.flatMap(m => m.koc.categories))];
    
    return `Chiến dịch ${campaign.title} sẽ tập trung vào ${categories.join(', ')} với ${topKOCs.length} KOC hàng đầu. ` +
           `Dự kiến đạt ${this.calculateTotalReach(topKOCs).toLocaleString()} lượt tiếp cận với ngân sách ${this.calculateTotalBudget(topKOCs).toLocaleString()} VND.`;
  }

  private generateTimeline(matches: KOCMatch[]) {
    return [
      {
        phase: 'Preparation',
        duration: 7, // days
        kocCount: 0
      },
      {
        phase: 'Content Creation',
        duration: 14,
        kocCount: matches.length
      },
      {
        phase: 'Campaign Launch',
        duration: 7,
        kocCount: matches.length
      },
      {
        phase: 'Performance Tracking',
        duration: 30,
        kocCount: matches.length
      }
    ];
  }
}

export default SmartKOCMatchingService;
