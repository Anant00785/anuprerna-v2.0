"use client";

import React, { useState } from "react";
import Image from "next/image";
import { authRepository } from "@/lib/api/repositories/auth.repository";

interface AuthEmailFormProps {
  email: string;
  setEmail: (email: string) => void;
  onSuccess: (isRegistered: boolean) => void;
  onBack: () => void;
}

export const AuthEmailForm: React.FC<AuthEmailFormProps> = ({
  email,
  setEmail,
  onSuccess,
  onBack,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("A valid email id is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await authRepository.checkEmailTenant(cleanEmail);
      setEmail(cleanEmail);
      onSuccess(res.registered);
    } catch (err: any) {
      setError(err?.message || "Failed to verify email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 min-w-[80%] md:mr-3">
      {/* Header Logo */}
      <div className="flex items-center gap-2 mb-5">
        <Image
          src="/assets/img/logo-brown.svg"
          width={40}
          height={40}
          alt="Anuprerna"
          unoptimized
        />
        <h1 className="text-2xl uppercase text-[#8E7862]">Anuprerna</h1>
      </div>

      <div className="fb-login-form-container flex flex-col items-stretch">
        <div className="flex gap-2 items-center">
          <span
            onClick={onBack}
            className="material-symbols-outlined cursor-pointer text-[#302e2e]"
          >
            arrow_back_ios
          </span>
          <h3 className="font-medium text-2xl mb-2">Continue with email</h3>
        </div>

        <p className="text-[#9fa6b8]">
          We’ll check if you have an account, and help create one if you don’t.
        </p>

        <div className="fb-login-form my-3">
          <form onSubmit={handleSubmit}>
            <div className="my-2.5">
              <label htmlFor="email" className="text-sm font-bold block mb-1">
                Email :
              </label>
              <input
                className="w-full px-2 py-2 border border-[#F0F5FA] rounded outline-none focus:border-[#8E7862]"
                type="email"
                id="email"
                name="username"
                autoFocus
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter your email"
              />
              {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>

            <button
              className="w-full mt-5 rounded bg-[#8E7862] text-white py-2 hover:bg-[#6c5b48] transition-colors font-medium flex items-center justify-center gap-2"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Continue"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
