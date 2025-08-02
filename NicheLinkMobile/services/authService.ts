import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosResponse } from 'axios';
import {
    AuthResponse,
    AuthTokens,
    LoginRequest,
    RegisterRequest,
    User
} from '../types/auth';

// Replace with your actual backend URL
const API_BASE_URL = 'http://localhost:3003/api';

// Mock mode for development
const MOCK_MODE = true;

class AuthService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    if (!MOCK_MODE) {
      this.setupInterceptors();
    }
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.apiClient.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshed = await this.refreshToken();
            if (refreshed) {
              const token = await this.getAccessToken();
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.apiClient(originalRequest);
            }
          } catch (refreshError) {
            await this.logout();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    if (MOCK_MODE) {
      return this.mockLogin(credentials);
    }
    
    try {
      const response: AxiosResponse<AuthResponse> = await this.apiClient.post(
        '/auth/login',
        credentials
      );

      if (response.data.success) {
        await this.storeTokens(response.data.tokens);
        await this.storeUser(response.data.user);
      }

      return response.data;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    if (MOCK_MODE) {
      return this.mockRegister(userData);
    }
    
    try {
      const response: AxiosResponse<AuthResponse> = await this.apiClient.post(
        '/auth/register',
        userData
      );

      if (response.data.success) {
        await this.storeTokens(response.data.tokens);
        await this.storeUser(response.data.user);
      }

      return response.data;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        await this.apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      await this.clearStorage();
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response: AxiosResponse<{ tokens: AuthTokens }> = await this.apiClient.post(
        '/auth/refresh',
        { refreshToken }
      );

      await this.storeTokens(response.data.tokens);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
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
      const token = await this.getAccessToken();
      const user = await this.getCurrentUser();
      return !!(token && user);
    } catch (error) {
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
  }

  private async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem('accessToken');
  }

  private async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem('refreshToken');
  }

  private async clearStorage(): Promise<void> {
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken',
      'tokenExpiry',
      'user',
    ]);
  }

  private handleAuthError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error('An unexpected error occurred');
  }

  // Mock methods for development
  private async mockLogin(credentials: LoginRequest): Promise<AuthResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simple mock validation
    if (credentials.email === 'test@example.com' && credentials.password === 'password123') {
      const mockTokens: AuthTokens = {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        expiresIn: 3600,
      };
      
      const mockUser: User = {
        id: '1',
        email: credentials.email,
        firstName: 'Test',
        lastName: 'User',
        role: 'INFLUENCER',
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.storeTokens(mockTokens);
      await this.storeUser(mockUser);

      return {
        success: true,
        user: mockUser,
        tokens: mockTokens,
        message: 'Login successful',
      };
    } else {
      throw new Error('Invalid email or password');
    }
  }

  private async mockRegister(userData: RegisterRequest): Promise<AuthResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple validation
    if (!userData.email || !userData.password || !userData.firstName || !userData.lastName) {
      throw new Error('All fields are required');
    }

    if (userData.email === 'existing@example.com') {
      throw new Error('Email already exists');
    }

    const mockTokens: AuthTokens = {
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      expiresIn: 3600,
    };
    
    const mockUser: User = {
      id: Date.now().toString(),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      verified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.storeTokens(mockTokens);
    await this.storeUser(mockUser);

    return {
      success: true,
      user: mockUser,
      tokens: mockTokens,
      message: 'Registration successful',
    };
  }

  // Method to update API base URL (useful for different environments)
  updateBaseURL(baseURL: string): void {
    this.apiClient.defaults.baseURL = baseURL;
  }
}

export default new AuthService();
