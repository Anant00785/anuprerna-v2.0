import { NextRequest, NextResponse } from 'next/server';
import { getIdentity } from '@/lib/feedback-identity';
import { saveFeedbackToNeon, uploadFeedbackImageToNeon, getFeedbacksFromNeon } from '@/lib/neon';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000';
const APP = 'storefront';

// GET /api/feedback?route=/foo -> namespace feedback (route + descendants) + the caller identity.
export async function GET(req: NextRequest) {
  const me = await getIdentity();
  const route = req.nextUrl.searchParams.get('route') ?? '';
  
  let allItems: Array<{ id: string; route: string; [key: string]: unknown }> = [];

  // Try backend first
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${BACKEND}/feedback?app=${APP}`, {
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const data = (await res.json().catch(() => ({}))) as { feedback?: Array<{ id: string; route: string }> };
    if (Array.isArray(data.feedback)) {
      allItems = data.feedback;
    }
  } catch {
    /* fallback to Neon */
  }

  // Also pull from Neon DB
  try {
    const neonRows = await getFeedbacksFromNeon(50);
    const neonFormatted = (neonRows || []).map((r) => ({
      id: `neon_${r.id}`,
      route: r.page_url || '/',
      pageLabel: r.page_url || '/',
      text: r.message,
      images: r.image_url ? [r.image_url] : [],
      submitterName: r.name || 'Customer',
      submitterEmail: r.email || null,
      status: r.status === 'resolved' ? 'resolved' : r.status === 'reviewed' ? 'claude_done' : 'pending',
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      updatedAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    }));

    // Merge without duplicate IDs
    const existingIds = new Set(allItems.map((i) => i.id));
    for (const item of neonFormatted) {
      if (!existingIds.has(item.id)) {
        allItems.unshift(item);
      }
    }
  } catch (err) {
    console.warn('Failed to load neon feedback in storefront API:', err);
  }

  const filtered = route
    ? allItems.filter((item) => {
        const r = item.route ?? '';
        return r === route || r.startsWith(route + '/');
      })
    : allItems;

  return NextResponse.json({ feedback: filtered, me });
}

// POST /api/feedback { route, pageLabel, text, images[] }
export async function POST(req: NextRequest) {
  const me = await getIdentity();
  const body = (await req.json().catch(() => ({}))) as {
    route?: string;
    pageLabel?: string;
    text?: string;
    images?: string[];
  };
  const text = (body.text ?? '').trim();
  if (!text) {
    return NextResponse.json({ error: 'Feedback text is required' }, { status: 400 });
  }

  const incomingImages = Array.isArray(body.images) ? body.images.slice(0, 2) : [];
  const uploadedImageUrls: string[] = [];

  // Upload any base64 images to Neon S3
  for (const img of incomingImages) {
    if (img.startsWith('data:')) {
      try {
        const matches = img.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const s3Url = await uploadFeedbackImageToNeon(buffer, mimeType, 'feedback.jpg');
          uploadedImageUrls.push(s3Url);
        } else {
          uploadedImageUrls.push(img);
        }
      } catch {
        uploadedImageUrls.push(img);
      }
    } else {
      uploadedImageUrls.push(img);
    }
  }

  const submitterName = me.authenticated ? (me.name || me.email || 'Customer') : 'Guest';
  const submitterEmail = me.email || null;

  // 1. Save to Neon Postgres DB
  try {
    await saveFeedbackToNeon({
      name: submitterName,
      email: submitterEmail,
      rating: 5,
      category: 'website',
      message: text,
      image_url: uploadedImageUrls[0] || null,
      page_url: body.route || '/',
      status: 'new',
    });
  } catch (err) {
    console.warn('Neon save fallback failed:', err);
  }

  // 2. Also forward to local backend
  const payload = {
    app: APP,
    route: body.route ?? '',
    pageLabel: body.pageLabel ?? body.route ?? '',
    text,
    images: uploadedImageUrls,
    submitterName,
    submitterEmail,
  };

  try {
    const res = await fetch(`${BACKEND}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.ok ? 201 : res.status });
  } catch {
    return NextResponse.json({ success: true, savedToNeon: true }, { status: 201 });
  }
}
