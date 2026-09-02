import fs from "fs";
import path from "path";

export interface CartItemRecord {
  id: number;
  email: string;
  fabricProductId?: number | null;
  finishedProductId?: number | null;
  selectedFabricId?: number | null;
  selectedSizeOptionId?: number | null;
  selectedFinishId?: string;
  customSize?: Record<string, unknown> | null;
  productGroup: string;
  orderType: string;
  quantity: number;
  makingCharge?: number | string;
  unit: string;
  price?: number;
  createdAt: number;
  updatedAt: number;
}

const DATA_DIR = path.resolve(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "user-carts.json");

function loadPersistedCarts(): Map<string, CartItemRecord[]> {
  const map = new Map<string, CartItemRecord[]>();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf8");
      const data = JSON.parse(raw);
      if (typeof data === "object" && data !== null) {
        Object.entries(data).forEach(([email, items]) => {
          if (Array.isArray(items)) {
            map.set(email.toLowerCase(), items);
          }
        });
      }
    }
  } catch {
    // ignore
  }
  return map;
}

function persistCarts(map: Map<string, CartItemRecord[]>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const obj: Record<string, CartItemRecord[]> = {};
    map.forEach((items, email) => {
      obj[email] = items;
    });
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), "utf8");
  } catch {
    // ignore
  }
}

const globalForCarts = globalThis as unknown as {
  __anuprerna_user_carts?: Map<string, CartItemRecord[]>;
};

const cartsMap = globalForCarts.__anuprerna_user_carts ?? loadPersistedCarts();

if (process.env.NODE_ENV !== "production") {
  globalForCarts.__anuprerna_user_carts = cartsMap;
}

export const localCartStore = {
  getCart(email: string): CartItemRecord[] {
    const key = email.toLowerCase().trim();
    return cartsMap.get(key) || [];
  },

  addItem(email: string, payload: Partial<CartItemRecord>): CartItemRecord {
    const key = email.toLowerCase().trim();
    const items = cartsMap.get(key) || [];
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const quantity = Number(payload.quantity) || 1;

    // Check if duplicate item exists
    const existingIdx = items.findIndex((it) => {
      if (payload.fabricProductId && it.fabricProductId === payload.fabricProductId) return true;
      if (payload.finishedProductId && it.finishedProductId === payload.finishedProductId) {
        return (
          it.selectedFinishId === (payload.selectedFinishId || "") &&
          it.selectedSizeOptionId === (payload.selectedSizeOptionId || null)
        );
      }
      return false;
    });

    if (existingIdx >= 0) {
      items[existingIdx].quantity += quantity;
      items[existingIdx].updatedAt = Date.now();
      cartsMap.set(key, items);
      persistCarts(cartsMap);
      return items[existingIdx];
    }

    const newItem: CartItemRecord = {
      id,
      email: key,
      fabricProductId: payload.fabricProductId ?? null,
      finishedProductId: payload.finishedProductId ?? null,
      selectedFabricId: payload.selectedFabricId ?? null,
      selectedSizeOptionId: payload.selectedSizeOptionId ?? null,
      selectedFinishId: String(payload.selectedFinishId ?? ""),
      customSize: payload.customSize ?? null,
      productGroup: String(payload.productGroup || (payload.fabricProductId ? "FABRIC" : "FINISHED_PRODUCT")),
      orderType: String(payload.orderType || "IN_STOCK"),
      quantity,
      makingCharge: payload.makingCharge ?? 0,
      unit: String(payload.unit || (payload.fabricProductId ? "METER" : "UNIT")),
      price: payload.price,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    items.push(newItem);
    cartsMap.set(key, items);
    persistCarts(cartsMap);
    return newItem;
  },

  updateItem(email: string, id: number, quantity: number): boolean {
    const key = email.toLowerCase().trim();
    const items = cartsMap.get(key) || [];
    const idx = items.findIndex((it) => it.id === id);
    if (idx >= 0) {
      if (quantity <= 0) {
        items.splice(idx, 1);
      } else {
        items[idx].quantity = quantity;
        items[idx].updatedAt = Date.now();
      }
      cartsMap.set(key, items);
      persistCarts(cartsMap);
      return true;
    }
    return false;
  },

  removeItem(email: string, id: number): boolean {
    const key = email.toLowerCase().trim();
    const items = cartsMap.get(key) || [];
    const newItems = items.filter((it) => it.id !== id);
    if (newItems.length !== items.length) {
      cartsMap.set(key, newItems);
      persistCarts(cartsMap);
      return true;
    }
    return false;
  },

  clearCart(email: string): void {
    const key = email.toLowerCase().trim();
    cartsMap.delete(key);
    persistCarts(cartsMap);
  },
};
