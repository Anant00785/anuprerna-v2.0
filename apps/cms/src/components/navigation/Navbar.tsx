'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      type="button"
      className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 text-xs font-medium px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
    >
      <span className="w-1.5 h-3.5 bg-[#ca9b6d] rounded-sm inline-block"></span>
      <span>Logout</span>
    </button>
  );
}



