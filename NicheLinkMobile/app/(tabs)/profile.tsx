import { AuthGuard } from '@/components/AuthGuard';
import RoleDebugger from '@/components/RoleDebugger';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { COLORS } from '@/constants/DesignSystem';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  icon: string;
  title: string;
  subtitle?: string;
  action: () => void;
  toggle?: boolean;
  value?: boolean;
  showChevron?: boolean;
  dangerous?: boolean;
}

function ProfileContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(true);

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        },
      ]
    );
  };

  // Get user stats based on role
  const getUserStats = () => {
    if (user?.role === 'SME') {
      return [
        { label: 'Chiến dịch hoàn thành', value: '12', color: COLORS.success },
        { label: 'Đánh giá trung bình', value: '4.8', color: COLORS.warning },
        { label: 'Người theo dõi', value: '85K', color: COLORS.primary },
      ];
    } else {
      return [
        { label: 'Nhiệm vụ hoàn thành', value: '24', color: COLORS.success },
        { label: 'Đánh giá trung bình', value: '4.9', color: COLORS.warning },
        { label: 'Người theo dõi', value: '12.5K', color: COLORS.secondary },
      ];
    }
  };

  // Get role-specific menu sections
  const getMenuSections = (): MenuSection[] => {
    const baseAccount = [
      { 
        icon: 'person.circle.fill', 
        title: 'Thông tin cá nhân', 
        action: () => router.push('/profile-edit' as any),
        showChevron: true,
      },
      { 
        icon: 'creditcard.fill', 
        title: 'Phương thức thanh toán', 
        action: () => router.push('/payment-history' as any),
        showChevron: true,
      },
      { 
        icon: 'doc.text.fill', 
        title: 'Hợp đồng của tôi', 
        action: () => router.push('/contracts' as any),
        showChevron: true,
      },
    ];

    if (user?.role === 'SME') {
      baseAccount.push({
        icon: 'chart.bar.fill',
        title: 'Thống kê & Báo cáo',
        action: () => router.push('/campaign-management' as any),
        showChevron: true,
      });
    } else {
      baseAccount.push({
        icon: 'star.fill',
        title: 'Đánh giá & Phản hồi',
        action: () => router.push('/reviews' as any),
        showChevron: true,
      });
    }

    return [
      {
        title: 'Tài khoản',
        items: baseAccount,
      },
      {
        title: 'Cài đặt',
        items: [
          { 
            icon: 'bell.fill', 
            title: 'Thông báo', 
            action: () => setNotificationsEnabled(!notificationsEnabled),
            toggle: true,
            value: notificationsEnabled 
          },
          { 
            icon: 'envelope.fill', 
            title: 'Email tiếp thị', 
            action: () => setMarketingEnabled(!marketingEnabled),
            toggle: true,
            value: marketingEnabled 
          },
          { 
            icon: 'moon.fill', 
            title: 'Chế độ tối', 
            action: () => setDarkModeEnabled(!darkModeEnabled),
            toggle: true,
            value: darkModeEnabled 
          },
          { 
            icon: 'globe', 
            title: 'Ngôn ngữ', 
            subtitle: 'Tiếng Việt',
            action: () => router.push('/language-settings' as any),
            showChevron: true,
          },
        ]
      },
      {
        title: 'Hỗ trợ',
        items: [
          { 
            icon: 'questionmark.circle.fill', 
            title: 'Trợ giúp & Hỗ trợ', 
            action: () => router.push('/help' as any),
            showChevron: true,
          },
          { 
            icon: 'doc.text', 
            title: 'Điều khoản sử dụng', 
            action: () => router.push('/terms' as any),
            showChevron: true,
          },
          { 
            icon: 'hand.raised.fill', 
            title: 'Chính sách bảo mật', 
            action: () => router.push('/privacy' as any),
            showChevron: true,
          },
        ]
      },
      {
        title: 'Developer Tools (Testing)',
        items: [
          { 
            icon: 'wrench.and.screwdriver.fill', 
            title: 'Thay đổi Role', 
            subtitle: `Hiện tại: ${user?.role}`,
            action: () => router.push('/role-settings' as any),
            showChevron: true,
          },
        ]
      },
      {
        title: '',
        items: [
          { 
            icon: 'rectangle.portrait.and.arrow.right', 
            title: 'Đăng xuất', 
            action: handleLogout,
            dangerous: true,
          },
        ]
      }
    ];
  };

  // Render menu item
  const renderMenuItem = (item: MenuItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={[styles.menuItem, item.dangerous && styles.menuItemDangerous]}
      onPress={item.action}
    >
      <View style={styles.menuItemLeft}>
        <View style={[
          styles.menuIcon,
          item.dangerous && styles.menuIconDangerous
        ]}>
          <IconSymbol 
            name={item.icon as any} 
            size={20} 
            color={item.dangerous ? COLORS.error : COLORS.primary} 
          />
        </View>
        <View style={styles.menuTextContainer}>
          <ThemedText style={[
            styles.menuTitle,
            item.dangerous && styles.menuTitleDangerous
          ]}>
            {item.title}
          </ThemedText>
          {item.subtitle && (
            <ThemedText style={styles.menuSubtitle}>
              {item.subtitle}
            </ThemedText>
          )}
        </View>
      </View>

      <View style={styles.menuItemRight}>
        {item.toggle ? (
          <Switch
            value={item.value}
            onValueChange={item.action}
            trackColor={{ false: COLORS.light.border, true: COLORS.primary + '40' }}
            thumbColor={item.value ? COLORS.primary : COLORS.light.subtext}
          />
        ) : item.showChevron ? (
          <IconSymbol name="chevron.right" size={16} color={COLORS.light.subtext} />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  // Render section
  const renderSection = (section: MenuSection, index: number) => (
    <View key={index} style={styles.section}>
      {section.title && (
        <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
      )}
      <View style={styles.sectionContent}>
        {section.items.map(renderMenuItem)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header with gradient */}
        <LinearGradient
          colors={user?.role === 'SME' ? [COLORS.primary, '#00C9B7'] : [COLORS.secondary, '#FFAB91']}
          style={styles.header}
        >
          {/* Profile info */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <ThemedText style={styles.avatarText}>
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </ThemedText>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <IconSymbol name="pencil" size={16} color="white" />
              </TouchableOpacity>
            </View>
            
            <ThemedText style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </ThemedText>
            <ThemedText style={styles.userEmail}>
              {user?.email}
            </ThemedText>
            <View style={styles.roleBadge}>
              <ThemedText style={styles.roleText}>
                {user?.role === 'SME' ? 'Doanh nghiệp' : 'KOC/Influencer'}
              </ThemedText>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {getUserStats().map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <ThemedText style={styles.statValue}>{stat.value}</ThemedText>
                <ThemedText style={styles.statLabel}>{stat.label}</ThemedText>
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Role Debug Panel */}
        <RoleDebugger />

        {/* Menu sections */}
        {getMenuSections().map(renderSection)}

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            NicheLink v1.0.0
          </ThemedText>
          <ThemedText style={styles.footerText}>
            © 2025 NicheLink. All rights reserved.
          </ThemedText>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: COLORS.light.background,
  },
  content: {
    flex: 1,
  },

  // Header Styles
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  roleText: {
    fontSize: 12,
    color: 'white',
    fontFamily: 'Inter',
    fontWeight: '600',
  },

  // Stats Styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 20,
    marginHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 4,
  },

  // Section Styles
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.light.text,
    fontFamily: 'Inter',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  // Menu Item Styles
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.light.border,
  },
  menuItemDangerous: {
    backgroundColor: COLORS.error + '05',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconDangerous: {
    backgroundColor: COLORS.error + '15',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.light.text,
    fontFamily: 'Inter',
  },
  menuTitleDangerous: {
    color: COLORS.error,
  },
  menuSubtitle: {
    fontSize: 14,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  menuItemRight: {
    marginLeft: 12,
  },

  // Footer Styles
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 18,
  },
});
