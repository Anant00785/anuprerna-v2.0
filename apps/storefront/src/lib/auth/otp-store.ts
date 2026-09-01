// Shared in-memory store for 6-digit email OTPs
export interface OtpEntry {
  code: string;
  expiresAt: number;
}

const g = global as unknown as { __otpStore?: Map<string, OtpEntry> };
if (!g.__otpStore) {
  g.__otpStore = new Map<string, OtpEntry>();
}

export const otpStore = g.__otpStore;
