import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';
import backendAuthService from '../services/backendAuthService';
import { AuthError, AuthState, AuthTokens, LoginRequest, RegisterRequest, User } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; tokens: AuthTokens } }
  | { type: 'AUTH_FAILURE'; payload: AuthError }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  tokens: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        tokens: null,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const isAuth = await backendAuthService.isAuthenticated();
      if (isAuth) {
        const user = await backendAuthService.getCurrentUser();
        if (user) {
          // We don't store tokens in state for security, just check if they exist
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user,
              tokens: { accessToken: '', refreshToken: '', expiresIn: 0 }, // Placeholder
            },
          });
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials: LoginRequest) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const response = await backendAuthService.login(credentials);
      
      if (response.success) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.user,
            tokens: response.tokens,
          },
        });
      } else {
        dispatch({
          type: 'AUTH_FAILURE',
          payload: { message: response.message || 'Login failed' },
        });
      }
    } catch (error: any) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { message: error.message || 'Login failed' },
      });
    }
  };

  const register = async (userData: RegisterRequest) => {
    console.log('🚀 [AUTH CONTEXT] Starting registration for:', userData.email);
    dispatch({ type: 'AUTH_START' });
    
    try {
      const response = await backendAuthService.register(userData);
      console.log('✅ [AUTH CONTEXT] Registration response:', response.success);
      
      if (response.success) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: response.user,
            tokens: response.tokens,
          },
        });
        console.log('✅ [AUTH CONTEXT] Registration successful, user logged in');
      } else {
        console.log('❌ [AUTH CONTEXT] Registration failed:', response.message);
        dispatch({
          type: 'AUTH_FAILURE',
          payload: { message: response.message || 'Registration failed' },
        });
      }
    } catch (error: any) {
      console.log('❌ [AUTH CONTEXT] Registration error:', error.message);
      dispatch({
        type: 'AUTH_FAILURE',
        payload: { message: error.message || 'Registration failed' },
      });
    }
  };

  const logout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      await backendAuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
