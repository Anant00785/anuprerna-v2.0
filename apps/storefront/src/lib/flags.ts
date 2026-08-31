// Sandbox feature flags. NEXT_PUBLIC_* values are inlined at BUILD time.
//
// SOCIAL (Google) LOGIN. DEFAULT false -> the Google button is HIDDEN in the
// isolated sandbox: social OAuth is the one login path that reaches live Loom
// (POST /authenticate/social) and it needs an OAuth redirect domain that is not
// configured for the demo. Email sign-in + native signup are always available.
// Set NEXT_PUBLIC_SOCIAL_LOGIN_ENABLED=true to offer the Google button again.
export const SOCIAL_LOGIN_ENABLED =
  process.env.NEXT_PUBLIC_SOCIAL_LOGIN_ENABLED === 'true';
