import { getAuth } from '../config/firebase';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

// Define types manually to avoid import issues
type UserRole = 'SME' | 'INFLUENCER' | 'ADMIN';
type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface RegisterUserData {
  email: string;
  password: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  phoneNumber?: string;
  // SME specific fields
  companyName?: string;
  businessType?: string;
  industry?: string;
  website?: string;
  // Influencer specific fields
  displayName?: string;
  bio?: string;
  categories?: string[];
  languages?: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Computed field
  role: UserRole;
  status: UserStatus;
  phone?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  smeProfile?: any;
  influencerProfile?: any;
}

class AuthService {
  private auth = getAuth();

  /**
   * Register a new user with Firebase and create database record
   */
  async registerUser(userData: RegisterUserData): Promise<{ user: UserProfile; firebaseUser: any }> {
    try {
      logger.info(`Starting user registration for email: ${userData.email}`);

      // Check if user already exists in database
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create Firebase user
      const firebaseUser = await this.auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.fullName,
        emailVerified: false
      });
      
      logger.info(`Firebase user created successfully: ${firebaseUser.uid}`);

      // Create database user record
      const dbUser = await prisma.user.create({
        data: {
          firebaseUid: firebaseUser.uid,
          email: userData.email,
          firstName: userData.firstName || userData.fullName?.split(' ')[0] || '',
          lastName: userData.lastName || userData.fullName?.split(' ').slice(1).join(' ') || '',
          phone: userData.phoneNumber,
          role: userData.role,
          status: 'PENDING',
        } as any
      });

      // Create role-specific profile
      if (userData.role === 'SME') {
        await (prisma as any).sMEProfile.create({
          data: {
            userId: dbUser.id,
            companyName: userData.companyName || '',
            businessType: userData.businessType || '',
            industry: userData.industry || '',
            website: userData.website
          }
        });
      } else if (userData.role === 'INFLUENCER') {
        await (prisma as any).influencerProfile.create({
          data: {
            userId: dbUser.id,
            displayName: userData.displayName || userData.fullName || '',
            bio: userData.bio,
            categories: userData.categories || [],
            languages: userData.languages || ['vi']
          }
        });
      }

      // Set custom claims in Firebase (with fallback)
      try {
        await this.auth.setCustomUserClaims(firebaseUser.uid, {
          role: userData.role,
          userId: dbUser.id
        });
        logger.info('Firebase custom claims set successfully');
      } catch (error: any) {
        logger.warn('Failed to set Firebase custom claims:', error.message);
        // Continue without custom claims in development
        if (process.env.NODE_ENV !== 'development') {
          throw error;
        }
      }

      // Send email verification (with fallback)
      try {
        await this.sendEmailVerification(firebaseUser.uid);
        logger.info('Email verification sent successfully');
      } catch (error: any) {
        logger.warn('Failed to send email verification:', error.message);
        // Continue without email verification in development
        if (process.env.NODE_ENV !== 'development') {
          throw error;
        }
      }

      // Get complete user profile
      const userProfile = await this.getUserProfile(dbUser.id);

      logger.info(`User registration completed for: ${userData.email}`);

