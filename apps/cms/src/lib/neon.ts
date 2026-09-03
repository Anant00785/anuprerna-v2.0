import { Pool } from "pg";
import { S3Client } from "@aws-sdk/client-s3";

// No hardcoded fallbacks here on purpose: this file previously shipped a live
// Neon Postgres password and S3 keys as source-code defaults, committed to the
// repo. Missing configuration must fail loudly, not silently authenticate
// against production with a credential anyone reading the repo can see.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export const neonS3Endpoint = () => requireEnv("NEON_S3_ENDPOINT");
export const neonFeedbackBucket = () => requireEnv("NEON_FEEDBACK_BUCKET");
const S3_ACCESS_KEY = () => requireEnv("NEON_S3_ACCESS_KEY_ID");
const S3_SECRET_KEY = () => requireEnv("NEON_S3_SECRET_ACCESS_KEY");
const S3_REGION = () => process.env.NEON_S3_REGION || "us-east-2";

let pgPool: Pool | null = null;
export function getNeonPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: requireEnv("DATABASE_URL"),
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pgPool;
}

let s3Client: S3Client | null = null;
export function getNeonS3(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: neonS3Endpoint(),
      region: S3_REGION(),
      credentials: {
        accessKeyId: S3_ACCESS_KEY(),
        secretAccessKey: S3_SECRET_KEY(),
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

export interface FeedbackRecord {
  id?: number;
  name?: string | null;
  email?: string | null;
  rating?: number;
  category?: string;
  message: string;
  image_url?: string | null;
  page_url?: string | null;
  page_title?: string | null;
  status?: string;
  created_at?: string | Date;
}

export async function getFeedbacksFromNeon(limit = 100): Promise<FeedbackRecord[]> {
  const pool = getNeonPool();
  const query = `
    SELECT id, name, email, rating, category, message, image_url, page_url, page_title, status, created_at
    FROM customer_feedbacks
    ORDER BY created_at DESC
    LIMIT $1;
  `;
  const res = await pool.query(query, [limit]);
  return res.rows;
}

export async function updateFeedbackStatusInNeon(id: number, status: string): Promise<boolean> {
  const pool = getNeonPool();
  const query = `
    UPDATE customer_feedbacks
    SET status = $1
    WHERE id = $2;
  `;
  const res = await pool.query(query, [status, id]);
  return (res.rowCount ?? 0) > 0;
}

export async function deleteFeedbackFromNeon(id: number): Promise<boolean> {
  const pool = getNeonPool();
  const query = `
    DELETE FROM customer_feedbacks
    WHERE id = $1;
  `;
  const res = await pool.query(query, [id]);
  return (res.rowCount ?? 0) > 0;
}

export const deleteFeedbackInNeon = deleteFeedbackFromNeon;
