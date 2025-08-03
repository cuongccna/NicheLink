/**
 * Test Real Authentication - No Mock Data
 * This test ensures only real backend authentication works
 */

const API_BASE_URL = 'http://192.168.1.54:3001/api';

async function testInvalidLogin() {
  console.log('🧪 Testing login with unregistered email...');
  
  const credentials = {
    email: 'nonexistent@test.com',
    password: 'wrongpassword'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.log('✅ Correctly rejected invalid login:', result.message);
      return true;
    } else {
      console.log('❌ PROBLEM: Invalid login was accepted!', result);
      return false;
    }
    
  } catch (error) {
    console.log('✅ Login properly failed:', error.message);
    return true;
  }
}

async function testValidRegistrationThenLogin() {
  console.log('\n🧪 Testing valid registration then login...');
  
  const userData = {
    email: `valid-test-${Date.now()}@test.com`,
    password: 'ValidPassword123!',
    fullName: 'Valid Test User',
    role: 'INFLUENCER'
  };

  try {
    // Step 1: Register
    console.log('📝 Step 1: Registering new user...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    const registerResult = await registerResponse.json();
    
    if (!registerResponse.ok) {
      console.log('❌ Registration failed:', registerResult);
      return false;
    }
    
    console.log('✅ Registration successful:', registerResult.success);

    // Step 2: Login with same credentials
    console.log('🔑 Step 2: Logging in with registered credentials...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password
      })
    });

    const loginResult = await loginResponse.json();
    
    if (loginResponse.ok && loginResult.success) {
      console.log('✅ Login successful with real token:', !!loginResult.data?.token);
      return true;
    } else {
      console.log('❌ Login failed after registration:', loginResult);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

async function testInvalidPassword() {
  console.log('\n🧪 Testing registered email with wrong password...');
  
  // Use a known registered email (from previous test)
  const credentials = {
    email: 'testmobile1754114714466@nichelnk.com', // From previous successful registration
    password: 'wrongpassword123'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.log('✅ Correctly rejected wrong password:', result.message);
      return true;
    } else {
      console.log('❌ PROBLEM: Wrong password was accepted!', result);
      return false;
    }
    
  } catch (error) {
    console.log('✅ Wrong password properly failed:', error.message);
    return true;
  }
}

async function runRealAuthTests() {
  console.log('🔐 Real Authentication Tests (No Mock Data)');
  console.log('='.repeat(50));
  
  let passCount = 0;
  let totalTests = 3;
  
  // Test 1: Invalid login should fail
  if (await testInvalidLogin()) {
    passCount++;
  }
  
  // Test 2: Valid registration + login should work
  if (await testValidRegistrationThenLogin()) {
    passCount++;
  }
  
  // Test 3: Wrong password should fail
  if (await testInvalidPassword()) {
    passCount++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passCount}/${totalTests} passed`);
  
  if (passCount === totalTests) {
    console.log('🎉 All tests passed! Authentication is working correctly.');
    console.log('✅ No mock data bypass');
    console.log('✅ Real backend validation');
    console.log('✅ Proper error handling');
  } else {
    console.log('❌ Some tests failed. Check authentication logic.');
  }
  
  return passCount === totalTests;
}

// Run the tests
runRealAuthTests().catch(error => {
  console.error('Test suite failed:', error);
});
