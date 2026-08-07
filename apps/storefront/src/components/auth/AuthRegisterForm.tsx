"use client";

import React, { useState } from "react";
import { authRepository } from "@/lib/api/repositories/auth.repository";
import { profileRepository } from "@/lib/api/repositories/profile.repository";
import { useAuthStore } from "@/stores/auth.store";

interface AuthRegisterFormProps {
  email: string;
  onSuccessRegister: () => void;
  onBack: () => void;
}

export const AuthRegisterForm: React.FC<AuthRegisterFormProps> = ({
  email: initialEmail,
  onSuccessRegister,
  onBack,
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setToken, setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName) {
      setError("Please fill in all required fields.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await authRepository.registerCustomer({
        email,
        password,
        firstName,
        lastName,
        phone,
      });

      if (res && res.jwt) {
        setToken(res.jwt);

        try {
          const profile = await profileRepository.getCustomerProfile(res.jwt);
          setUser(profile);
        } catch {
          setUser({ email, firstName, lastName, phone });
        }

        setLoading(false);
        onSuccessRegister();
      } else {
        setLoading(false);
        setError("Registration failed. Please try again.");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Registration failed. Please try again.");
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

      <h3 className="font-medium text-2xl mb-1 text-gray-900">Create Account</h3>
      <p className="text-[#9fa6b8] text-sm mb-6">
        Sign up to manage your profile and orders
      </p>

      {error && (
        <div className="p-3 mb-4 text-xs text-red-700 bg-red-50 rounded border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              First Name *
            </label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="w-full px-3 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8E7862] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="w-full px-3 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8E7862] text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8E7862] text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 234 567 890"
            className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8E7862] text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Password *
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
            className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8E7862] text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 rounded bg-[#8E7862] text-white hover:bg-[#6c5b48] py-3 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
};
