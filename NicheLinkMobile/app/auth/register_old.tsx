import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { RegisterRequest } from '../../types/auth';

export default function RegisterScreen() {
  const { register, isLoading, error, clearError } = useAuth();
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

  const validateForm = (): boolean => {
    const errors: Partial<RegisterRequest> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      // Navigation will be handled by the auth context and root layout
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

  React.useEffect(() => {
    if (error) {
      Alert.alert('Registration Failed', error.message);
    }
  }, [error]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          <View className="flex-1 justify-center py-12">
            {/* Logo/Brand */}
            <View className="items-center mb-8">
              <Text className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                NicheLink
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 mt-2">
                Join the Community
              </Text>
            </View>

            {/* Register Form */}
            <View className="space-y-4">
              <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                Create Account
              </Text>

              {/* Role Selection */}
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  I am a...
                </Text>
                <View className="flex-row space-x-4">
                  <TouchableOpacity
                    onPress={() => handleInputChange('role', 'INFLUENCER')}
                    className={`flex-1 py-3 px-4 rounded-lg border ${
                      formData.role === 'INFLUENCER'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Text className={`text-center ${
                      formData.role === 'INFLUENCER'
                        ? 'text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      Influencer
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleInputChange('role', 'SME')}
                    className={`flex-1 py-3 px-4 rounded-lg border ${
                      formData.role === 'SME'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Text className={`text-center ${
                      formData.role === 'SME'
                        ? 'text-blue-700 dark:text-blue-300 font-semibold'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      Business
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Name Inputs */}
              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name
                  </Text>
                  <TextInput
                    value={formData.firstName}
                    onChangeText={(value) => handleInputChange('firstName', value)}
                    placeholder="First name"
                    placeholderTextColor="#9CA3AF"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      validationErrors.firstName 
                        ? 'border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  />
                  {validationErrors.firstName && (
                    <Text className="text-red-500 text-xs mt-1">
                      {validationErrors.firstName}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name
                  </Text>
                  <TextInput
                    value={formData.lastName}
                    onChangeText={(value) => handleInputChange('lastName', value)}
                    placeholder="Last name"
                    placeholderTextColor="#9CA3AF"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      validationErrors.lastName 
                        ? 'border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  />
                  {validationErrors.lastName && (
                    <Text className="text-red-500 text-xs mt-1">
                      {validationErrors.lastName}
                    </Text>
                  )}
                </View>
              </View>

              {/* Email Input */}
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    validationErrors.email 
                      ? 'border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                />
                {validationErrors.email && (
                  <Text className="text-red-500 text-sm mt-1">
                    {validationErrors.email}
                  </Text>
                )}
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </Text>
                <View className="relative">
                  <TextInput
                    value={formData.password}
                    onChangeText={(value) => handleInputChange('password', value)}
                    placeholder="Create a password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showPassword}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                      validationErrors.password 
                        ? 'border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3"
                  >
                    <Text className="text-blue-600 dark:text-blue-400 text-sm">
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {validationErrors.password && (
                  <Text className="text-red-500 text-sm mt-1">
                    {validationErrors.password}
                  </Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </Text>
                <View className="relative">
                  <TextInput
                    value={formData.confirmPassword}
                    onChangeText={(value) => handleInputChange('confirmPassword', value)}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!showConfirmPassword}
                    className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                      validationErrors.confirmPassword 
                        ? 'border-red-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3"
                  >
                    <Text className="text-blue-600 dark:text-blue-400 text-sm">
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </Text>
                  </TouchableOpacity>
                </View>
                {validationErrors.confirmPassword && (
                  <Text className="text-red-500 text-sm mt-1">
                    {validationErrors.confirmPassword}
                  </Text>
                )}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={isLoading}
                className={`w-full py-3 rounded-lg mt-6 ${
                  isLoading 
                    ? 'bg-gray-400' 
                    : 'bg-blue-600 active:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center text-lg font-semibold">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>

              {/* Terms */}
              <Text className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                By creating an account, you agree to our{' '}
                <Text className="text-blue-600 dark:text-blue-400">Terms of Service</Text>
                {' '}and{' '}
                <Text className="text-blue-600 dark:text-blue-400">Privacy Policy</Text>
              </Text>

              {/* Login Link */}
              <View className="flex-row justify-center mt-6">
                <Text className="text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text className="text-blue-600 dark:text-blue-400 font-semibold">
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
