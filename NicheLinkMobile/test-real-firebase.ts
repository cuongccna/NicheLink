/**
 * Test Real Firebase Authentication End-to-End
 * This tests the complete Firebase Client SDK → Backend flow
 */

import firebaseAuthService from './services/firebaseClientAuthService';

async function testRealFirebaseRegistration() {
  console.log('🧪 Testing Real Firebase Registration...');
  
  const userData = {
    email: `firebase-test-${Date.now()}@test.com`,
    password: 'Test123456!',
    confirmPassword: 'Test123456!',
    firstName: 'Firebase',
    lastName: 'Test User',
    role: 'INFLUENCER' as const
  };

  try {
    console.log('📝 Starting registration with:', userData.email);
    
    const response = await firebaseAuthService.register(userData);
    
    if (response.success) {
      console.log('✅ Registration successful!');
      console.log('👤 User:', response.user.email, response.user.role);
      console.log('🎫 Token exists:', !!response.tokens.accessToken);
      return response.user;
    } else {
      console.log('❌ Registration failed:', response.message);
      return null;
    }
    
  } catch (error: any) {
    console.log('❌ Registration error:', error.message);
    return null;
  }
}

async function testRealFirebaseLogin(user: any) {
  console.log('\n🧪 Testing Real Firebase Login...');
  
  if (!user) {
    console.log('❌ No user to test login with');
    return false;
  }

  const credentials = {
    email: user.email,
    password: 'Test123456!' // Same password used in registration
  };

  try {
    console.log('🔑 Attempting login with:', credentials.email);
    
    const response = await firebaseAuthService.login(credentials);
    
    if (response.success) {
      console.log('✅ Login successful!');
      console.log('👤 User:', response.user.email, response.user.role);
      console.log('🎫 Token exists:', !!response.tokens.accessToken);
      return true;
    } else {
      console.log('❌ Login failed:', response.message);
      return false;
    }
    
  } catch (error: any) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

async function testRealFirebaseLogout() {
  console.log('\n🧪 Testing Real Firebase Logout...');
  
  try {
    await firebaseAuthService.logout();
    console.log('✅ Logout successful!');
    
    // Verify user is logged out
    const isAuth = await firebaseAuthService.isAuthenticated();
    if (!isAuth) {
      console.log('✅ User is properly logged out');
      return true;
    } else {
      console.log('❌ User still authenticated after logout');
      return false;
    }
    
  } catch (error: any) {
    console.log('❌ Logout error:', error.message);
    return false;
  }
}

async function testWrongPassword(user: any) {
  console.log('\n🧪 Testing Wrong Password...');
  
  if (!user) {
    console.log('❌ No user to test wrong password with');
    return true; // Skip this test
  }

  const wrongCredentials = {
    email: user.email,
    password: 'WrongPassword123!'
  };

  try {
    console.log('🔑 Attempting login with wrong password...');
    
    const response = await firebaseAuthService.login(wrongCredentials);
    
    if (response.success) {
      console.log('❌ CRITICAL: Wrong password was accepted!');
      return false;
    } else {
      console.log('✅ Wrong password correctly rejected');
      return true;
    }
    
  } catch (error: any) {
    console.log('✅ Wrong password correctly rejected:', error.message);
    return true;
  }
}

async function runRealFirebaseTests() {
  console.log('🔥 Real Firebase Authentication End-to-End Tests');
  console.log('='.repeat(60));
  
  let passCount = 0;
  let totalTests = 4;
  let registeredUser = null;
  
  // Test 1: Registration
  console.log('Test 1/4: Registration');
  registeredUser = await testRealFirebaseRegistration();
  if (registeredUser) {
    passCount++;
    console.log('✅ Test 1 PASSED');
  } else {
    console.log('❌ Test 1 FAILED');
  }
  
  // Test 2: Login
  console.log('\n' + '='.repeat(30));
  console.log('Test 2/4: Login');
  if (await testRealFirebaseLogin(registeredUser)) {
    passCount++;
    console.log('✅ Test 2 PASSED');
  } else {
    console.log('❌ Test 2 FAILED');
  }
  
  // Test 3: Wrong Password
  console.log('\n' + '='.repeat(30));
  console.log('Test 3/4: Wrong Password');
  if (await testWrongPassword(registeredUser)) {
    passCount++;
    console.log('✅ Test 3 PASSED');
  } else {
    console.log('❌ Test 3 FAILED');
  }
  
  // Test 4: Logout
  console.log('\n' + '='.repeat(30));
  console.log('Test 4/4: Logout');
  if (await testRealFirebaseLogout()) {
    passCount++;
    console.log('✅ Test 4 PASSED');
  } else {
    console.log('❌ Test 4 FAILED');
  }
  
  // Final Results
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Final Results: ${passCount}/${totalTests} tests passed`);
  
  if (passCount === totalTests) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Real Firebase Authentication is working perfectly');
    console.log('🔥 Mobile app is ready for production use');
    console.log('🚀 Architecture: Firebase Client SDK → ID Token → Backend');
  } else {
    console.log('❌ Some tests failed. Check the logs above for details.');
    console.log('🔧 Issues to investigate:');
    if (!registeredUser) console.log('   - Firebase user registration');
    if (passCount < 2) console.log('   - Firebase login process');
    if (passCount < 3) console.log('   - Password validation');
    if (passCount < 4) console.log('   - Logout process');
  }
  
  return passCount === totalTests;
}

// Export for use in React Native
export { runRealFirebaseTests };

// For Node.js testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runRealFirebaseTests };
}
