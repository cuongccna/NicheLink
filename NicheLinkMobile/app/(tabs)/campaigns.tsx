import { AuthGuard } from '@/components/AuthGuard';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

// Design System Colors
const COLORS = {
  primary: '#00A79D', // Teal
  secondary: '#FF8A65', // Peach Orange
  success: '#4CAF50', // Green
  error: '#F44336', // Red
  warning: '#FFC107', // Yellow
  light: {
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: '#212529',
    subtext: '#6C757D',
  },
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#E0E0E0',
    subtext: '#A0A0A0',
  }
};

function CampaignsContent() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;
  const [activeTab, setActiveTab] = useState(user?.role === 'SME' ? 'my-campaigns' : 'available');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data cho SME campaigns (quản lý campaigns)
  const smeCampaigns = [
    {
      id: 1,
      title: 'Quảng bá sản phẩm skincare mới',
      description: 'Tìm kiếm KOC trong lĩnh vực làm đẹp để review sản phẩm skincare mới nhất',
      budget: '5,000,000 VNĐ',
      deadline: '15/08/2025',
      category: 'Beauty & Fashion',
      status: 'active',
      applicants: 12,
      views: 156,
      created: '01/08/2025',
      requirements: ['Follower > 10K', 'Nữ 20-35 tuổi', 'Quan tâm làm đẹp']
    },
    {
      id: 2,
      title: 'Review ứng dụng giao đồ ăn',
      description: 'Cần KOC review và giới thiệu ứng dụng giao đồ ăn mới',
      budget: '3,000,000 VNĐ', 
      deadline: '20/08/2025',
      category: 'Food & Tech',
      status: 'draft',
      applicants: 0,
      views: 23,
      created: '03/08/2025',
      requirements: ['Follower > 5K', 'Thường xuyên order đồ ăn', 'Review chi tiết']
    },
    {
      id: 3,
      title: 'Unboxing sản phẩm công nghệ',
      description: 'Tìm tech reviewer để unboxing và đánh giá sản phẩm mới',
      budget: '8,000,000 VNĐ',
      deadline: '25/08/2025', 
      category: 'Technology',
      status: 'completed',
      applicants: 15,
      views: 289,
      created: '25/07/2025',
      requirements: ['Tech reviewer', 'Video chất lượng cao', 'Follower > 20K']
    }
  ];

  // Mock data cho KOC campaigns (portfolio/gallery style)
  const kocCampaigns = [
    {
      id: 1,
      title: 'Quảng bá sản phẩm skincare mới',
      brand: 'Beauty Co.',
      budget: '800,000 VNĐ',
      status: 'completed',
      completedDate: '10/07/2025',
      rating: 4.8,
      image: '🧴',
      category: 'Beauty & Fashion',
      type: 'Post + Story',
      engagement: '2.1K likes, 45 comments'
    },
    {
      id: 2,
      title: 'Review ứng dụng giao đồ ăn',
      brand: 'FoodTech Ltd.',
      budget: '500,000 VNĐ',
      status: 'ongoing',
      deadline: '20/08/2025',
      progress: 60,
      image: '🍜',
      category: 'Food & Tech',
      type: 'Video Review',
      engagement: 'Đang thực hiện...'
    },
    {
      id: 3,
      title: 'Unboxing sản phẩm công nghệ',
      brand: 'Tech Innovate',
      budget: '1,200,000 VNĐ',
      status: 'applied',
      appliedDate: '05/08/2025',
      image: '📱',
      category: 'Technology',
      type: 'Video Unboxing',
      engagement: 'Chờ phê duyệt...'
    }
  ];

  const renderSMECampaigns = () => (
    <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <LinearGradient
          colors={[COLORS.primary, '#4DB6AC']}
          style={styles.statCard}
        >
          <ThemedText style={styles.statNumber}>8</ThemedText>
          <ThemedText style={styles.statLabel}>Chiến dịch hoạt động</ThemedText>
        </LinearGradient>
        <LinearGradient
          colors={[COLORS.success, '#66BB6A']}
          style={styles.statCard}
        >
          <ThemedText style={styles.statNumber}>27</ThemedText>
          <ThemedText style={styles.statLabel}>Ứng viên chờ duyệt</ThemedText>
        </LinearGradient>
      </View>

      {/* Create Campaign Button */}
      <TouchableOpacity style={styles.createCampaignBtn}>
        <LinearGradient
          colors={[COLORS.primary, '#4DB6AC']}
          style={styles.createGradient}
        >
          <IconSymbol name="plus.circle.fill" size={24} color="white" />
          <ThemedText style={styles.createBtnText}>Tạo chiến dịch mới</ThemedText>
        </LinearGradient>
      </TouchableOpacity>

      {/* Campaigns List */}
      {smeCampaigns.map((campaign) => (
        <View key={campaign.id} style={[styles.smeCampaignCard, { backgroundColor: colors.surface }]}>
          <View style={styles.campaignHeader}>
            <View style={styles.campaignTitleSection}>
              <ThemedText style={[styles.smeCampaignTitle, { color: colors.text }]}>{campaign.title}</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) }]}>
                <ThemedText style={styles.statusText}>{getStatusText(campaign.status)}</ThemedText>
              </View>
            </View>
            <TouchableOpacity style={styles.moreBtn}>
              <IconSymbol name="ellipsis.circle" size={24} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          <ThemedText style={[styles.campaignDescription, { color: colors.subtext }]}>{campaign.description}</ThemedText>
          
          <View style={styles.campaignMetrics}>
            <View style={styles.metricItem}>
              <IconSymbol name="eye" size={16} color={colors.subtext} />
              <ThemedText style={[styles.metricText, { color: colors.subtext }]}>{campaign.views} lượt xem</ThemedText>
            </View>
            <View style={styles.metricItem}>
              <IconSymbol name="person.2" size={16} color={colors.subtext} />
              <ThemedText style={[styles.metricText, { color: colors.subtext }]}>{campaign.applicants} ứng viên</ThemedText>
            </View>
            <View style={styles.metricItem}>
              <IconSymbol name="banknote" size={16} color={COLORS.primary} />
              <ThemedText style={[styles.metricText, { color: COLORS.primary, fontWeight: '600' }]}>{campaign.budget}</ThemedText>
            </View>
          </View>

          <View style={styles.campaignFooter}>
            <ThemedText style={[styles.deadlineText, { color: COLORS.error }]}>Hạn: {campaign.deadline}</ThemedText>
            <TouchableOpacity style={[styles.manageBtn, { borderColor: COLORS.primary }]}>
              <ThemedText style={[styles.manageBtnText, { color: COLORS.primary }]}>Quản lý</ThemedText>
              <IconSymbol name="chevron.right" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderKOCCampaigns = () => (
    <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Portfolio Stats */}
      <View style={styles.kocStatsContainer}>
        <LinearGradient
          colors={[COLORS.secondary, '#FFAB91']}
          style={styles.kocStatCard}
        >
          <ThemedText style={styles.kocStatNumber}>12</ThemedText>
          <ThemedText style={styles.kocStatLabel}>Chiến dịch hoàn thành</ThemedText>
        </LinearGradient>
        <LinearGradient
          colors={[COLORS.primary, '#4DB6AC']}
          style={styles.kocStatCard}
        >
          <ThemedText style={styles.kocStatNumber}>4.9⭐</ThemedText>
          <ThemedText style={styles.kocStatLabel}>Đánh giá trung bình</ThemedText>
        </LinearGradient>
      </View>

      {/* Portfolio Gallery */}
      <View style={styles.portfolioGrid}>
        {kocCampaigns.map((campaign) => (
          <TouchableOpacity key={campaign.id} style={[styles.kocCampaignCard, { backgroundColor: colors.surface }]}>
            <LinearGradient
              colors={campaign.status === 'completed' ? [COLORS.success, '#66BB6A'] : 
                      campaign.status === 'ongoing' ? [COLORS.warning, '#FFD54F'] : 
                      [COLORS.primary, '#4DB6AC']}
              style={styles.campaignImageContainer}
            >
              <ThemedText style={styles.campaignEmoji}>{campaign.image}</ThemedText>
              {campaign.status === 'ongoing' && campaign.progress && (
                <View style={styles.progressContainer}>
                  <View style={[styles.progressBar, { width: `${campaign.progress}%` }]} />
                </View>
              )}
            </LinearGradient>
            
            <View style={styles.kocCampaignInfo}>
              <ThemedText style={[styles.kocCampaignTitle, { color: colors.text }]} numberOfLines={2}>
                {campaign.title}
              </ThemedText>
              <ThemedText style={[styles.kocBrandName, { color: colors.subtext }]}>{campaign.brand}</ThemedText>
              
              <View style={styles.campaignDetails}>
                <ThemedText style={[styles.campaignType, { color: COLORS.secondary }]}>{campaign.type}</ThemedText>
                <ThemedText style={[styles.campaignBudget, { color: COLORS.primary }]}>{campaign.budget}</ThemedText>
              </View>

              {campaign.status === 'completed' && (
                <View style={styles.completedInfo}>
                  <ThemedText style={[styles.ratingText, { color: COLORS.warning }]}>⭐ {campaign.rating}</ThemedText>
                  <ThemedText style={[styles.engagementText, { color: colors.subtext }]}>{campaign.engagement}</ThemedText>
                </View>
              )}
              
              {campaign.status === 'ongoing' && (
                <View style={styles.ongoingInfo}>
                  <ThemedText style={[styles.progressText, { color: COLORS.primary }]}>{campaign.progress}% hoàn thành</ThemedText>
                  <ThemedText style={[styles.deadlineText, { color: COLORS.error }]}>Hạn: {campaign.deadline}</ThemedText>
                </View>
              )}
              
              {campaign.status === 'applied' && (
                <View style={styles.appliedInfo}>
                  <ThemedText style={[styles.appliedText, { color: colors.subtext }]}>Đã ứng tuyển {campaign.appliedDate}</ThemedText>
                  <ThemedText style={[styles.statusWaitingText, { color: COLORS.secondary }]}>{campaign.engagement}</ThemedText>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'completed':
        return '#6B7280';
      case 'draft':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang hoạt động';
      case 'completed':
        return 'Đã hoàn thành';
      case 'draft':
        return 'Bản nháp';
      default:
        return status;
    }
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {user?.role === 'SME' ? (
        <>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my-campaigns' && [styles.activeTab, { backgroundColor: COLORS.primary }]]}
            onPress={() => setActiveTab('my-campaigns')}
          >
            <ThemedText style={[styles.tabText, { color: colors.subtext }, activeTab === 'my-campaigns' && styles.activeTabText]}>
              Chiến dịch của tôi
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'analytics' && [styles.activeTab, { backgroundColor: COLORS.primary }]]}
            onPress={() => setActiveTab('analytics')}
          >
            <ThemedText style={[styles.tabText, { color: colors.subtext }, activeTab === 'analytics' && styles.activeTabText]}>
              Thống kê
            </ThemedText>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'available' && [styles.activeTab, { backgroundColor: COLORS.secondary }]]}
            onPress={() => setActiveTab('available')}
          >
            <ThemedText style={[styles.tabText, { color: colors.subtext }, activeTab === 'available' && styles.activeTabText]}>
              Portfolio
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'ongoing' && [styles.activeTab, { backgroundColor: COLORS.secondary }]]}
            onPress={() => setActiveTab('ongoing')}
          >
            <ThemedText style={[styles.tabText, { color: colors.subtext }, activeTab === 'ongoing' && styles.activeTabText]}>
              Đang thực hiện
            </ThemedText>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={user?.role === 'SME' ? [COLORS.primary, '#4DB6AC'] : [COLORS.secondary, '#FFAB91']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>
            {user?.role === 'SME' ? 'Quản lý Chiến dịch' : 'Portfolio Chiến dịch'}
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {user?.role === 'SME' ? 'Theo dõi và quản lý các campaign' : 'Showcase công việc đã thực hiện'}
          </ThemedText>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <IconSymbol name="magnifyingglass" size={20} color="rgba(255,255,255,0.8)" />
          <TextInput
            style={styles.searchInput}
            placeholder={user?.role === 'SME' ? 'Tìm kiếm chiến dịch...' : 'Tìm kiếm trong portfolio...'}
            placeholderTextColor="rgba(255,255,255,0.7)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      {renderTabs()}
      
      {user?.role === 'SME' ? renderSMECampaigns() : renderKOCCampaigns()}
    </SafeAreaView>
  );
}

