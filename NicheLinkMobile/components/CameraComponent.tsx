import { Ionicons } from '@expo/vector-icons';
import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { MediaAsset } from '../services/cameraService';

interface CameraComponentProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (asset: MediaAsset) => void;
  mode?: 'photo' | 'video';
}

export const CameraComponent: React.FC<CameraComponentProps> = ({
  visible,
  onClose,
  onCapture,
  mode = 'photo',
}) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('auto');
  const [isRecording, setIsRecording] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  React.useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, []);

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      if (mode === 'photo') {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        if (photo) {
          const asset: MediaAsset = {
            uri: photo.uri,
            type: 'image',
            width: photo.width,
            height: photo.height,
          };
          onCapture(asset);
          onClose();
        }
      } else {
        if (isRecording) {
          cameraRef.current.stopRecording();
          setIsRecording(false);
        } else {
          setIsRecording(true);
          const video = await cameraRef.current.recordAsync({
            maxDuration: 30,
          });
          if (video) {
            const asset: MediaAsset = {
              uri: video.uri,
              type: 'video',
            };
            onCapture(asset);
          }
          setIsRecording(false);
          onClose();
        }
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Error', 'Failed to capture media');
    }
  };

  const toggleCameraType = () => {
    setFacing(facing === 'back' ? 'front' : 'back');
  };

  const toggleFlashMode = () => {
    const modes: FlashMode[] = ['auto', 'on', 'off'];
    const currentIndex = modes.indexOf(flash);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlash(modes[nextIndex]);
  };

  const getFlashIcon = () => {
    switch (flash) {
      case 'on':
        return 'flash';
      case 'off':
        return 'flash-off';
      default:
        return 'flash-auto';
    }
  };

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.centerContainer}>
          <Text>Requesting camera permission...</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={styles.centerContainer}>
          <Text style={styles.permissionText}>
            Camera access is required to use this feature
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {mode === 'photo' ? 'Take Photo' : 'Record Video'}
          </Text>
          <TouchableOpacity onPress={toggleFlashMode} style={styles.headerButton}>
            <Ionicons name={getFlashIcon() as any} size={24} color="white" />
          </TouchableOpacity>
        </View>

        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraType}
            >
              <Ionicons name="camera-reverse" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.captureButton,
                isRecording && styles.recordingButton,
              ]}
              onPress={handleCapture}
            >
              {mode === 'photo' ? (
                <View style={styles.captureButtonInner} />
              ) : (
                <View
                  style={[
                    styles.captureButtonInner,
                    isRecording && styles.recordingButtonInner,
                  ]}
                />
              )}
            </TouchableOpacity>

            <View style={styles.placeholder} />
          </View>
        </CameraView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 50,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 3,
    borderColor: '#000',
  },
  recordingButton: {
    backgroundColor: '#FF3B30',
  },
  recordingButtonInner: {
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  placeholder: {
    width: 50,
    height: 50,
  },
  permissionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
  },
});
