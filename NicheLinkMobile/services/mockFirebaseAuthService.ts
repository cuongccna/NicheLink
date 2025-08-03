// Temporary Mock Auth Service for Expo Go compatibility
// This service provides mock authentication without Firebase native modules

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, AuthTokens, LoginRequest, RegisterRequest, User } from '../types/auth';

class MockFirebaseAuthService {
  // Mock user database for testing
  private mockUsers = [
    {
      email: 'test@example.com',
      password: '123456',
      firstName: 'Test',
      lastName: 'User',
      role: 'SME' as const,
      verified: true, // Pre-verified for testing
    },
    {
      email: 'admin@nichelink.com', 
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'INFLUENCER' as const, // Changed to valid role
      verified: true, // Pre-verified for testing
    },
    {
      email: 'sme@test.com',
      password: 'password',
      firstName: 'SME',
      lastName: 'User', 
      role: 'SME' as const,
      verified: true, // Pre-verified for testing
    }
  ];

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('🔄 [MOCK AUTH] Simulating login for:', credentials.email);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Validate credentials against mock database
    const user = this.mockUsers.find(
      u => u.email === credentials.email && u.password === credentials.password
    );
    
    if (!user) {
      console.log('❌ [MOCK AUTH] Invalid credentials');
      throw new Error('Email hoặc mật khẩu không đúng');
    }
    
    // Check if user is verified
    if (!user.verified) {
      console.log('❌ [MOCK AUTH] User not verified');
      throw new Error('Tài khoản chưa được xác nhận. Vui lòng kiểm tra email để xác nhận tài khoản.');
    }
    
    // Mock successful login
    const mockUser: User = {
      id: 'mock-id-' + Date.now(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      verified: user.verified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const mockTokens: AuthTokens = {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      expiresIn: 3600,
    };
    
    // Store mock session
    await AsyncStorage.setItem('mockUser', JSON.stringify(mockUser));
    await AsyncStorage.setItem('mockTokens', JSON.stringify(mockTokens));
    
    console.log('✅ [MOCK AUTH] Login successful');
    
    return {
      success: true,
      user: mockUser,
      tokens: mockTokens,
      message: 'Đăng nhập thành công (Mock)',
    };
  }
  
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    console.log('🔄 [MOCK AUTH] Simulating registration for:', userData.email);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check if email already exists
    const existingUser = this.mockUsers.find(u => u.email === userData.email);
    if (existingUser) {
      console.log('❌ [MOCK AUTH] Email already exists');
      throw new Error('Email này đã được sử dụng');
    }
    
    // Validate password confirmation
    if (userData.password !== userData.confirmPassword) {
      console.log('❌ [MOCK AUTH] Password mismatch');
      throw new Error('Mật khẩu xác nhận không khớp');
    }
    
    // Create unverified user (requires email verification)
    const mockUser: User = {
      id: 'mock-id-' + Date.now(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      verified: false, // User needs to verify email first
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add to mock database and auto-verify for testing
    this.mockUsers.push({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      verified: true, // Auto-verify for testing
    });
    
    // Auto-login after registration for testing
    const tokens = {
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      expiresIn: 3600,
    };
    await AsyncStorage.setItem('mockUser', JSON.stringify(mockUser));
    await AsyncStorage.setItem('mockTokens', JSON.stringify(tokens));
    
    console.log('✅ [MOCK AUTH] Registration successful - auto-logged in for testing');
    
    return {
      success: true,
      user: mockUser,
      tokens,
      message: 'Đăng ký thành công!',
    };
  }
  
  async logout(): Promise<void> {
    console.log('🔄 [MOCK AUTH] Logging out');
    await AsyncStorage.removeItem('mockUser');
    await AsyncStorage.removeItem('mockTokens');
    console.log('✅ [MOCK AUTH] Logout successful');
  }
  
  async verifyEmail(email: string): Promise<{ success: boolean; message: string }> {
    console.log('🔄 [MOCK AUTH] Simulating email verification for:', email);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find user in mock database
    const userIndex = this.mockUsers.findIndex(u => u.email === email);
    
    if (userIndex === -1) {
      console.log('❌ [MOCK AUTH] User not found for verification');
      return {
        success: false,
        message: 'Không tìm thấy tài khoản với email này',
      };
    }
    
    // Mark as verified
    this.mockUsers[userIndex].verified = true;
    console.log('✅ [MOCK AUTH] Email verified successfully');
    
    return {
      success: true,
      message: 'Email đã được xác nhận thành công! Bạn có thể đăng nhập ngay bây giờ.',
    };
  }

  async clearAllData(): Promise<void> {
    console.log('🧹 [MOCK AUTH] Clearing all mock data');
    await AsyncStorage.removeItem('mockUser');
    await AsyncStorage.removeItem('mockTokens');
    console.log('✅ [MOCK AUTH] All mock data cleared');
  }
  
  async isAuthenticated(): Promise<boolean> {
    console.log('🔍 [MOCK AUTH] Checking authentication status...');
    const user = await AsyncStorage.getItem('mockUser');
    const isAuth = !!user;
    console.log('🔍 [MOCK AUTH] Is authenticated:', isAuth);
    return isAuth;
  }
  
  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem('mockUser');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('[MOCK AUTH] Error getting current user:', error);
      return null;
    }
  }
  
  async getTokens(): Promise<AuthTokens | null> {
    try {
      const tokensStr = await AsyncStorage.getItem('mockTokens');
      return tokensStr ? JSON.parse(tokensStr) : null;
    } catch (error) {
      console.error('[MOCK AUTH] Error getting tokens:', error);
      return null;
    }
  }
}

const mockFirebaseAuthService = new MockFirebaseAuthService();
export default mockFirebaseAuthService;
