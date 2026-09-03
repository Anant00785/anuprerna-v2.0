import { z } from "zod";

// Fail fast at boot if env is misconfigured. Never read process.env directly elsewhere.
const schema = z.object({
  NEXT_PUBLIC_API_MODE: z.enum(["legacy", "nest"]).default("nest"),
  NEXT_PUBLIC_SPRINGBOOT_API_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_NEST_API_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_S3_BASE_URL: z.string().url().default("https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_AUTH0_DOMAIN: z.string().min(1).default("dev-cxnfeuu6gvepp7qu.us.auth0.com"),
  NEXT_PUBLIC_AUTH0_CLIENT_ID: z.string().min(1).default("iW2PThISjeDP6I1dGoTgsoWDGwneBXPP"),
  NEXT_PUBLIC_RAZORPAY_KEY: z.string().min(1).default("rzp_test_TPvtsOM52j6QKA"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).default("pk_test_51S3WzdSRioYtxltc2tRZZ1GG4SKTJ04W7xwwEUqay0NHGzywN5nTgPdy8oR91QRHDWT0JXIFb04CHm3yyZvU0sTu00ddfP9480"),
});


function cleanUrl(val: string | undefined, fallback: string): string {
  if (!val || val.trim() === "") return fallback;
  return val;
}

export const env = schema.parse({
  NEXT_PUBLIC_API_MODE: process.env.NEXT_PUBLIC_API_MODE || "nest",
  NEXT_PUBLIC_SPRINGBOOT_API_URL: cleanUrl(process.env.NEXT_PUBLIC_SPRINGBOOT_API_URL, "http://localhost:3000"),
  NEXT_PUBLIC_NEST_API_URL: cleanUrl(process.env.NEXT_PUBLIC_NEST_API_URL, "http://localhost:3000"),
  NEXT_PUBLIC_S3_BASE_URL: cleanUrl(process.env.NEXT_PUBLIC_S3_BASE_URL, "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/"),
  NEXT_PUBLIC_API_URL: cleanUrl(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_NEST_API_URL, "http://localhost:3000"),
  NEXT_PUBLIC_AUTH0_DOMAIN: process.env.NEXT_PUBLIC_AUTH0_DOMAIN || "dev-cxnfeuu6gvepp7qu.us.auth0.com",
  NEXT_PUBLIC_AUTH0_CLIENT_ID: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || "iW2PThISjeDP6I1dGoTgsoWDGwneBXPP",
  NEXT_PUBLIC_RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY || "rzp_test_TPvtsOM52j6QKA",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_51S3WzdSRioYtxltc2tRZZ1GG4SKTJ04W7xwwEUqay0NHGzywN5nTgPdy8oR91QRHDWT0JXIFb04CHm3yyZvU0sTu00ddfP9480",
});

