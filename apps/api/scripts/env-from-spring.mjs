#!/usr/bin/env node
/**
 * apps/api/scripts/env-from-spring.mjs
 *
 * Generates apps/api/.env (git-ignored, see repo root .gitignore) from the
 * workspace's Spring-style dotenv file (dot-notation keys like
 * `aws.s3.access-key`). The API reads UPPER_SNAKE_CASE env vars — this
 * script is the one place that bridges the two naming schemes.
 *
 * Usage:
 *   node scripts/env-from-spring.mjs [--source <path>] [--app api|storefront|cms] [--out <path>]
 *
 * Defaults: --source ../../../.env (the workspace secrets file, one level
 * above the monorepo root) --app api --out apps/api/.env (relative to this
 * script when --app api).
 *
 * SECURITY: this script never prints, logs, or writes a secret VALUE to
 * stdout/stderr. Its console output lists only which keys were mapped and
 * which expected keys were missing from the source file — key names only.
 * The mapped .env file itself is written to disk, git-ignored, and is the
 * only place values land.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const args = { source: null, app: "api", out: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--source") args.source = argv[++i];
    else if (arg === "--app") args.app = argv[++i];
    else if (arg === "--out") args.out = argv[++i];
  }
  return args;
}

/** Minimal Spring dotenv parser: `key=value` per line, first `=` splits. */
function parseSpringEnv(text) {
  const map = new Map();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1);
    if (key) map.set(key, value);
  }
  return map;
}

/**
 * Builds a postgres:// connection string from Spring's
 * `spring.datasource.url` (jdbc:postgresql://host:port/db[?opts]) plus
 * username/password, if all three are present. Returns undefined
 * otherwise — the generator does not fabricate a partial URL.
 */
