// Pure FAQ-content builder for B2B pSEO landing pages. Deliberately NOT
// 'use client' (unlike B2bLandingPage.tsx) so both the client-side
// FaqAccordion (visual, click-to-expand) AND the server-side page.tsx
// (FAQPage JSON-LD) can import the exact same content -- single source of
// truth, no drift between what renders and what the schema claims.
export interface B2bFaqItem {
  q: string;
  a: string;
}

export function buildB2bFaqs(title: string): B2bFaqItem[] {
  return [
    {
      q: `What is the minimum order quantity for ${title.toLowerCase()}?`,
      a: `Our minimum order quantity starts at 50 meters for standard ${title.toLowerCase()}. Custom dyeing or weaving programmes have a minimum of 200 meters. We can discuss lower MOQs for sampling.`,
    },
    {
      q: `Can I request custom colours or patterns in ${title.toLowerCase()}?`,
      a: `Yes. We offer custom dyeing using natural and chemical dyes. Share your Pantone shade or fabric swatch and our dyeing team will match it. Minimum quantity applies for custom colourways.`,
    },
    {
      q: `What is the lead time for bulk ${title.toLowerCase()} orders?`,
      a: `Standard in-stock fabrics ship within 5–7 working days. Custom woven or dyed orders take 4–8 weeks depending on quantity and complexity. We provide a detailed timeline with your order confirmation.`,
    },
    {
      q: `Do you provide fabric samples before placing a bulk order?`,
      a: `Absolutely. We recommend ordering swatches before committing to bulk. Sample sets are available for a nominal fee, which is adjusted against your first bulk order.`,
    },
    {
      q: `What certifications do your ${title.toLowerCase()} fabrics carry?`,
      a: `Our fabrics are handloom-certified by the Handloom Mark programme. We also supply GRS (Global Recycled Standard) and GOTS-eligible organic cotton options. Certificates are provided with each order.`,
    },
    {
      q: `How is ${title.toLowerCase()} priced — per metre or per yard?`,
      a: `All our fabrics are priced per metre. Bulk pricing tiers apply: orders above 200 m, 500 m, and 1,000 m qualify for progressive discounts. Contact us for a custom price list.`,
    },
    {
      q: `Can Anuprerna ship ${title.toLowerCase()} internationally?`,
      a: `Yes, we ship globally. We work with DHL, FedEx, and sea-freight partners for large orders. All exports are handled with full GST compliance and HS-code documentation for smooth customs clearance.`,
    },
    {
      q: `What makes Anuprerna's ${title.toLowerCase()} different from other suppliers?`,
      a: `We source exclusively from hand-loom artisan clusters in East India — no power-loom substitution. Each fabric carries the texture and slight variation that only hand-weaving produces. You also get direct-from-weaver traceability and a direct positive impact on artisan livelihoods.`,
    },
  ];
}
