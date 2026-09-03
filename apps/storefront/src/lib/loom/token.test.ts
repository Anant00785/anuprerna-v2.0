import { describe, it, expect } from 'vitest';
import { isWrapperToken, isCartCapableToken } from './token';

/** Build an unsigned JWT with the given payload — the probe never verifies. */
const jwt = (payload: Record<string, unknown>) =>
  'eyJhbGciOiJIUzI1NiJ9.' +
  Buffer.from(JSON.stringify(payload)).toString('base64url') +
  '.sig';

describe('isCartCapableToken', () => {
  it('accepts a token minted by apps/api (numeric sub + roles array)', () => {
    expect(
      isCartCapableToken(jwt({ sub: 162936311, uid: 'abc', email: 'a@b.c', roles: ['ROLE_CUSTOMER'] })),
    ).toBe(true);
  });

  it('accepts the older wrapper shape (customerId + roles)', () => {
    expect(isCartCapableToken(jwt({ customerId: 42, roles: ['ROLE_CUSTOMER'] }))).toBe(true);
  });

  it('accepts a numeric sub sent as a string', () => {
    expect(isCartCapableToken(jwt({ sub: '162936311', roles: [] }))).toBe(true);
  });

  it('REJECTS a legacy Loom token — opaque sub, no cleartext roles', () => {
    // The case the guard exists for: the native cart answers 200 {success:false}
    // for these, so the session looks alive while every write silently fails.
    expect(isCartCapableToken(jwt({ sub: 'kJ8s+encrypted+blob==', exp: 9999999999 }))).toBe(false);
  });

  it('REJECTS a well-formed JWT carrying no roles claim', () => {
    expect(isCartCapableToken(jwt({ sub: 1, email: 'a@b.c' }))).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(isCartCapableToken(undefined)).toBe(false);
    expect(isCartCapableToken(null)).toBe(false);
    expect(isCartCapableToken('')).toBe(false);
    expect(isCartCapableToken('not.a.jwt.at.all')).toBe(false);
    expect(isCartCapableToken('onlyonepart')).toBe(false);
    expect(isCartCapableToken('a.!!!notbase64!!!.c')).toBe(false);
  });
});

describe('isWrapperToken stays lenient', () => {
  // /api/auth/me depends on this: an unrecognised token must reach the backend
  // rather than be cleared locally. Tightening it clears live sessions.
  it('accepts a legacy token so auth/me falls through to the backend', () => {
    expect(isWrapperToken(jwt({ sub: 'opaque' }))).toBe(true);
  });

  it('accepts a token with no roles claim', () => {
    expect(isWrapperToken(jwt({ email: 'a@b.c' }))).toBe(true);
  });

  it('still rejects structurally invalid input', () => {
    expect(isWrapperToken('onlyonepart')).toBe(false);
    expect(isWrapperToken(undefined)).toBe(false);
  });
});
