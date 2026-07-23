import { z } from "zod";

// Fail fast at boot if env is misconfigured. Never read process.env directly elsewhere.
const schema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:8090"),
});

export const env = schema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
