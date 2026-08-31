import 'server-only';
import { loomGet, loomPost } from '@/lib/loom/client';

// ---------------------------------------------------------------------------
// Misc-pages Loom helpers (server-only)
// Used by: /review (review stats), /contact (contact submit), footer
// newsletter signup widget
// ---------------------------------------------------------------------------

export interface ReviewStats {
  count: number;
  rating: number;
}

export interface ReviewStatsResponse {
  reviewStats?: ReviewStats;
  success?: boolean;
}

/** Fetch the global review stats (count + avg rating). Public endpoint — no token. */
export async function getReviewStats(): Promise<ReviewStats | null> {
  try {
    const data = await loomGet<ReviewStatsResponse>('/get/review/stats', {
      revalidate: 300,
    });
    return data?.reviewStats ?? null;
  } catch {
    return null;
  }
}

/**
 * POST a contact enquiry. Served NATIVELY by the sandbox wrapper's
 * MiscController -- stores in its own contact_message table (never a real
 * email, never live Loom). Returns success + message.
 */
export async function postContactEnquiry(body: {
  name: string;
  email: string;
  phone: string;
  country: string;
  company?: string;
  companyWebsite?: string;
  productType?: string;
  productDescription?: string;
  quantity?: number;
  deliveryDate?: string;
  /** Honeypot -- forwarded as-is; a real visitor never fills this. */
  hp?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await loomPost<{ success: boolean; message: string }>(
      '/send/contact-us',
      body,
    );
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, message: msg };
  }
}

/**
 * POST a newsletter signup. Served NATIVELY by the sandbox wrapper's
 * NewsletterController -- upserts into its own newsletter_subscription table
 * (own-record, reversible; no live Loom endpoint for this has ever existed).
 */
export async function postNewsletterSubscribe(
  email: string,
  source?: string,
  hp?: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await loomPost<{ success: boolean; message?: string }>(
      '/send/newsletter-subscribe',
      { email, source, hp },
    );
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, message: msg };
  }
}
