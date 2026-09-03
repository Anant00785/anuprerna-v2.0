import { describe, it, expect } from 'vitest';
import { isWrapperToken } from './token';

/** Build an unsigned JWT with the given payload — the probe never verifies. */
const jwt = (payload: Record<string, unknown>) =>
  'eyJhbGciOiJIUzI1NiJ9.' +
  Buffer.from(JSON.stringify(payload)).toString('base64url') +
  '.sig';

describe('isWrapperToken', () => {
  it('accepts a token minted by apps/api (numeric sub + roles array)', () => {
    expect(
      isWrapperToken(jwt({ sub: 162936311, uid: 'abc', email: 'a@b.c', roles: ['ROLE_CUSTOMER'] })),
    ).toBe(true);
  });

  it('accepts the older wrapper shape (customerId + roles)', () => {
    expect(isWrapperToken(jwt({ customerId: 42, roles: ['ROLE_CUSTOMER'] }))).toBe(true);
  });

  it('accepts a numeric sub sent as a string', () => {
    expect(isWrapperToken(jwt({ sub: '162936311', roles: [] }))).toBe(true);
  });

  it('REJECTS a legacy Loom token — opaque sub, no cleartext roles', () => {
    // The case the guard exists for: the native cart answers 200 {success:false}
    // for these, so the session looks alive while every write silently fails.
    expect(isWrapperToken(jwt({ sub: 'kJ8s+encrypted+blob==', exp: 9999999999 }))).toBe(false);
  });

  it('REJECTS a well-formed JWT carrying no roles claim', () => {
    expect(isWrapperToken(jwt({ sub: 1, email: 'a@b.c' }))).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(isWrapperToken(undefined)).toBe(false);
    expect(isWrapperToken(null)).toBe(false);
    expect(isWrapperToken('')).toBe(false);
    expect(isWrapperToken('not.a.jwt.at.all')).toBe(false);
    expect(isWrapperToken('onlyonepart')).toBe(false);
    expect(isWrapperToken('a.!!!notbase64!!!.c')).toBe(false);
  });
});
