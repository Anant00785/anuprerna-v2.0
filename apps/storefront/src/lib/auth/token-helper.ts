import crypto from "node:crypto";

const JWT_SECRET = process.env.AUTH_JWT_SECRET || "anuprerna-jwt-secret-key-2026";

export function signToken(payload: Record<string, unknown>): string {
  const header = { alg: "HS256", typ: "JWT" };
  const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${b64Header}.${b64Payload}`)
    .digest("base64url");
  return `${b64Header}.${b64Payload}.${signature}`;
}

export function decodeTokenPayload(token: string): Record<string, unknown> | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}
