"use client";

import React, { useState } from "react";
import Image from "next/image";
import { authRepository } from "@/lib/api/repositories/auth.repository";

interface AuthForgotPasswordProps {
  email: string;
  onBack: () => void;
}

export const AuthForgotPassword: React.FC<AuthForgotPasswordProps> = ({
  email: initialEmail,
  onBack,
}) => {
  const [email, setEmail] = useState(initialEmail || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Email is required.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await authRepository.sendPasswordResetEmail(cleanEmail);
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 min-w-[80%]">
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
        <h3 className="font-medium text-2xl mb-2">Forgot Password?</h3>
        <p className="text-[#9fa6b8]">Enter your email registered with us</p>

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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter your email"
              />
              {errorMsg && <p className="text-red-500 text-xs mt-1">{errorMsg}</p>}
            </div>

            <button
              className="w-full mt-5 rounded bg-[#8E7862] text-white py-2 hover:bg-[#6c5b48] transition-colors font-medium flex items-center justify-center gap-2"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Send"
              )}
            </button>
          </form>

          {success && (
            <div className="mt-4 p-3 bg-green-50 text-green-700 text-xs rounded border border-green-200">
              Password reset link has been sent to your email address.
            </div>
          )}

          <div className="w-full flex justify-end mt-4">
            <button
              type="button"
              onClick={onBack}
              className="text-base text-[#8E7862] hover:underline"
            >
              &lt; Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
