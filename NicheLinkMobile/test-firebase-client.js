/**
 * Test Firebase Client SDK Authentication
 * This simulates the new authentication flow
 */

const API_BASE_URL = 'http://192.168.1.54:3001/api';

// Mock Firebase Client SDK behavior for testing
class MockFirebaseAuth {
  async signInWithEmailAndPassword(email, password) {
    console.log(`🔥 [MOCK FIREBASE] Attempting login: ${email}`);
    
    // Simulate Firebase authentication
    if (email === 'test@example.com' && password === 'password123') {
      return {
        user: {
          uid: 'firebase-user-123',
          email: email,
          emailVerified: true,
          getIdToken: async () => {
            // Return a mock ID token
            return 'mock-firebase-id-token-jwt-here';
          }
        }
      };
    } else {
      const error = new Error('Authentication failed');
      error.code = 'auth/wrong-password';
      throw error;
    }
  }

  async createUserWithEmailAndPassword(email, password) {
    console.log(`🔥 [MOCK FIREBASE] Creating user: ${email}`);
    
    return {
      user: {
        uid: 'firebase-new-user-123',
        email: email,
        emailVerified: false,
        getIdToken: async () => {
          return 'mock-firebase-new-user-id-token';
        }
      }
    };
  }
}

const mockAuth = new MockFirebaseAuth();

async function testFirebaseLogin() {
  console.log('🧪 Testing Firebase Client SDK login flow...');
  
  try {
    // Step 1: Firebase Auth
    const userCredential = await mockAuth.signInWithEmailAndPassword(
      'test@example.com',
      'password123'
    );
    
    console.log('✅ [STEP 1] Firebase authentication successful');
    
    // Step 2: Get ID Token
    const idToken = await userCredential.user.getIdToken();
    console.log('✅ [STEP 2] ID token obtained');
    
    // Step 3: Verify with backend
    const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: idToken
      })
    });

    const result = await response.json();
    
    console.log('📊 Backend response:', response.status);
    console.log('📦 Response data:', result);
    
    if (response.ok && result.success) {
      console.log('✅ [STEP 3] Backend verification successful');
      return true;
    } else {
      console.log('❌ [STEP 3] Backend verification failed');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Firebase login flow failed:', error.message);
    return false;
  }
}

async function testFirebaseRegistration() {
  console.log('\n🧪 Testing Firebase Client SDK registration flow...');
  
  try {
    // Step 1: Create Firebase user
    const userCredential = await mockAuth.createUserWithEmailAndPassword(
      `newuser-${Date.now()}@test.com`,
      'password123'
    );
    
    console.log('✅ [STEP 1] Firebase user created');
    
    // Step 2: Get ID Token
    const idToken = await userCredential.user.getIdToken();
    console.log('✅ [STEP 2] ID token obtained');
    
    // Step 3: Register with backend
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: idToken,
        email: userCredential.user.email,
        fullName: 'Test User',
        role: 'INFLUENCER',
        bio: 'Test user bio'
      })
    });

    const result = await response.json();
    
    console.log('📊 Backend response:', response.status);
    console.log('📦 Response data:', result);
    
    if (response.ok && result.success) {
      console.log('✅ [STEP 3] Backend registration successful');
      return true;
    } else {
      console.log('❌ [STEP 3] Backend registration failed');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Firebase registration flow failed:', error.message);
    return false;
  }
}

async function runFirebaseClientTests() {
  console.log('🔥 Firebase Client SDK Authentication Tests');
  console.log('='.repeat(50));
  
  let passCount = 0;
  let totalTests = 2;
  
  // Test 1: Login flow
  if (await testFirebaseLogin()) {
    passCount++;
  }
  
  // Test 2: Registration flow
  if (await testFirebaseRegistration()) {
    passCount++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passCount}/${totalTests} passed`);
  
  if (passCount === totalTests) {
    console.log('🎉 All Firebase Client SDK tests passed!');
    console.log('✅ New authentication architecture is working');
    console.log('🔥 Firebase Client SDK → ID Token → Backend Verification');
  } else {
    console.log('❌ Some tests failed. Check backend /verify-token endpoint.');
  }
  
  return passCount === totalTests;
}

// Run the tests
runFirebaseClientTests().catch(error => {
  console.error('Test suite failed:', error);
});
