import fs from 'fs';
import path from 'path';

// Shared persistent store for 6-digit email OTPs
export interface OtpEntry {
  code: string;
  expiresAt: number;
}

const OTP_DIR = path.join(process.cwd(), '.orders-data');
const OTP_FILE = path.join(OTP_DIR, 'active-otps.json');

const g = global as unknown as { __otpStore?: Map<string, OtpEntry> };
if (!g.__otpStore) {
  g.__otpStore = new Map<string, OtpEntry>();
}

function readDiskOtps(): Record<string, OtpEntry> {
  try {
    if (fs.existsSync(OTP_FILE)) {
      return JSON.parse(fs.readFileSync(OTP_FILE, 'utf8'));
    }
  } catch {}
  return {};
}

function writeDiskOtps(data: Record<string, OtpEntry>) {
  try {
    if (!fs.existsSync(OTP_DIR)) {
      fs.mkdirSync(OTP_DIR, { recursive: true });
    }
    fs.writeFileSync(OTP_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch {}
}

export const otpStore = {
  get(email: string): OtpEntry | undefined {
    const key = email.toLowerCase().trim();
    // 1. Memory check
    const mem = g.__otpStore?.get(key);
    if (mem && Date.now() <= mem.expiresAt) {
      return mem;
    }
    // 2. Disk fallback (persists across server restarts and worker processes)
    const disk = readDiskOtps();
    const entry = disk[key];
    if (entry && Date.now() <= entry.expiresAt) {
      g.__otpStore?.set(key, entry);
      return entry;
    }
    return undefined;
  },
  set(email: string, entry: OtpEntry): void {
    const key = email.toLowerCase().trim();
    g.__otpStore?.set(key, entry);
    const disk = readDiskOtps();
    disk[key] = entry;
    writeDiskOtps(disk);
  },
  delete(email: string): void {
    const key = email.toLowerCase().trim();
    g.__otpStore?.delete(key);
    const disk = readDiskOtps();
    delete disk[key];
    writeDiskOtps(disk);
  },
};