      return {
        user: userProfile,
        firebaseUser: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified
        }
      };

    } catch (error) {
      logger.error('User registration failed:', error);
      throw error;
    }
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        smeProfile: true,
        influencerProfile: true
      } as any
    }) as any;

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      role: user.role as UserRole,
      status: user.status as UserStatus,
      phone: user.phone || undefined,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      smeProfile: user.smeProfile,
      influencerProfile: user.influencerProfile
    };
  }

  /**
   * Get user profile by Firebase UID
   */
  async getUserByFirebaseUid(firebaseUid: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { firebaseUid } as any,
      include: {
        smeProfile: true,
        influencerProfile: true
      } as any
    }) as any;

    if (!user) {
      throw new Error('User not found');
    }

    return this.getUserProfile(user.id);
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updateData: Partial<RegisterUserData>): Promise<UserProfile> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      }) as any;

      if (!user) {
        throw new Error('User not found');
      }

      // Update basic user info
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName: updateData.firstName,
          lastName: updateData.lastName,
          phone: updateData.phoneNumber
        } as any
      }) as any;

      // Update role-specific profile
      if (user.role === 'SME' && updateData.companyName) {
        await (prisma as any).sMEProfile.upsert({
          where: { userId },
          update: {
            companyName: updateData.companyName,
            businessType: updateData.businessType,
            industry: updateData.industry,
            website: updateData.website
          },
          create: {
            userId,
            companyName: updateData.companyName,
            businessType: updateData.businessType || '',
            industry: updateData.industry || '',
            website: updateData.website
          }
        });
      } else if (user.role === 'INFLUENCER' && updateData.bio) {
        await (prisma as any).influencerProfile.upsert({
          where: { userId },
          update: {
            displayName: updateData.displayName,
            bio: updateData.bio,
            categories: updateData.categories,
            languages: updateData.languages
          },
          create: {
            userId,
            displayName: updateData.displayName || '',
            bio: updateData.bio,
            categories: updateData.categories || [],
            languages: updateData.languages || ['vi']
          }
        });
      }

      // Update Firebase user if needed
      if (user.firebaseUid && (updateData.firstName || updateData.lastName)) {
        await this.auth.updateUser(user.firebaseUid, {
          displayName: `${updateData.firstName || updatedUser.firstName} ${updateData.lastName || updatedUser.lastName}`.trim()
        });
      }

      return this.getUserProfile(userId);

    } catch (error) {
      logger.error('Profile update failed:', error);
      throw error;
    }
  }

  /**
   * Verify email and activate user account
   */
  async verifyEmailAndActivateUser(firebaseUid: string): Promise<UserProfile> {
    try {
      // Get Firebase user to check verification status
      const firebaseUser = await this.auth.getUser(firebaseUid);
      
      if (!firebaseUser.emailVerified) {
        throw new Error('Email not verified in Firebase');
      }

      // Update database user
      const user = await prisma.user.update({
        where: { firebaseUid } as any,
        data: {
          isEmailVerified: true,
          status: 'ACTIVE'
        } as any
      }) as any;

      logger.info(`User account activated: ${user.email}`);

      return this.getUserProfile(user.id);

    } catch (error) {
      logger.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(firebaseUid: string): Promise<void> {
    try {
      // Generate email verification link
      const link = await this.auth.generateEmailVerificationLink(
        (await this.auth.getUser(firebaseUid)).email!
      );
      
      // In production, send email here
      logger.info(`Email verification link generated: ${link}`);
      
      // For development, just log the link
      console.log('📧 Email Verification Link:', link);

    } catch (error: any) {
      logger.error('Failed to send email verification:', error.message);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      }) as any;

      if (!user) {
        throw new Error('User not found');
      }

      // Soft delete in database
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'DELETED' } as any
      });

      // Delete from Firebase
      if (user.firebaseUid) {
        await this.auth.deleteUser(user.firebaseUid);
      }

      logger.info(`User account deleted: ${user.email}`);

    } catch (error) {
      logger.error('User deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get users by role with pagination
   */
  async getUsersByRole(
    role: UserRole,
    page: number = 1,
    limit: number = 10
  ): Promise<{ users: UserProfile[]; total: number; pages: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { role },
        include: {
          smeProfile: true,
          influencerProfile: true
        } as any,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: { role } })
    ]);

    const pages = Math.ceil(total / limit);

    return {
      users: users.map((user: any) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: user.role as UserRole,
        status: user.status as UserStatus,
        phone: user.phone || undefined,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        smeProfile: user.smeProfile,
        influencerProfile: user.influencerProfile
      })),
      total,
      pages
    };
  }

  /**
   * Login user with Firebase Authentication
   */
  async loginUser(email: string, password: string): Promise<{ user: UserProfile; firebaseToken: string }> {
    try {
      logger.info(`Login attempt for email: ${email}`);
      
      // Check if user exists in database first
      const existingUser = await prisma.user.findUnique({
        where: { email: email },
        include: {
          smeProfile: true,
          influencerProfile: true
        }
      });

      if (!existingUser) {
        throw new Error('User not found. Please register first.');
      }

      // Create Firebase custom token
      const customToken = await this.auth.createCustomToken(existingUser.firebaseUid!);
      logger.info(`Custom token created for user: ${existingUser.firebaseUid}`);

      // Convert database user to UserProfile format
      const userProfile: UserProfile = {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName || '',
        lastName: existingUser.lastName || '',
        fullName: `${existingUser.firstName || ''} ${existingUser.lastName || ''}`.trim(),
        role: existingUser.role as UserRole,
        status: existingUser.status as UserStatus,
        phone: existingUser.phone || undefined,
        isEmailVerified: existingUser.isEmailVerified,
        createdAt: existingUser.createdAt,
        updatedAt: existingUser.updatedAt,
        smeProfile: existingUser.smeProfile,
        influencerProfile: existingUser.influencerProfile
      };

      logger.info(`User logged in successfully: ${email}`);
      return {
        user: userProfile,
        firebaseToken: customToken
      };

    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }
}

export default new AuthService();
