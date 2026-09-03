import { Pool } from 'pg';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// No hardcoded fallbacks here on purpose: this file previously shipped a live
// Neon Postgres password and S3 keys as source-code defaults, committed to the
// repo. Missing configuration must fail loudly, not silently authenticate
// against production with a credential anyone reading the repo can see.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

const S3_ENDPOINT = () => requireEnv('NEON_S3_ENDPOINT');
const S3_ACCESS_KEY = () => requireEnv('NEON_S3_ACCESS_KEY_ID');
const S3_SECRET_KEY = () => requireEnv('NEON_S3_SECRET_ACCESS_KEY');
const S3_REGION = () => process.env.NEON_S3_REGION || 'us-east-2';
const S3_BUCKET = () => requireEnv('NEON_FEEDBACK_BUCKET');

// Shared PostgreSQL pool for Neon
let pgPool: Pool | null = null;
export function getNeonPool(): Pool {
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: requireEnv('DATABASE_URL'),
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
      endpoint: S3_ENDPOINT(),
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
  const bucket = S3_BUCKET();

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  // Return signed URL with 7 days expiration (or direct endpoint URL)
  try {
    const signedUrl = await getSignedUrl(
      s3 as any,
      new GetObjectCommand({ Bucket: bucket, Key: key }) as any,
      { expiresIn: 60 * 60 * 24 * 7 }
    );
    return signedUrl;
  } catch {
    return `${S3_ENDPOINT()}/${bucket}/${key}`;
  }
}

/**
 * Save feedback record to Neon Postgres
 */
export async function saveFeedbackToNeon(feedback: FeedbackRecord): Promise<number> {
  const pool = getNeonPool();
  const query = `
    INSERT INTO customer_feedbacks (name, email, rating, category, message, image_url, page_url, page_title, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
    feedback.page_title || null,
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
    SELECT id, name, email, rating, category, message, image_url, page_url, page_title, status, created_at
    FROM customer_feedbacks
    ORDER BY created_at DESC
    LIMIT $1;
  `;
  const res = await pool.query(query, [limit]);
  return res.rows;
}
