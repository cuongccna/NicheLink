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
      
      {/* Home Tab - Different for each role */}
      <Tabs.Screen
        name="index"
        options={{
          title: user?.role === 'SME' ? 'Dashboard' : 'Bảng tin',
          tabBarIcon: ({ color }) => (
            <IconSymbol 
              size={28} 
              name={user?.role === 'SME' ? 'chart.bar.fill' : 'house.fill'} 
              color={color} 
            />
          ),
        }}
      />

      {/* SME-specific tabs */}
      {user?.role === 'SME' && (
        <>
          <Tabs.Screen
            name="create-campaign"
            options={{
              title: 'Tạo Campaign',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="koc-marketplace"
            options={{
              title: 'KOC Market',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
            }}
          />
          <Tabs.Screen
            name="campaigns"
            options={{
              title: 'Quản lý',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="briefcase.fill" color={color} />,
            }}
          />
        </>
      )}

      {/* INFLUENCER/KOC-specific tabs */}
      {user?.role === 'INFLUENCER' && (
        <>
          <Tabs.Screen
            name="my-tasks"
            options={{
              title: 'Nhiệm vụ',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
            }}
          />
          <Tabs.Screen
            name="workspace"
            options={{
              title: 'Workspace',
              tabBarIcon: ({ color }) => <IconSymbol size={28} name="folder.fill" color={color} />,
            }}
          />
        </>
      )}

      {/* Common tabs for both roles */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Tin nhắn',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />

      {/* Hide unused tabs */}
      <Tabs.Screen
        name="discovery"
        options={{
          href: null, // Hide discovery tab
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide explore tab
        }}
      />
    </Tabs>
  );
}
