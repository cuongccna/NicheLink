import { AuthGuard } from '@/components/AuthGuard';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { COLORS, ROLE_THEMES, SPACING, TYPOGRAPHY } from '@/constants/DesignSystem';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

function HomeContent() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;
  const roleTheme = user?.role ? ROLE_THEMES[user.role] : ROLE_THEMES.INFLUENCER;

  // SME Dashboard
  const renderSMEDashboard = () => (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={roleTheme.gradient}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <ThemedText style={styles.greeting}>Xin chào, {user?.firstName}!</ThemedText>
          <ThemedText style={styles.subtitle}>Quản lý chiến dịch marketing của bạn</ThemedText>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="briefcase.fill" size={24} color={COLORS.primary} />
            <ThemedText style={[styles.statNumber, { color: colors.text }]}>8</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.subtext }]}>Chiến dịch hoạt động</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="person.2.fill" size={24} color={COLORS.success} />
            <ThemedText style={[styles.statNumber, { color: colors.text }]}>47</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.subtext }]}>KOCs hợp tác</ThemedText>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="eye.fill" size={24} color={COLORS.warning} />
            <ThemedText style={[styles.statNumber, { color: colors.text }]}>2.3M</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.subtext }]}>Lượt tiếp cận</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="banknote" size={24} color={COLORS.error} />
            <ThemedText style={[styles.statNumber, { color: colors.text }]}>₫45M</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.subtext }]}>Ngân sách tháng</ThemedText>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Hành động nhanh</ThemedText>
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.surface }]}>
            <LinearGradient
              colors={[COLORS.primary, '#4DB6AC']}
              style={styles.actionIcon}
            >
              <IconSymbol name="plus.circle.fill" size={24} color="white" />
            </LinearGradient>
            <ThemedText style={[styles.actionText, { color: colors.text }]}>Tạo chiến dịch</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.surface }]}>
            <LinearGradient
              colors={[COLORS.secondary, '#FFAB91']}
              style={styles.actionIcon}
            >
              <IconSymbol name="person.2.fill" size={24} color="white" />
            </LinearGradient>
            <ThemedText style={[styles.actionText, { color: colors.text }]}>Tìm KOC</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Hoạt động gần đây</ThemedText>
        <View style={[styles.activityCard, { backgroundColor: colors.surface }]}>
          <IconSymbol name="checkmark.circle.fill" size={20} color={COLORS.success} />
          <View style={styles.activityContent}>
            <ThemedText style={[styles.activityTitle, { color: colors.text }]}>Campaign "Skincare Launch" hoàn thành</ThemedText>
            <ThemedText style={[styles.activityTime, { color: colors.subtext }]}>2 giờ trước</ThemedText>
          </View>
        </View>
        <View style={[styles.activityCard, { backgroundColor: colors.surface }]}>
          <IconSymbol name="person.badge.plus" size={20} color={COLORS.primary} />
          <View style={styles.activityContent}>
            <ThemedText style={[styles.activityTitle, { color: colors.text }]}>3 KOC mới ứng tuyển cho "Tech Review"</ThemedText>
            <ThemedText style={[styles.activityTime, { color: colors.subtext }]}>5 giờ trước</ThemedText>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // KOC Feed/Bảng tin
  const renderKOCFeed = () => (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={roleTheme.gradient}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <ThemedText style={styles.greeting}>Chào {user?.firstName}! ✨</ThemedText>
          <ThemedText style={styles.subtitle}>Khám phá cơ hội hợp tác mới</ThemedText>
        </View>
      </LinearGradient>

      {/* KOC Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="star.fill" size={24} color={COLORS.warning} />
            <ThemedText style={[styles.statNumber, { color: colors.text }]}>4.9</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.subtext }]}>Đánh giá</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="list.bullet" size={24} color={COLORS.secondary} />
            <ThemedText style={[styles.statNumber, { color: colors.text }]}>12</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.subtext }]}>Đã hoàn thành</ThemedText>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="clock.fill" size={24} color={COLORS.primary} />
            <ThemedText style={[styles.statNumber, { color: colors.text }]}>3</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.subtext }]}>Đang thực hiện</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <IconSymbol name="banknote" size={24} color={COLORS.success} />
            <ThemedText style={[styles.statNumber, { color: colors.text }]}>₫18M</ThemedText>
            <ThemedText style={[styles.statLabel, { color: colors.subtext }]}>Thu nhập tháng</ThemedText>
          </View>
        </View>
      </View>

      {/* Available Campaigns */}
      <View style={styles.section}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Cơ hội mới</ThemedText>
        
        <View style={[styles.campaignCard, { backgroundColor: colors.surface }]}>
          <View style={styles.campaignHeader}>
            <View style={styles.campaignBrand}>
              <View style={[styles.brandLogo, { backgroundColor: COLORS.primary }]}>
                <ThemedText style={styles.brandInitial}>B</ThemedText>
              </View>
              <View>
                <ThemedText style={[styles.brandName, { color: colors.text }]}>Beauty Co.</ThemedText>
                <ThemedText style={[styles.campaignType, { color: colors.subtext }]}>Beauty & Fashion</ThemedText>
              </View>
            </View>
            <View style={[styles.budgetBadge, { backgroundColor: COLORS.success + '20' }]}>
              <ThemedText style={[styles.budgetText, { color: COLORS.success }]}>₫800K</ThemedText>
            </View>
          </View>
          
          <ThemedText style={[styles.campaignTitle, { color: colors.text }]}>Review sản phẩm skincare mới</ThemedText>
          <ThemedText style={[styles.campaignDesc, { color: colors.subtext }]}>Tạo content review chi tiết cho dòng sản phẩm chăm sóc da mới. Cần video + post Instagram.</ThemedText>
          
          <View style={styles.campaignFooter}>
            <View style={styles.campaignMeta}>
              <IconSymbol name="clock" size={14} color={colors.subtext} />
              <ThemedText style={[styles.metaText, { color: colors.subtext }]}>Hạn: 15/08</ThemedText>
            </View>
            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: COLORS.secondary }]}>
              <ThemedText style={styles.applyBtnText}>Ứng tuyển</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.campaignCard, { backgroundColor: colors.surface }]}>
          <View style={styles.campaignHeader}>
            <View style={styles.campaignBrand}>
              <View style={[styles.brandLogo, { backgroundColor: COLORS.warning }]}>
                <ThemedText style={styles.brandInitial}>F</ThemedText>
              </View>
              <View>
                <ThemedText style={[styles.brandName, { color: colors.text }]}>FoodTech</ThemedText>
                <ThemedText style={[styles.campaignType, { color: colors.subtext }]}>Food & Tech</ThemedText>
              </View>
            </View>
            <View style={[styles.budgetBadge, { backgroundColor: COLORS.success + '20' }]}>
              <ThemedText style={[styles.budgetText, { color: COLORS.success }]}>₫500K</ThemedText>
            </View>
          </View>
          
          <ThemedText style={[styles.campaignTitle, { color: colors.text }]}>Review app giao đồ ăn</ThemedText>
          <ThemedText style={[styles.campaignDesc, { color: colors.subtext }]}>Tạo video review app giao đồ ăn mới. Tập trung vào UX và tính năng nổi bật.</ThemedText>
          
          <View style={styles.campaignFooter}>
            <View style={styles.campaignMeta}>
              <IconSymbol name="clock" size={14} color={colors.subtext} />
              <ThemedText style={[styles.metaText, { color: colors.subtext }]}>Hạn: 20/08</ThemedText>
            </View>
            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: COLORS.secondary }]}>
              <ThemedText style={styles.applyBtnText}>Ứng tuyển</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {user?.role === 'SME' ? renderSMEDashboard() : renderKOCFeed()}
    </SafeAreaView>
  );
}

