import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { RegisterRequest } from '../../types/auth';

export default function RegisterScreen() {
  const { register, isLoading, error, clearError, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<RegisterRequest>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'INFLUENCER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<RegisterRequest>>({});

  // Auto-navigate after successful registration
  React.useEffect(() => {
    if (isAuthenticated) {
      // Navigate to main app after successful registration
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (error) {
      Alert.alert('Đăng ký thất bại', error.message);
    }
  }, [error]);

  const validateForm = (): boolean => {
    const errors: Partial<RegisterRequest> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'Tên là bắt buộc';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Họ là bắt buộc';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Vui lòng nhập email hợp lệ';
    }

    if (!formData.password) {
      errors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 8) {
      errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu không khớp';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    clearError();
    
    if (!validateForm()) {
      return;
    }

    try {
      await register(formData);
      // Navigation will be handled by useEffect above
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const handleInputChange = (field: keyof RegisterRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo/Brand */}
            <View style={styles.brandContainer}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoIcon}>🔗</Text>
              </View>
              <Text style={styles.brandTitle}>NicheLink</Text>
              <Text style={styles.brandSubtitle}>Tham gia cộng đồng</Text>
            </View>

            {/* Register Form */}
            <View style={styles.formContainer}>
              <Text style={styles.welcomeTitle}>Tạo tài khoản</Text>

              {/* Role Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tôi là...</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    onPress={() => handleInputChange('role', 'INFLUENCER')}
                    style={[
                      styles.roleButton,
                      formData.role === 'INFLUENCER' && styles.roleButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      formData.role === 'INFLUENCER' && styles.roleButtonTextActive
                    ]}>
                      Influencer
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleInputChange('role', 'SME')}
                    style={[
                      styles.roleButton,
                      formData.role === 'SME' && styles.roleButtonActive
                    ]}
                  >
                    <Text style={[
                      styles.roleButtonText,
                      formData.role === 'SME' && styles.roleButtonTextActive
                    ]}>
                      Doanh nghiệp
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Name Inputs */}
              <View style={styles.nameContainer}>
                <View style={styles.nameInputContainer}>
                  <Text style={styles.label}>Tên</Text>
                  <TextInput
                    value={formData.firstName}
                    onChangeText={(value) => handleInputChange('firstName', value)}
                    placeholder="Nhập tên"
                    placeholderTextColor="#9CA3AF"
                    style={[
                      styles.textInput,
                      validationErrors.firstName && styles.inputError
                    ]}
                  />
                  {validationErrors.firstName && (
                    <Text style={styles.errorText}>{validationErrors.firstName}</Text>
                  )}
                </View>
                <View style={styles.nameInputContainer}>
                  <Text style={styles.label}>Họ</Text>
                  <TextInput
                    value={formData.lastName}
                    onChangeText={(value) => handleInputChange('lastName', value)}
                    placeholder="Nhập họ"
                    placeholderTextColor="#9CA3AF"
                    style={[
                      styles.textInput,
                      validationErrors.lastName && styles.inputError
                    ]}
                  />
                  {validationErrors.lastName && (
                    <Text style={styles.errorText}>{validationErrors.lastName}</Text>
                  )}
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Địa chỉ Email</Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="Nhập email của bạn"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.textInput,
                    validationErrors.email && styles.inputError
                  ]}
                />
                {validationErrors.email && (
                  <Text style={styles.errorText}>{validationErrors.email}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    placeholder="Tạo mật khẩu"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    style={[
                      styles.passwordInput,
                      validationErrors.password && styles.inputError
                    ]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.showPasswordButton}
                  >
                    <Text style={styles.showPasswordText}>
                      {showPassword ? 'Ẩn' : 'Hiện'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {validationErrors.password && (
                  <Text style={styles.errorText}>{validationErrors.password}</Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    placeholder="Xác nhận mật khẩu"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    style={[
                      styles.passwordInput,
                      validationErrors.confirmPassword && styles.inputError
                    ]}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.showPasswordButton}
                  >
                    <Text style={styles.showPasswordText}>
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {validationErrors.confirmPassword && (
                  <Text style={styles.errorText}>{validationErrors.confirmPassword}</Text>
                )}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={isLoading}
                style={[
                  styles.registerButton,
                  isLoading && styles.registerButtonDisabled
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.registerButtonText}>Tạo tài khoản</Text>
                )}
              </TouchableOpacity>

              {/* Terms */}
              <Text style={styles.termsText}>
                Bằng cách tạo tài khoản, bạn đồng ý với{' '}
                <Text style={styles.termsLink}>Điều khoản dịch vụ</Text>
                {' '}và{' '}
                <Text style={styles.termsLink}>Chính sách bảo mật</Text>
              </Text>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Đã có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.loginLink}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 48,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoIcon: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  brandSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  formContainer: {
    gap: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#EBF8FF',
  },
  roleButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  roleButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  nameContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  nameInputContainer: {
    flex: 1,
    gap: 8,
  },
  textInput: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#111827',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#111827',
  },
  showPasswordButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  showPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },
  registerButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  registerButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  termsLink: {
    color: '#007AFF',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 16,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
