import { PrismaClient } from '@prisma/client';

// Mock Prisma Client for testing
export const mockPrismaClient = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  influencerProfile: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  campaign: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  recommendationResult: {
    create: jest.fn(),
    createMany: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  smeProfile: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
} as unknown as PrismaClient;

// Sample test data
export const mockUser = {
  id: 'user_123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'INFLUENCER',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockInfluencerProfile = {
  id: 'influencer_123',
  userId: 'user_123',
  displayName: 'Test Influencer',
  bio: 'Test bio for influencer',
  followersCount: 50000,
  engagementRate: 0.05,
  averageViews: 5000,
  averageLikes: 250,
  averageComments: 25,
  averageShares: 10,
  location: 'Ho Chi Minh City, Vietnam',
  languages: ['vi', 'en'],
  categories: ['fashion', 'beauty', 'lifestyle'],
  contentTypes: ['photo', 'video', 'reel'],
  totalCampaigns: 10,
  successfulCampaigns: 9,
  averageROI: 2.5,
  reliabilityScore: 0.9,
  communicationScore: 0.85,
  aiTags: ['beauty', 'fashion', 'vietnamese'],
  personalityType: 'Enthusiastic',
  createdAt: new Date(),
  updatedAt: new Date(),
  user: mockUser,
  socialMediaAccounts: [],
  analytics: [],
};

export const mockSMEProfile = {
  id: 'sme_123',
  userId: 'user_sme_123',
  companyName: 'Test Beauty Co',
  industry: 'Beauty & Cosmetics',
  companySize: '51-200',
  website: 'https://testbeauty.com',
  location: 'Vietnam',
  description: 'Leading beauty brand in Vietnam',
  verificationStatus: 'VERIFIED',
  totalCampaigns: 5,
  activeCampaigns: 2,
  totalSpent: 50000000,
  averageROI: 3.2,
  preferredInfluencerTypes: ['micro', 'mid-tier'],
  brandValues: ['sustainability', 'authenticity'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockCampaign = {
  id: 'campaign_123',
  smeId: 'sme_123',
  title: 'Summer Beauty Collection Campaign',
  description: 'Promote our new summer skincare line',
  category: 'beauty',
  budget: 10000000, // 10M VND
  startDate: new Date('2025-08-15'),
  endDate: new Date('2025-09-15'),
  requirements: {
    minFollowers: 10000,
    ageRange: '18-35',
    locations: ['Ho Chi Minh City', 'Hanoi'],
    contentTypes: ['photo', 'video'],
  },
  targetAudience: {
    ageGroups: ['18-25', '26-35'],
    gender: 'female',
    interests: ['beauty', 'skincare', 'fashion'],
    locations: ['Vietnam'],
  },
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
  sme: mockSMEProfile,
};

export const mockRecommendationResult = {
  id: 'recommendation_123',
  campaignId: 'campaign_123',
  influencerId: 'influencer_123',
  overallScore: 0.85,
  relevanceScore: 0.9,
  audienceScore: 0.8,
  engagementScore: 0.85,
  reliabilityScore: 0.9,
  budgetScore: 0.7,
  matchReasons: [
    'Excellent content category match',
    'Strong audience demographic alignment',
    'High engagement quality',
    'Proven track record',
  ],
  concerns: [],
  algorithmVersion: 'AI_VIETNAMESE_V1',
  confidence: 0.85,
  createdAt: new Date(),
  campaign: mockCampaign,
  influencer: mockInfluencerProfile,
};

export const mockRecommendationCriteria = {
  campaignId: 'campaign_123',
  budget: 10000000,
  targetAudience: {
    ageGroups: ['18-25', '26-35'],
    gender: 'female',
    interests: ['beauty', 'skincare', 'fashion'],
    locations: ['Vietnam'],
  },
  requirements: {
    minFollowers: 10000,
    ageRange: '18-35',
    locations: ['Ho Chi Minh City', 'Hanoi'],
    contentTypes: ['photo', 'video'],
  },
  categories: ['beauty', 'skincare'],
  locations: ['Ho Chi Minh City', 'Hanoi'],
};

// Mock request objects
export const mockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  user: undefined,
  ...overrides,
});

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Helper function to create mock Express request with authentication
export const authenticatedRequest = (userId = 'user_123', role = 'SME', overrides = {}) => 
  mockRequest({
    user: {
      id: userId,
      email: 'test@example.com',
      role,
    },
    ...overrides,
  });
