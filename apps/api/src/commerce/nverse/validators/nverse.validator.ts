// @ts-nocheck
import { LoginRequest, OtpSendRequest, OtpVerifyRequest, EmailVerifyRequest } from '../types/nverse.types.js';

export function validateLoginRequest(data: LoginRequest) {
  if (!data.email && !data.contactNumber) {
    return 'Email or contact number is required';
  }
  if (!data.password) {
    return 'Password is required';
  }
  return null;
}

export function validateOtpSendRequest(data: OtpSendRequest) {
  if (!data.contactNumber) {
    return 'Contact number is required';
  }
  return null;
}

export function validateOtpVerifyRequest(data: OtpVerifyRequest) {
  if (!data.contactNumber || !data.otp) {
    return 'Contact number and OTP are required';
  }
  return null;
}

export function validateEmailVerifyRequest(data: EmailVerifyRequest) {
  if (!data.email || !data.token) {
    return 'Email and token are required';
  }
  return null;
}
// @ts-nocheck
// @ts-nocheck
