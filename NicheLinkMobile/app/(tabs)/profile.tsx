import { AuthGuard } from '@/components/AuthGuard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';

function ProfileContent() {
  const { user, logout } = useAuth();
  const colorScheme = useColorScheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(colorScheme === 'dark');

  const handleLogout = async () => {
    await logout();
  };

  const menuSections = [
    {
      title: 'Tài khoản',
      items: [
        { icon: 'person.circle', title: 'Thông tin cá nhân', action: () => console.log('Profile') },
        { icon: 'creditcard', title: 'Phương thức thanh toán', action: () => console.log('Payment') },
        { icon: 'doc.text', title: 'Hợp đồng của tôi', action: () => console.log('Contracts') },
        { icon: 'chart.bar', title: 'Thống kê & Báo cáo', action: () => console.log('Analytics') },
      ]
    },
    {
      title: 'Cài đặt',
      items: [
        { 
          icon: 'bell', 
          title: 'Thông báo', 
          action: () => setNotificationsEnabled(!notificationsEnabled),
          toggle: true,
          value: notificationsEnabled 
        },
        { 
          icon: 'moon', 
          title: 'Chế độ tối', 
          action: () => setDarkModeEnabled(!darkModeEnabled),
          toggle: true,
          value: darkModeEnabled 
        },
        { icon: 'globe', title: 'Ngôn ngữ', action: () => console.log('Language'), subtitle: 'Tiếng Việt' },
        { icon: 'questionmark.circle', title: 'Trợ giúp & Hỗ trợ', action: () => console.log('Help') },
      ]
    },
    {
      title: 'Pháp lý',
      items: [
        { icon: 'doc.plaintext', title: 'Điều khoản sử dụng', action: () => console.log('Terms') },
        { icon: 'hand.raised', title: 'Chính sách bảo mật', action: () => console.log('Privacy') },
        { icon: 'info.circle', title: 'Về chúng tôi', action: () => console.log('About') },
      ]
    }
  ];

  const renderMenuItem = (item: any, index: number) => (
    <TouchableOpacity 
      key={index} 
      style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      onPress={item.action}
    >
      <ThemedView style={styles.menuItemLeft}>
        <IconSymbol name={item.icon} size={20} color={Colors[colorScheme ?? 'light'].icon} />
        <ThemedView style={styles.menuItemText}>
          <ThemedText style={styles.menuItemTitle}>{item.title}</ThemedText>
          {item.subtitle && (
            <ThemedText style={styles.menuItemSubtitle}>{item.subtitle}</ThemedText>
          )}
        </ThemedView>
      </ThemedView>
      
      {item.toggle ? (
        <Switch
          value={item.value}
          onValueChange={item.action}
          trackColor={{ false: '#E5E7EB', true: Colors[colorScheme ?? 'light'].tint }}
          thumbColor={item.value ? 'white' : '#F3F4F6'}
        />
      ) : (
        <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Hồ sơ</ThemedText>
      </ThemedView>

      {/* Profile Card */}
      <TouchableOpacity style={[styles.profileCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <ThemedView style={styles.profileInfo}>
          <ThemedView style={[styles.avatarContainer, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
            <ThemedText style={styles.avatarText}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.userInfo}>
            <ThemedText type="defaultSemiBold" style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </ThemedText>
            <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
            <ThemedView style={styles.userRole}>
              <ThemedText style={[styles.roleText, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
                {user?.role === 'SME' ? 'Doanh nghiệp' : 'Influencer'}
              </ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        
        <IconSymbol name="chevron.right" size={20} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
      </TouchableOpacity>

      {/* Stats Cards */}
      {user?.role === 'INFLUENCER' && (
        <ThemedView style={styles.statsContainer}>
          <ThemedView style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <ThemedText style={styles.statNumber}>12</ThemedText>
            <ThemedText style={styles.statLabel}>Chiến dịch hoàn thành</ThemedText>
          </ThemedView>
          
          <ThemedView style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <ThemedText style={styles.statNumber}>4.8</ThemedText>
            <ThemedText style={styles.statLabel}>Đánh giá trung bình</ThemedText>
          </ThemedView>
          
          <ThemedView style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <ThemedText style={styles.statNumber}>85K</ThemedText>
            <ThemedText style={styles.statLabel}>Người theo dõi</ThemedText>
          </ThemedView>
        </ThemedView>
      )}

      {/* Menu Sections */}
      {menuSections.map((section, sectionIndex) => (
        <ThemedView key={sectionIndex} style={styles.menuSection}>
          <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
          <ThemedView style={[styles.menuGroup, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            {section.items.map((item, itemIndex) => renderMenuItem(item, itemIndex))}
          </ThemedView>
        </ThemedView>
      ))}

      {/* Logout Button */}
      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
        onPress={handleLogout}
      >
        <IconSymbol name="arrow.right.square" size={20} color="#EF4444" />
        <ThemedText style={styles.logoutText}>Đăng xuất</ThemedText>
      </TouchableOpacity>

      <ThemedView style={styles.footer}>
        <ThemedText style={styles.versionText}>NicheLink v1.0.0</ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

export default function ProfileScreen() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    marginBottom: 0,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  userRole: {
    alignSelf: 'flex-start',
  },
  roleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.8,
  },
  menuGroup: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    marginLeft: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
  },
  menuItemSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logoutText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 12,
    opacity: 0.5,
  },
});
