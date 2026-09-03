export interface LoginRequest {
  email?: string;
  contactNumber?: string;
  password?: string;
}

export interface OtpSendRequest {
  contactNumber: string;
}

export interface OtpVerifyRequest {
  contactNumber: string;
  otp: string;
}

export interface EmailVerifyRequest {
  email: string;
  token: string;
}

export interface PaginationQuery {
  page?: string;
  size?: string;
}
