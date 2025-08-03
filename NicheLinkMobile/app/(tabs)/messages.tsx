import { AuthGuard } from '@/components/AuthGuard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';

function MessagesContent() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');

  const mockConversations = [
    {
      id: 1,
      name: 'Nguyễn Văn An',
      lastMessage: 'Cảm ơn bạn đã quan tâm đến chiến dịch!',
      time: '2 phút trước',
      unread: 2,
      avatar: '👨‍🍳',
      isOnline: true,
      type: user?.role === 'SME' ? 'influencer' : 'company',
    },
    {
      id: 2,
      name: 'Beauty Co.',
      lastMessage: 'Chúng tôi đã xem hồ sơ của bạn...',
      time: '1 giờ trước',
      unread: 0,
      avatar: '🏢',
      isOnline: false,
      type: user?.role === 'SME' ? 'influencer' : 'company',
    },
    {
      id: 3,
      name: 'Trần Thị Bình',
      lastMessage: 'Khi nào chúng ta có thể bắt đầu?',
      time: '3 giờ trước',
      unread: 1,
      avatar: '👩‍💼',
      isOnline: true,
      type: user?.role === 'SME' ? 'influencer' : 'company',
    },
    {
      id: 4,
      name: 'Tech Innovate',
      lastMessage: 'Hợp đồng đã được gửi qua email',
      time: 'Hôm qua',
      unread: 0,
      avatar: '💻',
      isOnline: false,
      type: user?.role === 'SME' ? 'influencer' : 'company',
    },
  ];

  const filteredConversations = mockConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Tin nhắn</ThemedText>
        
        {/* Search Bar */}
        <ThemedView style={[styles.searchContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <IconSymbol name="magnifyingglass" size={20} color={Colors[colorScheme ?? 'light'].icon} />
          <TextInput
            style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
            placeholder="Tìm kiếm cuộc trò chuyện..."
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </ThemedView>
      </ThemedView>

      <ScrollView style={styles.conversationsList}>
        {filteredConversations.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="message" size={64} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            <ThemedText style={styles.emptyText}>
              {searchQuery ? 'Không tìm thấy cuộc trò chuyện nào' : 'Chưa có tin nhắn nào'}
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Bắt đầu trò chuyện với các đối tác của bạn'}
            </ThemedText>
          </ThemedView>
        ) : (
          filteredConversations.map((conversation) => (
            <TouchableOpacity 
              key={conversation.id} 
              style={[styles.conversationItem, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
            >
              <ThemedView style={styles.avatarContainer}>
                <ThemedText style={styles.avatar}>{conversation.avatar}</ThemedText>
                {conversation.isOnline && <ThemedView style={styles.onlineIndicator} />}
              </ThemedView>
              
              <ThemedView style={styles.conversationContent}>
                <ThemedView style={styles.conversationHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.conversationName}>
                    {conversation.name}
                  </ThemedText>
                  <ThemedText style={styles.conversationTime}>
                    {conversation.time}
                  </ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.conversationFooter}>
                  <ThemedText 
                    style={[
                      styles.lastMessage, 
                      conversation.unread > 0 && styles.unreadMessage
                    ]} 
                    numberOfLines={1}
                  >
                    {conversation.lastMessage}
                  </ThemedText>
                  
                  {conversation.unread > 0 && (
                    <ThemedView style={[styles.unreadBadge, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
                      <ThemedText style={styles.unreadCount}>
                        {conversation.unread}
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
              </ThemedView>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
      >
        <IconSymbol name="plus" size={24} color="white" />
      </TouchableOpacity>
    </ThemedView>
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
    paddingTop: 60,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  conversationsList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    fontSize: 40,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
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
    flex: 1,
  },
  conversationTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    opacity: 0.7,
    marginRight: 8,
  },
  unreadMessage: {
    fontWeight: '600',
    opacity: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
