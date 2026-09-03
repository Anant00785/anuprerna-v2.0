import { Pool } from "pg";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const NEON_PG_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_WPjQ9oXgzKR7@ep-morning-band-ay7cmm8m-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";

const S3_ENDPOINT =
  process.env.NEON_S3_ENDPOINT ||
  "https://br-raspy-sun-ayr5oy8j.storage.c-5.us-east-2.aws.neon.tech";

const S3_ACCESS_KEY =
  process.env.NEON_S3_ACCESS_KEY_ID ||
  "nak_live_d9db58cbb2c94570a43b92ed9ac4f425";

const S3_SECRET_KEY =
  process.env.NEON_S3_SECRET_ACCESS_KEY ||
  "nsk_live_017a5dbfa3add7a13f3af61b4716c974c962add0991842786c552796d4859712";

const S3_REGION = process.env.NEON_S3_REGION || "us-east-2";
const S3_BUCKET = process.env.NEON_FEEDBACK_BUCKET || "feeback";

let pgPool: Pool | null = null;
export function getNeonPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: NEON_PG_URL,
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
      endpoint: S3_ENDPOINT,
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
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
