// Simple authentication test using curl-like approach
const http = require('http');

// Test credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

const payload = JSON.stringify({
  username: TEST_EMAIL,
  password: TEST_PASSWORD
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/authenticate/email',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log('🔐 Testing authentication...');
console.log('📧 Email:', TEST_EMAIL);
console.log('🔑 Password:', TEST_PASSWORD);
console.log('🌐 Endpoint: http://localhost:3000/authenticate/email');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📊 Response Status:', res.statusCode);
    console.log('📝 Response Body:', data);
    
    if (res.statusCode === 200) {
      try {
        const response = JSON.parse(data);
        if (response.token) {
          console.log('\n✅ SUCCESS!');
          console.log('🎯 JWT Token:', response.token);
          
          // Decode JWT header and payload
          const tokenParts = response.token.split('.');
          if (tokenParts.length === 3) {
            console.log('\n📋 JWT Analysis:');
            const header = JSON.parse(Buffer.from(tokenParts[0], 'base64url').toString('utf8'));
            const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString('utf8'));
            console.log('  Header:', JSON.stringify(header));
            console.log('  Payload:', JSON.stringify(payload));
            console.log('\n✅ All tests passed!');
          }
        } else {
          console.log('❌ No token in response');
        }
      } catch (e) {
        console.log('❌ Error parsing response:', e.message);
      }
    } else if (res.statusCode === 401) {
      console.log('\n❌ AUTHENTICATION FAILED');
      console.log('   - Check if database is seeded: node simple_seed.js');
      console.log('   - Check if user exists: test@example.com');
      console.log('   - Check if password is hashed correctly');
    } else {
      console.log('\n❌ Unexpected status code:', res.statusCode);
    }
    
    console.log('\n🎯 Test Summary:');
    console.log('  Email: test@example.com');
    console.log('  Password: password123');
    console.log('  Status: ' + (res.statusCode === 200 ? '✅ PASS' : '❌ FAIL'));
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
  console.log('\n💡 Make sure the server is running:');
  console.log('   1. npm run build');
  console.log('   2. npm run dev');
  console.log('   3. Then run this test');
});

req.write(payload);
req.end();

// Timeout after 5 seconds
setTimeout(() => {
  console.log('\n⏰ Test timed out - make sure server is running on port 3000');
  process.exit(1);
}, 5000);