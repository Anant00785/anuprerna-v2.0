'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ProductionWarningBanner } from './ProductionWarningBanner';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Breadcrumbs } from './Breadcrumbs';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const isLoginPage = pathname === '/login' || pathname === '/';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Standalone Login Page - render immediately without blocking
  if (isLoginPage) {
    return <div className="min-h-screen w-full bg-white">{children}</div>;
  }

  // Prevent SSR Hydration mismatch on protected routes
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center gap-3 text-slate-700">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-light tracking-wide uppercase">Loading Weave Console...</p>
      </div>
    );
  }

  // Unauthenticated user trying to access protected routes
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 font-light">Redirecting to login portal...</p>
        </div>
      </div>
    );
  }

  // Protected Dashboard Layout
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-[#edf1f7]">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#edf1f7]">
          <div className="flex items-center justify-between px-8 pt-5 pb-3">
            <Breadcrumbs />
            <Navbar />
          </div>
          <main className="px-8 py-2 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
