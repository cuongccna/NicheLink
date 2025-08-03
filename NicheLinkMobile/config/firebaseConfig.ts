import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

// Firebase configuration - sẽ được tự động load từ google-services.json/GoogleService-Info.plist
// Không cần manual config cho React Native Firebase

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  console.log('🔥 Initializing Firebase...');
} else {
  console.log('🔥 Firebase already initialized');
}

export { auth };
export default firebase;
