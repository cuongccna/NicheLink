import { AuthGuard } from '@/components/AuthGuard';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

function HomeContent() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const mockStats = {
    SME: {
      activeCampaigns: '3',
      totalViews: '45.2K',
      totalEngagement: '1.8K',
      conversionRate: '12.4%',
    },
    INFLUENCER: {
      activeCampaigns: '5',
      completedCampaigns: '23',
      totalEarnings: '$1,240',
      avgRating: '4.8',
    },
  };

  const recentActivities = [
    {
      id: 1,
      type: 'campaign_completed',
      title: 'Chiến dịch "Summer Collection" đã hoàn thành',
      time: '2 giờ trước',
      color: '#4CAF50',
    },
    {
      id: 2,
      type: 'new_message',
      title: 'Tin nhắn mới từ Fashion Brand XYZ',
      time: '5 giờ trước',
      color: '#2196F3',
    },
    {
      id: 3,
      type: 'rating_received',
      title: 'Nhận được đánh giá 5 sao từ khách hàng',
      time: '1 ngày trước',
      color: '#FF9800',
    },
  ];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#667eea', dark: '#764ba2' }}
      headerImage={
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <View style={styles.titleContainer}>
            <ThemedText type="title" style={styles.headerTitle}>NicheLink</ThemedText>
            <HelloWave />
          </View>
        </LinearGradient>
      }>
      
      {/* User Welcome */}
      <LinearGradient
        colors={['#ffecd2', '#fcb69f']}
        style={styles.welcomeCard}
      >
        <ThemedText type="title" style={styles.welcomeTitle}>
          Xin chào, {user?.firstName || 'User'}! 👋
        </ThemedText>
        <ThemedText style={styles.welcomeSubtitle}>
          {user?.role === 'SME' 
            ? 'Quản lý chiến dịch và kết nối với Influencer' 
            : 'Khám phá cơ hội hợp tác mới'}
        </ThemedText>
      </LinearGradient>

      {/* Statistics Section */}
      <ThemedView style={styles.statsSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>📊 Thống kê tổng quan</ThemedText>
        
        <ThemedView style={styles.statsGrid}>
          {user?.role === 'SME' ? (
            <>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.statCard}>
                <ThemedText style={styles.statNumber}>{mockStats.SME.activeCampaigns}</ThemedText>
                <ThemedText style={styles.statLabel}>Chiến dịch đang chạy</ThemedText>
              </LinearGradient>
              <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.statCard}>
                <ThemedText style={styles.statNumber}>{mockStats.SME.totalViews}</ThemedText>
                <ThemedText style={styles.statLabel}>Tổng lượt xem</ThemedText>
              </LinearGradient>
              <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.statCard}>
                <ThemedText style={styles.statNumber}>{mockStats.SME.totalEngagement}</ThemedText>
                <ThemedText style={styles.statLabel}>Tương tác</ThemedText>
              </LinearGradient>
              <LinearGradient colors={['#43e97b', '#38f9d7']} style={styles.statCard}>
                <ThemedText style={styles.statNumber}>{mockStats.SME.conversionRate}</ThemedText>
                <ThemedText style={styles.statLabel}>Tỷ lệ chuyển đổi</ThemedText>
              </LinearGradient>
            </>
          ) : (
            <>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.statCard}>
                <ThemedText style={styles.statNumber}>{mockStats.INFLUENCER.activeCampaigns}</ThemedText>
                <ThemedText style={styles.statLabel}>Đang thực hiện</ThemedText>
              </LinearGradient>
              <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.statCard}>
                <ThemedText style={styles.statNumber}>{mockStats.INFLUENCER.completedCampaigns}</ThemedText>
                <ThemedText style={styles.statLabel}>Đã hoàn thành</ThemedText>
              </LinearGradient>
              <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.statCard}>
                <ThemedText style={styles.statNumber}>{mockStats.INFLUENCER.totalEarnings}</ThemedText>
                <ThemedText style={styles.statLabel}>Tổng thu nhập</ThemedText>
              </LinearGradient>
              <LinearGradient colors={['#43e97b', '#38f9d7']} style={styles.statCard}>
                <ThemedText style={styles.statNumber}>⭐ {mockStats.INFLUENCER.avgRating}</ThemedText>
                <ThemedText style={styles.statLabel}>Đánh giá TB</ThemedText>
              </LinearGradient>
            </>
          )}
        </ThemedView>
      </ThemedView>

      {/* Recent Activities */}
      <ThemedView style={styles.activitiesSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>🕒 Hoạt động gần đây</ThemedText>
        
        {recentActivities.map((activity) => (
          <LinearGradient
            key={activity.id}
            colors={['#ffffff', '#f8f9fa']}
            style={styles.activityItem}
          >
            <LinearGradient
              colors={[activity.color, activity.color + '80']}
              style={styles.activityIcon}
            >
              <ThemedText style={styles.activityIconText}>
                {activity.type === 'campaign_completed' ? '✓' : 
                 activity.type === 'new_message' ? '💬' : '👍'}
              </ThemedText>
            </LinearGradient>
            <ThemedView style={styles.activityContent}>
              <ThemedText style={styles.activityTitle}>{activity.title}</ThemedText>
              <ThemedText style={styles.activityTime}>{activity.time}</ThemedText>
            </ThemedView>
          </LinearGradient>
        ))}
      </ThemedView>

      {/* Quick Actions */}
      <ThemedView style={styles.quickActionsSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>⚡ Thao tác nhanh</ThemedText>
        
        <ThemedView style={styles.quickActionsGrid}>
          {user?.role === 'SME' ? (
            <>
              <TouchableOpacity>
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.quickActionCard}>
                  <ThemedText style={styles.quickActionIcon}>📝</ThemedText>
                  <ThemedText style={styles.quickActionText}>Tạo chiến dịch</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity>
                <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.quickActionCard}>
                  <ThemedText style={styles.quickActionIcon}>🔍</ThemedText>
                  <ThemedText style={styles.quickActionText}>Tìm Influencer</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity>
                <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.quickActionCard}>
                  <ThemedText style={styles.quickActionIcon}>📊</ThemedText>
                  <ThemedText style={styles.quickActionText}>Báo cáo</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity>
                <LinearGradient colors={['#43e97b', '#38f9d7']} style={styles.quickActionCard}>
                  <ThemedText style={styles.quickActionIcon}>💼</ThemedText>
                  <ThemedText style={styles.quickActionText}>Hợp đồng</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity>
                <LinearGradient colors={['#667eea', '#764ba2']} style={styles.quickActionCard}>
                  <ThemedText style={styles.quickActionIcon}>🎯</ThemedText>
                  <ThemedText style={styles.quickActionText}>Tìm chiến dịch</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity>
                <LinearGradient colors={['#f093fb', '#f5576c']} style={styles.quickActionCard}>
                  <ThemedText style={styles.quickActionIcon}>👤</ThemedText>
                  <ThemedText style={styles.quickActionText}>Cập nhật hồ sơ</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity>
                <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.quickActionCard}>
                  <ThemedText style={styles.quickActionIcon}>📈</ThemedText>
                  <ThemedText style={styles.quickActionText}>Thống kê</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity>
                <LinearGradient colors={['#43e97b', '#38f9d7']} style={styles.quickActionCard}>
                  <ThemedText style={styles.quickActionIcon}>💰</ThemedText>
                  <ThemedText style={styles.quickActionText}>Thu nhập</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </ThemedView>
      </ThemedView>

      {/* Logout Button */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButtonContainer}>
        <LinearGradient colors={['#ff6b6b', '#ee5a52']} style={styles.logoutButton}>
          <ThemedText style={styles.logoutButtonText}>🚪 Đăng xuất</ThemedText>
        </LinearGradient>
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

export default function HomeScreen() {
  return (
    <AuthGuard requireAuth={true}>
      <HomeContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  welcomeCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeTitle: {
    color: '#2d3748',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: '#4a5568',
    fontSize: 16,
    lineHeight: 24,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#2d3748',
    marginLeft: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  activitiesSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  activityIconText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  activityContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    color: '#2d3748',
  },
  activityTime: {
    fontSize: 13,
    color: '#718096',
  },
  quickActionsSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    color: 'white',
  },
  logoutButtonContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  logoutButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
