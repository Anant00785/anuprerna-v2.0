import { z } from "zod";

// Fail fast at boot if env is misconfigured. Never read process.env directly elsewhere.
const schema = z.object({
  NEXT_PUBLIC_API_MODE: z.enum(["legacy", "nest"]).default("legacy"),
  NEXT_PUBLIC_SPRINGBOOT_API_URL: z.string().url().default("https://loom-v2.anuprerna.com"),
  NEXT_PUBLIC_NEST_API_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_S3_BASE_URL: z.string().url().default("https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/"),
  NEXT_PUBLIC_API_URL: z.string().url().default("https://loom-v2.anuprerna.com"),
  NEXT_PUBLIC_AUTH0_DOMAIN: z.string().min(1).default("dev-cxnfeuu6gvepp7qu.us.auth0.com"),
  NEXT_PUBLIC_AUTH0_CLIENT_ID: z.string().min(1).default("iW2PThISjeDP6I1dGoTgsoWDGwneBXPP"),
});

function cleanUrl(val: string | undefined, fallback: string): string {
  if (!val || val.trim() === "") return fallback;
  return val;
}

export const env = schema.parse({
  NEXT_PUBLIC_API_MODE: process.env.NEXT_PUBLIC_API_MODE || "legacy",
  NEXT_PUBLIC_SPRINGBOOT_API_URL: cleanUrl(process.env.NEXT_PUBLIC_SPRINGBOOT_API_URL, "https://loom-v2.anuprerna.com"),
  NEXT_PUBLIC_NEST_API_URL: cleanUrl(process.env.NEXT_PUBLIC_NEST_API_URL, "http://localhost:3000"),
  NEXT_PUBLIC_S3_BASE_URL: cleanUrl(process.env.NEXT_PUBLIC_S3_BASE_URL, "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/"),
  NEXT_PUBLIC_API_URL: cleanUrl(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SPRINGBOOT_API_URL, "https://loom-v2.anuprerna.com"),
  NEXT_PUBLIC_AUTH0_DOMAIN: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || "dev-cxnfeuu6gvepp7qu.us.auth0.com",
  NEXT_PUBLIC_AUTH0_CLIENT_ID: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || "iW2PThISjeDP6I1dGoTgsoWDGwneBXPP",
});
