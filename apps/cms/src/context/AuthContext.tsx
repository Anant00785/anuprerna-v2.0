'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthService, Authority } from '@/lib/auth-service';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userEmail: string | null;
  authority: Authority | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  userEmail: null,
  authority: null,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authority, setAuthority] = useState<Authority | null>(null);

  // Initialize auth ONCE on app mount
  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') return;

      const valid = AuthService.hasValidJWT();
      setIsAuthenticated(valid);

      if (valid) {
        const storedEmail = localStorage.getItem('user_email');
        setUserEmail(storedEmail);

        const storedAuth = localStorage.getItem('authority');
        if (storedAuth) {
          try {
            setAuthority(JSON.parse(storedAuth));
          } catch {
            // fallback
          }
        }

        try {
          const authData = await AuthService.resolveAuthorityToken();
          setAuthority(authData);
        } catch (e) {
          console.warn('Authority resolution on initial load:', e);
        }
      } else {
        setUserEmail(null);
        setAuthority(null);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Handle route guards without triggering auth re-initialization
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && pathname !== '/login') {
      router.replace('/login');
    } else if (isAuthenticated && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [pathname, isAuthenticated, isLoading, router]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const { authority: authData } = await AuthService.login(username, password);
      setIsAuthenticated(true);
      setUserEmail(username);
      if (authData) setAuthority(authData);
      router.replace('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.destroySession();
    setIsAuthenticated(false);
    setUserEmail(null);
    setAuthority(null);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userEmail,
        authority,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
