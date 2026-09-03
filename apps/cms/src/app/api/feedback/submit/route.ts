import { NextRequest, NextResponse } from "next/server";
import { getNeonPool, getNeonS3 } from "@/lib/neon";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const S3_BUCKET = process.env.NEON_FEEDBACK_BUCKET || "feeback";
const S3_ENDPOINT =
  process.env.AWS_ENDPOINT_URL_S3 ||
  "https://br-raspy-sun-ayr5oy8j.storage.c-5.us-east-2.aws.neon.tech";

async function uploadImageToNeon(
  fileBuffer: Buffer,
  contentType: string = "image/jpeg",
  originalFilename: string = "feedback.jpg"
): Promise<string> {
  const s3 = getNeonS3();
  const ext = originalFilename.split(".").pop() || "jpg";
  const cleanExt = ext.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
  const key = `cms-feedback/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

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

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let name = "";
    let email = "";
    let rating = 5;
    let category = "cms";
    let message = "";
    let pageUrl = "/";
    let pageTitle = "";
    let imageUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      name = String(formData.get("name") || "").trim();
      email = String(formData.get("email") || "").trim();
      rating = Number(formData.get("rating") || 5);
      category = String(formData.get("category") || "cms").trim();
      message = String(formData.get("message") || "").trim();
      pageUrl = String(formData.get("pageUrl") || "/").trim();
      pageTitle = String(formData.get("pageTitle") || "").trim();

      const imageFile = formData.get("image") as File | null;
      if (imageFile && imageFile.size > 0) {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        imageUrl = await uploadImageToNeon(
          buffer,
          imageFile.type || "image/jpeg",
          imageFile.name || "feedback.jpg"
        );
      }
    } else {
      const body = await req.json();
      name = String(body.name || "").trim();
      email = String(body.email || "").trim();
      rating = Number(body.rating || 5);
      category = String(body.category || "cms").trim();
      message = String(body.message || "").trim();
      pageUrl = String(body.pageUrl || "/").trim();
      pageTitle = String(body.pageTitle || "").trim();

      if (body.imageBase64) {
        const matches = body.imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          imageUrl = await uploadImageToNeon(buffer, mimeType, "feedback.jpg");
        }
      }
    }

    if (!message) {
      return NextResponse.json({ success: false, error: "Feedback message is required" }, { status: 400 });
    }

    const pool = getNeonPool();
    const query = `
      INSERT INTO customer_feedbacks (name, email, rating, category, message, image_url, page_url, page_title, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id;
    `;
    const values = [
      name || "CMS Admin",
      email || null,
      Math.min(5, Math.max(1, rating)),
      category,
      message,
      imageUrl || null,
      pageUrl || "/",
      pageTitle || null,
      "new",
    ];

    const res = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      id: res.rows[0]?.id,
      imageUrl,
      pageUrl,
      pageTitle,
      message: "Feedback submitted successfully to Neon!",
    });
  } catch (error: unknown) {
    console.error("CMS Feedback submission error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
