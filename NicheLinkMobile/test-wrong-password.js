/**
 * Test backend authentication with wrong password
 */

const API_BASE_URL = 'http://192.168.1.54:3001/api';

async function testWrongPassword() {
  console.log('🧪 Testing wrong password...');
  
  const credentials = {
    email: 'testmobile1754114714466@nichelnk.com',
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
    
    console.log('📊 Response status:', response.status);
    console.log('📦 Response data:', result);
    
    if (response.ok && result.success) {
      console.log('❌ CRITICAL ISSUE: Wrong password was accepted!');
      console.log('🚨 Backend authentication is not validating passwords correctly');
      return false;
    } else {
      console.log('✅ Correctly rejected wrong password');
      return true;
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return false;
  }
}

testWrongPassword();
