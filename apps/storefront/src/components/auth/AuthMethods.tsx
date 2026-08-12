"use client";

import React from "react";
import Image from "next/image";
import { useGoogleLogin } from "@react-oauth/google";

interface AuthMethodsProps {
  onSelectMethod: (method: "BASIC" | "GOOGLE") => void;
  onGoogleSuccess: (tokenResponse: any) => void;
  onGoogleError?: () => void;
}

export const AuthMethods: React.FC<AuthMethodsProps> = ({
  onSelectMethod,
  onGoogleSuccess,
  onGoogleError,
}) => {
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      onGoogleSuccess(tokenResponse);
    },
    onError: () => {
      if (onGoogleError) onGoogleError();
    },
  });

  const handleGoogleClick = () => {
    onSelectMethod("GOOGLE");
    if (googleLogin) {
      googleLogin();
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

      {/* Form Container */}
      <div className="fb-login-form-container flex flex-col items-stretch">
        <h3 className="font-medium text-2xl mb-2">Welcome</h3>
        <p className="text-[#9fa6b8]">Use your email or another service to continue </p>

        <div className="fb-auth-provider my-3">
          <div className="flex flex-col justify-between gap-2">
            <button
              onClick={() => onSelectMethod("BASIC")}
              className="w-full mt-2 rounded border-2 border-[#8E7862] text-[#8E7862] py-2 hover:border-[#6c5b48] transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-normal"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">email</span>
              Continue with Email
            </button>

            <button
              onClick={handleGoogleClick}
              className="w-full mt-2 rounded border-2 border-[#8E7862] text-[#8E7862] py-2 hover:border-[#6c5b48] transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-normal"
              type="button"
            >
              <Image
                src="/assets/img/google_logo.svg"
                width={20}
                height={20}
                alt="Google"
                unoptimized
              />
              Continue with Google
            </button>
          </div>

          <div className="w-full flex flex-col justify-start text-sm my-3">
            <p className="text-[#9fa6b8]">
              By continuing you agree to the website&apos;s{" "}
              <a
                className="text-[#8E7862] underline"
                href="https://anuprerna.com/content/policies/terms-conditions/174271"
                target="_blank"
                rel="noreferrer"
              >
                T&amp;C
              </a>{" "}
              &amp;{" "}
              <a
                className="text-[#8E7862] underline"
                href="https://anuprerna.com/content/policies/privacy-policy/173823"
                target="_blank"
                rel="noreferrer"
              >
                Privacy Policies
              </a>
            </p>
            <p className="text-[#9fa6b8]">
              and to receive emails for service related information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
