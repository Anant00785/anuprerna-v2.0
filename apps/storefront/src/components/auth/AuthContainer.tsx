"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { env } from "@/env";
import { AuthMethods } from "./AuthMethods";
import { AuthEmailForm } from "./AuthEmailForm";
import { AuthLoginForm } from "./AuthLoginForm";
import { AuthRegisterForm } from "./AuthRegisterForm";
import { AuthForgotPassword } from "./AuthForgotPassword";
import { authRepository } from "@/lib/api/repositories/auth.repository";
import { profileRepository } from "@/lib/api/repositories/profile.repository";
import { useAuthStore } from "@/stores/auth.store";

type AuthStep = "CHOICE" | "EMAIL" | "LOGIN" | "REGISTER" | "FORGOT_PASSWORD";

const AuthFlow: React.FC = () => {
  const [step, setStep] = useState<AuthStep>("CHOICE");
  const [email, setEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/profile/dashboard";

  const { setToken, setUser } = useAuthStore();
  const { loginWithPopup, getIdTokenClaims, user: auth0User } = useAuth0();

  const handleAuthComplete = () => {
    router.push(returnUrl);
  };

  /**
   * Loom's `/authenticate/social` calls `Auth0Service.validateToken(token, username)`:
   * it needs the raw Auth0 **ID token** and the tenant's real email as username.
   * The previous implementation sent a Google OAuth access token with the literal
   * username "google_user", which can never validate. Mirrors fabric's flow:
   * verify the tenant, register it if new, then authenticate.
   */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGoogleError(null);

    try {
      await loginWithPopup({
        authorizationParams: { connection: "google-oauth2", prompt: "login" },
      });

      const claims = await getIdTokenClaims();
      const idToken = claims?.__raw;
      const googleEmail = (claims?.email ?? auth0User?.email ?? "").trim().toLowerCase();

      if (!idToken || !googleEmail) {
        setGoogleError("Google sign in did not return a verified email address.");
        return;
      }

      const status = await authRepository.checkEmailTenant(googleEmail);
      if (!status.registered) {
        await authRepository.registerSocial(googleEmail, idToken, "GOOGLE");
      }

      const res = await authRepository.loginSocial(googleEmail, idToken, "GOOGLE");
      if (!res?.jwt) {
        setGoogleError("Google login succeeded, but no JWT token was returned.");
        return;
      }

      setToken(res.jwt);
      try {
        setUser(await profileRepository.getCustomerProfile(res.jwt));
      } catch {
        setUser({ email: googleEmail });
      }
      handleAuthComplete();
    } catch (err: any) {
      const raw = err?.message || "Google authentication failed.";
      // A bare "Failed to fetch" from auth0-spa-js means the browser blocked the
      // call to the Auth0 token endpoint — almost always because this origin is
      // not in the Auth0 application's Allowed Web Origins. Say so, rather than
      // leaving a two-word message that reads like a backend outage.
      setGoogleError(
        /failed to fetch/i.test(raw)
          ? `Could not reach Auth0 (${raw}). This origin (${
              typeof window === "undefined" ? "" : window.location.origin
            }) is probably missing from the Auth0 application's Allowed Web Origins and Allowed Callback URLs.`
          : raw
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
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
              // flex-col, not flex-row: as a row sibling the error banner was
              // squeezed into a ~one-word column beside the form, which is how a
              // full Auth0 message rendered as just "Failed to fetch".
              <div className="w-full flex flex-col justify-center items-center">
                {googleError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 w-full break-words">
                    {googleError}
                  </div>
                )}

                {step === "CHOICE" && (
                  <AuthMethods
                    onSelectMethod={(method) => {
                      // Clear a stale Google error; it used to persist across every
                      // later step and read as though the email login had failed.
                      setGoogleError(null);
                      if (method === "BASIC") setStep("EMAIL");
                    }}
                    onGoogleSignIn={handleGoogleSignIn}
                  />
                )}

                {step === "EMAIL" && (
                  <AuthEmailForm
                    email={email}
                    setEmail={setEmail}
                    onSuccess={async (isRegistered, checkedEmail) => {
                      if (!isRegistered) {
                        setStep("REGISTER");
                        return;
                      }
                      // A registered account is not necessarily a password
                      // account. Ask Loom which provider owns it before offering
                      // a password box that could only ever 401.
                      const { valid, actualProvider } =
                        await authRepository.validateProvider(checkedEmail);
                      if (valid) {
                        setStep("LOGIN");
                        return;
                      }
                      setStep("CHOICE");
                      setGoogleError(
                        actualProvider === "GOOGLE"
                          ? "This account was created with Google. Use “Continue with Google” to sign in."
                          : actualProvider === "FACEBOOK"
                            ? "This account was created with Facebook, which this storefront does not support yet."
                            : "This account cannot be signed into with a password. Try another sign-in option."
                      );
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
    </>
  );
};

export const AuthContainer: React.FC = () => (
  <Auth0Provider
    domain={env.NEXT_PUBLIC_AUTH0_DOMAIN}
    clientId={env.NEXT_PUBLIC_AUTH0_CLIENT_ID}
    authorizationParams={{
      redirect_uri: typeof window === "undefined" ? undefined : window.location.origin,
    }}
  >
    <AuthFlow />
  </Auth0Provider>
);
