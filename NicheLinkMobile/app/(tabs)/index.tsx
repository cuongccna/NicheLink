import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { AuthGuard } from '@/components/AuthGuard';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '../../context/AuthContext';

function HomeContent() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Navigation will be handled by the auth context
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#007AFF', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome, {user?.firstName}!</ThemedText>
        <HelloWave />
      </ThemedView>
      
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">🎯 Dashboard</ThemedText>
        <ThemedText>
          You're logged in as a <ThemedText type="defaultSemiBold">{user?.role}</ThemedText>.
          {user?.role === 'INFLUENCER' 
            ? ' Discover exciting campaigns and start collaborating with brands.'
            : ' Create campaigns and connect with influencers to grow your business.'
          }
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">📱 Sprint 7 Features</ThemedText>
        <ThemedText>
          {`• Mobile-First UI/UX with Dark/Light mode support\n• Push Notifications for real-time updates\n• Mobile-Optimized Workflows with swipe gestures\n• Camera Integration for content creation`}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">🚀 Coming Soon</ThemedText>
        <ThemedText>
          {`• Campaign Management\n• Real-time Messaging\n• Media Upload & Gallery\n• Offline Support`}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <TouchableOpacity 
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <ThemedText style={styles.logoutText}>Sign Out</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

export default function HomeScreen() {
  return (
    <AuthGuard requireAuth={true}>
      <HomeContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
