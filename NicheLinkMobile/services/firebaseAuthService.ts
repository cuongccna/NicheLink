import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import {
    AuthResponse,
    AuthTokens,
    LoginRequest,
    RegisterRequest,
    User
} from '../types/auth';

const API_BASE_URL = 'http://localhost:3003/api';

class FirebaseAuthService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Step 1: Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      
      // Step 2: Get Firebase ID Token
      const idToken = await userCredential.user.getIdToken();
      
      // Step 3: Get user profile from backend
      const profileResponse = await this.apiClient.get('/auth/profile', {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      const user: User = profileResponse.data.user;
      const tokens: AuthTokens = {
        accessToken: idToken,
        refreshToken: 'firebase-refresh', // Firebase handles refresh automatically
        expiresIn: 3600
      };

      // Store tokens and user data
      await this.storeTokens(tokens);
      await this.storeUser(user);

      return {
        success: true,
        user,
        tokens,
        message: 'Login successful'
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Step 1: Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Step 2: Update Firebase profile
      await updateProfile(userCredential.user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });

      // Step 3: Get Firebase ID Token
      const idToken = await userCredential.user.getIdToken();

      // Step 4: Register with backend
      const registerResponse = await this.apiClient.post('/auth/register', {
        email: userData.email,
        fullName: `${userData.firstName} ${userData.lastName}`,
        role: userData.role,
        firebaseUid: userCredential.user.uid
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      const user: User = {
        id: userCredential.user.uid,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        verified: userCredential.user.emailVerified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const tokens: AuthTokens = {
        accessToken: idToken,
        refreshToken: 'firebase-refresh',
        expiresIn: 3600
      };

      // Store tokens and user data
      await this.storeTokens(tokens);
      await this.storeUser(user);

      return {
        success: true,
        user,
        tokens,
        message: 'Registration successful'
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      await this.clearStorage();
    } catch (error) {
      console.warn('Logout error:', error);
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
      const user = auth.currentUser;
      const storedUser = await this.getCurrentUser();
      return !!(user && storedUser);
    } catch (error) {
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const user = auth.currentUser;
      if (!user) return false;

      const idToken = await user.getIdToken(true); // Force refresh
      const tokens: AuthTokens = {
        accessToken: idToken,
        refreshToken: 'firebase-refresh',
        expiresIn: 3600
      };

      await this.storeTokens(tokens);
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
    // Firebase Auth errors
    if (error.code) {
      switch (error.code) {
        case 'auth/user-not-found':
          return new Error('No account found with this email address');
        case 'auth/wrong-password':
          return new Error('Incorrect password');
        case 'auth/email-already-in-use':
          return new Error('An account with this email already exists');
        case 'auth/weak-password':
          return new Error('Password should be at least 6 characters');
        case 'auth/invalid-email':
          return new Error('Invalid email address');
        default:
          return new Error(error.message || 'Authentication failed');
      }
    }

    // API errors
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    
    if (error.message) {
      return new Error(error.message);
    }
    
    return new Error('An unexpected error occurred');
  }

  // Method to update API base URL
  updateBaseURL(baseURL: string): void {
    this.apiClient.defaults.baseURL = baseURL;
  }
}

export default new FirebaseAuthService();
