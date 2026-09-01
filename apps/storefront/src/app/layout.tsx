import type { Metadata } from 'next';
import { Jost } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { CurrencyProvider, type ForexRates, type ForexUplifts } from '@/contexts/CurrencyContext';
import { getForex, getForexList } from '@/lib/loom/endpoints';
import NotificationBar from '@/components/layout/NotificationBar';
import TopProgressBar from '@/components/layout/TopProgressBar';
import SiteHeaderServer from '@/components/layout/SiteHeader.server';
import SiteFooter from '@/components/layout/SiteFooter';
import CookieConsent from '@/components/layout/CookieConsent';
import { BuyerModeProvider } from '@/components/BuyerModeProvider';
import AdAttributionCapture from '@/components/AdAttributionCapture';
import BuyerModeToggle from '@/components/BuyerModeToggle';
import PageFeedbackWidget from '@/components/feedback/PageFeedbackWidget';
import JsonLd from '@/components/seo/JsonLd';
import { siteUrl, robotsMeta } from '@/lib/seo/config';

// FIX 1: Load Jost via next/font/google — self-hosted, preloaded, no external
// round-trip, no render-blocking stylesheet. Exposes --font-jost CSS variable.
const jost = Jost({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-jost',
  preload: true,  // CLS fix: preload so font arrives before first paint — eliminates the 69px hero-column reflow at t=319ms
});

const TITLE = 'Sustainable Artisanal Handloom Fabrics, Apparel & Accessories Manufacturer | Anuprerna';
// Standardized to 500+ artisans per Amit's decision (2026-07-07) to use a single consistent
// figure everywhere (was previously 300+ to match the then-live www.anuprerna.com meta tag,
// which itself is being updated to 500+ in the fabric repo — see FIX (F-H9) parity note).
const DESC = 'Discover Anuprerna’s sustainable handloom fabrics crafted by 500+ skilled artisans in East India. We offer low MOQ custom manufacturing of apparel, stoles, scarves, handbags, and home furnishings in cotton, khadi, linen, hemp, bamboo, mulberry, matka silk and more.';

// SEO built DARK. generateMetadata reads SEO_MODE at RUNTIME so a Vercel env
// flip activates the SEO layer without a rebuild. DARK (default) => noindex.
// metadataBase + all canonical/OG urls resolve against SITE_URL (anuprerna.com),
// NEVER the vercel.app demo host, in either mode. A '%s | Anuprerna' title
// template is deliberately NOT used: live PDP titles are the bare product name
// (no brand suffix) and every existing page already embeds the brand, so a
// suffix template would double-brand ~30 pages. TITLE is the default fallback;
// pages set their own full titles.
export async function generateMetadata(): Promise<Metadata> {
  const site = siteUrl();
  return {
    metadataBase: new URL(site),
    title: TITLE,
    description: DESC,
    robots: robotsMeta(),
    alternates: { canonical: site },
    openGraph: {
      type: 'website',
      siteName: 'Anuprerna',
      locale: 'en_US',
      url: site,
      title: TITLE,
      description: DESC,
    },
    twitter: {
      card: 'summary_large_image',
      title: TITLE,
      description: DESC,
    },
  };
}

// Organization structured data — rendered in BOTH modes (harmless while
// noindexed). url/logo anchor to SITE_URL / brand assets, never vercel.app.
function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Anuprerna',
    url: siteUrl(),
    logo: '/media/logo_black.svg',
    sameAs: [
      'https://twitter.com/Anuprerna6',
      'https://www.facebook.com/anuprernatelier/',
      'https://in.pinterest.com/anuprernas/',
      'https://www.instagram.com/anuprerna_atelier/',
      'https://www.linkedin.com/company/anuprerna/',
    ],
  };
}

// WebSite structured data — site-wide, rendered in BOTH modes (harmless while
// noindexed). SearchAction target is the app's REAL search route
// (app/display/search/page.tsx reads ?search=<term>) — confirmed live, not a
// placeholder.
function websiteJsonLd() {
  const site = siteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Anuprerna',
    url: site,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: site + '/display/search?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Fetch forex once at the layout level so CurrencyProvider covers ALL page content.
  // BOTH numbers live prices with: the day's market rate AND the studio's
  // per-market uplift. Their product is the effective rate, and it must match
  // what the server charges (backend ForexConversionService).
  const [forex, forexList] = await Promise.all([
    getForex().catch(() => null),
    getForexList().catch(() => []),
  ]);
  const rates: ForexRates | null = forex
    ? { usd: forex.usd, gbp: forex.gbp, eur: forex.eur }
    : null;
  const uplifts: ForexUplifts = {};
  for (const row of forexList) {
    const code = String(row?.currency ?? '').toUpperCase();
    const v = Number(row?.rate);
    if ((code === 'INR' || code === 'USD' || code === 'GBP' || code === 'EUR') && Number.isFinite(v) && v > 0) {
      uplifts[code] = v;
    }
  }

  const feedbackEnabled = process.env.NEXT_PUBLIC_FEEDBACK_ENABLED === 'true';

  return (
    <html lang='en' className={jost.variable}>
      <head>
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      </head>
      <body>
        <AuthProvider>
          {/* Ad-attribution capture: runs captureFromUrl() on every landing (gclid/utm_*). */}
          <AdAttributionCapture />
          <CurrencyProvider rates={rates} uplifts={uplifts}>
            <BuyerModeProvider>
            <TopProgressBar />
            <NotificationBar />
            <SiteHeaderServer />
            {children}
            <SiteFooter />
            <CookieConsent />
            {feedbackEnabled && <PageFeedbackWidget />}
              {/* Buyer-mode switcher: global, unobtrusive fixed control (desktop).
                 Mounted here in the layout (not SiteHeader) to avoid the busy header
                 edit-lane; flips B2C<->B2B session mode. See BuyerModeToggle TODO. */}
              <div className='fixed bottom-4 left-4 z-[110] hidden lg:flex items-center rounded-full border border-gray-300 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur'>
                <BuyerModeToggle />
              </div>
            </BuyerModeProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
