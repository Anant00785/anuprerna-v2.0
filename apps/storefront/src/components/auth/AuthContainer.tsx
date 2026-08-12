"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthMethods } from "./AuthMethods";
import { AuthEmailForm } from "./AuthEmailForm";
import { AuthLoginForm } from "./AuthLoginForm";
import { AuthRegisterForm } from "./AuthRegisterForm";
import { AuthForgotPassword } from "./AuthForgotPassword";
import { authRepository } from "@/lib/api/repositories/auth.repository";
import { profileRepository } from "@/lib/api/repositories/profile.repository";
import { useAuthStore } from "@/stores/auth.store";

type AuthStep = "CHOICE" | "EMAIL" | "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";

export const AuthContainer: React.FC = () => {
  const [step, setStep] = useState<AuthStep>("CHOICE");
  const [email, setEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/profile/dashboard";

  const { setToken, setUser } = useAuthStore();

  const handleAuthComplete = () => {
    router.push(returnUrl);
  };

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setGoogleLoading(true);
    setGoogleError(null);

    const credential = tokenResponse?.access_token || tokenResponse?.credential;
    if (!credential) {
      setGoogleLoading(false);
      setGoogleError("Unable to retrieve Google credentials.");
      return;
    }

    try {
      let res;
      try {
        res = await authRepository.loginSocial("google_user", credential, "GOOGLE");
      } catch (err: any) {
        if (err?.message?.includes("401")) {
          res = await authRepository.registerSocial("google_user@anuprerna.com", credential, "GOOGLE");
        } else {
          throw err;
        }
      }

      if (res && res.jwt) {
        setToken(res.jwt);
        try {
          const profile = await profileRepository.getCustomerProfile(res.jwt);
          setUser(profile);
        } catch {
          setUser({ email: "google_user@anuprerna.com" });
        }
        setGoogleLoading(false);
        handleAuthComplete();
      } else {
        setGoogleLoading(false);
        setGoogleError("Google login succeeded, but no JWT token was returned.");
      }
    } catch (err: any) {
      setGoogleLoading(false);
      setGoogleError(err?.message || "Google authentication failed.");
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy-google-client-id"}>
      <section className="fb-login w-full flex justify-center items-center min-h-[90vh] bg-[#fffcf7]">
        <div className="w-full max-w-[956px] min-h-[67vh] bg-white rounded-2xl p-3 md:p-6 m-3 drop-shadow-xl flex flex-col md:flex-row justify-between items-stretch gap-3">
          
          {/* Left Panel: Dynamic Auth Steps */}
          <div className="md:flex-[50%] flex justify-center items-center">
            {googleLoading ? (
              <div className="flex flex-col items-center gap-3 text-center py-8">
                <div className="w-8 h-8 border-4 border-[#8E7862] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-700">Verifying Google Sign In...</p>
              </div>
            ) : (
              <div className="w-full flex justify-center items-center">
                {googleError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 w-full">
                    {googleError}
                  </div>
                )}

                {step === "CHOICE" && (
                  <AuthMethods
                    onSelectMethod={(method) => {
                      if (method === "BASIC") setStep("EMAIL");
                    }}
                    onGoogleSuccess={handleGoogleSuccess}
                    onGoogleError={() => setGoogleError("Google sign in failed.")}
                  />
                )}

                {step === "EMAIL" && (
                  <AuthEmailForm
                    email={email}
                    setEmail={setEmail}
                    onSuccess={(isRegistered) => {
                      if (isRegistered) {
                        setStep("LOGIN");
                      } else {
                        setStep("REGISTER");
                      }
                    }}
                    onBack={() => setStep("CHOICE")}
                  />
                )}

                {step === "LOGIN" && (
                  <AuthLoginForm
                    email={email}
                    onSuccessLogin={handleAuthComplete}
                    onForgotPassword={() => setStep("FORGOT_PASSWORD")}
                    onBack={() => setStep("EMAIL")}
                  />
                )}

                {step === "REGISTER" && (
                  <AuthRegisterForm
                    email={email}
                    onSuccessRegister={handleAuthComplete}
                    onBack={() => setStep("EMAIL")}
                  />
                )}

                {step === "FORGOT_PASSWORD" && (
                  <AuthForgotPassword
                    email={email}
                    onBack={() => setStep("LOGIN")}
                  />
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Auth Image matching legacy Angular site */}
          <div className="md:flex-[50%] rounded-2xl overflow-hidden relative flex justify-center items-center min-h-[300px] md:min-h-[480px]">
            <Image
              src="/assets/img/auth.jpeg"
              alt="Anuprerna"
              width={400}
              height={500}
              className="w-full h-full object-cover"
              priority
              unoptimized
            />
          </div>

        </div>
      </section>
    </GoogleOAuthProvider>
  );
};
