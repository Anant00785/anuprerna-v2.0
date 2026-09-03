/**
 * apps/api/src/common/config/env.schema.ts
 *
 * Boot-time validation for every environment variable the API reads.
 * Wired via `ConfigModule.forRoot({ isGlobal: true, validate })` in
 * app.module.ts — Nest calls `validate(process.env)` once at startup and
 * refuses to boot if it throws.
 *
 * Only two keys are required (DATABASE_URL, AUTH_JWT_SECRET) — everything
 * else is optional so the API boots without any given integration
 * configured; the service that needs a missing key must fail clearly when
 * invoked, not at boot.
 *
 * class-validator/class-transformer, not zod: zod is not in this
 * workspace and class-validator already is (it's a Nest dependency used
 * elsewhere in this repo) — no new dependency for this.
 *
 * SECURITY: on failure this throws an error listing missing/invalid *key
 * names* only. Never include a key's value in an error message, log, or
 * comment.
 */
import { plainToInstance } from "class-transformer";
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MinLength, validateSync } from "class-validator";
import { Transform } from "class-transformer";

/** Accepts "true"/"1" (case-insensitive) as true; everything else, including unset, is false. */
function booleanFlag() {
  return Transform(({ value }) => {
    if (typeof value === "boolean") return value;
    return typeof value === "string" && ["true", "1"].includes(value.toLowerCase());
  });
}

export class EnvironmentVariables {
  // ---------------------------------------------------------------------
  // Boot-critical — the API cannot run at all without these.
  // ---------------------------------------------------------------------

  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  // 32 chars minimum: this is the HS256 signing key for every session token, so
  // a short one is brute-forceable into forged tokens carrying any role.
  @IsString()
  @MinLength(32)
  AUTH_JWT_SECRET!: string;

  // ---------------------------------------------------------------------
  // App runtime
  // ---------------------------------------------------------------------

  @IsOptional()
  @IsIn(["development", "test", "production"])
  NODE_ENV?: string;

  @IsOptional()
  @IsString()
  PORT?: string;

  @IsOptional()
  @IsString()
  SWAGGER?: string;

  // ---------------------------------------------------------------------
  // Auth (JC-1/JC-2 — pepper is read by a later phase; TTL/secret already
  // consumed by gatekeeper.service.ts today).
  // ---------------------------------------------------------------------

