import { AuthGuard } from '@/components/AuthGuard';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { COLORS } from '@/constants/DesignSystem';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: string;
  isOnline: boolean;
  type: 'influencer' | 'company';
  category?: string;
}

function MessagesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'companies' | 'influencers'>('all');

  // Mock conversations data
  const mockConversations: Conversation[] = [
    {
      id: 'conv_001',
      name: 'Nguyễn Văn An',
      lastMessage: 'Cảm ơn bạn đã quan tâm đến chiến dịch!',
      time: '2 phút trước',
      unread: 2,
      avatar: '👨‍🍳',
      isOnline: true,
      type: user?.role === 'SME' ? 'influencer' : 'company',
      category: 'Food & Beverage',
    },
    {
      id: 'conv_002',
      name: 'Beauty Co.',
      lastMessage: 'Chúng tôi đã xem hồ sơ của bạn...',
      time: '1 giờ trước',
      unread: 0,
      avatar: '🏢',
      isOnline: false,
      type: user?.role === 'SME' ? 'influencer' : 'company',
      category: 'Beauty & Skincare',
    },
    {
      id: 'conv_003',
      name: 'Trần Thị Bình',
      lastMessage: 'Khi nào chúng ta có thể bắt đầu?',
      time: '3 giờ trước',
      unread: 1,
      avatar: '👩‍💼',
      isOnline: true,
      type: user?.role === 'SME' ? 'influencer' : 'company',
      category: 'Fashion',
    },
    {
      id: 'conv_004',
      name: 'Tech Innovate',
      lastMessage: 'Hợp đồng đã được gửi qua email',
      time: 'Hôm qua',
      unread: 0,
      avatar: '💻',
      isOnline: false,
      type: user?.role === 'SME' ? 'influencer' : 'company',
      category: 'Technology',
    },
  ];

  // Filter conversations
  const filteredConversations = mockConversations.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' ||
                         (selectedFilter === 'unread' && conv.unread > 0) ||
                         (selectedFilter === 'companies' && conv.type === 'company') ||
                         (selectedFilter === 'influencers' && conv.type === 'influencer');
    
    return matchesSearch && matchesFilter;
  });

  // Navigate to chat
  const navigateToChat = (conversationId: string) => {
    router.push('/screens/chat' as any);
  };

  // Get role-specific title
  const getTitle = () => {
    return user?.role === 'SME' ? 'Tin nhắn với KOC' : 'Tin nhắn với Doanh nghiệp';
  };

  // Get role-specific subtitle
  const getSubtitle = () => {
    return user?.role === 'SME' ? 
      'Quản lý cuộc trò chuyện với các KOC' : 
      'Theo dõi tin nhắn từ các doanh nghiệp';
  };

  // Get filter options
  const getFilterOptions = () => {
    const baseOptions = [
      { key: 'all', label: 'Tất cả', count: mockConversations.length },
      { key: 'unread', label: 'Chưa đọc', count: mockConversations.filter(c => c.unread > 0).length },
    ];

    if (user?.role === 'SME') {
      baseOptions.push({
        key: 'influencers',
        label: 'KOC',
        count: mockConversations.filter(c => c.type === 'influencer').length
      });
    } else {
      baseOptions.push({
        key: 'companies',
        label: 'Doanh nghiệp',
        count: mockConversations.filter(c => c.type === 'company').length
      });
    }

    return baseOptions;
  };

  // Render conversation item
  const renderConversation = (conversation: Conversation) => (
    <TouchableOpacity
      key={conversation.id}
      style={styles.conversationItem}
      onPress={() => navigateToChat(conversation.id)}
    >
      {/* Avatar with online status */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <ThemedText style={styles.avatarEmoji}>{conversation.avatar}</ThemedText>
        </View>
        {conversation.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      {/* Conversation content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <ThemedText style={styles.conversationName} numberOfLines={1}>
            {conversation.name}
          </ThemedText>
          <ThemedText style={styles.conversationTime}>
            {conversation.time}
          </ThemedText>
        </View>

        <View style={styles.conversationFooter}>
          <ThemedText style={styles.lastMessage} numberOfLines={1}>
            {conversation.lastMessage}
          </ThemedText>
          {conversation.unread > 0 && (
            <View style={styles.unreadBadge}>
              <ThemedText style={styles.unreadText}>
                {conversation.unread > 99 ? '99+' : conversation.unread}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Category tag */}
        {conversation.category && (
          <View style={styles.categoryTag}>
            <ThemedText style={styles.categoryText}>
              {conversation.category}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Action indicator */}
      <View style={styles.actionIndicator}>
        <IconSymbol name="chevron.right" size={16} color={COLORS.light.subtext} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={user?.role === 'SME' ? [COLORS.primary, '#00C9B7'] : [COLORS.secondary, '#FFAB91']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>{getTitle()}</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {getSubtitle()}
          </ThemedText>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" size={18} color={COLORS.light.subtext} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm cuộc trò chuyện..."
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

      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {getFilterOptions().map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                selectedFilter === filter.key && styles.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(filter.key as any)}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  selectedFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label}
              </ThemedText>
              {filter.count > 0 && (
                <View style={[
                  styles.filterBadge,
                  selectedFilter === filter.key && styles.filterBadgeActive,
                ]}>
                  <ThemedText style={[
                    styles.filterBadgeText,
                    selectedFilter === filter.key && styles.filterBadgeTextActive,
                  ]}>
                    {filter.count}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Conversations list */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredConversations.length > 0 ? (
          filteredConversations.map(renderConversation)
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="message" size={64} color={COLORS.light.subtext} />
            <ThemedText style={styles.emptyTitle}>
              {searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có tin nhắn'}
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {searchQuery 
                ? 'Thử tìm kiếm với từ khóa khác'
                : user?.role === 'SME' 
                  ? 'Hãy bắt đầu liên hệ với các KOC để tạo chiến dịch thành công'
                  : 'Các tin nhắn từ doanh nghiệp sẽ xuất hiện ở đây'
              }
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Floating action button for SME */}
      {user?.role === 'SME' && (
        <TouchableOpacity style={styles.fab}>
          <LinearGradient
            colors={[COLORS.primary, '#00C9B7']}
            style={styles.fabGradient}
          >
            <IconSymbol name="plus.message" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

export default function MessagesScreen() {
  return (
    <AuthGuard>
      <MessagesContent />
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

  // Filter Styles
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.light.background,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.light.text,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  filterBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  filterBadgeActive: {
    backgroundColor: 'white',
  },
  filterBadgeText: {
    fontSize: 12,
    color: 'white',
    fontFamily: 'Inter',
    fontWeight: 'bold',
  },
  filterBadgeTextActive: {
    color: COLORS.primary,
  },

  // Content Styles
  content: {
    flex: 1,
  },

  // Conversation Styles
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
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
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.light.text,
    fontFamily: 'Inter',
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginLeft: 8,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    color: 'white',
    fontFamily: 'Inter',
    fontWeight: 'bold',
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    color: COLORS.secondary,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  actionIndicator: {
    marginLeft: 8,
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
