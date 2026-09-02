// apps/storefront/src/lib/auth/user-store.ts
import fs from 'fs';
import path from 'path';

export interface UserProfileData {
  email: string;
  name: string;
  phone?: string;
  password?: string;
  buyerType?: 'b2c' | 'b2b';
  companyName?: string;
  gstNumber?: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

function loadPersistedUsers(): Map<string, UserProfileData> {
  const map = new Map<string, UserProfileData>();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((u: UserProfileData) => {
          if (u && u.email) map.set(u.email.toLowerCase(), u);
        });
      }
    }
  } catch {
    // ignore
  }
  return map;
}

function persistUsers(map: Map<string, UserProfileData>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const arr = Array.from(map.values());
    fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
  } catch {
    // ignore
  }
}

const globalForUsers = globalThis as unknown as {
  __anuprerna_users?: Map<string, UserProfileData>;
};

const map = globalForUsers.__anuprerna_users ?? loadPersistedUsers();

if (process.env.NODE_ENV !== 'production') {
  globalForUsers.__anuprerna_users = map;
}

if (!map.has('anantkr10000@gmail.com')) {
  map.set('anantkr10000@gmail.com', {
    email: 'anantkr10000@gmail.com',
    name: 'Anant Kumar',
    phone: '+91 9876543210',
    password: 'Anant@1234',
    buyerType: 'b2c',
  });
}

export const userStore = {
  get(email: string): UserProfileData | undefined {
    return map.get(email.toLowerCase());
  },
  set(email: string, data: UserProfileData): void {
    map.set(email.toLowerCase(), data);
    persistUsers(map);
  },
  has(email: string): boolean {
    return map.has(email.toLowerCase());
  },
  delete(email: string): boolean {
    const res = map.delete(email.toLowerCase());
    persistUsers(map);
    return res;
  },
};
