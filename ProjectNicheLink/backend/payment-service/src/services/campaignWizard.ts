import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export interface WizardStep {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect' | 'range' | 'upload' | 'currency';
  options?: string[];
  validation: ValidationRule[];
  nextStep?: string | ((answer: any) => string);
  description?: string;
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface WizardSession {
  id: string;
  campaignId: string;
  currentStep: string;
  responses: Record<string, any>;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignDraft {
  title: string;
  description: string;
  category: string[];
  budget: number;
  currency: string;
  targetReach?: number;
  targetEngagement?: number;
  duration: number;
  contentTypes: string[];
  audienceDemo: any;
  requirements: string[];
}

export class CampaignWizardService {
  private prisma: PrismaClient;
  private wizardSteps: WizardStep[] = [];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.initializeWizardSteps();
  }

  private initializeWizardSteps() {
    this.wizardSteps = [
      {
        id: 'welcome',
        question: 'Chào mừng bạn đến với NicheLink! Hãy bắt đầu tạo chiến dịch của bạn. Tên chiến dịch là gì?',
        type: 'text',
        validation: [
          { type: 'required', message: 'Vui lòng nhập tên chiến dịch' },
          { type: 'min', value: 5, message: 'Tên chiến dịch phải có ít nhất 5 ký tự' }
        ],
        nextStep: 'product_category'
      },
      {
        id: 'product_category',
        question: 'Bạn muốn quảng bá sản phẩm/dịch vụ nào?',
        type: 'multiselect',
        options: [
          'Thời trang & Làm đẹp',
          'Công nghệ & Điện tử',
          'Ẩm thực & Đồ uống',
          'Du lịch & Khách sạn',
          'Sức khỏe & Thể thao',
          'Giáo dục & Kỹ năng',
          'Tài chính & Đầu tư',
          'Bất động sản',
          'Ô tô & Xe máy',
          'Mẹ & Bé'
        ],
        validation: [
          { type: 'required', message: 'Vui lòng chọn ít nhất 1 danh mục' }
        ],
        nextStep: 'budget_range'
      },
      {
        id: 'budget_range',
        question: 'Ngân sách dự kiến cho chiến dịch này là bao nhiêu?',
        type: 'currency',
        validation: [
          { type: 'required', message: 'Vui lòng nhập ngân sách' },
          { type: 'min', value: 1000000, message: 'Ngân sách tối thiểu là 1,000,000 VND' }
        ],
        description: 'Ngân sách này bao gồm chi phí cho KOC và phí dịch vụ platform',
        nextStep: 'campaign_duration'
      },
      {
        id: 'campaign_duration',
        question: 'Bạn muốn chiến dịch kéo dài trong bao lâu?',
        type: 'select',
        options: [
          '1 tuần',
          '2 tuần', 
          '1 tháng',
          '2 tháng',
          '3 tháng',
          'Dài hạn (>3 tháng)'
        ],
        validation: [
          { type: 'required', message: 'Vui lòng chọn thời gian chiến dịch' }
        ],
        nextStep: 'target_audience'
      },
      {
        id: 'target_audience',
        question: 'Đối tượng khách hàng mục tiêu của bạn là ai?',
        type: 'multiselect',
        options: [
          'Gen Z (18-24 tuổi)',
          'Millennials (25-34 tuổi)',
          'Gen X (35-44 tuổi)',
          'Trung niên (45-54 tuổi)',
          'Nam giới',
          'Nữ giới',
          'Thành thị',
          'Nông thôn',
          'Thu nhập cao',
          'Thu nhập trung bình'
        ],
        validation: [
          { type: 'required', message: 'Vui lòng chọn đối tượng mục tiêu' }
        ],
        nextStep: 'content_types'
      },
      {
        id: 'content_types',
        question: 'Bạn muốn KOC tạo nội dung dưới hình thức nào?',
        type: 'multiselect',
        options: [
          'Video TikTok',
          'Instagram Post',
          'Instagram Stories',
          'Instagram Reels',
          'Facebook Post',
          'YouTube Video',
          'Blog Review',
          'Live Stream',
          'Unboxing Video'
        ],
        validation: [
          { type: 'required', message: 'Vui lòng chọn ít nhất 1 loại nội dung' }
        ],
        nextStep: 'target_metrics'
      },
      {
        id: 'target_metrics',
        question: 'Mục tiêu reach và engagement bạn mong muốn?',
        type: 'range',
        validation: [
          { type: 'required', message: 'Vui lòng nhập mục tiêu' }
        ],
        description: 'Hệ thống sẽ gợi ý KOC phù hợp dựa trên mục tiêu này',
        nextStep: 'requirements'
      },
      {
        id: 'requirements',
        question: 'Có yêu cầu đặc biệt nào cho KOC không?',
        type: 'text',
        validation: [],
        description: 'Ví dụ: Phải có kinh nghiệm review sản phẩm tương tự, có tối thiểu 10k followers...',
        nextStep: 'summary'
      },
      {
        id: 'summary',
        question: 'Xem lại thông tin chiến dịch và xác nhận',
        type: 'select',
        options: ['Xác nhận và tạo chiến dịch', 'Chỉnh sửa lại'],
        validation: [
          { type: 'required', message: 'Vui lòng xác nhận' }
        ]
      }
    ];
  }

  // Start new campaign wizard session
  async startCampaignWizard(smeId: string): Promise<WizardSession> {
    try {
      // Create campaign draft first
      const campaign = await this.prisma.campaign.create({
        data: {
          smeId,
          title: '',
          description: '',
          category: [],
          budget: 0,
          currency: 'VND',
          status: 'DRAFT'
        }
      });

      // Create wizard session
      const session = await this.prisma.wizardSession.create({
        data: {
          campaignId: campaign.id,
          currentStep: 'welcome',
          responses: {},
          status: 'IN_PROGRESS'
        }
      });

      return {
        id: session.id,
        campaignId: campaign.id,
        currentStep: session.currentStep,
        responses: session.responses as Record<string, any>,
        status: session.status as 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED',
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };
    } catch (error) {
      console.error('Start campaign wizard failed:', error);
      throw error;
    }
  }

  // Process wizard step
  async processWizardStep(sessionId: string, answer: any): Promise<WizardStep | null> {
    try {
      const session = await this.prisma.wizardSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new AppError('Wizard session not found', 404, 'SESSION_NOT_FOUND');
      }

      const currentStep = this.wizardSteps.find(step => step.id === session.currentStep);
      if (!currentStep) {
        throw new AppError('Invalid wizard step', 400, 'INVALID_STEP');
      }

      // Validate answer
      this.validateAnswer(answer, currentStep.validation);

      // Update responses
      const responses = { ...session.responses as Record<string, any> };
      responses[session.currentStep] = answer;

      // Determine next step
      let nextStepId: string | null = null;
      if (currentStep.nextStep) {
        if (typeof currentStep.nextStep === 'function') {
          nextStepId = currentStep.nextStep(answer);
        } else {
          nextStepId = currentStep.nextStep;
        }
      }

      // Update session
      await this.prisma.wizardSession.update({
        where: { id: sessionId },
        data: {
          currentStep: nextStepId || 'completed',
          responses: responses,
          status: nextStepId ? 'IN_PROGRESS' : 'COMPLETED'
        }
      });

      // Return next step or null if completed
      if (!nextStepId) {
        await this.completeCampaignWizard(sessionId);
        return null;
      }

      const nextStep = this.wizardSteps.find(step => step.id === nextStepId);
      return nextStep || null;
    } catch (error) {
      console.error('Process wizard step failed:', error);
      throw error;
    }
  }

  // Complete campaign wizard and generate campaign
  async completeCampaignWizard(sessionId: string): Promise<CampaignDraft> {
    try {
      const session = await this.prisma.wizardSession.findUnique({
        where: { id: sessionId },
        include: {
          campaign: true
        }
      });

      if (!session) {
        throw new AppError('Wizard session not found', 404, 'SESSION_NOT_FOUND');
      }

      const responses = session.responses as Record<string, any>;
      
      // Generate campaign draft from responses
      const campaignDraft = this.generateCampaignDraft(responses);

      // Update campaign with wizard results
      const updateData: any = {
        title: campaignDraft.title,
        description: campaignDraft.description,
        category: campaignDraft.category,
        budget: campaignDraft.budget,
        currency: campaignDraft.currency,
        status: 'CREATED'
      };
      
      if (campaignDraft.targetReach) {
        updateData.targetReach = campaignDraft.targetReach;
      }
      
      if (campaignDraft.targetEngagement) {
        updateData.targetEngagement = campaignDraft.targetEngagement;
      }

      await this.prisma.campaign.update({
        where: { id: session.campaignId },
        data: updateData
      });

      return campaignDraft;
    } catch (error) {
      console.error('Complete campaign wizard failed:', error);
      throw error;
    }
  }

  // Get current wizard step
  async getCurrentStep(sessionId: string): Promise<WizardStep> {
    try {
      const session = await this.prisma.wizardSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new AppError('Wizard session not found', 404, 'SESSION_NOT_FOUND');
      }

      const step = this.wizardSteps.find(step => step.id === session.currentStep);
      if (!step) {
        throw new AppError('Invalid wizard step', 400, 'INVALID_STEP');
      }

      return step;
    } catch (error) {
      console.error('Get current step failed:', error);
      throw error;
    }
  }

  // Generate campaign draft from wizard responses
  private generateCampaignDraft(responses: Record<string, any>): CampaignDraft {
    // Parse budget
    let budget = 0;
    if (responses.budget_range) {
      budget = parseInt(responses.budget_range.toString().replace(/[^0-9]/g, ''));
    }

    // Parse duration to days
    let duration = 30; // default 1 month
    if (responses.campaign_duration) {
      const durationStr = responses.campaign_duration;
      if (durationStr.includes('1 tuần')) duration = 7;
      else if (durationStr.includes('2 tuần')) duration = 14;
      else if (durationStr.includes('1 tháng')) duration = 30;
      else if (durationStr.includes('2 tháng')) duration = 60;
      else if (durationStr.includes('3 tháng')) duration = 90;
      else if (durationStr.includes('Dài hạn')) duration = 180;
    }

    // Calculate target metrics based on budget
    const estimatedReach = Math.floor(budget / 1000) * 50; // Rough estimate
    const estimatedEngagement = 0.05; // 5% engagement rate

    return {
      title: responses.welcome || 'Chiến dịch mới',
      description: `Chiến dịch quảng bá ${responses.product_category?.join(', ') || 'sản phẩm'} với ngân sách ${budget.toLocaleString('vi-VN')} VND`,
      category: Array.isArray(responses.product_category) ? responses.product_category : [],
      budget,
      currency: 'VND',
      targetReach: estimatedReach,
      targetEngagement: estimatedEngagement,
      duration,
      contentTypes: Array.isArray(responses.content_types) ? responses.content_types : [],
      audienceDemo: {
        age: responses.target_audience || [],
        interests: responses.product_category || []
      },
      requirements: responses.requirements ? [responses.requirements] : []
    };
  }

  // Validate wizard answer
  private validateAnswer(answer: any, validationRules: ValidationRule[]): void {
    for (const rule of validationRules) {
      switch (rule.type) {
        case 'required':
          if (!answer || (Array.isArray(answer) && answer.length === 0) || answer.toString().trim() === '') {
            throw new AppError(rule.message, 400, 'VALIDATION_ERROR');
          }
          break;
        case 'min':
          if (typeof answer === 'string' && answer.length < rule.value) {
            throw new AppError(rule.message, 400, 'VALIDATION_ERROR');
          }
          if (typeof answer === 'number' && answer < rule.value) {
            throw new AppError(rule.message, 400, 'VALIDATION_ERROR');
          }
          break;
        case 'max':
          if (typeof answer === 'string' && answer.length > rule.value) {
            throw new AppError(rule.message, 400, 'VALIDATION_ERROR');
          }
          if (typeof answer === 'number' && answer > rule.value) {
            throw new AppError(rule.message, 400, 'VALIDATION_ERROR');
          }
          break;
        case 'pattern':
          if (typeof answer === 'string' && !new RegExp(rule.value).test(answer)) {
            throw new AppError(rule.message, 400, 'VALIDATION_ERROR');
          }
          break;
      }
    }
  }

  // Get wizard session info
  async getWizardSession(sessionId: string): Promise<WizardSession> {
    try {
      const session = await this.prisma.wizardSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new AppError('Wizard session not found', 404, 'SESSION_NOT_FOUND');
      }

      return {
        id: session.id,
        campaignId: session.campaignId,
        currentStep: session.currentStep,
        responses: session.responses as Record<string, any>,
        status: session.status as 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED',
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };
    } catch (error) {
      console.error('Get wizard session failed:', error);
      throw error;
    }
  }
}

export default CampaignWizardService;
