// apps/storefront/src/lib/auth/user-store.ts
export interface UserProfileData {
  email: string;
  name: string;
  phone?: string;
  buyerType?: "b2c" | "b2b";
  companyName?: string;
  gstNumber?: string;
}

const globalForUsers = globalThis as unknown as {
  __anuprerna_users?: Map<string, UserProfileData>;
};

export const userStore =
  globalForUsers.__anuprerna_users ?? new Map<string, UserProfileData>();

if (process.env.NODE_ENV !== "production") {
  globalForUsers.__anuprerna_users = userStore;
}

// Pre-populate demo accounts with real names
userStore.set("anantkr10000@gmail.com", {
  email: "anantkr10000@gmail.com",
  name: "Anant Kumar",
  phone: "+91 9876543210",
  buyerType: "b2c",
});
userStore.set("support@anuprerna.com", {
  email: "support@anuprerna.com",
  name: "Amit Singha",
  phone: "+91 9895923232",
  buyerType: "b2b",
});
