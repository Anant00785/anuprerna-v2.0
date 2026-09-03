import { describe, it, expect } from 'vitest';
import { humaniseAuthError } from './error-message';

/**
 * The API answers with Loom codes AS the message
 * (`throw new UnauthorizedException(AuthErrorCode.INVALID_PROVIDER_TOKEN)`),
 * and the storefront rendered it verbatim — a shopper who mistyped a password
 * was shown "AECx02", which reads like a crash.
 */
describe('humaniseAuthError', () => {
  it('translates every known code to something actionable', () => {
    for (const code of ['AECx01', 'AECx02', 'AECx03', 'AECx04', 'AECx05']) {
      const out = humaniseAuthError(code);
      expect(out).not.toContain('AECx');
      expect(out.length).toBeGreaterThan(10);
    }
  });

  it('gives the wrong-password case a message about the password', () => {
    expect(humaniseAuthError('AECx02')).toMatch(/email and password/i);
  });

  it('replaces a code embedded in a longer sentence', () => {
    expect(humaniseAuthError('Login failed: AECx02 returned')).not.toContain('AECx02');
  });

  it('passes a real human message through untouched', () => {
    const msg = 'A user is already registered with this email address';
    expect(humaniseAuthError(msg)).toBe(msg);
  });

  it('falls back for an empty or missing message', () => {
    expect(humaniseAuthError('')).toMatch(/try again/i);
    expect(humaniseAuthError(undefined)).toMatch(/try again/i);
    expect(humaniseAuthError(null)).toMatch(/try again/i);
  });

  it('uses the caller fallback when one is given', () => {
    expect(humaniseAuthError('', 'Custom fallback')).toBe('Custom fallback');
  });

  it('does not swallow an UNKNOWN code — it should look odd, not vanish', () => {
    // A future AECx99 must still surface something, so a missing mapping is
    // visible rather than silently rendering an empty error.
    expect(humaniseAuthError('AECx99')).toMatch(/try again/i);
  });
});
