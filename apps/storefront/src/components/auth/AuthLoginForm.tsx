"use client";

import React, { useState } from "react";
import Image from "next/image";
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
  const [loginFailure, setLoginFailure] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { setToken, setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 1) {
      setErrorMsg("Password is required. Minimum 8 characters.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setLoginFailure(false);

    try {
      const res = await authRepository.loginEmail(email, password);
      if (res && res.jwt) {
        setToken(res.jwt);
        try {
          const profile = await profileRepository.getCustomerProfile(res.jwt);
          setUser(profile);
        } catch {
          setUser({ email });
        }
        onSuccessLogin();
      } else {
        setLoginFailure(true);
        setErrorMsg("Invalid credentials. Please try again.");
      }
    } catch (err: any) {
      setLoginFailure(true);
      setErrorMsg(err?.message || "Invalid credentials. Please try again.");
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

      <div className="fb-login-form-container flex flex-col">
        <div className="flex gap-2 items-center">
          <span
            onClick={onBack}
            className="material-symbols-outlined cursor-pointer text-[#302e2e]"
          >
            arrow_back_ios
          </span>
          {!loginFailure ? (
            <h3 className="font-medium text-2xl mb-2">Sign in with email</h3>
          ) : (
            <h3 className="font-medium text-2xl mb-2">Incorrect Password</h3>
          )}
        </div>

        {!loginFailure ? (
          <p className="text-[#9fa6b8]">
            Seems like you already have an account with{" "}
            <span className="text-black font-semibold">{email}</span>. Enter your
            password to sign in
          </p>
        ) : (
          <p className="text-[#9fa6b8]">
            You have entered the wrong password for your account with {email}.
            Retry with another password or continue using a different sign-in
            option or reset your password
          </p>
        )}

        <div className="fb-login-form my-3">
          <form onSubmit={handleSubmit}>
            <div className="my-2.5">
              <label htmlFor="password" className="text-sm font-bold block mb-1">
                Password :
              </label>
              <div className="w-full border border-[#F0F5FA] rounded flex items-center justify-between gap-0.5 pr-2 focus-within:border-[#8E7862]">
                <input
                  className="w-full px-2 py-2 md:min-w-[300px] outline-none"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Enter your password"
                />
                <div
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#9fa6b8] mt-1">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </div>
              </div>

              {errorMsg && <p className="text-red-500 text-xs mt-1">{errorMsg}</p>}
            </div>

            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-[#8E7862] hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            <button
              className="w-full mt-5 rounded bg-[#8E7862] text-white py-2 hover:bg-[#6c5b48] transition-colors font-medium flex items-center justify-center gap-2"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
