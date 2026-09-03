#!/usr/bin/env node
/**
 * scripts/push-env-to-aws.mjs
 *
 * Reads apps/api/.env and pushes it to AWS Secrets Manager as a single
 * JSON secret, so the API can load its whole environment from one place.
 *
 * Values never leave your machine except to go to AWS. Nothing is printed
 * to stdout except key NAMES — never a value.
 *
 * Usage:
 *   node scripts/push-env-to-aws.mjs --dry-run
 *   node scripts/push-env-to-aws.mjs
 *   node scripts/push-env-to-aws.mjs --secret-name anuprerna/api/staging
 *
 * Requires: AWS CLI installed and configured (`aws configure`) with
 * permission for secretsmanager:CreateSecret / PutSecretValue.
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const secretNameIdx = args.indexOf("--secret-name");
const SECRET_NAME = secretNameIdx !== -1 ? args[secretNameIdx + 1] : "anuprerna/api/prod";
const envPathIdx = args.indexOf("--env-file");
const ENV_PATH = envPathIdx !== -1
  ? resolve(process.cwd(), args[envPathIdx + 1])
  : join(repoRoot, "apps", "api", ".env");

/** Keys that must be present or the API refuses to boot (env.schema.ts). */
const REQUIRED = ["DATABASE_URL", "AUTH_JWT_SECRET"];

/**
 * Minimal .env parser: KEY=VALUE per line, `#` comments, optional
 * surrounding quotes. Deliberately does not support multi-line values —
 * none of this app's keys use them.
 */
function parseEnv(text) {
  const out = {};
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    if (!key) continue;
    out[key] = value;
  }
  return out;
}

let raw;
try {
  raw = readFileSync(ENV_PATH, "utf8");
} catch (err) {
  console.error(`Could not read ${ENV_PATH}\n  ${err.message}`);
  process.exit(1);
}

const parsed = parseEnv(raw);

// Drop keys with empty values — an empty string is not the same as unset,
// and the schema treats most keys as optional-when-absent.
const populated = {};
const empty = [];
for (const [key, value] of Object.entries(parsed)) {
  if (value === "") empty.push(key);
  else populated[key] = value;
}

const missingRequired = REQUIRED.filter((key) => !populated[key]);
if (missingRequired.length > 0) {
  console.error(
    `Refusing to push — required keys missing or empty in ${ENV_PATH}: ${missingRequired.join(", ")}`,
  );
  process.exit(1);
}

// Key names only. Never log a value.
console.log(`Source:      ${ENV_PATH}`);
console.log(`Secret name: ${SECRET_NAME}`);
console.log(`\nKeys to push (${Object.keys(populated).length}):`);
for (const key of Object.keys(populated).sort()) console.log(`  ${key}`);
if (empty.length > 0) {
  console.log(`\nSkipped (empty value) — ${empty.length}:`);
  for (const key of empty.sort()) console.log(`  ${key}`);
}

if (dryRun) {
  console.log("\n--dry-run: nothing sent to AWS.");
  process.exit(0);
}

// Write the payload to a temp file and hand AWS a file:// reference, so no
// secret value ever appears in argv (visible to other users via `ps`).
const tmpFile = join(tmpdir(), `anuprerna-secret-${process.pid}-${Date.now()}.json`);
writeFileSync(tmpFile, JSON.stringify(populated), { mode: 0o600 });

function aws(argv) {
  return execFileSync("aws", argv, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

try {
  let exists = true;
  try {
    aws(["secretsmanager", "describe-secret", "--secret-id", SECRET_NAME]);
  } catch {
    exists = false;
  }

  if (exists) {
    console.log(`\nSecret exists — putting a new version.`);
    aws([
      "secretsmanager", "put-secret-value",
      "--secret-id", SECRET_NAME,
      "--secret-string", `file://${tmpFile}`,
    ]);
  } else {
    console.log(`\nSecret does not exist — creating it.`);
    aws([
      "secretsmanager", "create-secret",
      "--name", SECRET_NAME,
      "--description", "Anuprerna API environment (apps/api)",
      "--secret-string", `file://${tmpFile}`,
    ]);
  }
  console.log(`Done. ${Object.keys(populated).length} keys stored at ${SECRET_NAME}.`);
  console.log(`\nRetrieve with:\n  aws secretsmanager get-secret-value --secret-id ${SECRET_NAME} --query SecretString --output text`);
} catch (err) {
  // AWS CLI errors go to stderr and do not echo the secret payload.
  console.error(`\nAWS CLI failed:\n${err.stderr || err.message}`);
  process.exit(1);
} finally {
  try {
    unlinkSync(tmpFile);
  } catch {
    console.error(`WARNING: could not remove temp file ${tmpFile} — delete it manually.`);
  }
}
