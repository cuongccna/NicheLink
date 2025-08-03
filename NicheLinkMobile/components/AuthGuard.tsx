import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'SME' | 'INFLUENCER' | string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = true,
  requiredRole
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-900">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Redirect href="../auth/login" />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Redirect href="../(tabs)" />;
  }

  // Check role requirement
  if (requiredRole && user?.role !== requiredRole) {
    return <Redirect href="../(tabs)" />;
  }

  return <>{children}</>;
};
