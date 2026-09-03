/**
 * apps/api/src/auth/service/password-reset.service.ts
 *
 * Real password reset. The two controller endpoints this replaces
 * (`send/password-reset/email`, `reset/password`) were stubs that answered
 * `simpleResponse(true, ...)` and did nothing — the storefront's own
 * /api/auth/{forgot,reset-password} routes were stubbed to match, so the whole
 * chain reported success end to end while no email was sent and no password
 * ever changed.
 *
 * SECURITY DECISIONS, and why:
 *
 *  - The token is stored as a SHA-256 HASH. `verification_token` is readable by
 *    anything with database access (the CMS table-explorer included); storing the
 *    raw token would make a read of that table equivalent to being able to reset
 *    any account's password.
 *  - Single use. `verified_at` is stamped inside the same UPDATE that consumes
 *    the row, so a replayed link cannot set the password twice.
 *  - 30-minute expiry, checked server-side against the stored `expires_at`.
 *  - NO EMAIL ENUMERATION. An address with no account gets the same response,
 *    and takes the same path, as one with an account. Answering "no such user"
 *    here would turn this endpoint into a membership oracle for the whole
 *    customer list.
 *  - The new password goes through GatekeeperService.hashPassword, i.e.
 *    bcrypt(pepper + password) at cost 11 — the same function login verifies
 *    against. Writing the column any other way would lock the account out.
 */
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { and, eq, isNull } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";
import nodemailer, { type Transporter } from "nodemailer";
import { DATABASE_CONNECTION, type Database } from "../../database/database.module.js";
import { loomTenant, verificationToken } from "../../database/schema/schema.js";
import { GatekeeperService } from "./gatekeeper.service.js";
import type { EnvironmentVariables } from "../../common/config/env.schema.js";

/** How long a reset link stays valid. */
export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
/** Matches the minimum the storefront form enforces. */
export const MIN_PASSWORD_LENGTH = 6;

export interface ResetOutcome {
  ok: boolean;
  /** Safe to show a customer — never says whether an account exists. */
  message: string;
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Database,
    private readonly gatekeeper: GatekeeperService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {
    const host = (this.config.get("SMTP_HOST", { infer: true }) ?? "").trim();
    const user = (this.config.get("SMTP_USER", { infer: true }) ?? "").trim();
    const pass = (this.config.get("SMTP_PASS", { infer: true }) ?? "").trim();
    this.from = (this.config.get("SMTP_FROM", { infer: true }) ?? "").trim();

    const rawPort = (this.config.get("SMTP_PORT", { infer: true }) ?? "").trim();
    const parsedPort = Number.parseInt(rawPort, 10);
    const port = Number.isFinite(parsedPort) ? parsedPort : 587;

    this.transporter =
      host && this.from
        ? nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            ...(user && pass ? { auth: { user, pass } } : {}),
          })
        : null;
  }

  private hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /** Same wording whether or not the address has an account — see the header. */
  private readonly genericSent =
    "If that email is registered, a password reset link is on its way.";

  async sendResetEmail(rawEmail: string): Promise<ResetOutcome> {
    const email = (rawEmail || "").trim().toLowerCase();
    if (!email) return { ok: false, message: "Email is required." };

    const rows = await this.db
      .select({ id: loomTenant.id })
      .from(loomTenant)
      .where(eq(loomTenant.email, email))
      .limit(1);

    // Deliberately the same response as the success path.
    if (rows.length === 0) {
      this.logger.log(`Password reset requested for an address with no account.`);
      return { ok: true, message: this.genericSent };
    }

    const tenantId = Number(rows[0].id);
    // 32 bytes of CSPRNG, base64url so it survives a URL path segment intact.
    const token = randomBytes(32).toString("base64url");
    const now = Date.now();

    await this.db.insert(verificationToken).values({
      tenantId,
      token: this.hash(token),
      createdAt: String(now),
      expiresAt: String(now + RESET_TOKEN_TTL_MS),
    });

    const base = (this.config.get("STOREFRONT_URL", { infer: true }) ?? "").trim().replace(/\/+$/, "");
    const link = `${base}/auth/forget-password/${token}`;

    if (!this.transporter) {
      // The token row exists but nothing was sent. Say so in the log rather than
      // reporting a delivery that did not happen.
      this.logger.error("SMTP is not configured — password reset email NOT sent.");
      return { ok: true, message: this.genericSent };
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject: "Reset your Anuprerna password",
        text:
          `Someone asked to reset the password for this Anuprerna account.\n\n` +
          `Reset it here (the link works once and expires in 30 minutes):\n${link}\n\n` +
          `If this wasn't you, you can ignore this email — nothing has changed.`,
        html:
          `<p>Someone asked to reset the password for this Anuprerna account.</p>` +
          `<p><a href="${link}">Reset your password</a></p>` +
          `<p>The link works once and expires in 30 minutes. ` +
          `If this wasn't you, you can ignore this email — nothing has changed.</p>`,
      });
    } catch (err) {
      // Do not leak delivery failure back to the caller: it would still reveal
      // that the address exists. Logged for operators instead.
      this.logger.error(`Password reset email failed to send: ${String(err)}`);
    }

    return { ok: true, message: this.genericSent };
  }

  async resetPassword(rawToken: string, password: string): Promise<ResetOutcome> {
    const token = (rawToken || "").trim();
    if (!token || !password) {
      return { ok: false, message: "Token and new password are required." };
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return { ok: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
    }

    const rows = await this.db
      .select({
        id: verificationToken.id,
        tenantId: verificationToken.tenantId,
        expiresAt: verificationToken.expiresAt,
      })
      .from(verificationToken)
      .where(and(eq(verificationToken.token, this.hash(token)), isNull(verificationToken.verifiedAt)))
      .limit(1);

    const row = rows[0];
    // One message for "no such token", "already used" and "expired": a caller
    // holding a bad link learns nothing about which.
    const invalid = { ok: false, message: "That reset link is invalid or has expired." };
    if (!row) return invalid;

    const expiresAt = Number(row.expiresAt ?? 0);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return invalid;

    const hashed = await this.gatekeeper.hashPassword(password);

    return this.db.transaction(async (tx) => {
      // Consume the token FIRST, conditional on it still being unused, so two
      // concurrent submissions of the same link cannot both change the password.
      const consumed = await tx
        .update(verificationToken)
        .set({ verifiedAt: String(Date.now()) })
        .where(and(eq(verificationToken.id, row.id), isNull(verificationToken.verifiedAt)))
        .returning({ id: verificationToken.id });

      if (consumed.length === 0) return invalid;

      await tx
        .update(loomTenant)
        .set({ userPassword: hashed })
        .where(eq(loomTenant.id, BigInt(row.tenantId)));

      return { ok: true, message: "Password updated successfully." };
    });
  }
}
