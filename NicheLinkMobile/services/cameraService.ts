import { Camera, CameraType, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Alert } from 'react-native';

export interface CameraSettings {
  type: CameraType;
  flashMode: FlashMode;
  quality: number; // 0 to 1
}

export interface MediaAsset {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  fileSize?: number;
  fileName?: string;
}

export interface CameraPermissions {
  camera: boolean;
  microphone: boolean;
  mediaLibrary: boolean;
}

class CameraService {
  private defaultSettings: CameraSettings = {
    type: 'back',
    flashMode: 'auto',
    quality: 0.8,
  };

  async requestPermissions(): Promise<CameraPermissions> {
    try {
      const [cameraStatus, microphoneStatus, mediaLibraryStatus] = await Promise.all([
        Camera.requestCameraPermissionsAsync(),
        Camera.requestMicrophonePermissionsAsync(),
        MediaLibrary.requestPermissionsAsync(),
      ]);

      return {
        camera: cameraStatus.status === 'granted',
        microphone: microphoneStatus.status === 'granted',
        mediaLibrary: mediaLibraryStatus.status === 'granted',
      };
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return {
        camera: false,
        microphone: false,
        mediaLibrary: false,
      };
    }
  }

  async checkPermissions(): Promise<CameraPermissions> {
    try {
      const [cameraStatus, microphoneStatus, mediaLibraryStatus] = await Promise.all([
        Camera.getCameraPermissionsAsync(),
        Camera.getMicrophonePermissionsAsync(),
        MediaLibrary.getPermissionsAsync(),
      ]);

      return {
        camera: cameraStatus.status === 'granted',
        microphone: microphoneStatus.status === 'granted',
        mediaLibrary: mediaLibraryStatus.status === 'granted',
      };
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return {
        camera: false,
        microphone: false,
        mediaLibrary: false,
      };
    }
  }

  async ensurePermissions(): Promise<boolean> {
    const permissions = await this.checkPermissions();
    
    if (!permissions.camera) {
      const newPermissions = await this.requestPermissions();
      if (!newPermissions.camera) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }

    return true;
  }

  async takePicture(cameraRef: any, settings?: Partial<CameraSettings>): Promise<MediaAsset | null> {
    try {
      if (!cameraRef) {
        throw new Error('Camera reference is required');
      }

      const hasPermission = await this.ensurePermissions();
      if (!hasPermission) {
        return null;
      }

      const photo = await cameraRef.takePictureAsync({
        quality: settings?.quality || this.defaultSettings.quality,
        skipProcessing: false,
        exif: false,
      });

      const asset: MediaAsset = {
        uri: photo.uri,
        type: 'image',
        width: photo.width,
        height: photo.height,
      };

      return asset;
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
      return null;
    }
  }

  async recordVideo(
    cameraRef: any, 
    maxDuration: number = 60000, // 60 seconds
    settings?: Partial<CameraSettings>
  ): Promise<MediaAsset | null> {
    try {
      if (!cameraRef) {
        throw new Error('Camera reference is required');
      }

      const hasPermission = await this.ensurePermissions();
      if (!hasPermission) {
        return null;
      }

      const video = await cameraRef.recordAsync({
        quality: settings?.quality || this.defaultSettings.quality,
        maxDuration,
        mute: false,
      });

      const asset: MediaAsset = {
        uri: video.uri,
        type: 'video',
      };

      return asset;
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video. Please try again.');
      return null;
    }
  }

  async stopVideoRecording(cameraRef: any): Promise<void> {
    try {
      if (cameraRef) {
        await cameraRef.stopRecording();
      }
    } catch (error) {
      console.error('Error stopping video recording:', error);
    }
  }

  async pickImageFromLibrary(allowsEditing = true): Promise<MediaAsset | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photo library to select images.',
          [{ text: 'OK' }]
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: 'image',
          width: asset.width,
          height: asset.height,
          fileName: asset.fileName || undefined,
          fileSize: asset.fileSize || undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking image from library:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
      return null;
    }
  }

  async pickVideoFromLibrary(allowsEditing = false): Promise<MediaAsset | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant access to your photo library to select videos.',
          [{ text: 'OK' }]
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: 'video',
          width: asset.width,
          height: asset.height,
          duration: asset.duration || undefined,
          fileName: asset.fileName || undefined,
          fileSize: asset.fileSize || undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking video from library:', error);
      Alert.alert('Error', 'Failed to select video. Please try again.');
      return null;
    }
  }

  async saveToLibrary(uri: string, type: 'image' | 'video' = 'image'): Promise<boolean> {
    try {
      const permissions = await this.checkPermissions();
      
      if (!permissions.mediaLibrary) {
        const newPermissions = await this.requestPermissions();
        if (!newPermissions.mediaLibrary) {
          Alert.alert(
            'Permission Required',
            'Please grant access to save media to your photo library.',
            [{ text: 'OK' }]
          );
          return false;
        }
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      
      if (type === 'image') {
        // Create album for NicheLink images
        const album = await MediaLibrary.getAlbumAsync('NicheLink');
        if (album == null) {
          await MediaLibrary.createAlbumAsync('NicheLink', asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving to library:', error);
      Alert.alert('Error', 'Failed to save media to library.');
      return false;
    }
  }

  // Quick action methods for common use cases
  async quickCapture(type: 'photo' | 'video' = 'photo'): Promise<MediaAsset | null> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera access to capture media.',
          [{ text: 'OK' }]
        );
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: type === 'photo' 
          ? ImagePicker.MediaTypeOptions.Images 
          : ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: type === 'photo' ? 'image' : 'video',
          width: asset.width,
          height: asset.height,
          duration: asset.duration || undefined,
          fileName: asset.fileName || undefined,
          fileSize: asset.fileSize || undefined,
        };
      }

      return null;
    } catch (error) {
      console.error('Error in quick capture:', error);
      Alert.alert('Error', 'Failed to capture media. Please try again.');
      return null;
    }
  }

  async showMediaPicker(): Promise<MediaAsset | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Media',
        'Choose how you want to add media',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const result = await this.quickCapture('photo');
              resolve(result);
            },
          },
          {
            text: 'Photo Library',
            onPress: async () => {
              const result = await this.pickImageFromLibrary();
              resolve(result);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });
  }
}

export default new CameraService();