export default function CampaignsScreen() {
  return (
    <AuthGuard>
      <CampaignsContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: 'white',
    fontFamily: 'Inter',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 25,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeTab: {},
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // SME Styles
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  createCampaignBtn: {
    marginBottom: 20,
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  createBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter',
  },
  smeCampaignCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  campaignTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  smeCampaignTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  moreBtn: {
    padding: 4,
  },
  campaignDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  campaignMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Inter',
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  manageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
    fontFamily: 'Inter',
  },

  // KOC Styles
  kocStatsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  kocStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  kocStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  kocStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kocCampaignCard: {
    width: '48%',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  campaignImageContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  campaignEmoji: {
    fontSize: 40,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  kocCampaignInfo: {
    padding: 12,
  },
  kocCampaignTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  kocBrandName: {
    fontSize: 12,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  campaignDetails: {
    marginBottom: 8,
  },
  campaignType: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  campaignBudget: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  completedInfo: {
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  engagementText: {
    fontSize: 10,
    fontFamily: 'Inter',
  },
  ongoingInfo: {
    marginTop: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  appliedInfo: {
    marginTop: 4,
  },
  appliedText: {
    fontSize: 11,
    marginBottom: 2,
    fontFamily: 'Inter',
  },
  statusWaitingText: {
    fontSize: 10,
    fontStyle: 'italic',
    fontFamily: 'Inter',
  },
});
