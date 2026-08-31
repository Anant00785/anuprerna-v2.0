import type { MetadataRoute } from 'next';
import {
  isSeoLive,
  absUrl,
  DISALLOWED_PRODUCT_PATHS,
  DISALLOWED_PREFIXES,
} from '@/lib/seo/config';

// force-dynamic: robots.txt is otherwise static-generated at BUILD time. We read
// SEO_MODE at REQUEST time so ONE Vercel build can flip dark<->live via the env
// var with no rebuild. Cheap route, safe to render per-request.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  // DARK (default): disallow the entire site, no sitemap reference. The demo
  // stays completely non-crawlable until launch.
  if (!isSeoLive()) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    };
  }

  // LIVE: real production rules (ported from www.anuprerna.com/robots.txt) —
  // allow all, minus legacy/utility prefixes and the private payment-link
  // product URLs. Sitemap points at SITE_URL (never the vercel.app host).
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...DISALLOWED_PREFIXES, ...DISALLOWED_PRODUCT_PATHS],
    },
    sitemap: absUrl('/sitemap.xml'),
  };
}
