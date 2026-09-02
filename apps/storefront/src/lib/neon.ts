import { Pool } from 'pg';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const NEON_PG_URL =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_WPjQ9oXgzKR7@ep-morning-band-ay7cmm8m-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';

const S3_ENDPOINT =
  process.env.AWS_ENDPOINT_URL_S3 ||
  'https://br-raspy-sun-ayr5oy8j.storage.c-5.us-east-2.aws.neon.tech';

const S3_ACCESS_KEY =
  process.env.AWS_ACCESS_KEY_ID || 'nak_live_d9db58cbb2c94570a43b92ed9ac4f425';

const S3_SECRET_KEY =
  process.env.AWS_SECRET_ACCESS_KEY ||
  'nsk_live_017a5dbfa3add7a13f3af61b4716c974c962add0991842786c552796d4859712';

const S3_REGION = process.env.AWS_REGION || 'us-east-2';
const S3_BUCKET = process.env.NEON_FEEDBACK_BUCKET || 'feeback';

// Shared PostgreSQL pool for Neon
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

// Shared S3 Client for Neon Object Storage
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
  status?: string;
  created_at?: string | Date;
}

/**
 * Upload a feedback image / screenshot to Neon S3 storage
 */
export async function uploadFeedbackImageToNeon(
  fileBuffer: Buffer,
  contentType: string = 'image/jpeg',
  originalFilename: string = 'image.jpg'
): Promise<string> {
  const s3 = getNeonS3();
  const ext = originalFilename.split('.').pop() || 'jpg';
  const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
  const key = `feedback/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  // Return signed URL with 7 days expiration (or direct endpoint URL)
  try {
    const signedUrl = await getSignedUrl(
      s3 as any,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }) as any,
      { expiresIn: 60 * 60 * 24 * 7 }
    );
    return signedUrl;
  } catch {
    return `${S3_ENDPOINT}/${S3_BUCKET}/${key}`;
  }
}

/**
 * Save feedback record to Neon Postgres
 */
export async function saveFeedbackToNeon(feedback: FeedbackRecord): Promise<number> {
  const pool = getNeonPool();
  const query = `
    INSERT INTO customer_feedbacks (name, email, rating, category, message, image_url, page_url, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id;
  `;
  const values = [
    feedback.name || 'Anonymous Guest',
    feedback.email || null,
    feedback.rating || 5,
    feedback.category || 'general',
    feedback.message,
    feedback.image_url || null,
    feedback.page_url || '/',
    feedback.status || 'new',
  ];

  const res = await pool.query(query, values);
  return res.rows[0]?.id;
}

/**
 * Get all customer feedbacks from Neon Postgres
 */
export async function getFeedbacksFromNeon(limit = 100): Promise<FeedbackRecord[]> {
  const pool = getNeonPool();
  const query = `
    SELECT id, name, email, rating, category, message, image_url, page_url, status, created_at
    FROM customer_feedbacks
    ORDER BY created_at DESC
    LIMIT $1;
  `;
  const res = await pool.query(query, [limit]);
  return res.rows;
}
