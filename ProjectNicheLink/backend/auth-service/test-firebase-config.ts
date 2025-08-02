import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Firebase Configuration Check:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY_ID:', process.env.FIREBASE_PRIVATE_KEY_ID);
console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);
console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY?.length);

// Test if we can parse the private key
try {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  console.log('Private key format looks valid:', privateKey?.includes('-----BEGIN PRIVATE KEY-----'));
} catch (error) {
  console.error('Private key parsing error:', error);
}

console.log('\n🌐 Testing network connectivity to Google services...');

// Test basic network connectivity
import https from 'https';

const testUrl = 'https://www.googleapis.com';
const req = https.get(testUrl, (res) => {
  console.log(`✅ Can reach ${testUrl} - Status: ${res.statusCode}`);
}).on('error', (err) => {
  console.error(`❌ Cannot reach ${testUrl}:`, err.message);
});

req.setTimeout(5000, () => {
  console.error('❌ Request timeout');
  req.destroy();
});
