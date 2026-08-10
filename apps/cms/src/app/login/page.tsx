'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Brand Side Section */}
      <div className="hidden lg:flex lg:w-2/5 bg-slate-50 flex-col justify-center items-center px-16 relative border-r border-slate-200">
        <div className="text-center">
          <h1 className="text-6xl font-light text-gray-800 mb-6 tracking-wider">WEAVE</h1>
          <div className="w-32 h-px bg-gray-400 mx-auto mb-8"></div>
          <p className="text-xl text-gray-600 font-light leading-relaxed">Management Console</p>
          <p className="text-lg text-gray-500 font-light mt-2">for Anuprerna</p>
        </div>
        <div className="absolute bottom-16 text-center">
          <p className="text-sm text-gray-400 font-light">Professional Dashboard Access</p>
        </div>
      </div>

      {/* Login Form Section */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-12">
            <h1 className="text-5xl font-light text-gray-800 mb-4 tracking-wider">WEAVE</h1>
            <div className="w-24 h-px bg-gray-400 mx-auto mb-6"></div>
            <p className="text-lg text-gray-600 font-light">Anuprerna Management Console</p>
          </div>

          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-light text-gray-800 mb-3">Access Dashboard</h2>
              <p className="text-gray-500 font-light">Enter your credentials to continue</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="wv-input"
                  placeholder="your.email@company.com"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 uppercase tracking-wide">
                  Password
                </label>
                <div className="w-full relative">
                  <input
                    type={hidePassword ? 'password' : 'text'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="wv-input pr-10"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setHidePassword(!hidePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {hidePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="wv-btn w-full py-3 px-8 text-white font-medium text-base uppercase tracking-wide flex items-center justify-center gap-3"
                >
                  {loading && (
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  )}
                  <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                </button>
              </div>
            </form>

            <div className="text-center">
              <span className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer">
                Forgot your password? click here
              </span>
            </div>

            <div className="text-center pt-4">
              <p className="text-xs text-gray-400 font-light uppercase tracking-wide">Secure Access Portal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
