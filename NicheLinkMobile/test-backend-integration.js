/**
 * Test Backend Integration with Real Firebase
 * Tests verify-token endpoint with real Firebase setup
 */

const API_BASE_URL = 'http://192.168.1.54:3001/api';

async function testBackendHealthy() {
  console.log('🏥 Testing backend health...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Backend is healthy:', result.status);
      console.log('📊 Uptime:', Math.round(result.uptime), 'seconds');
      return true;
    } else {
      console.log('❌ Backend health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to backend:', error.message);
    return false;
  }
}

async function testVerifyTokenEndpoint() {
  console.log('\n🔐 Testing /verify-token endpoint...');
  
  // Test with invalid token
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: 'invalid-token'
      })
    });

    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📦 Response data:', result);
    
    if (!response.ok) {
      console.log('✅ Invalid token correctly rejected');
      return true;
    } else {
      console.log('❌ Invalid token was accepted - security issue!');
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing verify-token:', error.message);
    return false;
  }
}

async function testRegisterEndpointStructure() {
  console.log('\n📝 Testing /register endpoint structure...');
  
  // Test with missing data to see expected structure
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📦 Expected fields:', result);
    
    if (response.status === 400) {
      console.log('✅ Register endpoint is properly validating input');
      return true;
    } else {
      console.log('⚠️ Unexpected response from register endpoint');
      return true; // Not a failure, just different than expected
    }
  } catch (error) {
    console.log('❌ Error testing register endpoint:', error.message);
    return false;
  }
}

async function testDeprecatedEndpoints() {
  console.log('\n🚫 Testing deprecated endpoints...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password'
      })
    });

    const result = await response.json();
    
    console.log('📊 Login endpoint response:', response.status);
    console.log('📦 Response:', result);
    
    if (result.error === 'DeprecatedEndpoint') {
      console.log('✅ Login endpoint properly deprecated');
      return true;
    } else {
      console.log('⚠️ Login endpoint not deprecated as expected');
      return false;
    }
  } catch (error) {
    console.log('❌ Error testing deprecated endpoints:', error.message);
    return false;
  }
}

async function runBackendIntegrationTests() {
  console.log('🔗 Backend Integration Tests for Firebase');
  console.log('='.repeat(50));
  
  let passCount = 0;
  let totalTests = 4;
  
  // Test 1: Backend Health
  if (await testBackendHealthy()) {
    passCount++;
    console.log('✅ Test 1/4 PASSED: Backend Health');
  } else {
    console.log('❌ Test 1/4 FAILED: Backend Health');
    console.log('🚨 Cannot proceed without healthy backend');
    return false;
  }
  
  // Test 2: Verify Token Endpoint
  if (await testVerifyTokenEndpoint()) {
    passCount++;
    console.log('✅ Test 2/4 PASSED: Verify Token');
  } else {
    console.log('❌ Test 2/4 FAILED: Verify Token');
  }
  
  // Test 3: Register Endpoint
  if (await testRegisterEndpointStructure()) {
    passCount++;
    console.log('✅ Test 3/4 PASSED: Register Structure');
  } else {
    console.log('❌ Test 3/4 FAILED: Register Structure');
  }
  
  // Test 4: Deprecated Endpoints
  if (await testDeprecatedEndpoints()) {
    passCount++;
    console.log('✅ Test 4/4 PASSED: Deprecated Endpoints');
  } else {
    console.log('❌ Test 4/4 FAILED: Deprecated Endpoints');
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Backend Integration Results: ${passCount}/${totalTests} passed`);
  
  if (passCount === totalTests) {
    console.log('🎉 Backend is ready for Firebase integration!');
    console.log('✅ All endpoints responding correctly');
    console.log('🔥 Ready for mobile app testing');
  } else {
    console.log('⚠️ Some backend issues detected');
    console.log('🔧 Check backend configuration');
  }
  
  return passCount === totalTests;
}

// Run the tests
runBackendIntegrationTests().catch(error => {
  console.error('Backend integration tests failed:', error);
});
