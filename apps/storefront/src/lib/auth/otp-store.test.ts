import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * The bug this guards: the store was an in-memory Map on `global`. On Vercel,
 * /email-code/request and /email-code/verify can run on DIFFERENT serverless
 * instances, so the code was written to one heap and looked up in another —
 * the user was told "not valid or has expired" seconds after receiving it, and
 * a retry that happened to land on the same instance appeared to work.
 *
 * These tests drive the real module against a fake `postgres` client, asserting
 * the SQL contract rather than the transport.
 */

interface Row { code_hash: string; expires_at: number; attempts: number }
const table = new Map<string, Row>();
let created = false;

// Minimal tagged-template stand-in for the postgres client.
function fakeSql(strings: TemplateStringsArray, ...vals: unknown[]) {
  const q = strings.join('?').replace(/\s+/g, ' ').trim();

  if (/CREATE TABLE IF NOT EXISTS storefront_email_otp/i.test(q)) {
    created = true;
    return Promise.resolve([]);
  }
  if (/^INSERT INTO storefront_email_otp/i.test(q)) {
    const [email, codeHash, expiresAt] = vals as [string, string, number];
    table.set(email, { code_hash: codeHash, expires_at: expiresAt, attempts: 0 });
    return Promise.resolve([]);
  }
  if (/^SELECT code_hash/i.test(q)) {
    const row = table.get(vals[0] as string);
    return Promise.resolve(row ? [row] : []);
  }
  if (/^UPDATE storefront_email_otp SET attempts/i.test(q)) {
    const row = table.get(vals[0] as string);
    if (row) row.attempts += 1;
    return Promise.resolve([]);
  }
  if (/^DELETE FROM storefront_email_otp/i.test(q)) {
    table.delete(vals[0] as string);
    return Promise.resolve([]);
  }
  throw new Error('unexpected query: ' + q);
}

vi.mock('postgres', () => ({ default: () => fakeSql }));

const load = async () => (await import('./otp-store')).otpStore;

beforeEach(() => {
  table.clear();
  created = false;
  process.env.DATABASE_URL = 'postgres://test/test';
  vi.resetModules();
});

describe('otpStore (Postgres-backed)', () => {
  it('a code issued by one instance verifies from another — the reported bug', async () => {
    const issuing = await load();
    await issuing.set('a@b.com', { code: '123456', expiresAt: Date.now() + 60_000 });

    // A second module instance = a different serverless instance. With the old
    // in-memory Map this returned false; the shared table makes it succeed.
    vi.resetModules();
    const verifying = await load();
    await expect(verifying.verify('a@b.com', '123456')).resolves.toBe(true);
  });

  it('creates its table on first use', async () => {
    const store = await load();
    await store.set('a@b.com', { code: '111111', expiresAt: Date.now() + 60_000 });
    expect(created).toBe(true);
  });

  it('never stores the code in plaintext', async () => {
    const store = await load();
    await store.set('a@b.com', { code: '424242', expiresAt: Date.now() + 60_000 });
    expect(table.get('a@b.com')!.code_hash).not.toContain('424242');
  });

  it('rejects a wrong code', async () => {
    const store = await load();
    await store.set('a@b.com', { code: '123456', expiresAt: Date.now() + 60_000 });
    await expect(store.verify('a@b.com', '000000')).resolves.toBe(false);
  });

  it('rejects an expired code', async () => {
    const store = await load();
    await store.set('a@b.com', { code: '123456', expiresAt: Date.now() - 1 });
    await expect(store.verify('a@b.com', '123456')).resolves.toBe(false);
  });

  it('consumes the code — it cannot be replayed', async () => {
    const store = await load();
    await store.set('a@b.com', { code: '123456', expiresAt: Date.now() + 60_000 });
    await expect(store.verify('a@b.com', '123456')).resolves.toBe(true);
    await expect(store.verify('a@b.com', '123456')).resolves.toBe(false);
  });

  it('burns the code after 5 wrong guesses', async () => {
    const store = await load();
    await store.set('a@b.com', { code: '123456', expiresAt: Date.now() + 60_000 });
    for (let i = 0; i < 5; i++) await store.verify('a@b.com', '999999');
    // Even the CORRECT code no longer works once the cap is hit.
    await expect(store.verify('a@b.com', '123456')).resolves.toBe(false);
  });

  it('rejects an email with no outstanding code', async () => {
    const store = await load();
    await expect(store.verify('nobody@b.com', '123456')).resolves.toBe(false);
  });

  it('re-issuing replaces the previous code and clears attempts', async () => {
    const store = await load();
    await store.set('a@b.com', { code: '111111', expiresAt: Date.now() + 60_000 });
    await store.verify('a@b.com', '000000'); // one wrong guess
    await store.set('a@b.com', { code: '222222', expiresAt: Date.now() + 60_000 });

    expect(table.get('a@b.com')!.attempts).toBe(0);
    await expect(store.verify('a@b.com', '111111')).resolves.toBe(false);
    await expect(store.verify('a@b.com', '222222')).resolves.toBe(true);
  });

  it('throws rather than silently falling back when DATABASE_URL is unset', async () => {
    delete process.env.DATABASE_URL;
    const store = await load();
    await expect(store.set('a@b.com', { code: '1', expiresAt: 1 })).rejects.toThrow(/DATABASE_URL/);
  });
});
