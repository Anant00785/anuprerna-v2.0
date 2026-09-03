import { LoginRequest, OtpSendRequest, OtpVerifyRequest, EmailVerifyRequest } from '../types/nverse.types.js';

export function parseLoginRequest(data: any): LoginRequest {
  return {
    email: data?.email,
    contactNumber: data?.contactNumber,
    password: data?.password,
  };
}

export function parseOtpSendRequest(data: any): OtpSendRequest {
  return {
    contactNumber: data?.contactNumber,
  };
}

export function parseOtpVerifyRequest(data: any): OtpVerifyRequest {
  return {
    contactNumber: data?.contactNumber,
    otp: data?.otp,
  };
}

export function parseEmailVerifyRequest(data: any): EmailVerifyRequest {
  return {
    email: data?.email,
    token: data?.token,
  };
}

export function parsePaginationQuery(query: any) {
  const page = parseInt(query?.page || '1', 10);
  const size = parseInt(query?.size || '10', 10);
  return {
    page: isNaN(page) || page < 1 ? 1 : page,
    size: isNaN(size) || size < 1 ? 10 : size,
  };
}
