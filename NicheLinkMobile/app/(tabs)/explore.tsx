import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity } from 'react-native';

import { CameraComponent } from '@/components/CameraComponent';
import { Collapsible } from '@/components/Collapsible';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '../../context/AuthContext';
import cameraService, { MediaAsset } from '../../services/cameraService';
import notificationService from '../../services/notificationService';

function ExploreContent() {
  const { user } = useAuth();
  const [showCamera, setShowCamera] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<MediaAsset | null>(null);

  const handleCameraCapture = (asset: MediaAsset) => {
    setCapturedMedia(asset);
    Alert.alert('Success', `${asset.type === 'image' ? 'Photo' : 'Video'} captured successfully!`);
  };

  const handleQuickCapture = async () => {
    const asset = await cameraService.quickCapture('photo');
    if (asset) {
      setCapturedMedia(asset);
      Alert.alert('Success', 'Photo captured successfully!');
    }
  };

  const handleMediaPicker = async () => {
    const asset = await cameraService.showMediaPicker();
    if (asset) {
      setCapturedMedia(asset);
      Alert.alert('Success', 'Media selected successfully!');
    }
  };

  const sendTestNotification = async () => {
    try {
      await notificationService.initialize();
      await notificationService.sendCampaignNotification(
        'Test Campaign',
        'This is a test notification for NicheLink!'
      );
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#007AFF', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="camera.fill"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Sprint 7 Features</ThemedText>
      </ThemedView>
      
      <ThemedText>Welcome {user?.firstName}! Explore the new mobile features.</ThemedText>

      <Collapsible title="📱 Camera Integration">
        <ThemedText style={styles.description}>
          Capture photos and videos for your campaigns with our integrated camera system.
        </ThemedText>
        
        <ThemedView style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={() => setShowCamera(true)}
          >
            <ThemedText style={styles.buttonText}>Open Camera</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleQuickCapture}
          >
            <ThemedText style={styles.secondaryButtonText}>Quick Capture</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleMediaPicker}
          >
            <ThemedText style={styles.secondaryButtonText}>Media Picker</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        {capturedMedia && (
          <ThemedView style={styles.mediaPreview}>
            <ThemedText style={styles.mediaText}>
              ✅ {capturedMedia.type === 'image' ? 'Photo' : 'Video'} captured
            </ThemedText>
            {capturedMedia.type === 'image' && (
              <Image source={{ uri: capturedMedia.uri }} style={styles.previewImage} />
            )}
          </ThemedView>
        )}
      </Collapsible>

      <Collapsible title="🔔 Push Notifications">
        <ThemedText style={styles.description}>
          Real-time notifications for campaign updates, messages, and payments.
        </ThemedText>
        
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={sendTestNotification}
        >
          <ThemedText style={styles.buttonText}>Send Test Notification</ThemedText>
        </TouchableOpacity>
      </Collapsible>

      <Collapsible title="🎨 Mobile-First Design">
        <ThemedText style={styles.description}>
          Dark/Light mode support with touch-friendly interface and accessibility features.
        </ThemedText>
        <ThemedText>
          • Responsive design for all screen sizes{'\n'}
          • Touch-friendly buttons and gestures{'\n'}
          • Automatic dark/light mode detection{'\n'}
          • Optimized for iOS and Android
        </ThemedText>
      </Collapsible>

      <Collapsible title="⚡ Mobile Workflows">
        <ThemedText style={styles.description}>
          Optimized workflows with swipe gestures and offline support.
        </ThemedText>
        <ThemedText>
          • Swipe gestures for quick actions{'\n'}
          • Offline data caching{'\n'}
          • Voice-to-text input support{'\n'}
          • Gesture-based navigation
        </ThemedText>
      </Collapsible>

      <Collapsible title="🔗 Backend Integration">
        <ThemedText style={styles.description}>
          Ready for integration with existing microservices.
        </ThemedText>
        <ThemedText>
          • Authentication service integration{'\n'}
          • Campaign API connectivity{'\n'}
          • Real-time messaging system{'\n'}
          • Media upload capabilities
        </ThemedText>
      </Collapsible>

      <CameraComponent
        visible={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
        mode="photo"
      />
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  description: {
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
    marginVertical: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  mediaPreview: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  mediaText: {
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
});

export default function TabTwoScreen() {
  return (
    <ExploreContent />
  );
}
