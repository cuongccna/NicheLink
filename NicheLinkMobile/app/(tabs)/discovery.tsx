import { AuthGuard } from '@/components/AuthGuard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';

function DiscoveryContent() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const [searchQuery, setSearchQuery] = useState('');

  const mockInfluencers = [
    {
      id: 1,
      name: 'Nguyễn Văn An',
      category: 'Food & Lifestyle',
      followers: '50K',
      rating: 4.8,
      image: '👨‍🍳',
    },
    {
      id: 2,
      name: 'Trần Thị Bình',
      category: 'Fashion & Beauty',
      followers: '120K',
      rating: 4.9,
      image: '👩‍💼',
    },
    {
      id: 3,
      name: 'Lê Minh Cường',
      category: 'Tech & Gaming',
      followers: '80K',
      rating: 4.7,
      image: '👨‍💻',
    },
  ];

  const categories = [
    { name: 'Tất cả', icon: 'square.grid.3x3' },
    { name: 'Ẩm thực', icon: 'fork.knife' },
    { name: 'Thời trang', icon: 'tshirt' },
    { name: 'Công nghệ', icon: 'laptopcomputer' },
    { name: 'Du lịch', icon: 'airplane' },
  ];

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Khám phá {user?.role === 'SME' ? 'Influencer' : 'Chiến dịch'}
        </ThemedText>
        
        {/* Search Bar */}
        <ThemedView style={[styles.searchContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <IconSymbol name="magnifyingglass" size={20} color={Colors[colorScheme ?? 'light'].icon} />
          <TextInput
            style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
            placeholder={user?.role === 'SME' ? 'Tìm kiếm influencer...' : 'Tìm kiếm chiến dịch...'}
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </ThemedView>
      </ThemedView>

      {/* Categories */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>Danh mục</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {categories.map((category, index) => (
            <TouchableOpacity key={index} style={[styles.categoryCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
              <IconSymbol name={category.icon} size={24} color={Colors[colorScheme ?? 'light'].tint} />
              <ThemedText style={styles.categoryText}>{category.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Results */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          {user?.role === 'SME' ? 'Influencer nổi bật' : 'Chiến dịch phù hợp'}
        </ThemedText>
        
        {mockInfluencers.map((influencer) => (
          <TouchableOpacity key={influencer.id} style={[styles.card, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <ThemedView style={styles.cardHeader}>
              <ThemedText style={styles.avatar}>{influencer.image}</ThemedText>
              <ThemedView style={styles.cardInfo}>
                <ThemedText type="defaultSemiBold">{influencer.name}</ThemedText>
                <ThemedText style={styles.category}>{influencer.category}</ThemedText>
                <ThemedView style={styles.stats}>
                  <ThemedText style={styles.followers}>{influencer.followers} followers</ThemedText>
                  <ThemedView style={styles.rating}>
                    <IconSymbol name="star.fill" size={16} color="#FFD700" />
                    <ThemedText style={styles.ratingText}>{influencer.rating}</ThemedText>
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            </ThemedView>
          </TouchableOpacity>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

export default function DiscoveryScreen() {
  return (
    <AuthGuard>
      <DiscoveryContent />
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
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    marginBottom: 15,
  },
  categoriesContainer: {
    flexDirection: 'row',
  },
  categoryCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginRight: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 80,
  },
  categoryText: {
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
  },
  card: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    fontSize: 40,
    marginRight: 15,
  },
  cardInfo: {
    flex: 1,
  },
  category: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  followers: {
    fontSize: 12,
    opacity: 0.7,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
});
