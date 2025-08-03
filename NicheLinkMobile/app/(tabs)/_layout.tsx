import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { COLORS, ROLE_THEMES } from '@/constants/DesignSystem';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;
  
  // Get role-specific theme
  const roleTheme = user?.role ? ROLE_THEMES[user.role] : ROLE_THEMES.INFLUENCER;

  // SME Tab Configuration - Only 5 main tabs
  if (user?.role === 'SME') {
    return (
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: roleTheme.primary,
          tabBarInactiveTintColor: colors.subtext,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderTopWidth: 0,
              elevation: 0,
              shadowOpacity: 0.1,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: -2 },
            },
            default: {
              backgroundColor: colors.surface,
              borderTopWidth: 0,
              elevation: 8,
              shadowOpacity: 0.1,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: -2 },
            },
          }),
        }}>
        
        {/* Dashboard */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Trang chủ',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />

        {/* Campaigns */}
        <Tabs.Screen
          name="campaigns"
          options={{
            title: 'Chiến dịch',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="briefcase.fill" color={color} />
            ),
          }}
        />

        {/* Create Campaign - Center FAB */}
        <Tabs.Screen
          name="create-campaign"
          options={{
            title: 'Tạo mới',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol 
                size={36} 
                name="plus.circle.fill" 
                color={focused ? roleTheme.primary : roleTheme.accent} 
              />
            ),
            tabBarIconStyle: {
              marginTop: -8,
            },
          }}
        />

        {/* Messages */}
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Tin nhắn',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="message.fill" color={color} />
            ),
          }}
        />

        {/* Profile */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Hồ sơ',
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="person.fill" color={color} />
            ),
          }}
        />

        {/* Hidden screens for SME */}
        <Tabs.Screen
          name="my-tasks"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="koc-profile"
          options={{ href: null }}
        />
      </Tabs>
    );
  }

  // KOC Tab Configuration - Only 4 main tabs
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: roleTheme.primary,
        tabBarInactiveTintColor: colors.subtext,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0.1,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: -2 },
          },
          default: {
            backgroundColor: colors.surface,
            borderTopWidth: 0,
            elevation: 8,
            shadowOpacity: 0.1,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: -2 },
          },
        }),
      }}>
      
      {/* Feed/Discovery */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Bảng tin',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="safari.fill" color={color} />
          ),
        }}
      />

      {/* My Tasks */}
      <Tabs.Screen
        name="my-tasks"
        options={{
          title: 'Nhiệm vụ',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="checklist" color={color} />
          ),
        }}
      />

      {/* Messages */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Tin nhắn',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="message.fill" color={color} />
          ),
        }}
      />

      {/* KOC Profile */}
      <Tabs.Screen
        name="koc-profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />

      {/* Hidden screens for KOC */}
      <Tabs.Screen
        name="campaigns"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="create-campaign"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="profile"
        options={{ href: null }}
      />
    </Tabs>
  );
}
