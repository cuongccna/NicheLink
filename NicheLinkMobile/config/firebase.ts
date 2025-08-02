import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB-test-key", // Temporary - replace with real key from Firebase Console
  authDomain: "nichelink-2b13e.firebaseapp.com",
  projectId: "nichelink-2b13e",
  storageBucket: "nichelink-2b13e.appspot.com",
  messagingSenderId: "123456789", // Temporary - replace with real sender ID
  appId: "1:123456789:web:test-app-id" // Temporary - replace with real app ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

export { auth };
export default app;