  @IsOptional()
  @IsString()
  AUTH_PASSWORD_PEPPER?: string;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value, 10)))
  AUTH_JWT_TTL_SECONDS?: number;

  /** `auth0.jwt.issuer` — required only by the Auth0 social-login endpoints. */
  @IsOptional()
  @IsString()
  AUTH0_ISSUER?: string;

  // ---------------------------------------------------------------------
  // Kill-switches — the anti-spam / anti-live-money layer. All default
  // false. Schema-enforced, not convention: every outbound provider call
  // site must check its flag before doing anything with side effects.
  // ---------------------------------------------------------------------

  @IsOptional()
  @IsBoolean()
  @booleanFlag()
  OUTBOUND_EMAIL_ENABLED: boolean = false;

  @IsOptional()
  @IsBoolean()
  @booleanFlag()
  OUTBOUND_SMS_ENABLED: boolean = false;

  @IsOptional()
  @IsBoolean()
  @booleanFlag()
  OUTBOUND_WHATSAPP_ENABLED: boolean = false;

  @IsOptional()
  @IsBoolean()
  @booleanFlag()
  PAYMENTS_LIVE_MODE: boolean = false;

  // ---------------------------------------------------------------------
  // AWS S3 (canonical names from the Spring mapping; the legacy
  // AWS_BUCKET/AWS_REGION/AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY names
  // are also read as fallbacks by image.service.ts today — kept optional
  // here too so that mechanical refactor doesn't change behavior).
  // ---------------------------------------------------------------------

  @IsOptional() @IsString() AWS_S3_ACCESS_KEY?: string;
  @IsOptional() @IsString() AWS_S3_SECRET_KEY?: string;
  @IsOptional() @IsString() AWS_S3_BUCKET?: string;
  @IsOptional() @IsString() AWS_S3_REGION?: string;
  @IsOptional() @IsString() AWS_ACCESS_KEY_ID?: string;
  @IsOptional() @IsString() AWS_SECRET_ACCESS_KEY?: string;
  @IsOptional() @IsString() AWS_BUCKET?: string;
  @IsOptional() @IsString() AWS_REGION?: string;

  // ---------------------------------------------------------------------
  // SMTP (email)
  // ---------------------------------------------------------------------

  @IsOptional() @IsString() SMTP_HOST?: string;
  @IsOptional() @IsString() SMTP_PORT?: string;
  @IsOptional() @IsString() SMTP_USER?: string;
  @IsOptional() @IsString() SMTP_PASS?: string;
  @IsOptional() @IsString() SMTP_FROM?: string;

  // ---------------------------------------------------------------------
  // Payments — guard only in this phase, no provider implementation.
  // ---------------------------------------------------------------------

  @IsOptional() @IsString() STRIPE_KEY_SECRET?: string;
  @IsOptional() @IsString() STRIPE_WEBHOOK_SECRET?: string;
  @IsOptional() @IsString() RAZORPAY_KEY_ID?: string;
  @IsOptional() @IsString() RAZORPAY_KEY_SECRET?: string;
  @IsOptional() @IsString() RAZORPAY_WEBHOOK_SECRET?: string;
  /** Checkout success/cancel redirect base, used when building Stripe sessions. */
  @IsOptional() @IsString() STOREFRONT_URL?: string;
  /** CC'd on payment-failure notifications (Loom's EmailConstant.ADMIN_EMAIL_ADDRESS). */
  @IsOptional() @IsString() ADMIN_EMAIL_ADDRESS?: string;

  // ---------------------------------------------------------------------
  // MSG91 (OTP SMS) — canonical mapping-table names plus the names the
  // service file reads today, kept side by side so the refactor stays
  // mechanical.
  // ---------------------------------------------------------------------

  @IsOptional() @IsString() MSG91_AUTH_KEY?: string;
  @IsOptional() @IsString() MSG91_OTP_TEMPLATE_ID?: string;
  @IsOptional() @IsString() MSG91_OTP_LENGTH?: string;
  @IsOptional() @IsString() MSG91_TEMPLATE_ID?: string;
  @IsOptional() @IsString() MSG91_SEND_OTP_URL?: string;
  @IsOptional() @IsString() MSG91_VERIFY_OTP_URL?: string;
  @IsOptional() @IsString() MSG91_RESEND_OTP_URL?: string;
  @IsOptional() @IsString() MSG91_FAKE_MODE?: string;

  // ---------------------------------------------------------------------
  // WhatsApp (Freshchat)
  // ---------------------------------------------------------------------

  @IsOptional() @IsString() WHATSAPP_API_TOKEN?: string;
  @IsOptional() @IsString() WHATSAPP_NAMESPACE?: string;
  @IsOptional() @IsString() WHATSAPP_MOBILE?: string;
  @IsOptional() @IsString() WHATSAPP_API_URL?: string;
  @IsOptional() @IsString() WHATSAPP_PHONE_NUMBER_ID?: string;

  // ---------------------------------------------------------------------
  // Zoho
  // ---------------------------------------------------------------------

  @IsOptional() @IsString() ZOHO_CLIENT_ID?: string;
  @IsOptional() @IsString() ZOHO_CLIENT_SECRET?: string;
  @IsOptional() @IsString() ZOHO_REFRESH_TOKEN?: string;
  @IsOptional() @IsString() ZOHO_ORG_ID?: string;
  @IsOptional() @IsString() ZOHO_OAUTH_BASE_URI?: string;
  @IsOptional() @IsString() ZOHO_API_BASE_URI?: string;
  /** Legacy name read directly by zoho.service.ts today; kept for the mechanical refactor. */
  @IsOptional() @IsString() ZOHO_API_BASE_URL?: string;

  // Zoho webhook caller allowlist — the NestJS equivalent of Loom's
  // @NVerseDomainValidated(headerKeys={"User-Agent","Zoho-Request-Ip"},
  // headerValues={"ZohoBooks-Agent","103.89.74.49"}) on
  // ZohoStockSyncWebhookController.java:31-41. Defaults are the Loom literals;
  // they are env-driven so a Zoho renumbering is a config change, not a deploy.
  // ZohoWebhookGuard FAILS CLOSED if either is blank.
  @IsOptional() @IsString() ZOHO_WEBHOOK_USER_AGENT: string = "ZohoBooks-Agent";
  /** Comma-separated. Checked against the Zoho-Request-Ip header (and the peer address when the flag below is on). */
  @IsOptional() @IsString() ZOHO_WEBHOOK_ALLOWED_IPS: string = "103.89.74.49";
  /**
   * Additionally require the transport-level source address to be in the
   * allowlist. Off by default: behind AWS App Runner the peer is the platform
   * proxy, so this needs Express `trust proxy` set in main.ts first, otherwise
   * every legitimate webhook is rejected.
   */
  @IsOptional() @IsBoolean() @booleanFlag() ZOHO_WEBHOOK_ENFORCE_PEER_IP: boolean = false;

  // ---------------------------------------------------------------------
  // AI / misc integrations named in the mapping table but not yet wired
  // to any service (Phase 5, droppable) — validated now so the schema is
  // the single source of truth for every key the API is allowed to read.
  // ---------------------------------------------------------------------

  @IsOptional() @IsString() GEMINI_API_KEY?: string;
  @IsOptional() @IsString() GEMINI_MODEL?: string;
  // AES key for tenant-email encryption at rest, from `nverse.aes.key`.
  // Algorithm is AES/ECB/PKCS5Padding with a 128-bit key derived from SHA-512 of this value —
  // but the exact digest-truncation is unverified, so the email encoder is still a dummy.
  // See docs/KNOWN-GAPS.md before implementing against this.
  @IsOptional() @IsString() EMAIL_ENCRYPTION_KEY?: string;

  // Separate secret: an authorization shared-secret the legacy backend expects as a request header.
  // Not an encryption key - do not conflate with EMAIL_ENCRYPTION_KEY.
  @IsOptional() @IsString() LOOM_TENANT_DECRYPT_FINGERPRINT?: string;
}

