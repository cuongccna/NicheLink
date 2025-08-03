import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

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

function ExploreContent() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock data for KOC (Campaigns to explore)
  const mockCampaigns = [
    {
      id: 1,
      title: 'Summer Beauty Collection 2024',
      brand: 'BeautyCare',
      logo: 'https://via.placeholder.com/60x60',
      description: 'Tìm KOC review bộ sưu tập mùa hè với son môi và kem dưỡng',
      reward: '$200',
      type: 'product',
      deadline: '15 ngày',
      participants: 12,
      category: 'beauty',
      status: 'active',
    },
    {
      id: 2,
      title: 'Tech Gadget Unboxing',
      brand: 'TechHub',
      logo: 'https://via.placeholder.com/60x60',
      description: 'Unboxing và review tai nghe không dây mới nhất',
      reward: '$150',
      type: 'video',
      deadline: '10 ngày',
      participants: 8,
      category: 'tech',
      status: 'active',
    },
    {
      id: 3,
      title: 'Food Tasting Challenge',
      brand: 'YummyEats',
      logo: 'https://via.placeholder.com/60x60',
      description: 'Thử và review thực đơn mới tại nhà hàng YummyEats',
      reward: '$100',
      type: 'content',
      deadline: '20 ngày',
      participants: 25,
      category: 'food',
      status: 'trending',
    },
  ];

  // Mock data for SME (KOCs to discover)
  const mockKOCs = [
    {
      id: 1,
      name: 'Minh Beauty',
      avatar: 'https://via.placeholder.com/80x80',
      specialty: 'Beauty & Skincare',
      followers: '125K',
      rating: 4.9,
      campaigns: 45,
      status: 'active',
      category: 'beauty',
      price: '$80-150',
    },
    {
      id: 2,
      name: 'Tech Reviewer Pro',
      avatar: 'https://via.placeholder.com/80x80',
      specialty: 'Technology & Gadgets',
      followers: '89K',
      rating: 4.8,
      campaigns: 32,
      status: 'active',
      category: 'tech',
      price: '$100-200',
    },
    {
      id: 3,
      name: 'Food Explorer',
      avatar: 'https://via.placeholder.com/80x80',
      specialty: 'Food & Restaurant',
      followers: '203K',
      rating: 4.7,
      campaigns: 78,
      status: 'busy',
      category: 'food',
      price: '$120-180',
    },
  ];

  const categories = [
    { id: 'all', label: 'Tất cả', icon: '🔍' },
    { id: 'beauty', label: 'Làm đẹp', icon: '💄' },
    { id: 'tech', label: 'Công nghệ', icon: '📱' },
    { id: 'food', label: 'Ẩm thực', icon: '🍽️' },
    { id: 'fashion', label: 'Thời trang', icon: '👗' },
  ];

  // Render KOC Discover (Campaign discovery)
  const renderKOCExplore = () => (
    <ScrollView style={[styles.container, { backgroundColor: COLORS.light.background }]} showsVerticalScrollIndicator={false}>
      {/* Header with gradient */}
      <LinearGradient
        colors={[COLORS.secondary, '#FFAB91']}
        style={styles.kocHeader}
      >
        <View style={styles.headerContent}>
          <Text style={styles.kocTitle}>✨ Khám phá chiến dịch mới</Text>
          <Text style={styles.kocSubtitle}>Tìm cơ hội hợp tác thú vị</Text>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm chiến dịch, thương hiệu..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.id && styles.categoryLabelActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Campaign Cards */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>🔥 Chiến dịch nổi bật</Text>
        {mockCampaigns.map((campaign) => (
          <TouchableOpacity key={campaign.id} style={styles.campaignCard}>
            <LinearGradient
              colors={[COLORS.primary, '#4DB6AC']}
              style={styles.campaignGradient}
            >
              <View style={styles.campaignHeader}>
                <Image source={{ uri: campaign.logo }} style={styles.brandLogo} />
                <View style={styles.campaignInfo}>
                  <Text style={styles.campaignTitle}>{campaign.title}</Text>
                  <Text style={styles.brandName}>{campaign.brand}</Text>
                </View>
                <View style={[styles.rewardBadge, { backgroundColor: COLORS.success }]}>
                  <Text style={styles.rewardText}>{campaign.reward}</Text>
                </View>
              </View>
              
              <Text style={styles.campaignDescription}>{campaign.description}</Text>
              
              <View style={styles.campaignFooter}>
                <View style={styles.campaignMeta}>
                  <Text style={styles.metaItem}>⏰ {campaign.deadline}</Text>
                  <Text style={styles.metaItem}>👥 {campaign.participants} người</Text>
                </View>
                <TouchableOpacity style={[styles.applyButton, { backgroundColor: COLORS.secondary }]}>
                  <Text style={styles.applyButtonText}>Tham gia</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  // Render SME Discover (KOC discovery)
  const renderSMEExplore = () => (
    <ScrollView style={[styles.container, { backgroundColor: COLORS.light.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.smeHeader, { backgroundColor: COLORS.light.surface }]}>
        <Text style={[styles.smeTitle, { color: COLORS.light.text }]}>🎯 Khám phá KOC</Text>
        <Text style={[styles.smeSubtitle, { color: COLORS.light.subtext }]}>Tìm đối tác phù hợp cho chiến dịch</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm KOC theo tên, lĩnh vực..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: COLORS.primary }]}>
          <Text style={styles.filterText}>⚙️ Lọc</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                selectedCategory === category.id && [styles.smeChipActive, { backgroundColor: COLORS.primary }],
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.id && styles.smeLabelActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* KOC Cards */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>⭐ KOC nổi bật</Text>
        {mockKOCs.map((koc) => (
          <TouchableOpacity key={koc.id} style={styles.kocCard}>
            <View style={styles.kocCardHeader}>
              <Image source={{ uri: koc.avatar }} style={styles.kocAvatar} />
              <View style={styles.kocInfo}>
                <View style={styles.kocNameRow}>
                  <Text style={styles.kocName}>{koc.name}</Text>
                  <View style={[styles.statusDot, { backgroundColor: koc.status === 'active' ? '#4CAF50' : '#FF9800' }]} />
                </View>
                <Text style={styles.kocSpecialty}>{koc.specialty}</Text>
                <Text style={styles.kocPrice}>{koc.price}/campaign</Text>
              </View>
            </View>

            <View style={styles.kocStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{koc.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{koc.rating}⭐</Text>
                <Text style={styles.statLabel}>Đánh giá</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{koc.campaigns}</Text>
                <Text style={styles.statLabel}>Chiến dịch</Text>
              </View>
            </View>

            <View style={styles.kocActions}>
              <TouchableOpacity style={[styles.viewProfileButton, { borderColor: COLORS.primary }]}>
                <Text style={[styles.viewProfileText, { color: COLORS.primary }]}>Xem hồ sơ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.inviteButton, { backgroundColor: COLORS.primary }]}>
                <Text style={styles.inviteText}>Mời hợp tác</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.light.background }]}>
      {user?.role === 'SME' ? renderSMEExplore() : renderKOCExplore()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  // KOC Styles (Creative)
  kocHeader: {
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerContent: {
    padding: 20,
    alignItems: 'center',
  },
  kocTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  kocSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.9,
    fontFamily: 'Inter',
  },

  // SME Styles (Professional)
  smeHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  smeTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  smeSubtitle: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Inter',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    marginTop: -20,
    zIndex: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter',
  },
  filterButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  filterText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
  },

  // Categories
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  smeChipActive: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  categoryLabelActive: {
    color: '#ffffff',
  },
  smeLabelActive: {
    color: '#ffffff',
  },

  // Content
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    fontFamily: 'Inter',
  },

  // Campaign Cards (KOC)
  campaignCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  campaignGradient: {
    padding: 20,
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandLogo: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
  },
  campaignInfo: {
    flex: 1,
  },
  campaignTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Inter',
  },
  brandName: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  rewardBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rewardText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  campaignDescription: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  campaignMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter',
  },
  applyButton: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },

  // KOC Cards (SME)
  kocCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  kocCardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  kocAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  kocInfo: {
    flex: 1,
  },
  kocNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kocName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 8,
    fontFamily: 'Inter',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  kocSpecialty: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  kocPrice: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  kocStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'Inter',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  kocActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewProfileButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  inviteButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  inviteText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
});

export default function ExploreScreen() {
  return (
    <AuthGuard>
      <ExploreContent />
    </AuthGuard>
  );
}
