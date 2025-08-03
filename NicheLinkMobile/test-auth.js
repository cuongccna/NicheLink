/**
 * Test Firebase Authentication endpoints
 */

const API_BASE_URL = 'http://192.168.1.54:3001/api';

async function testRegistration() {
  console.log('🧪 Testing Registration...');
  
  const userData = {
    email: `testmobile${Date.now()}@nichelnk.com`,
    password: 'TestPassword123!',
    fullName: 'Mobile Test User',
    role: 'INFLUENCER',
    bio: 'Testing Firebase authentication from mobile app'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration successful:', {
        email: userData.email,
        success: result.success,
        userId: result.data?.user?.id,
        firebaseUid: result.data?.firebaseUid
      });
      return userData;
    } else {
      console.log('❌ Registration failed:', result);
      return null;
    }
  } catch (error) {
    console.log('❌ Registration error:', error.message);
    return null;
  }
}

async function testLogin(credentials) {
  console.log('🧪 Testing Login...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful:', {
        email: credentials.email,
        success: result.success,
        userId: result.data?.user?.id,
        tokenExists: !!result.data?.token
      });
      return result;
    } else {
      console.log('❌ Login failed:', result);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Firebase Authentication Tests...\n');
  
  // Test 1: Register new user
  const newUser = await testRegistration();
  if (!newUser) {
    console.log('❌ Cannot proceed with login test - registration failed');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: Login with new user
  const loginResult = await testLogin(newUser);
  if (!loginResult) {
    console.log('❌ Login test failed');
    return;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 All tests passed! Firebase Authentication is working correctly.');
  console.log('✅ Registration ✅ Login');
}

// Run tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
});
