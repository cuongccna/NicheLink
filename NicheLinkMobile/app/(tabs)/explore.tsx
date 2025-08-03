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
    FlatList,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

// KOC Types
interface KOCProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: number;
  engagementRate: number;
  category: string;
  location: string;
  bio: string;
  portfolioImages: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  priceRange: string;
  isVerified: boolean;
  isOnline: boolean;
  lastActive: string;
  specialties: string[];
  completedCampaigns: number;
  responseTime: string;
  languages: string[];
  demographics: {
    ageGroups: { range: string; percentage: number }[];
    genderSplit: { male: number; female: number; other: number };
    topLocations: string[];
  };
  recentWork: {
    campaignName: string;
    brand: string;
    imageUrl: string;
    engagement: number;
    date: string;
  }[];
}

interface FilterOptions {
  category: string[];
  location: string[];
  followers: { min: number; max: number };
  engagementRate: { min: number; max: number };
  priceRange: string[];
  isVerified: boolean | null;
  rating: number;
  sortBy: 'followers' | 'engagement' | 'rating' | 'price' | 'recent';
}

// Mock KOC data
const mockKOCs: KOCProfile[] = [
  {
    id: 'koc_001',
    name: 'Nguyễn Food Blogger',
    username: '@foodie_vietnam',
    avatar: '👨‍🍳',
    followers: 45200,
    engagementRate: 8.5,
    category: 'Food & Beverage',
    location: 'Hồ Chí Minh',
    bio: 'Food lover & restaurant reviewer. Chuyên đánh giá các món ăn ngon và địa điểm ăn uống.',
    portfolioImages: ['🍜', '🍲', '🥘', '🍛'],
    tags: ['Vietnamese Food', 'Restaurant Review', 'Cooking Tips', 'Street Food'],
    rating: 4.8,
    reviewCount: 127,
    priceRange: '300K - 800K',
    isVerified: true,
    isOnline: true,
    lastActive: 'Đang hoạt động',
    specialties: ['Food Photography', 'Video Review', 'Recipe Content'],
    completedCampaigns: 45,
    responseTime: '< 2 giờ',
    languages: ['Tiếng Việt', 'English'],
    demographics: {
      ageGroups: [
        { range: '18-24', percentage: 35 },
        { range: '25-34', percentage: 45 },
        { range: '35-44', percentage: 20 }
      ],
      genderSplit: { male: 40, female: 58, other: 2 },
      topLocations: ['TP.HCM', 'Hà Nội', 'Đà Nẵng']
    },
    recentWork: [
      {
        campaignName: 'Ra mắt cà phê PhinĐen',
        brand: 'PhinĐen Coffee',
        imageUrl: '☕',
        engagement: 12500,
        date: '2025-08-01'
      }
    ]
  },
  {
    id: 'koc_002',
    name: 'Beauty Guru Mai',
    username: '@beauty_mai',
    avatar: '💄',
    followers: 78900,
    engagementRate: 12.3,
    category: 'Beauty & Skincare',
    location: 'Hà Nội',
    bio: 'Beauty enthusiast | Skincare expert | Makeup artist. Sharing daily beauty tips và review sản phẩm.',
    portfolioImages: ['💋', '✨', '🌟', '💅'],
    tags: ['Skincare', 'Makeup Tutorial', 'Product Review', 'K-Beauty'],
    rating: 4.9,
    reviewCount: 203,
    priceRange: '500K - 1.2M',
    isVerified: true,
    isOnline: false,
    lastActive: '1 giờ trước',
    specialties: ['Makeup Tutorial', 'Skincare Routine', 'Live Streaming'],
    completedCampaigns: 67,
    responseTime: '< 1 giờ',
    languages: ['Tiếng Việt', 'English', '한국어'],
    demographics: {
      ageGroups: [
        { range: '16-24', percentage: 55 },
        { range: '25-34', percentage: 35 },
        { range: '35-44', percentage: 10 }
      ],
      genderSplit: { male: 15, female: 83, other: 2 },
      topLocations: ['Hà Nội', 'TP.HCM', 'Hải Phòng']
    },
    recentWork: [
      {
        campaignName: 'K-Beauty Skincare Routine',
        brand: 'Beauty Korea',
        imageUrl: '🧴',
        engagement: 18200,
        date: '2025-07-28'
      }
    ]
  },
  {
    id: 'koc_003',
    name: 'Tech Reviewer Alex',
    username: '@tech_alex',
    avatar: '📱',
    followers: 32100,
    engagementRate: 6.8,
    category: 'Technology',
    location: 'Đà Nẵng',
    bio: 'Tech enthusiast | Gadget reviewer | Software engineer. Đánh giá chi tiết các sản phẩm công nghệ.',
    portfolioImages: ['💻', '⌚', '🎧', '📷'],
    tags: ['Smartphone Review', 'Laptop Review', 'Tech Tips', 'Unboxing'],
    rating: 4.7,
    reviewCount: 89,
    priceRange: '400K - 900K',
    isVerified: true,
    isOnline: true,
    lastActive: 'Đang hoạt động',
    specialties: ['Product Review', 'Tech Tutorial', 'Comparison Videos'],
    completedCampaigns: 34,
    responseTime: '< 3 giờ',
    languages: ['Tiếng Việt', 'English'],
    demographics: {
      ageGroups: [
        { range: '18-24', percentage: 40 },
        { range: '25-34', percentage: 45 },
        { range: '35-44', percentage: 15 }
      ],
      genderSplit: { male: 70, female: 28, other: 2 },
      topLocations: ['Đà Nẵng', 'TP.HCM', 'Hà Nội']
    },
    recentWork: [
      {
        campaignName: 'Smartphone XYZ Pro Review',
        brand: 'TechViet',
        imageUrl: '📱',
        engagement: 8900,
        date: '2025-07-20'
      }
    ]
  },
  {
    id: 'koc_004',
    name: 'Fashion Style Linh',
    username: '@style_linh',
    avatar: '👗',
    followers: 56300,
    engagementRate: 9.2,
    category: 'Fashion',
    location: 'Hồ Chí Minh',
    bio: 'Fashion stylist | Outfit inspiration | Style blogger. Daily fashion tips và outfit coordination.',
    portfolioImages: ['👜', '👠', '👕', '💍'],
    tags: ['Fashion Styling', 'Outfit Ideas', 'Street Style', 'Lookbook'],
    rating: 4.6,
    reviewCount: 156,
    priceRange: '600K - 1.5M',
    isVerified: false,
    isOnline: false,
    lastActive: '3 giờ trước',
    specialties: ['Fashion Photography', 'Style Consulting', 'Trend Analysis'],
    completedCampaigns: 28,
    responseTime: '< 4 giờ',
    languages: ['Tiếng Việt', 'English'],
    demographics: {
      ageGroups: [
        { range: '18-24', percentage: 50 },
        { range: '25-34', percentage: 40 },
        { range: '35-44', percentage: 10 }
      ],
      genderSplit: { male: 20, female: 78, other: 2 },
      topLocations: ['TP.HCM', 'Hà Nội', 'Cần Thơ']
    },
    recentWork: [
      {
        campaignName: 'Summer Fashion Collection',
        brand: 'Fashion Forward',
        imageUrl: '👗',
        engagement: 15600,
        date: '2025-07-15'
      }
    ]
  },
  {
    id: 'koc_005',
    name: 'Fitness Coach Nam',
    username: '@fit_coach_nam',
    avatar: '💪',
    followers: 28700,
    engagementRate: 11.5,
    category: 'Health & Fitness',
    location: 'Hà Nội',
    bio: 'Personal trainer | Nutrition coach | Fitness motivator. Chia sẻ workout routines và healthy lifestyle.',
    portfolioImages: ['🏋️', '🥗', '🏃', '🧘'],
    tags: ['Workout Plans', 'Nutrition Tips', 'Fitness Motivation', 'Healthy Lifestyle'],
    rating: 4.8,
    reviewCount: 94,
    priceRange: '350K - 750K',
    isVerified: true,
    isOnline: true,
    lastActive: 'Đang hoạt động',
    specialties: ['Workout Videos', 'Nutrition Content', 'Fitness Challenges'],
    completedCampaigns: 22,
    responseTime: '< 2 giờ',
    languages: ['Tiếng Việt', 'English'],
    demographics: {
      ageGroups: [
        { range: '18-24', percentage: 30 },
        { range: '25-34', percentage: 50 },
        { range: '35-44', percentage: 20 }
      ],
      genderSplit: { male: 55, female: 43, other: 2 },
      topLocations: ['Hà Nội', 'TP.HCM', 'Đà Nẵng']
    },
    recentWork: [
      {
        campaignName: 'Summer Body Challenge',
        brand: 'FitLife Supplements',
        imageUrl: '🏋️',
        engagement: 9800,
        date: '2025-07-10'
      }
    ]
  },
  {
    id: 'koc_006',
    name: 'Travel Blogger Hương',
    username: '@travel_huong',
    avatar: '🌍',
    followers: 64200,
    engagementRate: 7.9,
    category: 'Travel & Lifestyle',
    location: 'Hồ Chí Minh',
    bio: 'Travel enthusiast | Adventure seeker | Culture explorer. Khám phá những điểm đến tuyệt vời.',
    portfolioImages: ['🏖️', '🏔️', '🏛️', '🍃'],
    tags: ['Travel Guide', 'Adventure', 'Culture', 'Photography'],
    rating: 4.7,
    reviewCount: 178,
    priceRange: '800K - 2M',
    isVerified: true,
    isOnline: false,
    lastActive: '2 giờ trước',
    specialties: ['Travel Photography', 'Cultural Content', 'Adventure Videos'],
    completedCampaigns: 41,
    responseTime: '< 6 giờ',
    languages: ['Tiếng Việt', 'English', 'Français'],
    demographics: {
      ageGroups: [
        { range: '18-24', percentage: 25 },
        { range: '25-34', percentage: 45 },
        { range: '35-44', percentage: 30 }
      ],
      genderSplit: { male: 35, female: 63, other: 2 },
      topLocations: ['TP.HCM', 'Hà Nội', 'Đà Lạt']
    },
    recentWork: [
      {
        campaignName: 'Discover Vietnam',
        brand: 'Vietnam Tourism',
        imageUrl: '🏞️',
        engagement: 22100,
        date: '2025-07-25'
      }
    ]
  }
];

function ExploreContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'followers' | 'engagement' | 'rating' | 'price'>('followers');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    category: [],
    location: [],
    followers: { min: 0, max: 100000 },
    engagementRate: { min: 0, max: 20 },
    priceRange: [],
    isVerified: null,
    rating: 0,
    sortBy: 'followers'
  });

  // Categories for filtering
  const categories = [
    { key: 'all', label: 'Tất cả', count: mockKOCs.length },
    { key: 'Food & Beverage', label: 'Ẩm thực', count: mockKOCs.filter(k => k.category === 'Food & Beverage').length },
    { key: 'Beauty & Skincare', label: 'Làm đẹp', count: mockKOCs.filter(k => k.category === 'Beauty & Skincare').length },
    { key: 'Technology', label: 'Công nghệ', count: mockKOCs.filter(k => k.category === 'Technology').length },
    { key: 'Fashion', label: 'Thời trang', count: mockKOCs.filter(k => k.category === 'Fashion').length },
    { key: 'Health & Fitness', label: 'Sức khỏe', count: mockKOCs.filter(k => k.category === 'Health & Fitness').length },
    { key: 'Travel & Lifestyle', label: 'Du lịch', count: mockKOCs.filter(k => k.category === 'Travel & Lifestyle').length },
  ];

  // Filter and sort KOCs
  const filteredKOCs = mockKOCs.filter(koc => {
    const matchesSearch = koc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         koc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         koc.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         koc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || koc.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'followers':
        return b.followers - a.followers;
      case 'engagement':
        return b.engagementRate - a.engagementRate;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  // Refresh data
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Navigate to KOC profile
  const navigateToKOCProfile = (koc: KOCProfile) => {
    // TODO: Navigate to detailed KOC profile
    Alert.alert(
      `${koc.name}`,
      `Followers: ${(koc.followers / 1000).toFixed(1)}K\nEngagement: ${koc.engagementRate}%\nRating: ${koc.rating}/5⭐`,
      [
        { text: 'Xem hồ sơ', onPress: () => console.log(`View profile: ${koc.id}`) },
        { text: 'Gửi lời mời', onPress: () => handleInviteKOC(koc) },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  // Handle KOC invitation
  const handleInviteKOC = (koc: KOCProfile) => {
    Alert.alert(
      'Gửi lời mời hợp tác',
      `Bạn muốn gửi lời mời hợp tác đến ${koc.name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Gửi lời mời', 
          onPress: () => {
            // TODO: Navigate to invitation flow
            Alert.alert('Thành công', 'Lời mời đã được gửi!');
          }
        }
      ]
    );
  };

  // Format followers count
  const formatFollowers = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Render KOC card
  const renderKOCCard = ({ item: koc }: { item: KOCProfile }) => (
    <TouchableOpacity
      style={[
        styles.kocCard,
        viewMode === 'list' && styles.kocCardList
      ]}
      onPress={() => navigateToKOCProfile(koc)}
    >
      {/* KOC Header */}
      <View style={styles.kocHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <ThemedText style={styles.avatarEmoji}>{koc.avatar}</ThemedText>
          </View>
          {koc.isOnline && <View style={styles.onlineIndicator} />}
          {koc.isVerified && (
            <View style={styles.verifiedBadge}>
              <IconSymbol name="checkmark.seal.fill" size={16} color={COLORS.primary} />
            </View>
          )}
        </View>

        <View style={styles.kocMainInfo}>
          <ThemedText style={styles.kocName} numberOfLines={1}>
            {koc.name}
          </ThemedText>
          <ThemedText style={styles.kocUsername}>{koc.username}</ThemedText>
          <ThemedText style={styles.kocLocation}>{koc.location}</ThemedText>
        </View>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => {
            // TODO: Add to favorites
            Alert.alert('Đã thêm vào danh sách yêu thích');
          }}
        >
          <IconSymbol name="heart" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <IconSymbol name="person.2" size={14} color={COLORS.primary} />
          <ThemedText style={styles.statText}>{formatFollowers(koc.followers)}</ThemedText>
        </View>
        <View style={styles.statItem}>
          <IconSymbol name="heart.fill" size={14} color={COLORS.error} />
          <ThemedText style={styles.statText}>{koc.engagementRate}%</ThemedText>
        </View>
        <View style={styles.statItem}>
          <IconSymbol name="star.fill" size={14} color={COLORS.warning} />
          <ThemedText style={styles.statText}>{koc.rating}</ThemedText>
        </View>
        <View style={styles.statItem}>
          <IconSymbol name="banknote" size={14} color={COLORS.success} />
          <ThemedText style={styles.statText}>{koc.priceRange}</ThemedText>
        </View>
      </View>

      {/* Bio */}
      <ThemedText style={styles.kocBio} numberOfLines={2}>
        {koc.bio}
      </ThemedText>

      {/* Portfolio Preview */}
      <View style={styles.portfolioPreview}>
        {koc.portfolioImages.slice(0, 4).map((image, index) => (
          <View key={index} style={styles.portfolioItem}>
            <ThemedText style={styles.portfolioEmoji}>{image}</ThemedText>
          </View>
        ))}
      </View>

      {/* Tags */}
      <View style={styles.tagsContainer}>
        {koc.tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <ThemedText style={styles.tagText}>{tag}</ThemedText>
          </View>
        ))}
        {koc.tags.length > 3 && (
          <View style={styles.tag}>
            <ThemedText style={styles.tagText}>+{koc.tags.length - 3}</ThemedText>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewProfileButton]}
          onPress={() => navigateToKOCProfile(koc)}
        >
          <IconSymbol name="person.circle" size={16} color="white" />
          <ThemedText style={styles.actionButtonText}>Xem hồ sơ</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.inviteButton]}
          onPress={() => handleInviteKOC(koc)}
        >
          <IconSymbol name="plus.message" size={16} color={COLORS.primary} />
          <ThemedText style={[styles.actionButtonText, { color: COLORS.primary }]}>Mời hợp tác</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Response Time Badge */}
      <View style={styles.responseTimeBadge}>
        <IconSymbol name="clock" size={12} color={COLORS.success} />
        <ThemedText style={styles.responseTimeText}>{koc.responseTime}</ThemedText>
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
          <ThemedText style={styles.headerTitle}>Khám phá KOC</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Tìm kiếm và kết nối với các KOC phù hợp
          </ThemedText>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" size={18} color={COLORS.light.subtext} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm KOC theo tên, username, hoặc tag..."
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

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <ThemedText style={styles.quickStatNumber}>{mockKOCs.length}</ThemedText>
              <ThemedText style={styles.quickStatLabel}>KOC available</ThemedText>
            </View>
            <View style={styles.quickStatItem}>
              <ThemedText style={styles.quickStatNumber}>
                {categories.filter(c => c.key !== 'all').length}
              </ThemedText>
              <ThemedText style={styles.quickStatLabel}>Categories</ThemedText>
            </View>
            <View style={styles.quickStatItem}>
              <ThemedText style={styles.quickStatNumber}>
                {mockKOCs.filter(k => k.isOnline).length}
              </ThemedText>
              <ThemedText style={styles.quickStatLabel}>Online now</ThemedText>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Filters and Controls */}
      <View style={styles.controlsContainer}>
        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryTab,
                selectedCategory === category.key && styles.categoryTabActive,
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <ThemedText
                style={[
                  styles.categoryText,
                  selectedCategory === category.key && styles.categoryTextActive,
                ]}
              >
                {category.label}
              </ThemedText>
              {category.count > 0 && (
                <View style={[
                  styles.categoryBadge,
                  selectedCategory === category.key && styles.categoryBadgeActive,
                ]}>
                  <ThemedText style={[
                    styles.categoryBadgeText,
                    selectedCategory === category.key && styles.categoryBadgeTextActive,
                  ]}>
                    {category.count}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort and View Controls */}
        <View style={styles.sortContainer}>
          <View style={styles.sortButtons}>
            {[
              { key: 'followers', label: 'Followers', icon: 'person.2' },
              { key: 'engagement', label: 'Engagement', icon: 'heart.fill' },
              { key: 'rating', label: 'Rating', icon: 'star.fill' },
            ].map((sort) => (
              <TouchableOpacity
                key={sort.key}
                style={[
                  styles.sortButton,
                  sortBy === sort.key && styles.sortButtonActive
                ]}
                onPress={() => setSortBy(sort.key as any)}
              >
                <IconSymbol 
                  name={sort.icon as any} 
                  size={14} 
                  color={sortBy === sort.key ? 'white' : COLORS.light.subtext} 
                />
                <ThemedText style={[
                  styles.sortButtonText,
                  sortBy === sort.key && styles.sortButtonTextActive
                ]}>
                  {sort.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.viewControls}>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
              onPress={() => setViewMode('grid')}
            >
              <IconSymbol name="grid" size={16} color={viewMode === 'grid' ? COLORS.primary : COLORS.light.subtext} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <IconSymbol name="list.bullet" size={16} color={viewMode === 'list' ? COLORS.primary : COLORS.light.subtext} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <ThemedText style={styles.resultsText}>
          {filteredKOCs.length} KOC được tìm thấy
        </ThemedText>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <IconSymbol name="slider.horizontal.3" size={16} color={COLORS.primary} />
          <ThemedText style={styles.filterButtonText}>Bộ lọc</ThemedText>
        </TouchableOpacity>
      </View>

      {/* KOC List */}
      <FlatList
        data={filteredKOCs}
        renderItem={renderKOCCard}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={styles.kocList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {/* Advanced Filter Button */}
      <TouchableOpacity style={styles.advancedFilterFab}>
        <LinearGradient
          colors={[COLORS.secondary, '#FFAB91']}
          style={styles.fabGradient}
        >
          <IconSymbol name="slider.horizontal.below.rectangle" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

export default function ExploreScreen() {
  return (
    <AuthGuard>
      <ExploreContent />
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

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    width: '100%',
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter',
  },
  quickStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontFamily: 'Inter',
  },

  // Controls Container
  controlsContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },

  // Category Filter
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: COLORS.light.background,
  },
  categoryTabActive: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.light.text,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: 'white',
  },
  categoryBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  categoryBadgeActive: {
    backgroundColor: 'white',
  },
  categoryBadgeText: {
    fontSize: 12,
    color: 'white',
    fontFamily: 'Inter',
    fontWeight: 'bold',
  },
  categoryBadgeTextActive: {
    color: COLORS.primary,
  },

  // Sort and View Controls
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.light.background,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: 12,
    color: COLORS.light.subtext,
    marginLeft: 4,
    fontFamily: 'Inter',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  viewControls: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.light.background,
  },
  viewButtonActive: {
    backgroundColor: COLORS.primary + '20',
  },

  // Results Header
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  resultsText: {
    fontSize: 14,
    color: COLORS.light.text,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '20',
  },
  filterButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontFamily: 'Inter',
    fontWeight: '500',
  },

  // KOC List
  kocList: {
    padding: 16,
    paddingBottom: 100, // Account for FAB
  },

  // KOC Card
  kocCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
    position: 'relative',
  },
  kocCardList: {
    marginHorizontal: 0,
    marginBottom: 12,
  },

  // KOC Header
  kocHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: 'white',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
  },
  kocMainInfo: {
    flex: 1,
  },
  kocName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.light.text,
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  kocUsername: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  kocLocation: {
    fontSize: 11,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
  },
  favoriteButton: {
    padding: 8,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  statText: {
    fontSize: 11,
    color: COLORS.light.text,
    marginLeft: 4,
    fontFamily: 'Inter',
    fontWeight: '500',
  },

  // Bio
  kocBio: {
    fontSize: 12,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    lineHeight: 16,
    marginBottom: 12,
  },

  // Portfolio Preview
  portfolioPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  portfolioItem: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioEmoji: {
    fontSize: 18,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  tag: {
    backgroundColor: COLORS.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.secondary,
    fontFamily: 'Inter',
    fontWeight: '500',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    flex: 1,
  },
  viewProfileButton: {
    backgroundColor: COLORS.primary,
  },
  inviteButton: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Inter',
    color: 'white',
  },

  // Response Time Badge
  responseTimeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  responseTimeText: {
    fontSize: 9,
    color: COLORS.success,
    marginLeft: 3,
    fontFamily: 'Inter',
    fontWeight: '500',
  },

  // Advanced Filter FAB
  advancedFilterFab: {
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
