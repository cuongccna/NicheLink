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
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

// Task status types
type TaskStatus = 'in_progress' | 'pending' | 'completed' | 'overdue';

interface Task {
  id: string;
  campaignTitle: string;
  brand: string;
  status: TaskStatus;
  deadline: string;
  progress: number;
  requirements: string[];
  paymentAmount: string;
  submittedAt?: string;
  daysLeft: number;
}

// Mock tasks data for KOC
const mockTasks: Task[] = [
  {
    id: 'task_coffee_review',
    campaignTitle: 'Review sản phẩm cà phê PhinĐen',
    brand: 'PhinĐen Coffee',
    status: 'in_progress',
    deadline: '2025-08-10',
    progress: 75,
    requirements: ['Video review 60s', 'Post Instagram', 'Story highlights'],
    paymentAmount: '₫800,000',
    daysLeft: 3,
  },
  {
    id: 'task_skincare_unbox',
    campaignTitle: 'Unboxing sản phẩm skincare',
    brand: 'Beauty Brand X',
    status: 'pending',
    deadline: '2025-08-15',
    progress: 0,
    requirements: ['Unboxing video', 'First impression post', 'Review sau 7 ngày'],
    paymentAmount: '₫1,200,000',
    daysLeft: 8,
  },
  {
    id: 'task_fashion_lookbook',
    campaignTitle: 'Summer Fashion Lookbook',
    brand: 'StyleVogue',
    status: 'completed',
    deadline: '2025-07-30',
    progress: 100,
    requirements: ['3 outfit posts', 'Reels thời trang', 'Story styling tips'],
    paymentAmount: '₫1,500,000',
    submittedAt: '2025-07-28',
    daysLeft: 0,
  },
  {
    id: 'task_tech_review_overdue',
    campaignTitle: 'Review smartphone mới',
    brand: 'TechHub',
    status: 'overdue',
    deadline: '2025-07-25',
    progress: 60,
    requirements: ['Video review chi tiết', 'So sánh với competitor', 'Post pros/cons'],
    paymentAmount: '₫2,000,000',
    daysLeft: -5,
  },
];

