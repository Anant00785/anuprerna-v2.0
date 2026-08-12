"use client";

import React, { useState } from "react";
import { authRepository } from "@/lib/api/repositories/auth.repository";

interface AuthForgotPasswordProps {
  email: string;
  onBack: () => void;
}

export const AuthForgotPassword: React.FC<AuthForgotPasswordProps> = ({
  email: initialEmail,
  onBack,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await authRepository.sendPasswordResetEmail(email);
      setLoading(false);
      setSubmitted(true);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Failed to send password reset email.");
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

      <h3 className="font-medium text-2xl mb-1 text-gray-900">Reset Password</h3>
      <p className="text-[#9fa6b8] text-sm mb-6">
        Enter your email to receive password reset instructions.
      </p>

      {submitted ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          Password reset instructions have been sent to <strong>{email}</strong>.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 rounded border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8E7862] text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded bg-[#8E7862] text-white hover:bg-[#6c5b48] py-3 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}
    </div>
  );
};
