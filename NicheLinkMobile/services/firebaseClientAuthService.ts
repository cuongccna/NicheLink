import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { auth } from '../config/firebaseConfig';
import {
    AuthResponse,
    AuthTokens,
    LoginRequest,
    RegisterRequest,
    User
} from '../types/auth';

const API_BASE_URL = 'http://192.168.1.54:3001/api';

class FirebaseAuthService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 20000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Clear any existing mock data on service initialization
    this.clearMockData();
    
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
    console.log('🔑 [FIREBASE LOGIN ATTEMPT]', { email: credentials.email });
    
    try {
      // Step 1: Authenticate with Firebase Client SDK
      console.log('🔥 [STEP 1] Authenticating with Firebase Client SDK...');
      const userCredential = await auth().signInWithEmailAndPassword(
        credentials.email,
        credentials.password
      );

      if (!userCredential.user) {
        throw new Error('Firebase authentication failed - no user returned');
      }

      console.log('✅ [FIREBASE AUTH] User authenticated:', userCredential.user.uid);

      // Step 2: Get ID token from Firebase
      console.log('🎫 [STEP 2] Getting ID token...');
      const idToken = await userCredential.user.getIdToken();
      
      if (!idToken) {
        throw new Error('Failed to get ID token from Firebase');
      }

      console.log('✅ [ID TOKEN] Token obtained successfully');

      // Step 3: Verify token with backend
      console.log('🔐 [STEP 3] Verifying token with backend...');
      const response = await this.apiClient.post('/auth/verify-token', {
        idToken: idToken
      });

      console.log('✅ [BACKEND VERIFY RESPONSE]', response.data);

      if (response.data.success) {
        const user: User = {
          id: response.data.data.user?.id || userCredential.user.uid,
          email: credentials.email,
          firstName: response.data.data.user?.firstName || '',
          lastName: response.data.data.user?.lastName || '',
          role: response.data.data.user?.role || 'INFLUENCER',
          verified: response.data.data.user?.isEmailVerified || userCredential.user.emailVerified,
          createdAt: response.data.data.user?.createdAt || new Date().toISOString(),
          updatedAt: response.data.data.user?.updatedAt || new Date().toISOString()
        };

        const tokens: AuthTokens = {
          accessToken: response.data.data.token || idToken,
          refreshToken: response.data.data.refreshToken || '',
          expiresIn: response.data.data.expiresIn || 3600
        };

        await this.storeTokens(tokens);
        await this.storeUser(user);

        console.log('✅ [LOGIN SUCCESS] Firebase + Backend authentication successful');

        return {
          success: true,
          user,
          tokens,
          message: 'Đăng nhập thành công'
        };
      }

      throw new Error('Backend token verification failed');
    } catch (error: any) {
      console.log('❌ [LOGIN FAILED]', error.message);
      
      // Handle Firebase-specific errors
      if (error.code === 'auth/user-not-found') {
        throw new Error('Email này chưa được đăng ký. Vui lòng đăng ký trước khi đăng nhập.');
      }
      
      if (error.code === 'auth/wrong-password') {
        throw new Error('Mật khẩu không đúng.');
      }
      
      if (error.code === 'auth/invalid-email') {
        throw new Error('Email không hợp lệ.');
      }

      if (error.code === 'auth/user-disabled') {
        throw new Error('Tài khoản này đã bị vô hiệu hóa.');
      }

      if (error.code === 'auth/too-many-requests') {
        throw new Error('Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau.');
      }

      if (error.code === 'auth/network-request-failed') {
        throw new Error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.');
      }
      
      // For other errors, throw them to be handled by the UI
      throw new Error(error.message || 'Đăng nhập thất bại');
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    console.log('🚀 [FIREBASE REGISTRATION ATTEMPT]', userData.email, userData.role);
    
    try {
      // Step 1: Create user with Firebase Auth
      console.log('🔥 [STEP 1] Creating user with Firebase Auth...');
      const userCredential = await auth().createUserWithEmailAndPassword(
        userData.email,
        userData.password
      );

      if (!userCredential.user) {
        throw new Error('Firebase user creation failed');
      }

      console.log('✅ [FIREBASE USER CREATED]', userCredential.user.uid);

      // Step 2: Get ID token
      console.log('🎫 [STEP 2] Getting ID token...');
      const idToken = await userCredential.user.getIdToken();

      // Step 3: Register user data with backend
      console.log('📝 [STEP 3] Registering user data with backend...');
      const response = await this.apiClient.post('/auth/register', {
        idToken: idToken,
        email: userData.email,
        fullName: `${userData.firstName} ${userData.lastName}`,
        role: userData.role,
        bio: userData.role === 'INFLUENCER' ? 'Mobile app user' : 'Business owner',
      });

      console.log('✅ [REGISTRATION BACKEND RESPONSE]', response.data);

      if (response.data.success || response.data.user) {
        const user: User = {
          id: response.data.user?.id || userCredential.user.uid,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          verified: userCredential.user.emailVerified,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const tokens: AuthTokens = {
          accessToken: response.data.data?.token || idToken,
          refreshToken: response.data.data?.refreshToken || '',
          expiresIn: response.data.data?.expiresIn || 3600
        };

        await this.storeTokens(tokens);
        await this.storeUser(user);

        console.log('✅ [REGISTRATION SUCCESS]', user.email, user.role);

        return {
          success: true,
          user,
          tokens,
          message: 'Đăng ký thành công'
        };
      }

      throw new Error('Registration failed');
    } catch (error: any) {
      console.log('❌ [REGISTRATION FAILED]', error.message);
      
      // Handle Firebase-specific errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email này đã được sử dụng. Vui lòng thử email khác hoặc đăng nhập.');
      }
      
      if (error.code === 'auth/weak-password') {
        throw new Error('Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.');
      }
      
      if (error.code === 'auth/invalid-email') {
        throw new Error('Email không hợp lệ.');
      }

      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Đăng ký email/password chưa được bật.');
      }

      if (error.code === 'auth/network-request-failed') {
        throw new Error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.');
      }

      // Check if it's a backend error
      if (error.response?.status === 409) {
        throw new Error('Email này đã được sử dụng. Vui lòng thử email khác hoặc đăng nhập.');
      }
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Dữ liệu không hợp lệ';
        throw new Error(`Lỗi đăng ký: ${errorMessage}`);
      }

      // Network errors with backend
      if (error.code === 'NETWORK_ERROR' || error.response?.status >= 500 || !error.response) {
        console.log('❌ [NETWORK ERROR] Cannot connect to registration server');
        throw new Error('Không thể kết nối đến server đăng ký. Vui lòng kiểm tra kết nối mạng và thử lại.');
      }
      
      // For other errors, throw them to be handled by the UI
      throw new Error(error.response?.data?.message || error.message || 'Đăng ký thất bại');
    }
  }

  async logout(): Promise<void> {
    console.log('🚪 [LOGOUT] Signing out...');
    
    try {
      // Sign out from Firebase
      await auth().signOut();
      console.log('✅ [FIREBASE LOGOUT] Signed out from Firebase');
      
      // Clear local storage
      await this.clearStorage();
      console.log('✅ [STORAGE CLEARED] Local data cleared');
      
    } catch (error) {
      console.error('❌ [LOGOUT ERROR]', error);
      // Even if logout fails, clear local storage
      await this.clearStorage();
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
      // Check both Firebase auth state and stored tokens
      const firebaseUser = auth().currentUser;
      const storedToken = await AsyncStorage.getItem('accessToken');
      
      return !!(firebaseUser && storedToken);
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }

  private async storeTokens(tokens: AuthTokens): Promise<void> {
    await AsyncStorage.multiSet([
      ['accessToken', tokens.accessToken],
      ['refreshToken', tokens.refreshToken],
      ['tokenExpiry', (Date.now() + (tokens.expiresIn * 1000)).toString()],
    ]);
  }

  private async storeUser(user: User): Promise<void> {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  }

  private async clearStorage(): Promise<void> {
    await AsyncStorage.multiRemove([
      'accessToken',
      'refreshToken',
      'tokenExpiry',
      'user',
      'userRegistry', // Remove local registry to force real authentication
    ]);
  }

  // Clear mock data on service initialization to ensure real authentication
  private async clearMockData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('userRegistry');
      console.log('🗑️ [INIT] Cleared mock user registry - forcing real authentication');
    } catch (error) {
      console.error('Error clearing mock data:', error);
    }
  }

  updateBaseURL(baseURL: string): void {
    this.apiClient.defaults.baseURL = baseURL;
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

const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;
