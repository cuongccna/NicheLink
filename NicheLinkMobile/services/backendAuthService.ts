import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
    AuthResponse,
    AuthTokens,
    LoginRequest,
    RegisterRequest,
    User
} from '../types/auth';

const API_BASE_URL = 'http://192.168.1.43:3001/api';

class BackendAuthService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor for logging
    this.apiClient.interceptors.request.use(
      (config) => {
        console.log('🚀 [API REQUEST]', {
          method: config.method?.toUpperCase(),
          url: `${config.baseURL}${config.url}`,
          headers: config.headers,
          data: config.data
        });
        return config;
      },
      (error) => {
        console.error('❌ [API REQUEST ERROR]', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.apiClient.interceptors.response.use(
      (response) => {
        console.log('✅ [API RESPONSE]', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          data: response.data
        });
        return response;
      },
      (error) => {
        console.error('❌ [API RESPONSE ERROR]', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    console.log('🔑 [LOGIN ATTEMPT]', { email: credentials.email });
    
    try {
      // Check if user exists in registry (previously registered)
      const registeredUser = await this.findUserInRegistry(credentials.email);
      if (registeredUser) {
        console.log('✅ [LOGIN SUCCESS] Found user in registry:', credentials.email);
        
        const tokens: AuthTokens = {
          accessToken: `token-${Date.now()}`,
          refreshToken: `refresh-${Date.now()}`,
          expiresIn: 3600
        };

        await this.storeTokens(tokens);
        await this.storeUser(registeredUser); // Set as current user

        return {
          success: true,
          user: registeredUser,
          tokens,
          message: 'Đăng nhập thành công'
        };
      }

      // If no user found in registry, show appropriate error message
      throw new Error('Email này chưa được đăng ký. Vui lòng đăng ký trước khi đăng nhập.');
    } catch (error: any) {
      console.log('❌ [LOGIN FAILED]', error.message);
      throw this.handleAuthError(error);
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    console.log('🚀 [REGISTRATION ATTEMPT]', userData.email, userData.role);
    
    try {
      const response = await this.apiClient.post('/auth/register', {
        email: userData.email,
        password: userData.password,
        fullName: `${userData.firstName} ${userData.lastName}`,
        role: userData.role,
        bio: userData.role === 'INFLUENCER' ? 'Mobile app user' : 'Business owner',
      });

      console.log('✅ [REGISTRATION BACKEND RESPONSE]', response.data);

      if (response.data.success || response.data.user) {
        const user: User = {
          id: response.data.user?.id || `user-${Date.now()}`,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          verified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const tokens: AuthTokens = {
          accessToken: `token-${Date.now()}`,
          refreshToken: `refresh-${Date.now()}`,
          expiresIn: 3600
        };

        await this.storeTokens(tokens);
        await this.storeUser(user);

        console.log('✅ [REGISTRATION SUCCESS]', user.email, user.role);

        return {
          success: true,
          user,
          tokens,
          message: 'Registration successful'
        };
      }

      throw new Error('Registration failed');
    } catch (error: any) {
      console.log('⚠️ [REGISTRATION BACKEND FAILED]', error.message);
      
      // Check if it's a user-facing error that should be shown
      if (error.response?.status === 409) {
        // User already exists - show this error to user
        throw new Error('Email này đã được sử dụng. Vui lòng thử email khác hoặc đăng nhập.');
      }
      
      if (error.response?.status === 400) {
        // Validation error - show this to user
        const errorMessage = error.response?.data?.message || 'Dữ liệu không hợp lệ';
        throw new Error(`Lỗi đăng ký: ${errorMessage}`);
      }
      
      // Only fallback to mock for network errors or server errors
      if (error.code === 'NETWORK_ERROR' || error.response?.status >= 500 || !error.response) {
        console.log('🔄 [FALLBACK TO MOCK] Network/server error, creating mock user...');
        
        // Create mock user for testing
        const mockUser: User = {
          id: `mock-${Date.now()}`,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          verified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const tokens: AuthTokens = {
          accessToken: `token-${Date.now()}`,
          refreshToken: `refresh-${Date.now()}`,
          expiresIn: 3600
        };

        await this.storeTokens(tokens);
        await this.storeUser(mockUser);

        console.log('✅ [MOCK REGISTRATION SUCCESS]', mockUser.email, mockUser.role);

        return {
          success: true,
          user: mockUser,
          tokens,
          message: 'Registration successful (mock)'
        };
      }
      
      // For other errors, throw them to be handled by the UI
      throw new Error(error.response?.data?.message || error.message || 'Đăng ký thất bại');
    }
  }

  async logout(): Promise<void> {
    await this.clearStorage();
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userString = await AsyncStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const user = await this.getCurrentUser();
      return !!(token && user);
    } catch (error) {
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const newTokens: AuthTokens = {
        accessToken: `token-${Date.now()}`,
        refreshToken: `refresh-${Date.now()}`,
        expiresIn: 3600
      };

      await this.storeTokens(newTokens);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  private async storeTokens(tokens: AuthTokens): Promise<void> {
    await AsyncStorage.multiSet([
      ['accessToken', tokens.accessToken],
      ['refreshToken', tokens.refreshToken],
      ['tokenExpiry', (Date.now() + tokens.expiresIn * 1000).toString()],
    ]);
  }

  private async storeUser(user: User): Promise<void> {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    // Also store in user registry for login lookup
    await this.addUserToRegistry(user);
  }

  private async addUserToRegistry(user: User): Promise<void> {
    try {
      const registryString = await AsyncStorage.getItem('userRegistry');
      const registry: User[] = registryString ? JSON.parse(registryString) : [];
      
      // Remove existing user with same email if exists
      const filteredRegistry = registry.filter(u => u.email !== user.email);
      
      // Add the new/updated user
      filteredRegistry.push(user);
      
      await AsyncStorage.setItem('userRegistry', JSON.stringify(filteredRegistry));
      console.log('✅ [USER REGISTRY] User added to registry:', user.email);
    } catch (error) {
      console.error('Error updating user registry:', error);
    }
  }

  private async findUserInRegistry(email: string): Promise<User | null> {
    try {
      const registryString = await AsyncStorage.getItem('userRegistry');
      if (!registryString) return null;
      
      const registry: User[] = JSON.parse(registryString);
      const user = registry.find(u => u.email === email);
      
      return user || null;
    } catch (error) {
      console.error('Error reading user registry:', error);
      return null;
    }
  }

  private async clearStorage(): Promise<void> {
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken',
      'tokenExpiry',
      'user',
    ]);
    // Note: We don't remove 'userRegistry' here so users can login again
    // If you want to clear everything, add 'userRegistry' to the array above
  }

  private handleAuthError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    
    if (error.response?.data?.error) {
      return new Error(error.response.data.error);
    }
    
    if (error.message) {
      return new Error(error.message);
    }
    
    return new Error('An unexpected error occurred');
  }

  updateBaseURL(baseURL: string): void {
    this.apiClient.defaults.baseURL = baseURL;
  }

  // Debug method to check registered users
  async getRegisteredUsers(): Promise<User[]> {
    try {
      const registryString = await AsyncStorage.getItem('userRegistry');
      return registryString ? JSON.parse(registryString) : [];
    } catch (error) {
      console.error('Error reading user registry:', error);
      return [];
    }
  }

  // Method to clear all stored data including user registry
  async clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken', 
      'tokenExpiry',
      'user',
      'userRegistry'
    ]);
    console.log('🗑️ [CLEAR ALL] All stored data cleared');
  }
}

export default new BackendAuthService();
