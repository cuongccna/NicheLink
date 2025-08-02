export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SME' | 'INFLUENCER';
  profileImage?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'SME' | 'INFLUENCER';
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  tokens: AuthTokens;
  message?: string;
}

export interface AuthError {
  message: string;
  field?: string;
  code?: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
}
