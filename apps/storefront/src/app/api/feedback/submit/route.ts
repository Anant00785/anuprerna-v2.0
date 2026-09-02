import { NextRequest, NextResponse } from 'next/server';
import { uploadFeedbackImageToNeon, saveFeedbackToNeon } from '@/lib/neon';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let name = '';
    let email = '';
    let rating = 5;
    let category = 'general';
    let message = '';
    let pageUrl = '/';
    let imageUrl: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      name = String(formData.get('name') || '').trim();
      email = String(formData.get('email') || '').trim();
      rating = Number(formData.get('rating') || 5);
      category = String(formData.get('category') || 'general').trim();
      message = String(formData.get('message') || '').trim();
      pageUrl = String(formData.get('pageUrl') || '/').trim();

      const imageFile = formData.get('image') as File | null;
      if (imageFile && imageFile.size > 0) {
        const buffer = Buffer.from(await imageFile.arrayBuffer());
        imageUrl = await uploadFeedbackImageToNeon(
          buffer,
          imageFile.type || 'image/jpeg',
          imageFile.name || 'feedback.jpg'
        );
      }
    } else {
      const body = await req.json();
      name = String(body.name || '').trim();
      email = String(body.email || '').trim();
      rating = Number(body.rating || 5);
      category = String(body.category || 'general').trim();
      message = String(body.message || '').trim();
      pageUrl = String(body.pageUrl || '/').trim();

      if (body.imageBase64) {
        const matches = body.imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          imageUrl = await uploadFeedbackImageToNeon(buffer, mimeType, 'feedback.jpg');
        }
      }
    }

    if (!message) {
      return NextResponse.json({ success: false, error: 'Feedback message is required' }, { status: 400 });
    }

    const feedbackId = await saveFeedbackToNeon({
      name: name || 'Anonymous User',
      email: email || null,
      rating: Math.min(5, Math.max(1, rating)),
      category,
      message,
      image_url: imageUrl,
      page_url: pageUrl,
      status: 'new',
    });

    return NextResponse.json({
      success: true,
      id: feedbackId,
      imageUrl,
      message: 'Feedback submitted successfully to Neon!',
    });
  } catch (error: unknown) {
    console.error('Feedback submission error:', error);
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
