import { AuthGuard } from '@/components/AuthGuard';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { COLORS } from '@/constants/DesignSystem';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

// Mock data cho KOC profile detail
const mockKOCProfile = {
  id: 1,
  name: "Minh Anh Beauty",
  bio: "Beauty Content Creator | Skincare Enthusiast",
  story: "Tôi là một beauty blogger với đam mê về skincare và makeup. Sau 3 năm hoạt động, tôi đã tích lũy được kinh nghiệm review hơn 500+ sản phẩm beauty từ các thương hiệu trong và ngoài nước. Tôi luôn mang đến những đánh giá chân thực và hữu ích cho cộng đồng.",
  coverImage: "https://via.placeholder.com/400x200",
  avatar: "https://via.placeholder.com/120",
  location: "TP.HCM",
  joinDate: "2021",
  verified: true,
  rating: 4.8,
  totalReviews: 47,
  completedCampaigns: 89,
  responseRate: "98%",
  avgResponseTime: "2 giờ",
  priceRange: "₫2-5M",
  platforms: {
    instagram: {
      followers: "85K",
      engagement: "4.2%",
      avgReach: "25K",
      verified: true
    },
    tiktok: {
      followers: "120K", 
      engagement: "5.8%",
      avgReach: "45K",
      verified: true
    },
    youtube: {
      followers: "45K",
      engagement: "3.1%",
      avgReach: "15K",
      verified: false
    },
    facebook: {
      followers: "35K",
      engagement: "2.8%",
      avgReach: "12K",
      verified: false
    }
  },
  specialties: ["Beauty", "Skincare", "Makeup", "Lifestyle", "Fashion"],
  portfolio: [
    {
      id: 1,
      type: "image",
      title: "Innisfree Green Tea Collection Review",
      thumbnail: "https://via.placeholder.com/150",
      platform: "Instagram",
      engagement: "1.2K likes",
      date: "2 tuần trước"
    },
    {
      id: 2,
      type: "video",
      title: "Morning Skincare Routine for Oily Skin",
      thumbnail: "https://via.placeholder.com/150",
      platform: "TikTok",
      engagement: "45K views",
      date: "1 tháng trước"
    },
    {
      id: 3,
      type: "video",
      title: "Affordable vs Luxury Moisturizers",
      thumbnail: "https://via.placeholder.com/150",
      platform: "YouTube",
      engagement: "8.5K views",
      date: "3 tuần trước"
    }
  ],
  reviews: [
    {
      id: 1,
      rating: 5,
      comment: "Minh Anh rất chuyên nghiệp và tạo content chất lượng. ROI của campaign rất cao!",
      brand: "Beauty Brand X",
      campaign: "Summer Skincare Collection",
      date: "2 tháng trước",
      anonymous: false
    },
    {
      id: 2,
      rating: 5,
      comment: "Content creator đáng tin cậy, delivery đúng thời gian và chất lượng vượt mong đợi.",
      brand: "Skincare Pro",
      campaign: "Anti-aging Serum Launch",
      date: "4 tháng trước",
      anonymous: true
    },
    {
      id: 3,
      rating: 4,
      comment: "Engagement rate rất tốt, audience phù hợp với target của chúng tôi.",
      brand: "K-Beauty Store",
      campaign: "Korean Skincare Routine",
      date: "6 tháng trước",
      anonymous: false
    }
  ],
  achievements: [
    "Top 50 Beauty Influencer VN 2024",
    "Best Skincare Content Creator",
    "100+ Brand Collaborations"
  ]
};

