import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  userType?: string;
  avatarUrl?: string;
  [key: string]: any;
}

interface AuthState {
  jwt: string | null;
  user: UserProfile | null;
  isLoggedIn: boolean;
  setToken: (token: string) => void;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
}

function setCookie(name: string, value: string, days: number = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      jwt: null,
      user: null,
      isLoggedIn: false,
      setToken: (token: string) => {
        setCookie("jwt_token", token);
        set({ jwt: token, isLoggedIn: true });
      },
      setUser: (user: UserProfile | null) => set({ user }),
      logout: () => {
        deleteCookie("jwt_token");
        set({ jwt: null, user: null, isLoggedIn: false });
      },
    }),
    {
      name: "anuprerna-auth",
    }
  )
);
