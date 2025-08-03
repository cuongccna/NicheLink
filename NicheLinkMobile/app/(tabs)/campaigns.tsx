import { AuthGuard } from '@/components/AuthGuard';
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
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Campaign status types
type CampaignStatus = 'running' | 'pending' | 'completed' | 'draft' | 'paused' | 'cancelled';

// Application status types
type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

interface CampaignAnalytics {
  views: number;
  applications: number;
  approvalRate: number;
  avgEngagement: number;
  totalReach: number;
  conversions: number;
}

interface KOCApplication {
  id: string;
  kocId: string;
  kocName: string;
  kocAvatar: string;
  kocFollowers: number;
  kocCategory: string;
  status: ApplicationStatus;
  appliedAt: string;
  proposedContent: string;
  proposedBudget: number;
}

interface Campaign {
  id: string;
  title: string;
  brand: string;
  status: CampaignStatus;
  budget: string;
  budgetAmount: number;
  category: string;
  participants: number;
  maxParticipants: number;
  deadline: string;
  progress: number;
  createdAt: string;
  description: string;
  requirements: string[];
  analytics: CampaignAnalytics;
  applications: KOCApplication[];
  isUrgent?: boolean;
}

// Mock campaigns data with enhanced analytics
const mockCampaigns: Campaign[] = [
  {
    id: 'phinden_coffee_launch',
    title: 'Ra mắt cà phê PhinĐen Premium',
    brand: 'PhinĐen Coffee',
    status: 'running',
    budget: '₫1,200,000',
    budgetAmount: 1200000,
    category: 'Food & Beverage',
    participants: 3,
    maxParticipants: 5,
    deadline: '5 ngày',
    progress: 65,
    createdAt: '2025-08-01',
    description: 'Giới thiệu dòng cà phê cao cấp mới với hương vị đặc biệt từ Đà Lạt',
    requirements: ['Có kinh nghiệm review F&B', 'Followers 10K+', 'Engagement rate >3%'],
    isUrgent: true,
    analytics: {
      views: 2847,
      applications: 12,
      approvalRate: 25,
      avgEngagement: 4.2,
      totalReach: 45600,
      conversions: 18,
    },
    applications: [],
  },
  {
    id: 'summer_fashion_2024',
    title: 'BST Thu Đông 2025',
    brand: 'Fashion Forward',
    status: 'pending',
    budget: '₫2,500,000',
    budgetAmount: 2500000,
    category: 'Fashion',
    participants: 0,
    maxParticipants: 8,
    deadline: '12 ngày',
    progress: 0,
    createdAt: '2025-08-02',
    description: 'Quảng bá bộ sưu tập thu đông với phong cách trẻ trung, năng động',
    requirements: ['Fashion influencer', 'Followers 20K+', 'Có kinh nghiệm chụp lookbook'],
    analytics: {
      views: 1892,
      applications: 8,
      approvalRate: 0,
      avgEngagement: 0,
      totalReach: 0,
      conversions: 0,
    },
    applications: [],
  },
  {
    id: 'tech_smartphone_review',
    title: 'Review Smartphone XYZ Pro',
    brand: 'TechViet',
    status: 'completed',
    budget: '₫900,000',
    budgetAmount: 900000,
    category: 'Technology',
    participants: 2,
    maxParticipants: 3,
    deadline: 'Đã kết thúc',
    progress: 100,
    createdAt: '2025-07-15',
    description: 'Đánh giá chi tiết smartphone flagship mới nhất',
    requirements: ['Tech reviewer', 'Video quality tốt', 'Followers 5K+'],
    analytics: {
      views: 5621,
      applications: 15,
      approvalRate: 20,
      avgEngagement: 6.8,
      totalReach: 89400,
      conversions: 34,
    },
    applications: [],
  },
  {
    id: 'skincare_routine_2024',
    title: 'Quy trình skincare K-Beauty',
    brand: 'Beauty Korea',
    status: 'draft',
    budget: '₫1,800,000',
    budgetAmount: 1800000,
    category: 'Beauty & Skincare',
    participants: 0,
    maxParticipants: 6,
    deadline: '20 ngày',
    progress: 0,
    createdAt: '2025-08-03',
    description: 'Hướng dẫn quy trình skincare 10 bước theo phong cách Hàn Quốc',
    requirements: ['Beauty influencer', 'Skincare expertise', 'Followers 12K+'],
    analytics: {
      views: 0,
      applications: 0,
      approvalRate: 0,
      avgEngagement: 0,
      totalReach: 0,
      conversions: 0,
    },
    applications: [],
  },
];

function CampaignsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'all' | 'running' | 'pending' | 'completed' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Filter campaigns by status and search
  const filteredCampaigns = mockCampaigns.filter(campaign => {
    const matchesTab = selectedTab === 'all' || campaign.status === selectedTab;
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Refresh campaigns
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Handle campaign action
  const handleCampaignAction = (campaignId: string, action: 'pause' | 'resume' | 'edit' | 'delete' | 'duplicate') => {
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc chắn muốn ${action === 'pause' ? 'tạm dừng' : 
                                action === 'resume' ? 'tiếp tục' :
                                action === 'edit' ? 'chỉnh sửa' :
                                action === 'delete' ? 'xóa' : 'sao chép'} chiến dịch này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xác nhận', 
          onPress: () => {
            console.log(`${action} campaign:`, campaignId);
          }
        },
      ]
    );
  };

  // Navigate to campaign details
  const navigateToCampaignDetails = (campaign: Campaign) => {
    if (campaign.id === 'phinden_coffee_launch') {
      router.push('/campaign-detail-sme' as any);
    } else {
      console.log(`Navigate to campaign: ${campaign.id}`);
    }
  };

  // Get status color
  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case 'running': return COLORS.success;
      case 'pending': return COLORS.warning;
      case 'completed': return COLORS.primary;
      case 'draft': return COLORS.light.subtext;
      case 'paused': return COLORS.secondary;
      case 'cancelled': return COLORS.error;
      default: return COLORS.light.subtext;
    }
  };

  // Get status text
  const getStatusText = (status: CampaignStatus) => {
    switch (status) {
      case 'running': return 'Đang chạy';
      case 'pending': return 'Chờ duyệt';
      case 'completed': return 'Hoàn thành';
      case 'draft': return 'Bản nháp';
      case 'paused': return 'Tạm dừng';
      case 'cancelled': return 'Đã hủy';
      default: return 'Không xác định';
    }
  };

  // Get campaign stats
  const getCampaignStats = () => {
    const total = mockCampaigns.length;
    const running = mockCampaigns.filter(c => c.status === 'running').length;
    const pending = mockCampaigns.filter(c => c.status === 'pending').length;
    const completed = mockCampaigns.filter(c => c.status === 'completed').length;
    const totalBudget = mockCampaigns.reduce((sum, c) => sum + c.budgetAmount, 0);
    const totalReach = mockCampaigns.reduce((sum, c) => sum + c.analytics.totalReach, 0);

    return { total, running, pending, completed, totalBudget, totalReach };
  };

  const stats = getCampaignStats();

  // Render stats overview
  const renderStatsOverview = () => (
    <View style={styles.statsContainer}>
      <LinearGradient
        colors={[COLORS.primary, '#00C9B7']}
        style={styles.statsGradient}
      >
        <ThemedText style={styles.statsTitle}>Tổng quan chiến dịch</ThemedText>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{stats.total}</ThemedText>
            <ThemedText style={styles.statLabel}>Tổng số</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{stats.running}</ThemedText>
            <ThemedText style={styles.statLabel}>Đang chạy</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{stats.pending}</ThemedText>
            <ThemedText style={styles.statLabel}>Chờ duyệt</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{stats.completed}</ThemedText>
            <ThemedText style={styles.statLabel}>Hoàn thành</ThemedText>
          </View>
        </View>
        <View style={styles.statsFooter}>
          <View style={styles.budgetInfo}>
            <IconSymbol name="banknote" size={16} color="white" />
            <ThemedText style={styles.budgetText}>
              Tổng ngân sách: ₫{(stats.totalBudget / 1000000).toFixed(1)}M
            </ThemedText>
          </View>
          <View style={styles.reachInfo}>
            <IconSymbol name="eye" size={16} color="white" />
            <ThemedText style={styles.reachText}>
              Tổng reach: {(stats.totalReach / 1000).toFixed(0)}K
            </ThemedText>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  // Render campaign card with enhanced analytics
  const renderCampaignCard = (campaign: Campaign) => (
    <TouchableOpacity
      key={campaign.id}
      style={[
        styles.campaignCard,
        campaign.isUrgent && styles.urgentCampaignCard
      ]}
      onPress={() => navigateToCampaignDetails(campaign)}
      onLongPress={() => {
        Alert.alert(
          'Tùy chọn chiến dịch',
          'Chọn hành động bạn muốn thực hiện',
          [
            { text: 'Hủy', style: 'cancel' },
            { text: 'Chỉnh sửa', onPress: () => handleCampaignAction(campaign.id, 'edit') },
            { text: 'Sao chép', onPress: () => handleCampaignAction(campaign.id, 'duplicate') },
            { text: 'Xóa', style: 'destructive', onPress: () => handleCampaignAction(campaign.id, 'delete') },
          ]
        );
      }}
    >
      {campaign.isUrgent && (
        <View style={styles.urgentBadge}>
          <IconSymbol name="exclamationmark.triangle.fill" size={12} color="white" />
          <ThemedText style={styles.urgentText}>URGENT</ThemedText>
        </View>
      )}

      {/* Campaign Header */}
      <View style={styles.campaignHeader}>
        <View style={styles.campaignIcon}>
          <IconSymbol 
            name="briefcase.fill" 
            size={20} 
            color={COLORS.primary} 
          />
        </View>
        <View style={styles.campaignMainInfo}>
          <ThemedText style={styles.campaignTitle} numberOfLines={2}>
            {campaign.title}
          </ThemedText>
          <ThemedText style={styles.campaignBrand}>{campaign.brand}</ThemedText>
          <ThemedText style={styles.campaignCategory}>{campaign.category}</ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(campaign.status) + '20' }]}>
          <ThemedText style={[styles.statusText, { color: getStatusColor(campaign.status) }]}>
            {getStatusText(campaign.status)}
          </ThemedText>
        </View>
      </View>

      {/* Campaign Analytics Mini */}
      <View style={styles.analyticsRow}>
        <View style={styles.analyticItem}>
          <IconSymbol name="eye" size={14} color={COLORS.light.subtext} />
          <ThemedText style={styles.analyticText}>{campaign.analytics.views}</ThemedText>
        </View>
        <View style={styles.analyticItem}>
          <IconSymbol name="person.2" size={14} color={COLORS.light.subtext} />
          <ThemedText style={styles.analyticText}>{campaign.analytics.applications}</ThemedText>
        </View>
        <View style={styles.analyticItem}>
          <IconSymbol name="heart" size={14} color={COLORS.light.subtext} />
          <ThemedText style={styles.analyticText}>{campaign.analytics.avgEngagement}%</ThemedText>
        </View>
        <View style={styles.analyticItem}>
          <IconSymbol name="chart.line.uptrend.xyaxis" size={14} color={COLORS.success} />
          <ThemedText style={styles.analyticText}>{campaign.analytics.conversions}</ThemedText>
        </View>
      </View>

      {/* Progress and Budget */}
      <View style={styles.campaignStats}>
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <ThemedText style={styles.progressLabel}>Tiến độ</ThemedText>
            <ThemedText style={styles.progressPercentage}>{campaign.progress}%</ThemedText>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${campaign.progress}%`,
                  backgroundColor: getStatusColor(campaign.status)
                }
              ]} 
            />
          </View>
        </View>

        <View style={styles.campaignFooter}>
          <View style={styles.budgetContainer}>
            <IconSymbol name="banknote" size={14} color={COLORS.primary} />
            <ThemedText style={styles.budgetValue}>{campaign.budget}</ThemedText>
          </View>
          <View style={styles.participantsContainer}>
            <IconSymbol name="person.3" size={14} color={COLORS.secondary} />
            <ThemedText style={styles.participantsText}>
              {campaign.participants}/{campaign.maxParticipants}
            </ThemedText>
          </View>
          <View style={styles.deadlineContainer}>
            <IconSymbol name="calendar" size={14} color={COLORS.warning} />
            <ThemedText style={styles.deadlineText}>{campaign.deadline}</ThemedText>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {campaign.status === 'running' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.warning + '20' }]}
            onPress={() => handleCampaignAction(campaign.id, 'pause')}
          >
            <IconSymbol name="pause.circle" size={16} color={COLORS.warning} />
          </TouchableOpacity>
        )}
        {campaign.status === 'paused' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.success + '20' }]}
            onPress={() => handleCampaignAction(campaign.id, 'resume')}
          >
            <IconSymbol name="play.circle" size={16} color={COLORS.success} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.primary + '20' }]}
          onPress={() => handleCampaignAction(campaign.id, 'edit')}
        >
          <IconSymbol name="pencil" size={16} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.secondary + '20' }]}
          onPress={() => navigateToCampaignDetails(campaign)}
        >
          <IconSymbol name="chart.bar" size={16} color={COLORS.secondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, '#00C9B7']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Quản lý Chiến dịch</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Theo dõi và quản lý các chiến dịch marketing
          </ThemedText>
          
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" size={18} color={COLORS.light.subtext} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm chiến dịch..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.light.subtext}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark.circle.fill" size={18} color={COLORS.light.subtext} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Stats Overview */}
      {renderStatsOverview()}

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'Tất cả', count: mockCampaigns.length },
            { key: 'running', label: 'Đang chạy', count: mockCampaigns.filter(c => c.status === 'running').length },
            { key: 'pending', label: 'Chờ duyệt', count: mockCampaigns.filter(c => c.status === 'pending').length },
            { key: 'completed', label: 'Hoàn thành', count: mockCampaigns.filter(c => c.status === 'completed').length },
            { key: 'draft', label: 'Bản nháp', count: mockCampaigns.filter(c => c.status === 'draft').length },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                selectedTab === tab.key && styles.activeTab,
              ]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  selectedTab === tab.key && styles.activeTabText,
                ]}
              >
                {tab.label}
              </ThemedText>
              {tab.count > 0 && (
                <View style={[
                  styles.tabBadge,
                  selectedTab === tab.key && styles.activeTabBadge,
                ]}>
                  <ThemedText style={[
                    styles.tabBadgeText,
                    selectedTab === tab.key && styles.activeTabBadgeText,
                  ]}>
                    {tab.count}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Campaigns List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredCampaigns.length > 0 ? (
          filteredCampaigns.map(renderCampaignCard)
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="briefcase" size={64} color={COLORS.light.subtext} />
            <ThemedText style={styles.emptyTitle}>
              {searchQuery ? 'Không tìm thấy chiến dịch' : 'Chưa có chiến dịch'}
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Thử tìm kiếm với từ khóa khác'
                : 'Hãy tạo chiến dịch đầu tiên để bắt đầu'
              }
            </ThemedText>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/(tabs)/create-campaign')}
              >
                <LinearGradient
                  colors={[COLORS.primary, '#00C9B7']}
                  style={styles.createButtonGradient}
                >
                  <IconSymbol name="plus" size={20} color="white" />
                  <ThemedText style={styles.createButtonText}>Tạo chiến dịch</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/create-campaign')}
      >
        <LinearGradient
          colors={[COLORS.primary, '#00C9B7']}
          style={styles.fabGradient}
        >
          <IconSymbol name="plus" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
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
    backgroundColor: COLORS.light.background,
  },

  // Header Styles
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
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
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Inter',
  },

  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    marginLeft: 8,
    fontFamily: 'Inter',
  },

  // Stats Overview
  statsContainer: {
    margin: 20,
    marginBottom: 0,
  },
  statsGradient: {
    borderRadius: 16,
    padding: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 6,
    fontFamily: 'Inter',
  },
  reachInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reachText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 6,
    fontFamily: 'Inter',
  },

  // Tab Styles
  tabContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.light.background,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.light.text,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
  },
  tabBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  activeTabBadge: {
    backgroundColor: 'white',
  },
  tabBadgeText: {
    fontSize: 12,
    color: 'white',
    fontFamily: 'Inter',
    fontWeight: 'bold',
  },
  activeTabBadgeText: {
    color: COLORS.primary,
  },

  // Content
  content: {
    flex: 1,
    padding: 16,
  },

  // Campaign Card Styles
  campaignCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  urgentCampaignCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  urgentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: 'Inter',
  },

  // Campaign Header
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  campaignIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  campaignMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.light.text,
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  campaignBrand: {
    fontSize: 14,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  campaignCategory: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: 'Inter',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },

  // Analytics Row
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  analyticItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  analyticText: {
    fontSize: 12,
    color: COLORS.light.subtext,
    marginLeft: 4,
    fontFamily: 'Inter',
  },

  // Campaign Stats
  campaignStats: {
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.light.text,
    fontFamily: 'Inter',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: 'Inter',
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.light.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
    fontFamily: 'Inter',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  participantsText: {
    fontSize: 14,
    color: COLORS.secondary,
    marginLeft: 6,
    fontFamily: 'Inter',
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  deadlineText: {
    fontSize: 14,
    color: COLORS.warning,
    marginLeft: 6,
    fontFamily: 'Inter',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.light.text,
    fontFamily: 'Inter',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  createButton: {
    marginTop: 20,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter',
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
