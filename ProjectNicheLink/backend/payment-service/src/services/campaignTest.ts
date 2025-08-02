import { PrismaClient } from '@prisma/client';

// Simple test to verify Prisma models are available
export class CampaignTestService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async testCampaignModel() {
    // Test if campaign model is accessible
    try {
      const campaigns = await this.prisma.campaign.findMany();
      console.log('Campaign model is available:', campaigns.length);
      return campaigns;
    } catch (error) {
      console.error('Campaign model error:', error);
      throw error;
    }
  }

  async testWizardModel() {
    // Test if wizardSession model is accessible
    try {
      const sessions = await this.prisma.wizardSession.findMany();
      console.log('WizardSession model is available:', sessions.length);
      return sessions;
    } catch (error) {
      console.error('WizardSession model error:', error);
      throw error;
    }
  }
}

export default CampaignTestService;
