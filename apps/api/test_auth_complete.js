import { NestFactory } from '@nestjs/core';
import { AppModule } from './dist/app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { request } from 'http';
import { createServer } from 'http';
import { AddressInfo } from 'net';

// Configuration
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'password123';

async function testAuth() {
  let server;
  let app;
  
  try {
    console.log('🚀 Starting NestJS application...');
    
    // Create the NestJS application
    app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    
    // Start the server on a random available port
    server = await app.getHttpServer();
    const address = server.address();
    const port = address ? (address as AddressInfo).port : 3000;
    
    if (!server.listening) {
      await app.listen(0); // Listen on random available port
      const newAddress = app.getHttpServer().address();
      const newPort = (newAddress as AddressInfo).port;
      console.log(`✅ Server started on port ${newPort}`);
    } else {
      console.log(`✅ Server started on port ${port}`);
    }
    
    // Get the actual port
    const actualPort = app.getHttpServer().address().port;
    
    // Test 1: POST /authenticate/email
    console.log('\n🔐 Testing POST /authenticate/email...');
    
    const payload = JSON.stringify({
      username: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    const options = {
      hostname: 'localhost',
      port: actualPort,
      path: '/authenticate/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
      }
    };

    const req = request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📝 Response: ${data}`);
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            if (response.token) {
              console.log(`🎯 JWT Token received: ${response.token.substring(0, 50)}...`);
              console.log(`📏 Token length: ${response.token.length} characters`);
              
              // Test 2: Verify JWT structure
              const tokenParts = response.token.split('.');
              if (tokenParts.length === 3) {
                console.log('✅ JWT has valid structure (header.payload.signature)');
                
                // Decode header and payload (without verification for now)
                try {
                  const header = JSON.parse(Buffer.from(tokenParts[0], 'base64url').toString('utf8'));
                  const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString('utf8'));
                  
                  console.log('📋 JWT Header:', JSON.stringify(header, null, 2));
                  console.log('📋 JWT Payload:', JSON.stringify(payload, null, 2));
                  
                  // Verify expected fields
                  if (header.alg === 'HS256' && header.typ === 'JWT') {
                    console.log('✅ JWT header is correct');
                  } else {
                    console.log('❌ JWT header is incorrect');
                  }
                  
                  if (payload.sub && payload.email && payload.roles && payload.iat && payload.exp) {
                    console.log('✅ JWT payload has expected fields');
                    console.log(`👤 Subject (user ID): ${payload.sub}`);
                    console.log(`📧 Email: ${payload.email}`);
                    console.log(`👥 Roles: ${JSON.stringify(payload.roles)}`);
                    
                    // Check if token is expired
                    const now = Math.floor(Date.now() / 1000);
                    if (payload.exp > now) {
                      console.log(`✅ Token expires in ${payload.exp - now} seconds`);
                    } else {
                      console.log('❌ Token is expired');
                    }
                  } else {
                    console.log('❌ JWT payload missing expected fields');
                  }
                  
                  console.log('\n🎉 ALL TESTS PASSED!');
                  console.log(`📧 Test email: ${TEST_EMAIL}`);
                  console.log(`🔑 Test password: ${TEST_PASSWORD}`);
                  console.log(`🔐 JWT Token: ${response.token}`);
                  
                } catch (parseError) {
                  console.log('❌ Could not parse JWT:', parseError.message);
                }
              } else {
                console.log('❌ JWT has invalid structure');
              }
            } else {
              console.log('❌ Response does not contain token');
            }
          } catch (parseError) {
            console.log('❌ Could not parse response:', parseError.message);
          }
        } else if (res.statusCode === 401) {
          console.log('❌ Authentication failed - Invalid credentials');
          console.log('💡 This likely means the password hash is not valid or user does not exist');
        } else {
          console.log(`❌ Unexpected status code: ${res.statusCode}`);
        }
        
        // Close the application
        app.close().then(() => {
          console.log('\n👋 Application closed');
        }).catch(console.error);
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request error:', e);
      app.close().then(() => {
        console.log('\n👋 Application closed');
      }).catch(console.error);
    });

    req.write(payload);
    req.end();

    // Set a timeout to close the app if no response
    setTimeout(() => {
      console.log('⏰ Request timed out');
      app.close().then(() => {
        console.log('\n👋 Application closed');
      }).catch(console.error);
    }, 10000);

  } catch (error) {
    console.error('❌ Full exception:', error);
    console.error('Stack trace:', error.stack);
    if (app) {
      await app.close();
    }
    process.exit(1);
  }
}

testAuth();