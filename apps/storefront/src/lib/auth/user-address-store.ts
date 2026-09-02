import fs from "fs";
import path from "path";

export interface AddressRecord {
  id: number;
  email: string;
  name: string;
  companyName?: string;
  addressLine1: string;
  addressLineOne?: string;
  addressLine2?: string;
  addressLineTwo?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  primaryPhone?: string;
  contactEmail?: string;
  addressType?: string;
  isDefault?: boolean;
  primaryBillingAddress?: boolean;
  primaryShippingAddress?: boolean;
  createdAt: number;
}

const DATA_DIR = path.resolve(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "user-addresses.json");

function loadPersistedAddresses(): Map<string, AddressRecord[]> {
  const map = new Map<string, AddressRecord[]>();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const data = JSON.parse(raw);
      if (typeof data === "object" && data !== null) {
        Object.entries(data).forEach(([email, list]) => {
          if (Array.isArray(list)) {
            map.set(email.toLowerCase(), list);
          }
        });
      }
    }
  } catch {
    // ignore
  }
  return map;
}

function persistAddresses(map: Map<string, AddressRecord[]>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const obj: Record<string, AddressRecord[]> = {};
    map.forEach((list, email) => {
      obj[email] = list;
    });
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), "utf8");
  } catch {
    // ignore
  }
}

const globalForAddresses = globalThis as unknown as {
  __anuprerna_user_addresses?: Map<string, AddressRecord[]>;
};

const addressMap = globalForAddresses.__anuprerna_user_addresses ?? loadPersistedAddresses();

if (process.env.NODE_ENV !== "production") {
  globalForAddresses.__anuprerna_user_addresses = addressMap;
}

export const userAddressStore = {
  getAddresses(email: string): AddressRecord[] {
    const key = email.toLowerCase().trim();
    return addressMap.get(key) || [];
  },

  addAddress(email: string, payload: Record<string, unknown>): AddressRecord {
    const key = email.toLowerCase().trim();
    const list = addressMap.get(key) || [];
    const id = Date.now() + Math.floor(Math.random() * 1000);

    const line1 = String(payload.addressLine1 || payload.addressLineOne || payload.line1 || payload.street || "").trim();
    const line2 = String(payload.addressLine2 || payload.addressLineTwo || payload.line2 || "").trim();
    const phone = String(payload.phone || payload.primaryPhone || payload.contactNumber || payload.phoneNumber || "").trim();

    const record: AddressRecord = {
      id,
      email: key,
      name: String(payload.name || "").trim(),
      companyName: String(payload.companyName || "").trim(),
      addressLine1: line1,
      addressLineOne: line1,
      addressLine2: line2,
      addressLineTwo: line2,
      city: String(payload.city || "").trim(),
      state: String(payload.state || "").trim(),
      postalCode: String(payload.postalCode || payload.zip || payload.pincode || "").trim(),
      country: String(payload.country || "India").trim(),
      phone: phone,
      primaryPhone: phone,
      contactEmail: String(payload.contactEmail || payload.email || key).trim(),
      addressType: String(payload.addressType || "SHIPPING").trim(),
      isDefault: list.length === 0 || payload.isDefault === true,
      primaryBillingAddress: Boolean(payload.primaryBillingAddress ?? true),
      primaryShippingAddress: Boolean(payload.primaryShippingAddress ?? true),
      createdAt: Date.now(),
    };

    list.unshift(record);
    addressMap.set(key, list);
    persistAddresses(addressMap);
    return record;
  },

  updateAddress(email: string, id: number, payload: Partial<AddressRecord>): boolean {
    const key = email.toLowerCase().trim();
    const list = addressMap.get(key) || [];
    const idx = list.findIndex((a) => a.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...payload, id };
      addressMap.set(key, list);
      persistAddresses(addressMap);
      return true;
    }
    return false;
  },

  deleteAddress(email: string, id: number): boolean {
    const key = email.toLowerCase().trim();
    const list = addressMap.get(key) || [];
    const newList = list.filter((a) => a.id !== id);
    if (newList.length !== list.length) {
      addressMap.set(key, newList);
      persistAddresses(addressMap);
      return true;
    }
    return false;
  },
};
