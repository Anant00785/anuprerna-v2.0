"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { authRepository } from "@/lib/api/repositories/auth.repository";
import { profileRepository } from "@/lib/api/repositories/profile.repository";
import { useAuthStore } from "@/stores/auth.store";

interface AuthRegisterFormProps {
  email: string;
  onSuccessRegister?: () => void;
  onBack: () => void;
}

export const AuthRegisterForm: React.FC<AuthRegisterFormProps> = ({
  email,
  onSuccessRegister,
  onBack,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccessful, setIsSuccessful] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const { setToken, setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setErrorMsg("First name is required.");
      return;
    }
    if (!lastName.trim()) {
      setErrorMsg("Last name is required.");
      return;
    }
    if (!password || password.length < 8) {
      setErrorMsg("Password is required. Minimum 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Confirm Password does not match with Password");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await authRepository.registerCustomer({
        email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      if (res?.success === false) {
        setErrorMsg(res.message || "Registration failed. Please try again.");
        return;
      }

      const token = (res as any)?.token;
      if (token) {
        setToken(token);
        try {
          const profile = await profileRepository.getCustomerProfile(token);
          setUser(profile);
        } catch {
          setUser({ email, userName: `${firstName.trim()} ${lastName.trim()}` });
        }
      }

      setIsSuccessful(true);

      // Auto-redirect to home or returnUrl after short confirmation feedback
      setTimeout(() => {
        if (onSuccessRegister) {
          onSuccessRegister();
        } else {
          router.push(returnUrl);
          router.refresh();
        }
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Registration failed. Please try again.");
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
        <div className="flex gap-2 items-center">
          <span
            onClick={onBack}
            className="material-symbols-outlined cursor-pointer text-[#302e2e]"
          >
            arrow_back_ios
          </span>
          <h3 className="font-medium text-2xl mb-2">Create your account</h3>
        </div>
        <p className="text-[#9fa6b8]">
          You are creating an account with{" "}
          <span className="text-black font-semibold">{email}</span>
        </p>

        <div className="fb-login-form my-3">
          <form onSubmit={handleSubmit}>
            <div className="flex justify-between items-center gap-2 my-2.5">
              <div className="w-1/2">
                <label htmlFor="f-name" className="text-sm font-bold block mb-1">
                  First Name :
                </label>
                <input
                  className="w-full px-2 py-2 border border-[#F0F5FA] rounded outline-none focus:border-[#8E7862]"
                  type="text"
                  id="f-name"
                  name="firstname"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="First Name"
                />
              </div>
              <div className="w-1/2">
                <label htmlFor="l-name" className="text-sm font-bold block mb-1">
                  Last Name :
                </label>
                <input
                  className="w-full px-2 py-2 border border-[#F0F5FA] rounded outline-none focus:border-[#8E7862]"
                  type="text"
                  id="l-name"
                  name="lastname"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="my-2.5">
              <label htmlFor="password" className="text-sm font-bold block mb-1">
                Password :
              </label>
              <div className="w-full border border-[#F0F5FA] rounded flex items-center justify-between gap-0.5 pr-2 focus-within:border-[#8E7862]">
                <input
                  className="w-full px-2 py-2 outline-none"
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
            </div>

            <div className="my-2.5">
              <label htmlFor="c-password" className="text-sm font-bold block mb-1">
                Confirm Password :
              </label>
              <div className="w-full border border-[#F0F5FA] rounded flex items-center justify-between gap-0.5 pr-2 focus-within:border-[#8E7862]">
                <input
                  className="w-full px-2 py-2 outline-none"
                  type={showConfirmPassword ? "text" : "password"}
                  id="c-password"
                  name="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Re-Enter your password"
                />
                <div
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[#9fa6b8] mt-1">
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </div>
              </div>
            </div>

            {errorMsg && <p className="text-red-500 text-xs mt-2">{errorMsg}</p>}

            <button
              className="w-full mt-5 rounded bg-[#8E7862] text-white py-2 hover:bg-[#6c5b48] transition-colors font-medium flex items-center justify-center gap-2"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          {isSuccessful && (
            <div className="px-2 mt-5 py-2 shadow flex gap-4 items-center justify-between border border-[#8E7862]/20 rounded text-xs text-gray-700">
              <span className="material-symbols-outlined text-2xl text-[#8E7862]">
                celebration
              </span>
              <div>
                Thank You for creating an account. Please check your email inbox / SPAM to
                verify.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