/** Key names only — never the offending value. */
function describeErrors(errors: import("class-validator").ValidationError[]): string[] {
  return errors.map((error) => {
    const constraints = error.constraints ? Object.values(error.constraints).join("; ") : "invalid value";
    return `${error.property} (${constraints})`;
  });
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  // Support either AUTH_JWT_SECRET or JWT_SECRET
  if (!config.AUTH_JWT_SECRET && config.JWT_SECRET) {
    config.AUTH_JWT_SECRET = config.JWT_SECRET;
  }

  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration — missing or invalid keys: ${describeErrors(errors).join(", ")}`,
    );
  }

  // Schema-level payments guard (JC-4 / plan §2): PAYMENTS_LIVE_MODE=false
  // (the default) requires a configured Stripe secret to be a test key.
  // Refuse to boot on a live key unless the flag is explicitly true AND
  // NODE_ENV=production. This never logs the key value.
  const stripeKey = validatedConfig.STRIPE_KEY_SECRET;
  if (stripeKey) {
    const isLiveKey = stripeKey.startsWith("sk_live_");
    const isTestKey = stripeKey.startsWith("sk_test_");
    const liveModeAuthorized = validatedConfig.PAYMENTS_LIVE_MODE && validatedConfig.NODE_ENV === "production";

    if (isLiveKey && !liveModeAuthorized) {
      throw new Error(
        "Invalid environment configuration — STRIPE_KEY_SECRET is a live key (sk_live_*) but " +
          "PAYMENTS_LIVE_MODE is not true with NODE_ENV=production. Refusing to boot.",
      );
    }
    if (!validatedConfig.PAYMENTS_LIVE_MODE && !isTestKey && !isLiveKey) {
      throw new Error(
        "Invalid environment configuration — STRIPE_KEY_SECRET does not look like a Stripe secret " +
          "key (expected sk_test_* or sk_live_*).",
      );
    }
  }

  return validatedConfig;
}
