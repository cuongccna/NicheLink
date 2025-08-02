import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export interface ContentSubmissionData {
  title: string;
  description?: string;
  contentType: 'POST' | 'VIDEO' | 'STORY' | 'REEL' | 'ARTICLE' | 'LIVESTREAM';
  platform: 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'WEBSITE' | 'BLOG';
  contentUrls: string[];
  thumbnailUrl?: string;
  metrics?: {
    reach?: number;
    engagement?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
  scheduledDate?: Date;
  tags?: string[];
  mentions?: string[];
}

export interface ContentSubmission {
  id: string;
  milestoneId: string;
  submitterId: string;
  content: ContentSubmissionData;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'REVISION_REQUESTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  reviewNotes?: string;
  reviewerId?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  revisionCount: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewCriteria {
  brandCompliance: boolean;
  contentQuality: boolean;
  audienceRelevance: boolean;
  platformOptimization: boolean;
  legalCompliance: boolean;
  customCriteria?: Record<string, boolean>;
}

export interface ContentReview {
  id: string;
  submissionId: string;
  reviewerId: string;
  status: 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED';
  criteria: ReviewCriteria;
  overallScore: number;
  notes: string;
  suggestions?: string[];
  createdAt: Date;
}

export interface ContentAnalytics {
  totalSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  avgReviewTime: number;
  avgRevisionCount: number;
  performanceByPlatform: Record<string, {
    count: number;
    avgScore: number;
    avgEngagement: number;
  }>;
  contentTypeDistribution: Record<string, number>;
  qualityTrends: Array<{
    date: Date;
    avgScore: number;
    count: number;
  }>;
}

export class ContentReviewService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Submit content for review
  async submitContent(milestoneId: string, submitterId: string, content: ContentSubmissionData): Promise<ContentSubmission> {
    try {
      // Verify milestone exists and submitter has access
      const milestone: any = await (this.prisma as any).escrowMilestone.findUnique({
        where: { id: milestoneId },
        include: { 
          escrowContract: true
        }
      });

      if (!milestone) {
        throw new AppError('Milestone not found', 404, 'MILESTONE_NOT_FOUND');
      }

      if (milestone.escrowContract.influencerId !== submitterId) {
        throw new AppError('Not authorized to submit content for this milestone', 403, 'UNAUTHORIZED_SUBMISSION');
      }

      const submission: any = await (this.prisma as any).contentSubmission.create({
        data: {
          milestoneId,
          submitterId,
          content: content as any,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          revisionCount: 0
        }
      });

      // Update milestone status to indicate content submitted
      await (this.prisma as any).escrowMilestone.update({
        where: { id: milestoneId },
        data: { status: 'SUBMITTED' }
      });

      return this.mapPrismaSubmissionToContentSubmission(submission);
    } catch (error) {
      console.error('Submit content failed:', error);
      throw error;
    }
  }

  // Review submitted content
  async reviewContent(
    submissionId: string, 
    reviewerId: string, 
    criteria: ReviewCriteria, 
    notes: string,
    suggestions?: string[]
  ): Promise<ContentReview> {
    try {
      // Get submission details
      const submission: any = await (this.prisma as any).contentSubmission.findUnique({
        where: { id: submissionId },
        include: {
          milestone: {
            include: { escrowContract: true }
          }
        }
      });

      if (!submission) {
        throw new AppError('Content submission not found', 404, 'SUBMISSION_NOT_FOUND');
      }

      // Verify reviewer has access (should be SME)
      if (submission.milestone.escrowContract.smeId !== reviewerId) {
        throw new AppError('Not authorized to review this content', 403, 'UNAUTHORIZED_REVIEW');
      }

      // Calculate overall score
      const criteriaValues = Object.values(criteria);
      const customCriteriaValues = criteria.customCriteria ? Object.values(criteria.customCriteria) : [];
      const allCriteria = [...criteriaValues.slice(0, 5), ...customCriteriaValues]; // Exclude customCriteria object
      const overallScore = (allCriteria.filter(Boolean).length / allCriteria.length) * 100;

      // Determine status based on score
      let status: 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED';
      if (overallScore >= 80) {
        status = 'APPROVED';
      } else if (overallScore >= 60) {
        status = 'REVISION_REQUESTED';
      } else {
        status = 'REJECTED';
      }

      // Create review record
      const review: any = await (this.prisma as any).contentReview.create({
        data: {
          submissionId,
          reviewerId,
          status,
          criteria: criteria as any,
          overallScore,
          notes,
          suggestions: suggestions || []
        }
      });

      // Update submission status
      const updateData: any = {
        status,
        reviewerId,
        reviewedAt: new Date(),
        reviewNotes: notes
      };

      if (status === 'REVISION_REQUESTED') {
        updateData.revisionCount = submission.revisionCount + 1;
      }

      await (this.prisma as any).contentSubmission.update({
        where: { id: submissionId },
        data: updateData
      });

      // Update milestone status based on review
      let milestoneStatus = 'IN_PROGRESS';
      if (status === 'APPROVED') {
        milestoneStatus = 'COMPLETED';
        
        // Auto-release funds if all criteria met and milestone completed
        await this.handleMilestoneCompletion(submission.milestoneId);
      } else if (status === 'REJECTED') {
        milestoneStatus = 'DISPUTED';
      }

      await (this.prisma as any).escrowMilestone.update({
        where: { id: submission.milestoneId },
        data: { status: milestoneStatus }
      });

      return this.mapPrismaReviewToContentReview(review);
    } catch (error) {
      console.error('Review content failed:', error);
      throw error;
    }
  }

  // Get submissions for review
  async getSubmissionsForReview(reviewerId: string, filters?: {
    status?: string;
    milestoneId?: string;
    campaignId?: string;
  }): Promise<ContentSubmission[]> {
    try {
      const whereClause: any = {
        milestone: {
          escrowContract: {
            smeId: reviewerId
          }
        }
      };

      if (filters?.status) {
        whereClause.status = filters.status;
      }

      if (filters?.milestoneId) {
        whereClause.milestoneId = filters.milestoneId;
      }

      if (filters?.campaignId) {
        whereClause.milestone = {
          ...whereClause.milestone,
          escrowContract: {
            ...whereClause.milestone.escrowContract,
            collaborationId: filters.campaignId
          }
        };
      }

      const submissions: any[] = await (this.prisma as any).contentSubmission.findMany({
        where: whereClause,
        include: {
          milestone: {
            include: { escrowContract: true }
          }
        },
        orderBy: { submittedAt: 'asc' }
      });

      return submissions.map(sub => this.mapPrismaSubmissionToContentSubmission(sub));
    } catch (error) {
      console.error('Get submissions for review failed:', error);
      throw error;
    }
  }

  // Get user submissions
  async getUserSubmissions(userId: string, filters?: {
    status?: string;
    milestoneId?: string;
    campaignId?: string;
  }): Promise<ContentSubmission[]> {
    try {
      const whereClause: any = {
        submitterId: userId
      };

      if (filters?.status) {
        whereClause.status = filters.status;
      }

      if (filters?.milestoneId) {
        whereClause.milestoneId = filters.milestoneId;
      }

      if (filters?.campaignId) {
        whereClause.milestone = {
          escrowContract: {
            collaborationId: filters.campaignId
          }
        };
      }

      const submissions: any[] = await (this.prisma as any).contentSubmission.findMany({
        where: whereClause,
        include: {
          milestone: {
            include: { escrowContract: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return submissions.map(sub => this.mapPrismaSubmissionToContentSubmission(sub));
    } catch (error) {
      console.error('Get user submissions failed:', error);
      throw error;
    }
  }

  // Update content submission
  async updateSubmission(submissionId: string, content: Partial<ContentSubmissionData>): Promise<ContentSubmission> {
    try {
      const submission: any = await (this.prisma as any).contentSubmission.findUnique({
        where: { id: submissionId }
      });

      if (!submission) {
        throw new AppError('Content submission not found', 404, 'SUBMISSION_NOT_FOUND');
      }

      // Can only update if in DRAFT or REVISION_REQUESTED status
      if (!['DRAFT', 'REVISION_REQUESTED'].includes(submission.status)) {
        throw new AppError('Cannot update submission in current status', 400, 'INVALID_STATUS_FOR_UPDATE');
      }

      const updatedContent = {
        ...submission.content,
        ...content
      };

      const updatedSubmission: any = await (this.prisma as any).contentSubmission.update({
        where: { id: submissionId },
        data: {
          content: updatedContent as any,
          status: 'SUBMITTED',
          submittedAt: new Date(),
          updatedAt: new Date()
        }
      });

      return this.mapPrismaSubmissionToContentSubmission(updatedSubmission);
    } catch (error) {
      console.error('Update submission failed:', error);
      throw error;
    }
  }

  // Get content analytics
  async getContentAnalytics(campaignId?: string, startDate?: Date, endDate?: Date): Promise<ContentAnalytics> {
    try {
      const whereClause: any = {};

      if (campaignId) {
        whereClause.milestone = {
          escrowContract: {
            collaborationId: campaignId
          }
        };
      }

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = startDate;
        if (endDate) whereClause.createdAt.lte = endDate;
      }

      const submissions: any[] = await (this.prisma as any).contentSubmission.findMany({
        where: whereClause,
        include: {
          reviews: true
        }
      });

      const reviews: any[] = await (this.prisma as any).contentReview.findMany({
        where: {
          submission: whereClause
        }
      });

      // Calculate metrics
      const totalSubmissions = submissions.length;
      const approvedSubmissions = submissions.filter(s => s.status === 'APPROVED').length;
      const rejectedSubmissions = submissions.filter(s => s.status === 'REJECTED').length;

      // Calculate average review time
      const reviewedSubmissions = submissions.filter(s => s.reviewedAt && s.submittedAt);
      const avgReviewTime = reviewedSubmissions.length > 0
        ? reviewedSubmissions.reduce((sum, s) => {
            return sum + (new Date(s.reviewedAt).getTime() - new Date(s.submittedAt).getTime());
          }, 0) / reviewedSubmissions.length / (1000 * 60 * 60 * 24) // days
        : 0;

      // Calculate average revision count
      const avgRevisionCount = submissions.length > 0
        ? submissions.reduce((sum, s) => sum + s.revisionCount, 0) / submissions.length
        : 0;

      // Performance by platform
      const performanceByPlatform: Record<string, any> = {};
      submissions.forEach(submission => {
        const platform = submission.content.platform;
        if (!performanceByPlatform[platform]) {
          performanceByPlatform[platform] = {
            count: 0,
            totalScore: 0,
            totalEngagement: 0
          };
        }

        performanceByPlatform[platform].count++;
        
        // Get review score if available
        const review = submission.reviews?.[0];
        if (review) {
          performanceByPlatform[platform].totalScore += review.overallScore;
        }

        // Get engagement metrics if available
        const metrics = submission.content.metrics;
        if (metrics?.engagement) {
          performanceByPlatform[platform].totalEngagement += metrics.engagement;
        }
      });

      // Convert to averages
      Object.keys(performanceByPlatform).forEach(platform => {
        const data = performanceByPlatform[platform];
        performanceByPlatform[platform] = {
          count: data.count,
          avgScore: data.count > 0 ? data.totalScore / data.count : 0,
          avgEngagement: data.count > 0 ? data.totalEngagement / data.count : 0
        };
      });

      // Content type distribution
      const contentTypeDistribution = submissions.reduce((acc, submission) => {
        const type = submission.content.contentType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Quality trends (last 30 days, grouped by week)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const qualityTrends: Array<{
        date: Date;
        avgScore: number;
        count: number;
      }> = [];

      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(thirtyDaysAgo.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

        const weekSubmissions = submissions.filter(s => {
          const submissionDate = new Date(s.createdAt);
          return submissionDate >= weekStart && submissionDate < weekEnd;
        });

        const weekReviews = weekSubmissions
          .map(s => s.reviews?.[0])
          .filter(r => r && r.overallScore !== undefined);

        const avgScore = weekReviews.length > 0
          ? weekReviews.reduce((sum, r) => sum + r.overallScore, 0) / weekReviews.length
          : 0;

        qualityTrends.push({
          date: weekStart,
          avgScore,
          count: weekSubmissions.length
        });
      }

      return {
        totalSubmissions,
        approvedSubmissions,
        rejectedSubmissions,
        avgReviewTime,
        avgRevisionCount,
        performanceByPlatform,
        contentTypeDistribution,
        qualityTrends
      };
    } catch (error) {
      console.error('Get content analytics failed:', error);
      throw error;
    }
  }

  // Handle milestone completion
  private async handleMilestoneCompletion(milestoneId: string): Promise<void> {
    try {
      // Check if all milestones in the contract are completed
      const milestone: any = await (this.prisma as any).escrowMilestone.findUnique({
        where: { id: milestoneId },
        include: {
          escrowContract: {
            include: {
              milestones: true
            }
          }
        }
      });

      if (!milestone) return;

      const allMilestones = milestone.escrowContract.milestones;
      const completedMilestones = allMilestones.filter((m: any) => m.status === 'COMPLETED');

      // If all milestones completed, mark contract as completed
      if (completedMilestones.length === allMilestones.length) {
        await (this.prisma as any).escrowContract.update({
          where: { id: milestone.escrowContractId },
          data: { status: 'COMPLETED' }
        });

        console.log(`Contract ${milestone.escrowContractId} marked as COMPLETED - all milestones finished`);
      }
    } catch (error) {
      console.error('Handle milestone completion failed:', error);
    }
  }

  // Helper method to map Prisma submission to ContentSubmission interface
  private mapPrismaSubmissionToContentSubmission(prismaSubmission: any): ContentSubmission {
    const mapped: any = {
      id: prismaSubmission.id,
      milestoneId: prismaSubmission.milestoneId,
      submitterId: prismaSubmission.submitterId,
      content: prismaSubmission.content,
      status: prismaSubmission.status,
      revisionCount: prismaSubmission.revisionCount,
      createdAt: new Date(prismaSubmission.createdAt),
      updatedAt: new Date(prismaSubmission.updatedAt)
    };

    // Add optional fields only if they exist
    if (prismaSubmission.reviewNotes) {
      mapped.reviewNotes = prismaSubmission.reviewNotes;
    }
    if (prismaSubmission.reviewerId) {
      mapped.reviewerId = prismaSubmission.reviewerId;
    }
    if (prismaSubmission.submittedAt) {
      mapped.submittedAt = new Date(prismaSubmission.submittedAt);
    }
    if (prismaSubmission.reviewedAt) {
      mapped.reviewedAt = new Date(prismaSubmission.reviewedAt);
    }
    if (prismaSubmission.publishedAt) {
      mapped.publishedAt = new Date(prismaSubmission.publishedAt);
    }

    return mapped as ContentSubmission;
  }

  // Helper method to map Prisma review to ContentReview interface
  private mapPrismaReviewToContentReview(prismaReview: any): ContentReview {
    return {
      id: prismaReview.id,
      submissionId: prismaReview.submissionId,
      reviewerId: prismaReview.reviewerId,
      status: prismaReview.status,
      criteria: prismaReview.criteria,
      overallScore: prismaReview.overallScore,
      notes: prismaReview.notes,
      suggestions: prismaReview.suggestions,
      createdAt: new Date(prismaReview.createdAt)
    };
  }

  // Publish approved content
  async publishContent(submissionId: string): Promise<ContentSubmission> {
    try {
      const submission: any = await (this.prisma as any).contentSubmission.findUnique({
        where: { id: submissionId }
      });

      if (!submission) {
        throw new AppError('Content submission not found', 404, 'SUBMISSION_NOT_FOUND');
      }

      if (submission.status !== 'APPROVED') {
        throw new AppError('Only approved content can be published', 400, 'INVALID_STATUS_FOR_PUBLISH');
      }

      const updatedSubmission: any = await (this.prisma as any).contentSubmission.update({
        where: { id: submissionId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date()
        }
      });

      return this.mapPrismaSubmissionToContentSubmission(updatedSubmission);
    } catch (error) {
      console.error('Publish content failed:', error);
      throw error;
    }
  }

  // Get submission details
  async getSubmissionById(submissionId: string): Promise<ContentSubmission | null> {
    try {
      const submission: any = await (this.prisma as any).contentSubmission.findUnique({
        where: { id: submissionId },
        include: {
          reviews: true,
          milestone: {
            include: { escrowContract: true }
          }
        }
      });

      if (!submission) {
        return null;
      }

      return this.mapPrismaSubmissionToContentSubmission(submission);
    } catch (error) {
      console.error('Get submission by ID failed:', error);
      throw error;
    }
  }
}

export default ContentReviewService;
