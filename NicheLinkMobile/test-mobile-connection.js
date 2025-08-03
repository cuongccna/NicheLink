/**
 * Test connection to backend from mobile device
 * This helps debug network connectivity issues
 */

const API_BASE_URL = 'http://192.168.1.54:3001/api';

async function testConnection() {
  console.log('🔗 Testing connection to backend...');
  console.log('📍 Target URL:', API_BASE_URL);
  
  try {
    console.log('⏱️ Starting request with 20s timeout...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Connection successful in ${duration}ms`);
    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📦 Response data:', data);
      return true;
    } else {
      console.log('❌ Bad response status:', response.status);
      return false;
    }
    
  } catch (error) {
    const endTime = Date.now();
    
    if (error.name === 'AbortError') {
      console.log('⏰ Request timed out after 20 seconds');
      console.log('💡 This might be a firewall or network issue');
    } else {
      console.log('❌ Connection failed:', error.message);
      console.log('💡 Possible causes:');
      console.log('   - Backend service not running');
      console.log('   - Wrong IP address');
      console.log('   - Firewall blocking connections');
      console.log('   - Network connectivity issues');
    }
    
    return false;
  }
}

async function testRegistration() {
  console.log('\n🧪 Testing registration endpoint...');
  
  const userData = {
    email: `mobile-test-${Date.now()}@test.com`,
    password: 'TestPassword123!',
    fullName: 'Mobile Test User',
    role: 'INFLUENCER'
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️ Registration completed in ${duration}ms`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Registration successful');
      return result;
    } else {
      const error = await response.json();
      console.log('❌ Registration failed:', error);
      return null;
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏰ Registration timed out after 20 seconds');
    } else {
      console.log('❌ Registration error:', error.message);
    }
    return null;
  }
}

async function runMobileTests() {
  console.log('📱 Mobile Device Network Test');
  console.log('='.repeat(50));
  
  // Test 1: Basic connectivity
  const isConnected = await testConnection();
  
  if (!isConnected) {
    console.log('\n❌ Cannot proceed with authentication tests');
    console.log('🔧 Troubleshooting steps:');
    console.log('   1. Check if backend is running: curl http://192.168.1.51:3001/api/health');
    console.log('   2. Check Windows Firewall settings');
    console.log('   3. Verify devices are on same network');
    console.log('   4. Try from web browser: http://192.168.1.51:3001/api/health');
    return;
  }
  
  // Test 2: Registration endpoint
  const registrationResult = await testRegistration();
  
  if (registrationResult) {
    console.log('\n🎉 All mobile tests passed!');
    console.log('✅ Network connectivity working');
    console.log('✅ Authentication endpoints accessible');
  } else {
    console.log('\n⚠️ Basic connectivity OK but registration failed');
    console.log('💡 Check backend logs for detailed error information');
  }
  
  console.log('\n📋 Summary:');
  console.log(`   Backend URL: ${API_BASE_URL}`);
  console.log('   Timeout: 20 seconds');
  console.log('   Ready for mobile app testing');
}

// Run the tests
runMobileTests().catch(error => {
  console.error('Test suite failed:', error);
});