function buildDatabaseUrl(spring) {
  const jdbcUrl = spring.get("spring.datasource.url");
  const user = spring.get("spring.datasource.username");
  const pass = spring.get("spring.datasource.password");
  if (!jdbcUrl || !user || pass === undefined) return undefined;

  const match = jdbcUrl.match(/^jdbc:postgresql:\/\/(.+)$/);
  if (!match) return undefined;

  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${match[1]}`;
}

// Mapping table — single source of truth for Spring key -> API env var.
// Value can be a literal Spring key, or a function(spring) -> string|undefined
// for keys that need to be derived (e.g. DATABASE_URL).
const API_MAPPING = {
  DATABASE_URL: buildDatabaseUrl,
  AUTH_PASSWORD_PEPPER: "nverse.encoder.pepper",
  AUTH_JWT_SECRET: "nverse.jwt.secret",
  AUTH_JWT_TTL_SECONDS: "loom.config.jwt.token-validity",
  AWS_S3_ACCESS_KEY: "aws.s3.access-key",
  AWS_S3_SECRET_KEY: "aws.s3.secret-key",
  AWS_S3_BUCKET: "aws.s3.bucket",
  AWS_S3_REGION: "aws.s3.region",
  SMTP_HOST: "spring.mail.host",
  SMTP_PORT: "spring.mail.port",
  SMTP_USER: "spring.mail.username",
  SMTP_PASS: "spring.mail.password",
  RAZORPAY_KEY_ID: "payment.razorpay.key-id",
  RAZORPAY_KEY_SECRET: "payment.razorpay.key-secret",
  RAZORPAY_WEBHOOK_SECRET: "payment.razorpay.webhook.secret",
  STRIPE_KEY_SECRET: "payment.stripe.key-secret",
  STRIPE_WEBHOOK_SECRET: "payment.stripe.webhook.secret",
  MSG91_AUTH_KEY: "msg91.authkey",
  MSG91_OTP_TEMPLATE_ID: "msg91.otp.template.id",
  MSG91_OTP_LENGTH: "msg91.otp.length",
  WHATSAPP_API_TOKEN: "freshchat.whatsapp.apikey",
  WHATSAPP_NAMESPACE: "freshchat.whatsapp.namespace",
  WHATSAPP_MOBILE: "freshchat.whatsapp.mobile",
  ZOHO_CLIENT_ID: "zoho.api.client-id",
  ZOHO_CLIENT_SECRET: "zoho.api.client-secret",
  ZOHO_REFRESH_TOKEN: "zoho.api.refresh-token",
  ZOHO_ORG_ID: "zoho.api.organisation-id",
  ZOHO_OAUTH_BASE_URI: "zoho.api.base-oauth-uri",
  ZOHO_API_BASE_URI: "zoho.api.base-api-uri",
  GEMINI_API_KEY: "loom.ai.gemini.api-key",
  GEMINI_MODEL: "loom.ai.gemini.model",
  // Corrected 2026-08-12: this was mapped from
  // `loom.config.table-explorer.decrypt-email-fingerprint`, which is NOT an encryption key at all —
  // it is an unrelated hardcoded authorization shared-secret
  // (LoomTenantDAOController.DECRYPT_EMAIL_FINGERPRINT). The real AES key for tenant-email
  // encryption is `nverse.aes.key`. See docs/KNOWN-GAPS.md.
  EMAIL_ENCRYPTION_KEY: "nverse.aes.key",
  // The table-explorer fingerprint is a separate secret, forwarded as a request header by the
  // storefront proxy. Kept under its own name so the two are never confused again.
  LOOM_TENANT_DECRYPT_FINGERPRINT: "loom.config.table-explorer.decrypt-email-fingerprint",
};

// Frontends get their own (smaller) tables. Extend here as storefront/cms
// grow real env needs — kept separate so `--app api` doesn't leak keys
// those apps don't read, and vice versa.
const FRONTEND_MAPPING = {
  storefront: {
    NEXT_PUBLIC_SITE_URL: "loom.site.url",
  },
  cms: {
    NEXT_PUBLIC_SITE_URL: "loom.site.url",
  },
};

// Kill-switches: always written, always default false. Never sourced from
// the Spring file — flipping them on is a deliberate local decision, not
// something that should silently follow the legacy config.
const KILL_SWITCHES = {
  OUTBOUND_EMAIL_ENABLED: "false",
  OUTBOUND_SMS_ENABLED: "false",
  OUTBOUND_WHATSAPP_ENABLED: "false",
  PAYMENTS_LIVE_MODE: "false",
};

function resolveOutputPath(app, explicitOut) {
  if (explicitOut) return path.resolve(explicitOut);
  if (app === "api") return path.join(apiRoot, ".env");
  // apps/{storefront,cms}/.env.local, sibling to apps/api at ../<app>
  return path.resolve(apiRoot, "..", app, ".env.local");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const sourcePath = path.resolve(apiRoot, args.source ?? "../../../.env");
  const outPath = resolveOutputPath(args.app, args.out);

  if (!existsSync(sourcePath)) {
    console.error(`Source Spring dotenv not found: ${sourcePath}`);
    process.exitCode = 1;
    return;
  }

  const spring = parseSpringEnv(readFileSync(sourcePath, "utf8"));

  const mapping = args.app === "api" ? API_MAPPING : FRONTEND_MAPPING[args.app];
  if (!mapping) {
    console.error(`Unknown --app "${args.app}". Expected one of: api, storefront, cms.`);
    process.exitCode = 1;
    return;
  }

  const mapped = [];
  const missing = [];
  const lines = [
    `# Generated by scripts/env-from-spring.mjs from ${path.relative(apiRoot, sourcePath)} — do not commit.`,
    `# Regenerate with: node scripts/env-from-spring.mjs --app ${args.app}`,
  ];

  for (const [apiKey, source] of Object.entries(mapping)) {
    const value = typeof source === "function" ? source(spring) : spring.get(source);
    if (value === undefined) {
      missing.push(apiKey);
      continue;
    }
    mapped.push(apiKey);
    lines.push(`${apiKey}=${value}`);
  }

  if (args.app === "api") {
    lines.push("", "# Kill-switches — flip to true only for a deliberate local test.");
    for (const [key, value] of Object.entries(KILL_SWITCHES)) {
      lines.push(`${key}=${value}`);
      mapped.push(key);
    }
  }

  writeFileSync(outPath, lines.join("\n") + "\n", { mode: 0o600 });

  console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
  console.log(`Mapped (${mapped.length}): ${mapped.join(", ")}`);
  console.log(`Missing from source (${missing.length}): ${missing.join(", ") || "none"}`);
}

main();
