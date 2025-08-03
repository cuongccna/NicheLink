import { AuthGuard } from '@/components/AuthGuard';
import RoleDebugger from '@/components/RoleDebugger';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { COLORS } from '@/constants/DesignSystem';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

// Destructure colors for easier access
const { text, subtext } = COLORS.light;

const { width } = Dimensions.get('window');

function HomeContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('relevance');

  // Navigation functions for SME
  const navigateToCampaignDetail = (campaignId: string) => {
    router.push('/screens/campaign-detail-sme' as any);
  };

  const navigateToKOCProfile = (kocId: string) => {
    router.push('/screens/koc-profile-an' as any);
  };

  const navigateToChat = (userId: string) => {
    router.push('/screens/chat' as any);
  };

  const navigateToNotifications = () => {
    router.push('/screens/notifications' as any);
  };

  const navigateToContentReview = () => {
    router.push('/screens/content-review' as any);
  };

  // Navigation functions for KOC
  const navigateToCampaignDetailKOC = (campaignId: string) => {
    router.push('/screens/campaign-detail-koc' as any);
  };

  const navigateToCompanyProfile = (companyId: string) => {
    router.push('/screens/company-profile' as any);
  };

  const navigateToWorkspace = (taskId: string) => {
    router.push('/screens/workspace' as any);
  };

  // SME Dashboard
  const renderSMEDashboard = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Role Debug Panel */}
        <RoleDebugger />
        
        {/* Top Navigation Header */}
        <View style={styles.topNavigation}>
          <View style={styles.logoSection}>
            <LinearGradient
              colors={[COLORS.primary, '#4DB6AC']}
              style={styles.logoContainer}
            >
              <ThemedText style={styles.logoText}>NL</ThemedText>
            </LinearGradient>
            <ThemedText style={styles.brandText}>NicheLink</ThemedText>
          </View>
          <View style={styles.searchAndNotification}>
            <View style={styles.searchContainer}>
              <IconSymbol name="magnifyingglass" size={18} color={COLORS.light.subtext} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm chiến dịch, KOC..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={COLORS.light.subtext}
              />
            </View>
            <TouchableOpacity 
              style={[styles.notificationBtn, styles.notificationBtnSME]}
              onPress={navigateToNotifications}
            >
              <IconSymbol name="bell.fill" size={20} color="#FFFFFF" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <IconSymbol name="person.fill" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={styles.greeting}>Xin chào, {user?.firstName}! 👋</ThemedText>
              <ThemedText style={styles.role}>SME Manager</ThemedText>
            </View>
          </View>
        </View>

        {/* Main Header with Gradient */}
        <LinearGradient
          colors={[COLORS.primary, '#4DB6AC']}
          style={styles.headerGradientSME}
        >
          <ThemedText style={styles.headerTitle}>Dashboard Tổng Quan</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Quản lý chiến dịch marketing hiệu quả</ThemedText>
        </LinearGradient>

        {/* Enhanced Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCardPrimary}>
            <LinearGradient 
              colors={['#00A79D', '#4DB6AC']} 
              style={styles.statGradient}
            >
              <IconSymbol name="briefcase.fill" size={28} color="white" />
              <ThemedText style={styles.statNumberPrimary}>8</ThemedText>
              <ThemedText style={styles.statLabelPrimary}>Chiến dịch đang chạy</ThemedText>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <IconSymbol name="person.2.fill" size={24} color={COLORS.success} />
            <ThemedText style={[styles.statNumber, {color: COLORS.success}]}>47</ThemedText>
            <ThemedText style={styles.statLabel}>KOCs hợp tác</ThemedText>
            <ThemedText style={styles.statChange}>+12% tuần này</ThemedText>
          </View>
          
          <View style={styles.statCard}>
            <IconSymbol name="eye.fill" size={24} color={COLORS.info} />
            <ThemedText style={[styles.statNumber, {color: COLORS.info}]}>2.4M</ThemedText>
            <ThemedText style={styles.statLabel}>Lượt tiếp cận</ThemedText>
            <ThemedText style={styles.statChange}>+8% tuần này</ThemedText>
          </View>
          
          <View style={styles.statCard}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={COLORS.warning} />
            <ThemedText style={[styles.statNumber, {color: COLORS.warning}]}>₫24M</ThemedText>
            <ThemedText style={styles.statLabel}>Doanh thu</ThemedText>
            <ThemedText style={styles.statChange}>+15% tuần này</ThemedText>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.sectionSME}>
          <ThemedText style={styles.sectionTitle}>Hành động nhanh</ThemedText>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/create-campaign' as any)}
            >
              <LinearGradient 
                colors={[COLORS.primary, '#4DB6AC']} 
                style={styles.actionGradient}
              >
                <IconSymbol name="plus.circle.fill" size={24} color="white" />
              </LinearGradient>
              <ThemedText style={styles.actionText}>Tạo chiến dịch</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/screens/explore' as any)}
            >
              <LinearGradient 
                colors={[COLORS.secondary, '#FFAB91']} 
                style={styles.actionGradient}
              >
                <IconSymbol name="person.badge.plus.fill" size={24} color="white" />
              </LinearGradient>
              <ThemedText style={styles.actionText}>Tìm KOC</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/screens/campaign-management' as any)}
            >
              <LinearGradient 
                colors={[COLORS.success, '#66BB6A']} 
                style={styles.actionGradient}
              >
                <IconSymbol name="chart.bar.fill" size={24} color="white" />
              </LinearGradient>
              <ThemedText style={styles.actionText}>Báo cáo</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/profile' as any)}
            >
              <LinearGradient 
                colors={[COLORS.info, '#42A5F5']} 
                style={styles.actionGradient}
              >
                <IconSymbol name="gearshape.fill" size={24} color="white" />
              </LinearGradient>
              <ThemedText style={styles.actionText}>Cài đặt</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.sectionSME}>
          <ThemedText style={styles.sectionTitle}>Hoạt động gần đây</ThemedText>
          <View style={styles.activityCard}>
            <TouchableOpacity 
              style={styles.activityItem}
              onPress={() => navigateToCampaignDetail('campaign_001')}
            >
              <View style={[styles.activityIcon, { backgroundColor: COLORS.success + '20' }]}>
                <IconSymbol name="checkmark.circle.fill" size={16} color={COLORS.success} />
              </View>
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityTitle}>Chiến dịch "Beauty Summer" hoàn thành</ThemedText>
                <ThemedText style={styles.activityTime}>2 giờ trước</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={COLORS.light.subtext} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.activityItem}
              onPress={() => navigateToKOCProfile('koc_001')}
            >
              <View style={[styles.activityIcon, { backgroundColor: COLORS.primary + '20' }]}>
                <IconSymbol name="person.badge.plus.fill" size={16} color={COLORS.primary} />
              </View>
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityTitle}>3 KOC mới tham gia hệ thống</ThemedText>
                <ThemedText style={styles.activityTime}>5 giờ trước</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={COLORS.light.subtext} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.activityItem}
              onPress={() => navigateToContentReview()}
            >
              <View style={[styles.activityIcon, { backgroundColor: COLORS.warning + '20' }]}>
                <IconSymbol name="eye.fill" size={16} color={COLORS.warning} />
              </View>
              <View style={styles.activityContent}>
                <ThemedText style={styles.activityTitle}>5 nội dung chờ duyệt</ThemedText>
                <ThemedText style={styles.activityTime}>1 ngày trước</ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={COLORS.light.subtext} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* Floating Action Button for SME */}
      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push('/create-campaign' as any)}
      >
        <LinearGradient
          colors={[COLORS.primary, '#4DB6AC']}
          style={styles.fabGradient}
        >
          <IconSymbol name="plus" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );

  // KOC Feed/Bảng tin
  const renderKOCFeed = () => (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Role Debug Panel */}
        <RoleDebugger />
        
        {/* Top Navigation Header */}
        <View style={styles.topNavigation}>
          <View style={styles.logoSection}>
            <LinearGradient
              colors={[COLORS.secondary, '#FFAB91']}
              style={styles.logoContainer}
            >
              <ThemedText style={styles.logoText}>NL</ThemedText>
            </LinearGradient>
            <ThemedText style={styles.brandText}>NicheLink</ThemedText>
          </View>
          <View style={styles.searchAndNotification}>
            <View style={styles.searchContainer}>
              <IconSymbol name="magnifyingglass" size={18} color={COLORS.light.subtext} />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm chiến dịch..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={COLORS.light.subtext}
              />
            </View>
            <TouchableOpacity 
              style={[styles.notificationBtn, styles.notificationBtnKOC]}
              onPress={navigateToNotifications}
            >
              <IconSymbol name="bell.fill" size={20} color="#FFFFFF" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter and Sort Section */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
            {['relevance', 'payment', 'deadline', 'category'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  selectedFilter === filter && styles.filterChipSelected
                ]}
                onPress={() => setSelectedFilter(filter)}
              >
                <ThemedText style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.filterChipTextSelected
                ]}>
                  {filter === 'relevance' ? 'Phù hợp nhất' :
                   filter === 'payment' ? 'Thù lao cao' :
                   filter === 'deadline' ? 'Gần hạn' : 'Danh mục'}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <IconSymbol name="person.fill" size={24} color={COLORS.secondary} />
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={styles.greeting}>Chào {user?.firstName}! ✨</ThemedText>
              <ThemedText style={styles.role}>KOC Creator</ThemedText>
            </View>
          </View>
        </View>

        {/* Main Header with Gradient */}
        <LinearGradient
          colors={[COLORS.secondary, '#FFAB91']}
          style={styles.headerGradient}
        >
          <ThemedText style={styles.headerTitle}>Bảng Tin Cộng Tác</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Khám phá cơ hội hợp tác mới hôm nay</ThemedText>
        </LinearGradient>

        {/* KOC Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCardPrimary}>
            <LinearGradient 
              colors={['#FF8A65', '#FFAB91']} 
              style={styles.statGradient}
            >
              <IconSymbol name="star.fill" size={28} color="white" />
              <ThemedText style={styles.statNumberPrimary}>4.9</ThemedText>
              <ThemedText style={styles.statLabelPrimary}>Xếp hạng của bạn</ThemedText>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <IconSymbol name="list.bullet" size={24} color={COLORS.success} />
            <ThemedText style={[styles.statNumber, {color: COLORS.success}]}>12</ThemedText>
            <ThemedText style={styles.statLabel}>Đã hoàn thành</ThemedText>
            <ThemedText style={styles.statChange}>+3 tháng này</ThemedText>
          </View>
          
          <View style={styles.statCard}>
            <IconSymbol name="clock.fill" size={24} color={COLORS.warning} />
            <ThemedText style={[styles.statNumber, {color: COLORS.warning}]}>5</ThemedText>
            <ThemedText style={styles.statLabel}>Đang thực hiện</ThemedText>
            <ThemedText style={styles.statChange}>2 sắp deadline</ThemedText>
          </View>
          
          <View style={styles.statCard}>
            <IconSymbol name="banknote.fill" size={24} color={COLORS.success} />
            <ThemedText style={[styles.statNumber, {color: COLORS.success}]}>₫8.5M</ThemedText>
            <ThemedText style={styles.statLabel}>Thu nhập</ThemedText>
            <ThemedText style={styles.statChange}>Tháng này</ThemedText>
          </View>
        </View>

        {/* Campaign Tasks Feed */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Nhiệm vụ mới dành cho bạn</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.seeAllText}>Xem tất cả</ThemedText>
            </TouchableOpacity>
          </View>
          
          {/* Enhanced Campaign Card for KOC */}
          <View style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <TouchableOpacity 
                style={styles.brandInfo}
                onPress={() => navigateToCompanyProfile('beauty_brand_x')}
              >
                <View style={styles.brandAvatar}>
                  <IconSymbol name="sparkles" size={16} color={COLORS.secondary} />
                </View>
                <View style={styles.brandDetails}>
                  <ThemedText style={styles.brandName}>Beauty Brand X</ThemedText>
                  <ThemedText style={styles.campaignCategory}>Skincare • Beauty</ThemedText>
                </View>
              </TouchableOpacity>
              <View style={styles.paymentTag}>
                <IconSymbol name="banknote.fill" size={12} color={COLORS.success} />
                <ThemedText style={styles.paymentText}>₫2-5M</ThemedText>
              </View>
            </View>
            
            <ThemedText style={styles.taskTitle}>Review sản phẩm skincare mùa hè mới</ThemedText>
            <ThemedText style={styles.taskDescription}>
              Tạo content review chi tiết cho dòng sản phẩm chăm sóc da mùa hè. 
              Bao gồm: Video TikTok + Instagram Reels + bài viết blog.
            </ThemedText>
            
            <View style={styles.taskTags}>
              <View style={styles.platformTag}>
                <ThemedText style={styles.tagText}>TikTok</ThemedText>
              </View>
              <View style={styles.platformTag}>
                <ThemedText style={styles.tagText}>Instagram</ThemedText>
              </View>
              <View style={styles.platformTag}>
                <ThemedText style={styles.tagText}>Blog</ThemedText>
              </View>
            </View>
            
            <View style={styles.taskMeta}>
              <View style={styles.metaRow}>
                <IconSymbol name="clock" size={14} color={COLORS.warning} />
                <ThemedText style={styles.metaText}>Hạn ứng tuyển: 5 ngày</ThemedText>
              </View>
              <View style={styles.metaRow}>
                <IconSymbol name="person.2" size={14} color={COLORS.info} />
                <ThemedText style={styles.metaText}>3/10 đã ứng tuyển</ThemedText>
              </View>
            </View>
            
            <View style={styles.taskActions}>
              <TouchableOpacity style={styles.detailBtn}>
                <ThemedText style={styles.detailBtnText}>Xem chi tiết</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn}>
                <ThemedText style={styles.applyBtnText}>Ứng tuyển</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Second Task Card */}
          <View style={styles.taskCard}>
            <View style={styles.taskHeader}>
              <View style={styles.brandInfo}>
                <View style={styles.brandAvatar}>
                  <IconSymbol name="heart.fill" size={16} color={COLORS.error} />
                </View>
                <View style={styles.brandDetails}>
                  <ThemedText style={styles.brandName}>Fashion Hub</ThemedText>
                  <ThemedText style={styles.campaignCategory}>Fashion • Lifestyle</ThemedText>
                </View>
              </View>
              <View style={styles.paymentTag}>
                <IconSymbol name="banknote.fill" size={12} color={COLORS.success} />
                <ThemedText style={styles.paymentText}>₫1-3M</ThemedText>
              </View>
            </View>
            
            <ThemedText style={styles.taskTitle}>Lookbook thời trang công sở</ThemedText>
            <ThemedText style={styles.taskDescription}>
              Tạo bộ ảnh lookbook với trang phục công sở thanh lịch. 
              Kết hợp với video styling tips trên Instagram Stories.
            </ThemedText>
            
            <View style={styles.taskTags}>
              <View style={styles.platformTag}>
                <ThemedText style={styles.tagText}>Instagram</ThemedText>
              </View>
              <View style={styles.platformTag}>
                <ThemedText style={styles.tagText}>Stories</ThemedText>
              </View>
            </View>
            
            <View style={styles.taskMeta}>
              <View style={styles.metaRow}>
                <IconSymbol name="clock" size={14} color={COLORS.error} />
                <ThemedText style={styles.metaText}>Hạn ứng tuyển: 3 ngày</ThemedText>
              </View>
              <View style={styles.metaRow}>
                <IconSymbol name="person.2" size={14} color={COLORS.info} />
                <ThemedText style={styles.metaText}>7/15 đã ứng tuyển</ThemedText>
              </View>
            </View>
            
            <View style={styles.taskActions}>
              <TouchableOpacity style={styles.detailBtn}>
                <ThemedText style={styles.detailBtnText}>Xem chi tiết</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn}>
                <ThemedText style={styles.applyBtnText}>Ứng tuyển</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  return user?.role === 'SME' ? renderSMEDashboard() : renderKOCFeed();
}

