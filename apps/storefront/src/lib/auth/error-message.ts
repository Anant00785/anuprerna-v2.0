/**
 * Turns the API's auth error CODES into something a customer can act on.
 *
 * The backend answers with Loom-compatible codes — "AECx01".."AECx05" — as the
 * message itself (`throw new UnauthorizedException(AuthErrorCode.X)`), and the
 * storefront was rendering that verbatim. A shopper who mistyped a password was
 * shown "AECx04", which tells them nothing and looks like a crash.
 *
 * The codes stay on the wire: they are the API's contract and other clients may
 * depend on them. Only the text shown to a person is translated, and anything
 * unrecognised falls back to the original message rather than being swallowed —
 * a new code should look odd in the UI, not vanish.
 */
const AUTH_ERROR_TEXT: Record<string, string> = {
  AECx01: 'Please enter both your email and password.',
  AECx02: "That email and password don't match. Please try again.",
  AECx03: 'This account has been disabled. Please contact support.',
  AECx04: "We couldn't verify that sign-in. Please try again.",
  AECx05: "This account doesn't have permission to do that.",
};

/** A bare code, or a message that is just a code. */
const CODE_ONLY = /^AECx\d{2}$/;

export function humaniseAuthError(message: unknown, fallback = 'Could not sign you in. Please try again.'): string {
  const raw = String(message ?? '').trim();
  if (!raw) return fallback;

  if (CODE_ONLY.test(raw)) return AUTH_ERROR_TEXT[raw] ?? fallback;

  // Some paths wrap the code in a sentence; replace it in place so any real
  // detail around it survives.
  const found = raw.match(/AECx\d{2}/);
  if (found && AUTH_ERROR_TEXT[found[0]]) return AUTH_ERROR_TEXT[found[0]];

  return raw;
}
