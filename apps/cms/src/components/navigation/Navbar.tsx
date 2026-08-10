'use client';

import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const { logout, userEmail, authority } = useAuth();

  return (
    <nav className="wv-navbar flex justify-between items-center px-6">
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-800 text-lg">Weave Admin Console</span>
      </div>
      <div className="flex items-center gap-4">
        {userEmail && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-700">{userEmail}</span>
            {authority?.superuser && <span className="bg-purple-100 text-purple-700 font-semibold px-1.5 py-0.5 rounded text-[10px]">SU</span>}
            {authority?.admin && <span className="bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded text-[10px]">ADMIN</span>}
          </div>
        )}
        <button
          onClick={logout}
          type="button"
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4 text-slate-500" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
}

