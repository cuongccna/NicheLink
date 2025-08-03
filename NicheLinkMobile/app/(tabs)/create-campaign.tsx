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
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

interface CampaignForm {
  title: string;
  description: string;
  budget: string;
  category: string;
  platforms: string[];
  targetAudience: string;
  deadline: string;
  requirements: string;
  deliverables: string[];
}

function CreateCampaignContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CampaignForm>({
    title: '',
    description: '',
    budget: '',
    category: '',
    platforms: [],
    targetAudience: '',
    deadline: '',
    requirements: '',
    deliverables: [],
  });

  const steps = [
    { id: 1, title: 'Thông tin cơ bản', icon: 'info.circle.fill' },
    { id: 2, title: 'Ngân sách & Timeline', icon: 'calendar.circle.fill' },
    { id: 3, title: 'Nền tảng & Đối tượng', icon: 'person.2.fill' },
    { id: 4, title: 'Xem trước & Xuất bản', icon: 'checkmark.circle.fill' },
  ];

  const categories = [
    { id: 'beauty', name: 'Beauty & Skincare', icon: 'sparkles', color: COLORS.secondary },
    { id: 'fashion', name: 'Fashion & Style', icon: 'heart.fill', color: COLORS.error },
    { id: 'tech', name: 'Technology', icon: 'desktopcomputer', color: COLORS.info },
    { id: 'food', name: 'Food & Beverage', icon: 'cup.and.saucer.fill', color: COLORS.warning },
    { id: 'lifestyle', name: 'Lifestyle', icon: 'house.fill', color: COLORS.success },
    { id: 'travel', name: 'Travel', icon: 'airplane', color: COLORS.primary },
  ];

  const platforms = [
    { id: 'tiktok', name: 'TikTok', icon: 'play.fill', color: '#FF0050' },
    { id: 'instagram', name: 'Instagram', icon: 'camera.fill', color: '#E4405F' },
    { id: 'youtube', name: 'YouTube', icon: 'play.rectangle.fill', color: '#FF0000' },
    { id: 'facebook', name: 'Facebook', icon: 'globe', color: '#1877F2' },
    { id: 'blog', name: 'Blog/Website', icon: 'doc.text.fill', color: COLORS.primary },
  ];

  const deliverableOptions = [
    { id: 'post', name: 'Post/Bài viết', icon: 'doc.text' },
    { id: 'story', name: 'Story/Status', icon: 'circle.stack' },
    { id: 'video', name: 'Video content', icon: 'video' },
    { id: 'review', name: 'Review/Đánh giá', icon: 'star' },
    { id: 'photo', name: 'Photo shoot', icon: 'camera' },
    { id: 'livestream', name: 'Livestream', icon: 'dot.radiowaves.left.and.right' },
  ];

  // Validation functions
  const validateStep1 = (): boolean => {
    return !!(formData.title.trim() && formData.description.trim() && formData.category);
  };

  const validateStep2 = (): boolean => {
    return !!(formData.budget && formData.deadline.trim());
  };

  const validateStep3 = (): boolean => {
    return formData.platforms.length > 0;
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: return validateStep1();
      case 2: return validateStep2();
      case 3: return validateStep3();
      case 4: return true; // Preview step
      default: return false;
    }
  };

  // Navigation functions
  const handleNext = () => {
    if (!validateCurrentStep()) {
      Alert.alert(
        'Thông tin chưa đầy đủ',
        'Vui lòng điền đầy đủ thông tin bắt buộc trước khi tiếp tục.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      Alert.alert('Lỗi', 'Vui lòng kiểm tra và điền đầy đủ thông tin.');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Thành công! 🎉', 
        'Chiến dịch đã được tạo và đang chờ duyệt từ admin.',
        [
          {
            text: 'Về trang chủ',
            onPress: () => router.push('/(tabs)'),
          },
          {
            text: 'Xem chiến dịch',
            onPress: () => router.push('/(tabs)/campaigns'),
          }
        ]
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo chiến dịch. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <View style={[
            styles.stepCircle,
            currentStep >= step.id && styles.stepCircleActive
          ]}>
            <IconSymbol 
              name={currentStep > step.id ? 'checkmark' : step.icon as any} 
              size={16} 
              color={currentStep >= step.id ? 'white' : COLORS.light.subtext} 
            />
          </View>
          {index < steps.length - 1 && (
            <View style={[
              styles.stepLine,
              currentStep > step.id && styles.stepLineActive
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Thông tin cơ bản về chiến dịch</ThemedText>
      
      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Tên chiến dịch *</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="VD: Review sản phẩm skincare mùa hè 2024"
          value={formData.title}
          onChangeText={(text) => setFormData({...formData, title: text})}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Mô tả chi tiết *</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Mô tả yêu cầu, nội dung cần tạo, và kỳ vọng..."
          value={formData.description}
          onChangeText={(text) => setFormData({...formData, description: text})}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Danh mục *</ThemedText>
        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                formData.category === category.id && styles.categoryCardSelected
              ]}
              onPress={() => setFormData({...formData, category: category.id})}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color + '15' }]}>
                <IconSymbol name={category.icon as any} size={20} color={category.color} />
              </View>
              <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Ngân sách & Timeline</ThemedText>
      
      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Ngân sách (VNĐ) *</ThemedText>
        <ThemedText style={styles.helper}>Chọn mức ngân sách phù hợp cho chiến dịch</ThemedText>
        <View style={styles.budgetOptions}>
          {[
            { range: '1-3 triệu', desc: 'Micro campaign' },
            { range: '3-5 triệu', desc: 'Standard campaign' },
            { range: '5-10 triệu', desc: 'Premium campaign' },
            { range: '10+ triệu', desc: 'Enterprise campaign' }
          ].map((budget) => (
            <TouchableOpacity
              key={budget.range}
              style={[
                styles.budgetChip,
                formData.budget === budget.range && styles.budgetChipSelected
              ]}
              onPress={() => setFormData({...formData, budget: budget.range})}
            >
              <ThemedText style={[
                styles.budgetChipText,
                formData.budget === budget.range && styles.budgetChipTextSelected
              ]}>
                {budget.range}
              </ThemedText>
              <ThemedText style={[
                styles.budgetChipDesc,
                formData.budget === budget.range && styles.budgetChipDescSelected
              ]}>
                {budget.desc}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Thời hạn hoàn thành *</ThemedText>
        <ThemedText style={styles.helper}>Thời gian từ khi bắt đầu đến khi hoàn thành</ThemedText>
        <View style={styles.deadlineOptions}>
          {['3 ngày', '1 tuần', '2 tuần', '1 tháng', 'Tùy chỉnh'].map((deadline) => (
            <TouchableOpacity
              key={deadline}
              style={[
                styles.deadlineChip,
                formData.deadline === deadline && styles.deadlineChipSelected
              ]}
              onPress={() => setFormData({...formData, deadline})}
            >
              <ThemedText style={[
                styles.deadlineChipText,
                formData.deadline === deadline && styles.deadlineChipTextSelected
              ]}>
                {deadline}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        {formData.deadline === 'Tùy chỉnh' && (
          <TextInput
            style={[styles.input, { marginTop: 12 }]}
            placeholder="VD: 10 ngày, 3 tuần..."
            value={formData.deadline === 'Tùy chỉnh' ? '' : formData.deadline}
            onChangeText={(text) => setFormData({...formData, deadline: text})}
          />
        )}
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Yêu cầu cụ thể</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="VD: Phải tag brand, sử dụng hashtag #campaign2024, đăng vào khung giờ vàng..."
          value={formData.requirements}
          onChangeText={(text) => setFormData({...formData, requirements: text})}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Nền tảng & Sản phẩm</ThemedText>
      
      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Chọn nền tảng *</ThemedText>
        <ThemedText style={styles.helper}>KOC sẽ đăng nội dung trên các nền tảng này</ThemedText>
        <View style={styles.platformGrid}>
          {platforms.map((platform) => (
            <TouchableOpacity
              key={platform.id}
              style={[
                styles.platformCard,
                formData.platforms.includes(platform.id) && styles.platformCardSelected
              ]}
              onPress={() => {
                const newPlatforms = formData.platforms.includes(platform.id)
                  ? formData.platforms.filter(p => p !== platform.id)
                  : [...formData.platforms, platform.id];
                setFormData({...formData, platforms: newPlatforms});
              }}
            >
              <IconSymbol name={platform.icon as any} size={24} color={platform.color} />
              <ThemedText style={styles.platformName}>{platform.name}</ThemedText>
              {formData.platforms.includes(platform.id) && (
                <View style={styles.platformCheckmark}>
                  <IconSymbol name="checkmark" size={12} color="white" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Loại nội dung cần tạo</ThemedText>
        <ThemedText style={styles.helper}>Chọn các loại deliverable mong muốn</ThemedText>
        <View style={styles.deliverableGrid}>
          {deliverableOptions.map((deliverable) => (
            <TouchableOpacity
              key={deliverable.id}
              style={[
                styles.deliverableCard,
                formData.deliverables.includes(deliverable.id) && styles.deliverableCardSelected
              ]}
              onPress={() => {
                const newDeliverables = formData.deliverables.includes(deliverable.id)
                  ? formData.deliverables.filter(d => d !== deliverable.id)
                  : [...formData.deliverables, deliverable.id];
                setFormData({...formData, deliverables: newDeliverables});
              }}
            >
              <IconSymbol name={deliverable.icon as any} size={20} color={COLORS.primary} />
              <ThemedText style={styles.deliverableName}>{deliverable.name}</ThemedText>
              {formData.deliverables.includes(deliverable.id) && (
                <View style={styles.deliverableCheckmark}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color={COLORS.success} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Đối tượng mục tiêu</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="VD: Phụ nữ 20-35 tuổi, quan tâm đến skincare, sống tại TP.HCM và Hà Nội..."
          value={formData.targetAudience}
          onChangeText={(text) => setFormData({...formData, targetAudience: text})}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Xem trước chiến dịch</ThemedText>
      
      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <ThemedText style={styles.previewTitle}>{formData.title || 'Tên chiến dịch'}</ThemedText>
          <View style={styles.previewBudget}>
            <ThemedText style={styles.previewBudgetText}>{formData.budget || 'Chưa chọn ngân sách'}</ThemedText>
          </View>
        </View>
        
        <ThemedText style={styles.previewDesc}>
          {formData.description || 'Chưa có mô tả'}
        </ThemedText>
        
        <View style={styles.previewMeta}>
          <View style={styles.previewMetaItem}>
            <IconSymbol name="tag.fill" size={16} color={COLORS.primary} />
            <ThemedText style={styles.previewMetaText}>
              {categories.find(c => c.id === formData.category)?.name || 'Chưa chọn danh mục'}
            </ThemedText>
          </View>
          
          <View style={styles.previewMetaItem}>
            <IconSymbol name="clock.fill" size={16} color={COLORS.warning} />
            <ThemedText style={styles.previewMetaText}>
              {formData.deadline || 'Chưa có thời hạn'}
            </ThemedText>
          </View>
        </View>
        
        {formData.platforms.length > 0 && (
          <View style={styles.previewPlatforms}>
            <ThemedText style={styles.previewLabel}>Nền tảng:</ThemedText>
            <View style={styles.previewPlatformList}>
              {formData.platforms.map(platformId => {
                const platform = platforms.find(p => p.id === platformId);
                return platform ? (
                  <View key={platformId} style={styles.previewPlatformChip}>
                    <ThemedText style={styles.previewPlatformText}>{platform.name}</ThemedText>
                  </View>
                ) : null;
              })}
            </View>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, '#4DB6AC']}
        style={styles.header}
      >
        <ThemedText style={styles.headerTitle}>Tạo Chiến Dịch Mới</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Bước {currentStep} / {steps.length}: {steps[currentStep - 1]?.title}
        </ThemedText>
      </LinearGradient>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.prevBtn} onPress={handlePrevious}>
            <IconSymbol name="chevron.left" size={20} color={COLORS.primary} />
            <ThemedText style={styles.prevBtnText}>Quay lại</ThemedText>
          </TouchableOpacity>
        )}
        
        <View style={styles.flex} />
        
        {/* Step Progress */}
        <View style={styles.stepProgress}>
          <ThemedText style={styles.stepProgressText}>
            {currentStep}/4
          </ThemedText>
        </View>
        
        <View style={styles.flex} />
        
        {currentStep < 4 ? (
          <TouchableOpacity 
            style={[
              styles.nextBtn,
              !validateCurrentStep() && styles.nextBtnDisabled
            ]} 
            onPress={handleNext}
            disabled={!validateCurrentStep()}
          >
            <ThemedText style={[
              styles.nextBtnText,
              !validateCurrentStep() && styles.nextBtnTextDisabled
            ]}>
              Tiếp theo
            </ThemedText>
            <IconSymbol 
              name="chevron.right" 
              size={20} 
              color={validateCurrentStep() ? "white" : COLORS.light.subtext} 
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.publishBtn} 
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ThemedText style={styles.publishBtnText}>Đang tạo...</ThemedText>
            ) : (
              <>
                <IconSymbol name="paperplane.fill" size={20} color="white" />
                <ThemedText style={styles.publishBtnText}>Xuất bản</ThemedText>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function CreateCampaignScreen() {
  return (
    <AuthGuard requiredRole="SME">
      <CreateCampaignContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  
  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'white',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.light.border,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  
  // Content
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.light.text,
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  
  // Form Inputs
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.light.text,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.light.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    fontFamily: 'Inter',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  
  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (width - 64) / 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  categoryCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    color: COLORS.light.text,
    fontFamily: 'Inter',
  },
  
  // Budget Options
  budgetOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  budgetChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  budgetChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  budgetChipText: {
    fontSize: 14,
    color: COLORS.light.text,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  budgetChipTextSelected: {
    color: 'white',
  },
  
  // Platform Grid
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformCard: {
    width: (width - 64) / 3,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  platformCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  platformName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    color: COLORS.light.text,
    marginTop: 8,
    fontFamily: 'Inter',
  },
  
  // Preview
  previewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.light.text,
    flex: 1,
    marginRight: 12,
    fontFamily: 'Inter',
  },
  previewBudget: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.success + '15',
    borderRadius: 8,
  },
  previewBudgetText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
    fontFamily: 'Inter',
  },
  previewDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.light.subtext,
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  previewMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  previewMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewMetaText: {
    fontSize: 13,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
  },
  previewPlatforms: {
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.light.text,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  previewPlatformList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewPlatformChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
  },
  previewPlatformText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: COLORS.light.border,
  },
  flex: {
    flex: 1,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  prevBtnText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Inter',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  nextBtnText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginRight: 4,
    fontFamily: 'Inter',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.success,
  },
  publishBtnText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Inter',
  },

  // New styles for enhanced UI
  helper: {
    fontSize: 14,
    color: COLORS.light.subtext,
    marginBottom: 12,
    fontFamily: 'Inter',
    fontStyle: 'italic',
  },
  stepProgress: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.light.background,
    borderRadius: 12,
  },
  stepProgressText: {
    fontSize: 14,
    color: COLORS.light.subtext,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  nextBtnDisabled: {
    backgroundColor: COLORS.light.border,
  },
  nextBtnTextDisabled: {
    color: COLORS.light.subtext,
  },
  budgetChipDesc: {
    fontSize: 12,
    color: COLORS.light.subtext,
    fontFamily: 'Inter',
    marginTop: 2,
  },
  budgetChipDescSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  deadlineOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deadlineChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.light.background,
    borderWidth: 1,
    borderColor: COLORS.light.border,
  },
  deadlineChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  deadlineChipText: {
    fontSize: 14,
    color: COLORS.light.text,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  deadlineChipTextSelected: {
    color: 'white',
  },
  platformCheckmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deliverableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  deliverableCard: {
    width: (width - 64) / 2,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: COLORS.light.border,
    alignItems: 'center',
    position: 'relative',
  },
  deliverableCardSelected: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + '10',
  },
  deliverableName: {
    fontSize: 14,
    color: COLORS.light.text,
    fontWeight: '500',
    fontFamily: 'Inter',
    marginTop: 8,
    textAlign: 'center',
  },
  deliverableCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