function MyTasksContent() {
  const [selectedTab, setSelectedTab] = useState<TaskStatus>('in_progress');
  const router = useRouter();

  // Filter tasks by status
  const filteredTasks = mockTasks.filter(task => task.status === selectedTab);

  // Get status color
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'in_progress': return COLORS.primary;
      case 'pending': return COLORS.warning;
      case 'completed': return COLORS.success;
      case 'overdue': return COLORS.error;
      default: return COLORS.light.subtext;
    }
  };

  // Get status text
  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'in_progress': return 'Đang thực hiện';
      case 'pending': return 'Chờ bắt đầu';
      case 'completed': return 'Đã hoàn thành';
      case 'overdue': return 'Quá hạn';
      default: return status;
    }
  };

  // Navigate to task workspace
  const navigateToWorkspace = (taskId: string) => {
    router.push('/creative-workspace' as any);
  };

  // Navigate to chat with brand
  const navigateToChat = (taskId: string) => {
    router.push('/chat' as any);
  };

  // Render task card
  const renderTaskCard = (task: Task) => (
    <TouchableOpacity
      key={task.id}
      style={styles.taskCard}
      onPress={() => navigateToWorkspace(task.id)}
    >
      {/* Task Header */}
      <View style={styles.taskHeader}>
        <View style={styles.taskIcon}>
          <IconSymbol 
            name="checkmark.circle.fill" 
            size={20} 
            color={getStatusColor(task.status)} 
          />
        </View>
        <View style={styles.taskMainInfo}>
          <ThemedText style={styles.taskTitle}>{task.campaignTitle}</ThemedText>
          <ThemedText style={styles.taskBrand}>{task.brand}</ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
          <ThemedText style={[styles.statusText, { color: getStatusColor(task.status) }]}>
            {getStatusText(task.status)}
          </ThemedText>
        </View>
      </View>

      {/* Task Progress (for in_progress and overdue tasks) */}
      {(task.status === 'in_progress' || task.status === 'overdue') && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <ThemedText style={styles.progressLabel}>Tiến độ</ThemedText>
            <ThemedText style={[styles.progressPercent, { color: getStatusColor(task.status) }]}>
              {task.progress}%
            </ThemedText>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${task.progress}%`, 
                  backgroundColor: getStatusColor(task.status) 
                }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Task Requirements */}
      <View style={styles.requirementsContainer}>
        <ThemedText style={styles.requirementsLabel}>Yêu cầu:</ThemedText>
        {task.requirements.map((req, index) => (
          <View key={index} style={styles.requirementItem}>
            <IconSymbol 
              name="circle.fill" 
              size={6} 
              color={COLORS.light.subtext} 
            />
            <ThemedText style={styles.requirementText}>{req}</ThemedText>
          </View>
        ))}
      </View>

      {/* Task Footer */}
      <View style={styles.taskFooter}>
        <View style={styles.taskMeta}>
          <View style={styles.metaItem}>
            <IconSymbol name="dollarsign.circle.fill" size={16} color={COLORS.success} />
            <ThemedText style={styles.metaText}>{task.paymentAmount}</ThemedText>
          </View>
          <View style={styles.metaItem}>
            <IconSymbol 
              name="clock.fill" 
              size={16} 
              color={task.daysLeft <= 1 ? COLORS.error : COLORS.warning} 
            />
            <ThemedText style={[
              styles.metaText,
              { color: task.daysLeft <= 1 ? COLORS.error : COLORS.light.text }
            ]}>
              {task.status === 'completed' 
                ? `Hoàn thành ${task.submittedAt}` 
                : task.daysLeft > 0 
                ? `${task.daysLeft} ngày còn lại`
                : `Quá hạn ${Math.abs(task.daysLeft)} ngày`
              }
            </ThemedText>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => navigateToChat(task.id)}
          >
            <IconSymbol name="message.fill" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          
          {task.status === 'in_progress' && (
            <TouchableOpacity 
              style={styles.workspaceButton}
              onPress={() => navigateToWorkspace(task.id)}
            >
              <IconSymbol name="square.and.pencil" size={16} color="white" />
              <ThemedText style={styles.workspaceButtonText}>Workspace</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Calculate stats
  const stats = {
    inProgress: mockTasks.filter(t => t.status === 'in_progress').length,
    completed: mockTasks.filter(t => t.status === 'completed').length,
    totalEarnings: mockTasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + parseInt(t.paymentAmount.replace(/[₫,]/g, '')), 0),
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.secondary, '#FF6B9D']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Nhiệm vụ của tôi</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Quản lý và theo dõi các công việc đã nhận
          </ThemedText>
          
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <ThemedText style={styles.quickStatNumber}>{stats.inProgress}</ThemedText>
              <ThemedText style={styles.quickStatLabel}>Đang thực hiện</ThemedText>
            </View>
            <View style={styles.quickStatItem}>
              <ThemedText style={styles.quickStatNumber}>{stats.completed}</ThemedText>
              <ThemedText style={styles.quickStatLabel}>Đã hoàn thành</ThemedText>
            </View>
            <View style={styles.quickStatItem}>
              <ThemedText style={styles.quickStatNumber}>
                ₫{(stats.totalEarnings / 1000000).toFixed(1)}M
              </ThemedText>
              <ThemedText style={styles.quickStatLabel}>Tổng thu nhập</ThemedText>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'in_progress', label: 'Đang thực hiện', count: mockTasks.filter(t => t.status === 'in_progress').length },
            { key: 'pending', label: 'Chờ bắt đầu', count: mockTasks.filter(t => t.status === 'pending').length },
            { key: 'completed', label: 'Đã hoàn thành', count: mockTasks.filter(t => t.status === 'completed').length },
            { key: 'overdue', label: 'Quá hạn', count: mockTasks.filter(t => t.status === 'overdue').length },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabItem,
                selectedTab === tab.key && styles.tabItemActive,
              ]}
              onPress={() => setSelectedTab(tab.key as TaskStatus)}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  selectedTab === tab.key && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </ThemedText>
              {tab.count > 0 && (
                <View style={[
                  styles.tabBadge,
                  selectedTab === tab.key && styles.tabBadgeActive,
                ]}>
                  <ThemedText style={[
                    styles.tabBadgeText,
                    selectedTab === tab.key && styles.tabBadgeTextActive,
                  ]}>
                    {tab.count}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Task List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredTasks.length > 0 ? (
          filteredTasks.map(renderTaskCard)
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="checkmark.circle" size={64} color={COLORS.light.subtext} />
            <ThemedText style={styles.emptyTitle}>
              Không có nhiệm vụ nào
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {selectedTab === 'pending' 
                ? 'Hiện tại bạn chưa có công việc nào chờ bắt đầu'
                : `Không có nhiệm vụ nào ở trạng thái "${getStatusText(selectedTab)}"`
              }
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function MyTasksScreen() {
  return (
    <AuthGuard requiredRole="INFLUENCER">
      <MyTasksContent />
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

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    width: '100%',
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter',
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    fontFamily: 'Inter',
  },

  // Tab Navigation
  tabContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light.border,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: COLORS.light.background,
  },
  tabItemActive: {
    backgroundColor: COLORS.secondary,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.light.text,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  tabTextActive: {
    color: 'white',
  },
  tabBadge: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  tabBadgeActive: {
    backgroundColor: 'white',
  },
  tabBadgeText: {
    fontSize: 12,
    color: 'white',
    fontFamily: 'Inter',
    fontWeight: 'bold',
  },
  tabBadgeTextActive: {
    color: COLORS.secondary,
  },

  // Content
  content: {
    flex: 1,
    padding: 16,
  },

  // Task Card
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskMainInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.light.text,
    fontFamily: 'Inter',
  },
  taskBrand: {
    fontSize: 14,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },

  // Progress
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
  },
  progressPercent: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.light.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Requirements
  requirementsContainer: {
    marginBottom: 12,
  },
  requirementsLabel: {
    fontSize: 12,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 13,
    color: COLORS.light.text,
    fontFamily: 'Inter',
    marginLeft: 8,
  },

  // Task Footer
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMeta: {
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.light.text,
    fontFamily: 'Inter',
    marginLeft: 6,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workspaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 16,
    gap: 6,
  },
  workspaceButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
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
});
