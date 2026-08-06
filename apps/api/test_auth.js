import { NestFactory } from '@nestjs/core';
import { AppModule } from './dist/app.module.js';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { request } from 'http';

async function testAuth() {
  try {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(3000);
    
    console.log('Server started on port 3000');
    
    // Make a request to the endpoint
    const payload = JSON.stringify({
      username: 'test@example.com',
      password: 'password123'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
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
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
        app.close();
      });
    });
    
    req.on('error', (e) => {
      console.error('Request error:', e);
      app.close();
    });
    
    req.write(payload);
    req.end();
    
  } catch (error) {
    console.error('Full exception:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testAuth();