function KOCProfileContent() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedPlatform, setSelectedPlatform] = useState('instagram');

  // Navigation functions
  const navigateToProfileEdit = () => {
    router.push('/profile-edit' as any);
  };

  const navigateToWallet = () => {
    router.push('/koc-wallet' as any);
  };

  const navigateToPortfolioManagement = () => {
    router.push('/portfolio-management' as any);
  };

  const navigateToMyReviews = () => {
    router.push('/my-reviews' as any);
  };

  const navigateToSettings = () => {
    router.push('/settings' as any);
  };

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: 'person.circle' },
    { id: 'portfolio', label: 'Portfolio', icon: 'photo.stack' },
    { id: 'reviews', label: 'Đánh giá', icon: 'star.circle' },
    { id: 'stats', label: 'Thống kê', icon: 'chart.bar.xaxis' }
  ];

  // Render platform stats
  const renderPlatformStats = () => (
    <View style={styles.platformSection}>
      <ThemedText style={styles.sectionTitle}>Thống kê nền tảng</ThemedText>
      
      {/* Platform selector */}
      <View style={styles.platformSelector}>
        {Object.entries(mockKOCProfile.platforms).map(([platform, data]) => (
          <TouchableOpacity
            key={platform}
            style={[
              styles.platformTab,
              selectedPlatform === platform && styles.platformTabSelected
            ]}
            onPress={() => setSelectedPlatform(platform)}
          >
            <IconSymbol 
              name={platform === 'instagram' ? 'camera.fill' : 
                   platform === 'tiktok' ? 'play.fill' :
                   platform === 'youtube' ? 'play.rectangle.fill' : 'globe'}
              size={16} 
              color={selectedPlatform === platform ? 'white' : COLORS.light.subtext} 
            />
            <ThemedText style={[
              styles.platformTabText,
              selectedPlatform === platform && styles.platformTabTextSelected
            ]}>
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </ThemedText>
            {data.verified && (
              <IconSymbol name="checkmark.circle.fill" size={12} color={COLORS.success} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected platform details */}
      <View style={styles.platformDetails}>
        <View style={styles.platformStatsGrid}>
          <View style={styles.platformStat}>
            <ThemedText style={styles.platformStatNumber}>
              {mockKOCProfile.platforms[selectedPlatform as keyof typeof mockKOCProfile.platforms].followers}
            </ThemedText>
            <ThemedText style={styles.platformStatLabel}>Followers</ThemedText>
          </View>
          <View style={styles.platformStat}>
            <ThemedText style={[styles.platformStatNumber, { color: COLORS.success }]}>
              {mockKOCProfile.platforms[selectedPlatform as keyof typeof mockKOCProfile.platforms].engagement}
            </ThemedText>
            <ThemedText style={styles.platformStatLabel}>Engagement</ThemedText>
          </View>
          <View style={styles.platformStat}>
            <ThemedText style={[styles.platformStatNumber, { color: COLORS.info }]}>
              {mockKOCProfile.platforms[selectedPlatform as keyof typeof mockKOCProfile.platforms].avgReach}
            </ThemedText>
            <ThemedText style={styles.platformStatLabel}>Avg Reach</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );

  // Render portfolio
  const renderPortfolio = () => (
    <View style={styles.portfolioSection}>
      <ThemedText style={styles.sectionTitle}>Portfolio & Nội dung mẫu</ThemedText>
      <View style={styles.portfolioGrid}>
        {mockKOCProfile.portfolio.map((item) => (
          <TouchableOpacity key={item.id} style={styles.portfolioItem}>
            <View style={styles.portfolioThumbnail}>
              <IconSymbol 
                name={item.type === 'video' ? 'play.circle.fill' : 'photo.fill'} 
                size={24} 
                color={COLORS.primary} 
              />
              {item.type === 'video' && (
                <View style={styles.playOverlay}>
                  <IconSymbol name="play.fill" size={16} color="white" />
                </View>
              )}
            </View>
            <View style={styles.portfolioInfo}>
              <ThemedText style={styles.portfolioTitle} numberOfLines={2}>
                {item.title}
              </ThemedText>
              <View style={styles.portfolioMeta}>
                <View style={styles.portfolioMetaItem}>
                  <IconSymbol name="calendar" size={12} color={COLORS.light.subtext} />
                  <ThemedText style={styles.portfolioMetaText}>{item.date}</ThemedText>
                </View>
                <View style={styles.portfolioMetaItem}>
                  <IconSymbol name="heart.fill" size={12} color={COLORS.error} />
                  <ThemedText style={styles.portfolioMetaText}>{item.engagement}</ThemedText>
                </View>
              </View>
              <View style={styles.platformBadge}>
                <ThemedText style={styles.platformBadgeText}>{item.platform}</ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render reviews
  const renderReviews = () => (
    <View style={styles.reviewsSection}>
      <View style={styles.reviewsHeader}>
        <ThemedText style={styles.sectionTitle}>Đánh giá từ đối tác</ThemedText>
        <View style={styles.ratingOverview}>
          <IconSymbol name="star.fill" size={16} color={COLORS.warning} />
          <ThemedText style={styles.overallRating}>{mockKOCProfile.rating}</ThemedText>
          <ThemedText style={styles.reviewCount}>({mockKOCProfile.totalReviews} đánh giá)</ThemedText>
        </View>
      </View>
      
      {mockKOCProfile.reviews.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewRating}>
              {[...Array(5)].map((_, index) => (
                <IconSymbol 
                  key={index}
                  name={index < review.rating ? "star.fill" : "star"} 
                  size={14} 
                  color={index < review.rating ? COLORS.warning : COLORS.light.border} 
                />
              ))}
            </View>
            <ThemedText style={styles.reviewDate}>{review.date}</ThemedText>
          </View>
          <ThemedText style={styles.reviewComment}>{review.comment}</ThemedText>
          <View style={styles.reviewFooter}>
            <ThemedText style={styles.reviewBrand}>
              {review.anonymous ? "Đối tác ẩn danh" : review.brand}
            </ThemedText>
            <ThemedText style={styles.reviewCampaign}>• {review.campaign}</ThemedText>
          </View>
        </View>
      ))}
    </View>
  );

  // Render overview tab
  const renderOverview = () => (
    <View style={styles.overviewSection}>
      {/* Story section */}
      <View style={styles.storySection}>
        <ThemedText style={styles.sectionTitle}>Câu chuyện của tôi</ThemedText>
        <ThemedText style={styles.storyText}>{mockKOCProfile.story}</ThemedText>
      </View>

      {/* Specialties */}
      <View style={styles.specialtiesSection}>
        <ThemedText style={styles.sectionTitle}>Chuyên môn</ThemedText>
        <View style={styles.specialtyTags}>
          {mockKOCProfile.specialties.map((specialty, index) => (
            <View key={index} style={styles.specialtyTag}>
              <ThemedText style={styles.specialtyText}>{specialty}</ThemedText>
            </View>
          ))}
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.achievementsSection}>
        <ThemedText style={styles.sectionTitle}>Thành tích</ThemedText>
        {mockKOCProfile.achievements.map((achievement, index) => (
          <View key={index} style={styles.achievementItem}>
            <IconSymbol name="trophy.fill" size={16} color={COLORS.warning} />
            <ThemedText style={styles.achievementText}>{achievement}</ThemedText>
          </View>
        ))}
      </View>

      {/* Quick stats */}
      <View style={styles.quickStatsSection}>
        <ThemedText style={styles.sectionTitle}>Thông tin hợp tác</ThemedText>
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStat}>
            <IconSymbol name="clock.fill" size={20} color={COLORS.info} />
            <ThemedText style={styles.quickStatNumber}>{mockKOCProfile.avgResponseTime}</ThemedText>
            <ThemedText style={styles.quickStatLabel}>Thời gian phản hồi</ThemedText>
          </View>
          <View style={styles.quickStat}>
            <IconSymbol name="checkmark.circle.fill" size={20} color={COLORS.success} />
            <ThemedText style={styles.quickStatNumber}>{mockKOCProfile.responseRate}</ThemedText>
            <ThemedText style={styles.quickStatLabel}>Tỷ lệ phản hồi</ThemedText>
          </View>
          <View style={styles.quickStat}>
            <IconSymbol name="briefcase.fill" size={20} color={COLORS.primary} />
            <ThemedText style={styles.quickStatNumber}>{mockKOCProfile.completedCampaigns}</ThemedText>
            <ThemedText style={styles.quickStatLabel}>Chiến dịch hoàn thành</ThemedText>
          </View>
        </View>
      </View>

      {/* Profile Management Section */}
      <View style={styles.managementSection}>
        <ThemedText style={styles.sectionTitle}>Quản lý hồ sơ</ThemedText>
        
        <TouchableOpacity 
          style={styles.managementItem}
          onPress={navigateToProfileEdit}
        >
          <View style={styles.managementIcon}>
            <IconSymbol name="person.circle.fill" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.managementContent}>
            <ThemedText style={styles.managementTitle}>Chỉnh sửa Hồ sơ</ThemedText>
            <ThemedText style={styles.managementSubtitle}>Cập nhật thông tin cá nhân</ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={16} color={COLORS.light.subtext} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.managementItem}
          onPress={navigateToWallet}
        >
          <View style={styles.managementIcon}>
            <IconSymbol name="creditcard.fill" size={20} color={COLORS.success} />
          </View>
          <View style={styles.managementContent}>
            <ThemedText style={styles.managementTitle}>Ví tiền / Thu nhập</ThemedText>
            <ThemedText style={styles.managementSubtitle}>Quản lý thanh toán và thu nhập</ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={16} color={COLORS.light.subtext} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.managementItem}
          onPress={navigateToPortfolioManagement}
        >
          <View style={styles.managementIcon}>
            <IconSymbol name="photo.stack.fill" size={20} color={COLORS.secondary} />
          </View>
          <View style={styles.managementContent}>
            <ThemedText style={styles.managementTitle}>Quản lý Portfolio</ThemedText>
            <ThemedText style={styles.managementSubtitle}>Thêm/sửa/xóa dự án mẫu</ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={16} color={COLORS.light.subtext} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.managementItem}
          onPress={navigateToMyReviews}
        >
          <View style={styles.managementIcon}>
            <IconSymbol name="star.fill" size={20} color={COLORS.warning} />
          </View>
          <View style={styles.managementContent}>
            <ThemedText style={styles.managementTitle}>Đánh giá của tôi</ThemedText>
            <ThemedText style={styles.managementSubtitle}>Xem đánh giá từ SME</ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={16} color={COLORS.light.subtext} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.managementItem}
          onPress={navigateToSettings}
        >
          <View style={styles.managementIcon}>
            <IconSymbol name="gearshape.fill" size={20} color={COLORS.info} />
          </View>
          <View style={styles.managementContent}>
            <ThemedText style={styles.managementTitle}>Cài đặt</ThemedText>
            <ThemedText style={styles.managementSubtitle}>Cài đặt ứng dụng</ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={16} color={COLORS.light.subtext} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Cover & Avatar Section */}
      <View style={styles.headerSection}>
        {/* Cover Image */}
        <View style={styles.coverImageContainer}>
          <LinearGradient
            colors={[COLORS.primary, '#4DB6AC']}
            style={styles.coverGradient}
          >
            <TouchableOpacity style={styles.backButton}>
              <IconSymbol name="chevron.left" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <IconSymbol name="square.and.arrow.up" size={20} color="white" />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <IconSymbol name="person.fill" size={40} color={COLORS.primary} />
              {mockKOCProfile.verified && (
                <View style={styles.verifiedBadge}>
                  <IconSymbol name="checkmark.circle.fill" size={24} color={COLORS.success} />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={styles.profileName}>{mockKOCProfile.name}</ThemedText>
              <ThemedText style={styles.profileBio}>{mockKOCProfile.bio}</ThemedText>
              <View style={styles.profileMeta}>
                <View style={styles.metaItem}>
                  <IconSymbol name="location.fill" size={14} color={COLORS.light.subtext} />
                  <ThemedText style={styles.metaText}>{mockKOCProfile.location}</ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <IconSymbol name="calendar" size={14} color={COLORS.light.subtext} />
                  <ThemedText style={styles.metaText}>Tham gia từ {mockKOCProfile.joinDate}</ThemedText>
                </View>
              </View>
            </View>
            <View style={styles.priceSection}>
              <ThemedText style={styles.priceRange}>{mockKOCProfile.priceRange}</ThemedText>
              <ThemedText style={styles.priceLabel}>Giá dự kiến</ThemedText>
            </View>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.messageBtn}>
              <IconSymbol name="message.fill" size={18} color={COLORS.primary} />
              <ThemedText style={styles.messageBtnText}>Nhắn tin</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.collaborateBtn}>
              <LinearGradient
                colors={[COLORS.primary, '#4DB6AC']}
                style={styles.collaborateBtnGradient}
              >
                <IconSymbol name="paperplane.fill" size={18} color="white" />
                <ThemedText style={styles.collaborateBtnText}>Mời Hợp tác</ThemedText>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabItem,
                selectedTab === tab.id && styles.tabItemSelected
              ]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <IconSymbol 
                name={tab.icon as any} 
                size={16} 
                color={selectedTab === tab.id ? COLORS.primary : COLORS.light.subtext} 
              />
              <ThemedText style={[
                styles.tabText,
                selectedTab === tab.id && styles.tabTextSelected
              ]}>
                {tab.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content based on selected tab */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'portfolio' && renderPortfolio()}
        {selectedTab === 'reviews' && renderReviews()}
        {selectedTab === 'stats' && renderPlatformStats()}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function KOCProfileScreen() {
  return (
    <AuthGuard>
      <KOCProfileContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },

  // Header Section
  headerSection: {
    backgroundColor: 'white',
  },
  coverImageContainer: {
    height: 200,
    position: 'relative',
  },
  coverGradient: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexDirection: 'row',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Profile Section
  profileSection: {
    padding: 20,
    marginTop: -30,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 2,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
    marginTop: 8,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.light.text,
    fontFamily: 'Inter',
  },
  profileBio: {
    fontSize: 16,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginTop: 4,
  },
  profileMeta: {
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginLeft: 6,
  },
  priceSection: {
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 8,
  },
  priceRange: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
    fontFamily: 'Inter',
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.success,
    fontFamily: 'Inter',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'white',
  },
  messageBtnText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'Inter',
    marginLeft: 8,
  },
  collaborateBtn: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  collaborateBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  collaborateBtnText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Inter',
    marginLeft: 8,
  },

  // Tab Navigation
  tabNavigation: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemSelected: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.light.subtext,
    fontWeight: '500',
    fontFamily: 'Inter',
    marginLeft: 6,
  },
  tabTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Common Section Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.light.text,
    fontFamily: 'Inter',
    marginBottom: 16,
  },

  // Overview Section
  overviewSection: {
    padding: 20,
  },
  storySection: {
    marginBottom: 32,
  },
  storyText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.light.text,
    fontFamily: 'Inter',
  },
  specialtiesSection: {
    marginBottom: 32,
  },
  specialtyTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.secondary + '15',
    borderRadius: 20,
  },
  specialtyText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  achievementsSection: {
    marginBottom: 32,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  achievementText: {
    fontSize: 15,
    color: COLORS.light.text,
    fontFamily: 'Inter',
    marginLeft: 12,
  },
  quickStatsSection: {
    marginBottom: 20,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: 'Inter',
    marginTop: 8,
  },
  quickStatLabel: {
    fontSize: 12,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginTop: 4,
    textAlign: 'center',
  },

  // Platform Stats
  platformSection: {
    padding: 20,
  },
  platformSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  platformTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  platformTabSelected: {
    backgroundColor: COLORS.primary,
  },
  platformTabText: {
    fontSize: 12,
    color: COLORS.light.subtext,
    fontWeight: '500',
    fontFamily: 'Inter',
    marginLeft: 4,
    marginRight: 4,
  },
  platformTabTextSelected: {
    color: 'white',
  },
  platformDetails: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  platformStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  platformStat: {
    alignItems: 'center',
  },
  platformStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    fontFamily: 'Inter',
  },
  platformStatLabel: {
    fontSize: 12,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginTop: 4,
  },

  // Portfolio Section
  portfolioSection: {
    padding: 20,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  portfolioItem: {
    width: (width - 52) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  portfolioThumbnail: {
    height: 120,
    backgroundColor: COLORS.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  playOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioInfo: {
    padding: 12,
  },
  portfolioTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.light.text,
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  portfolioMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  portfolioMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolioMetaText: {
    fontSize: 11,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginLeft: 4,
  },
  platformBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
  },
  platformBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
    fontFamily: 'Inter',
  },

  // Reviews Section
  reviewsSection: {
    padding: 20,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingOverview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallRating: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.warning,
    fontFamily: 'Inter',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginLeft: 4,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.light.text,
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewBrand: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: 'Inter',
  },
  reviewCampaign: {
    fontSize: 13,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginLeft: 4,
  },

  // Management Section
  managementSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  managementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.light.border,
  },
  managementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  managementContent: {
    flex: 1,
  },
  managementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.light.text,
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  managementSubtitle: {
    fontSize: 14,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
  },
});
