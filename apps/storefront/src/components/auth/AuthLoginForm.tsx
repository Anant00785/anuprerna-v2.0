"use client";

import React, { useState } from "react";
import { authRepository } from "@/lib/api/repositories/auth.repository";
import { profileRepository } from "@/lib/api/repositories/profile.repository";
import { useAuthStore } from "@/stores/auth.store";

interface AuthLoginFormProps {
  email: string;
  onSuccessLogin: () => void;
  onForgotPassword: () => void;
  onBack: () => void;
}

export const AuthLoginForm: React.FC<AuthLoginFormProps> = ({
  email,
  onSuccessLogin,
  onForgotPassword,
  onBack,
}) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setToken, setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await authRepository.loginEmail(email, password);
      if (res && res.jwt) {
        setToken(res.jwt);

        // Try fetching user profile details
        try {
          const profile = await profileRepository.getCustomerProfile(res.jwt);
          setUser(profile);
        } catch {
          // Default minimal profile
          setUser({ email });
        }

        setLoading(false);
        onSuccessLogin();
      } else {
        setLoading(false);
        setError("Invalid credentials. Please try again.");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="p-2 w-full max-w-[400px]">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-[#8E7862] hover:underline mb-4"
        type="button"
      >
        &larr; Back
      </button>

      <h3 className="font-medium text-2xl mb-1 text-gray-900">Welcome Back</h3>
      <p className="text-[#9fa6b8] text-sm mb-6 truncate">{email}</p>

      {error && (
        <div className="p-3 mb-4 text-xs text-red-700 bg-red-50 rounded border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8E7862] focus:border-transparent text-sm pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-[#8E7862] hover:underline font-medium"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 rounded bg-[#8E7862] text-white hover:bg-[#6c5b48] py-3 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
};
