/**
 * Email-OTP store, backed by Postgres.
 *
 * WHY NOT AN IN-MEMORY MAP: this used to be `new Map()` hung off `global`. That
 * works on one long-lived server and fails on Vercel, where each request may be
 * served by a DIFFERENT serverless instance: /email-code/request stored the code
 * in instance A's heap, /email-code/verify ran on instance B whose map was
 * empty, and the user was told "that code is not valid or has expired" seconds
 * after receiving it. Retrying eventually landed on the same instance and
 * appeared to "just work", which is what made it look intermittent.
 *
 * The code is stored as a SHA-256 hash of `email:code`, never in plaintext, so a
 * read of this table does not hand over live login codes. Verification is a
 * constant-time compare, attempts are capped, and a used or expired row is
 * deleted rather than left to linger.
 */
import { createHash, timingSafeEqual } from 'crypto';
import postgres from 'postgres';

export interface OtpEntry {
  code: string;
  expiresAt: number;
}

/** Wrong guesses allowed before the code is burned. */
const MAX_ATTEMPTS = 5;

let _sql: ReturnType<typeof postgres> | null = null;
let _ready: Promise<void> | null = null;

function db() {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      // No silent in-memory fallback: it would resurrect exactly the bug above,
      // and only under the conditions that make it hardest to reproduce.
      throw new Error('DATABASE_URL is not set — email OTP cannot be stored.');
    }
    _sql = postgres(url, { max: 1, ssl: 'require', idle_timeout: 20 });
  }
  return _sql;
}

/** Created on first use, matching the runtime-DDL precedent in checkout.repository.ts. */
async function ready(): Promise<void> {
  if (!_ready) {
    _ready = (async () => {
      await db()`
        CREATE TABLE IF NOT EXISTS storefront_email_otp (
          email       TEXT PRIMARY KEY,
          code_hash   TEXT   NOT NULL,
          expires_at  BIGINT NOT NULL,
          attempts    INT    NOT NULL DEFAULT 0,
          created_at  BIGINT NOT NULL
        )
      `;
    })().catch((err) => {
      _ready = null; // let the next call retry rather than latch a failure
      throw err;
    });
  }
  return _ready;
}

function hash(email: string, code: string): string {
  return createHash('sha256').update(`${email}:${code}`).digest('hex');
}

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, 'utf8');
  const y = Buffer.from(b, 'utf8');
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

export const otpStore = {
  /** Issue a code, replacing any outstanding one for this email. */
  async set(email: string, entry: OtpEntry): Promise<void> {
    await ready();
    await db()`
      INSERT INTO storefront_email_otp (email, code_hash, expires_at, attempts, created_at)
      VALUES (${email}, ${hash(email, entry.code)}, ${entry.expiresAt}, 0, ${Date.now()})
      ON CONFLICT (email) DO UPDATE
        SET code_hash = EXCLUDED.code_hash,
            expires_at = EXCLUDED.expires_at,
            attempts = 0,
            created_at = EXCLUDED.created_at
    `;
  },

  /**
   * True only for the code this server issued, unexpired, within the attempt
   * cap. A wrong guess counts against the cap; a correct one consumes the code.
   */
  async verify(email: string, code: string): Promise<boolean> {
    await ready();
    const rows = await db()`
      SELECT code_hash, expires_at, attempts FROM storefront_email_otp WHERE email = ${email}
    `;
    const row = rows[0];
    if (!row) return false;

    if (Date.now() > Number(row.expires_at) || Number(row.attempts) >= MAX_ATTEMPTS) {
      await otpStore.delete(email);
      return false;
    }

    if (!sameHash(String(row.code_hash), hash(email, code))) {
      await db()`UPDATE storefront_email_otp SET attempts = attempts + 1 WHERE email = ${email}`;
      return false;
    }

    await otpStore.delete(email);
    return true;
  },

  async delete(email: string): Promise<void> {
    await ready();
    await db()`DELETE FROM storefront_email_otp WHERE email = ${email}`;
  },
};
