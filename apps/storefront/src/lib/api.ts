import { env } from "@/env";
import type { ZodType } from "zod";

// Typed API client. Every call validates the response against a Zod schema from
// @anuprerna/types — this is how the audit's 364 untyped reads get closed. Never `any`.
export async function apiGet<T>(path: string, schema: ZodType<T>, init?: RequestInit): Promise<T> {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    next: { revalidate: 60 }, // ISR default; override per call
  });
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return schema.parse(await res.json());
}