export default function HomeScreen() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: SPACING.xl,
  },
  headerContent: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: TYPOGRAPHY.sizes.h2,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: 'white',
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.body1,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  statsContainer: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
    marginTop: -SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginTop: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.caption,
    marginTop: SPACING.xs,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.h3,
    fontWeight: TYPOGRAPHY.weights.semiBold,
    marginBottom: SPACING.lg,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionCard: {
    flex: 1,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionText: {
    fontSize: TYPOGRAPHY.sizes.body2,
    fontWeight: TYPOGRAPHY.weights.medium,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activityContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  activityTitle: {
    fontSize: TYPOGRAPHY.sizes.body2,
    fontWeight: TYPOGRAPHY.weights.medium,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  activityTime: {
    fontSize: TYPOGRAPHY.sizes.caption,
    marginTop: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  // KOC specific styles
  campaignCard: {
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  campaignBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  brandInitial: {
    color: 'white',
    fontSize: TYPOGRAPHY.sizes.body1,
    fontWeight: TYPOGRAPHY.weights.bold,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  brandName: {
    fontSize: TYPOGRAPHY.sizes.body1,
    fontWeight: TYPOGRAPHY.weights.semiBold,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  campaignType: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  budgetBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  budgetText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    fontWeight: TYPOGRAPHY.weights.semiBold,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  campaignTitle: {
    fontSize: TYPOGRAPHY.sizes.body1,
    fontWeight: TYPOGRAPHY.weights.semiBold,
    marginBottom: SPACING.sm,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  campaignDesc: {
    fontSize: TYPOGRAPHY.sizes.body2,
    lineHeight: 20,
    marginBottom: SPACING.lg,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  campaignMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.caption,
    marginLeft: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
  applyBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  applyBtnText: {
    color: 'white',
    fontSize: TYPOGRAPHY.sizes.body2,
    fontWeight: TYPOGRAPHY.weights.semiBold,
    fontFamily: TYPOGRAPHY.fontFamily,
  },
});
