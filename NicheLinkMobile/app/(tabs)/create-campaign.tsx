import { AuthGuard } from '@/components/AuthGuard';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { COLORS } from '@/constants/DesignSystem';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

function CreateCampaignContent() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    budget: '',
    category: '',
    platforms: [] as string[],
    targetAudience: '',
    deadline: '',
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
        <View style={styles.budgetOptions}>
          {['1-3 triệu', '3-5 triệu', '5-10 triệu', '10+ triệu'].map((budget) => (
            <TouchableOpacity
              key={budget}
              style={[
                styles.budgetChip,
                formData.budget === budget && styles.budgetChipSelected
              ]}
              onPress={() => setFormData({...formData, budget})}
            >
              <ThemedText style={[
                styles.budgetChipText,
                formData.budget === budget && styles.budgetChipTextSelected
              ]}>
                {budget}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Thời hạn hoàn thành</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="VD: 7 ngày, 2 tuần, 1 tháng..."
          value={formData.deadline}
          onChangeText={(text) => setFormData({...formData, deadline: text})}
        />
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <ThemedText style={styles.stepTitle}>Nền tảng & Đối tượng</ThemedText>
      
      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Chọn nền tảng *</ThemedText>
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
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <ThemedText style={styles.label}>Đối tượng mục tiêu</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="VD: Phụ nữ 20-35 tuổi, quan tâm đến skincare, sống tại các thành phố lớn..."
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

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = () => {
    // TODO: Implement campaign publishing logic
    console.log('Publishing campaign:', formData);
  };

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
        
        {currentStep < 4 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <ThemedText style={styles.nextBtnText}>Tiếp theo</ThemedText>
            <IconSymbol name="chevron.right" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
            <IconSymbol name="paperplane.fill" size={20} color="white" />
            <ThemedText style={styles.publishBtnText}>Xuất bản</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

export default function CreateCampaignScreen() {
  return (
    <AuthGuard>
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
});
