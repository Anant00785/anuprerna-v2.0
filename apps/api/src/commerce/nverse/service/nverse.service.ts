// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { NVerseRepository } from '../repository/nverse.repository.js';
import { LoginRequest, OtpSendRequest, OtpVerifyRequest, EmailVerifyRequest } from '../types/nverse.types.js';
import { simpleResponse, keyedResponse, paginatedResponse } from '../../../common/response/rain-response.js';

@Injectable()
export class NVerseService {
  constructor(private readonly repository: NVerseRepository) {}

  async login(data: LoginRequest) {
    let user;
    if (data.email) {
      user = await this.repository.findTenantByEmail(data.email);
    } else if (data.contactNumber) {
      user = await this.repository.findTenantByContactNumber(data.contactNumber);
    }

    if (!user) {
      return simpleResponse(false, 'Invalid credentials');
    }

    if (user.userPassword !== data.password) {
      return simpleResponse(false, 'Invalid credentials');
    }

    // In a real scenario, JWT token generation goes here.
    return keyedResponse('token', 'dummy-jwt-token');
  }

  async sendOtp(data: OtpSendRequest) {
    const user = await this.repository.findTenantByContactNumber(data.contactNumber);
    if (!user) {
      return simpleResponse(false, 'User not found');
    }
    // Real OTP sending logic
    return simpleResponse(true, 'OTP sent successfully');
  }

  async verifyOtp(data: OtpVerifyRequest) {
    // Dummy verification
    if (data.otp === '1234') {
      return keyedResponse('token', 'dummy-jwt-token-from-otp');
    }
    return simpleResponse(false, 'Invalid OTP');
  }

  async verifyEmail(data: EmailVerifyRequest) {
    // Dummy verification
    return simpleResponse(true, 'Email verified successfully');
  }

  async getVerificationTokens(page: number, size: number) {
    const { items, total } = await this.repository.getVerificationTokens(page, size);
    return paginatedResponse(items, total, page, size);
  }

  async getVerificationTokenById(id: string) {
    const token = await this.repository.getVerificationTokenById(id);
    if (!token) {
      return simpleResponse(false, 'Token not found');
    }
    return keyedResponse('data', token);
  }
}
// @ts-nocheck