export default function HomeScreen() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    position: 'relative', // Đảm bảo FAB có thể position absolute
  },
  content: {
    flex: 1,
  },
  
  // Header Styles
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.light.text,
    fontFamily: 'Inter',
  },
  role: {
    fontSize: 14,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.error,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  
  headerGradient: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Inter',
  },

  // Stats Styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: -16,
  },
  statCardPrimary: {
    width: (width - 52) / 2,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumberPrimary: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    fontFamily: 'Inter',
  },
  statLabelPrimary: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  statCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Inter',
    color: COLORS.light.subtext,
  },
  statChange: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Inter',
    color: COLORS.success,
    fontWeight: '600',
  },

  // Section Styles
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: COLORS.light.text,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'Inter',
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 56) / 4,
    alignItems: 'center',
  },
  actionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Inter',
    color: COLORS.light.text,
    fontWeight: '500',
  },

  // Activity Styles
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: COLORS.light.text,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginTop: 2,
  },

  // Campaign Card Styles
  campaignCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter',
    color: COLORS.light.text,
  },
  campaignCategory: {
    fontSize: 12,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  budgetTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.success + '15',
    borderRadius: 12,
  },
  budgetText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
    fontFamily: 'Inter',
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter',
    color: COLORS.light.text,
  },
  campaignDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: 'Inter',
    color: COLORS.light.subtext,
  },
  campaignTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  campaignMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginLeft: 4,
    marginRight: 12,
  },
  applyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  applyBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  
  // Role-specific styles
  notificationBtnSME: {
    marginRight: 8,
  },
  notificationBtnKOC: {
    backgroundColor: COLORS.secondary,
    marginRight: 8,
  },
  headerGradientSME: {
    paddingVertical: 35,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  sectionSME: {
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 8,
  },
  
  // Top Navigation Styles
  topNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter',
  },
  brandText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.light.text,
    fontFamily: 'Inter',
  },
  searchAndNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.light.background,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    flex: 1,
    maxWidth: 200,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.light.text,
    fontFamily: 'Inter',
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  
  // Filter Section
  filterSection: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  filterScrollView: {
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.light.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipSelected: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.light.subtext,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  filterChipTextSelected: {
    color: 'white',
  },
  
  // Enhanced Task Card Styles
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandDetails: {
    marginLeft: 12,
  },
  paymentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.success + '15',
    borderRadius: 12,
  },
  paymentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
    fontFamily: 'Inter',
    marginLeft: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter',
    color: COLORS.light.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  taskDescription: {
    fontSize: 14,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    lineHeight: 20,
    marginBottom: 16,
  },
  taskTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  platformTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.secondary + '15',
    borderRadius: 8,
  },
  taskMeta: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 12,
  },
  detailBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    alignItems: 'center',
  },
  detailBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
    fontFamily: 'Inter',
  },
  
  // FAB Styles
  fab: {
    position: 'absolute',
    bottom: 90, // Tăng từ 24 lên 90 để tránh bottom tab
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999, // Đảm bảo FAB nằm trên tất cả
    borderWidth: 2,
    borderColor: 'white',
  },
  fabGradient: {
    width: 52, // Giảm 2px để tính border
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
