'use client';
// BuyerModeHome -- buyer-mode-aware home composition (v1, founder taste review).
//
// The home page shows the SAME sections in every mode -- mode only changes the
// ORDER / EMPHASIS, never availability and never any price (see lib/buyer-mode.ts).
//
// The site is primarily B2B, with B2C as a secondary explore lane. Ordering below
// is founder-set off Microsoft Clarity behaviour data (revised 2026-08-16):
//
//   guest & b2c (retail)  -> SHOPPABLE-first order:
//       Hero -> Finished (the moving, shoppable product) -> Featured (fabric +
//       categories) -> trust strip -> Collaborations -> Reviews
//       -> Manufacturing process -> [Wholesale invitation] -> Wholesale -> News
//     Retail visitors want the shoppable product first, NOT manufacturing
//     capability or fabric yardage. Manufacturing sits low, immediately before the
//     wholesale invitation, where it backs the "we can also custom-make it" pitch.
//   b2b (logged-in wholesale) -> capability-first order:
//       Hero -> Manufacturing process (a brand buyer wants capability EARLY)
//       -> Wholesale -> Collaborations (designer proof high for brand buyers)
//       -> Featured (fabric merchandising) -> trust strip
//       -> Reviews -> Finished (B2C, secondary) -> News
//
// SLOTS: the manufacturing + collaborations props are SERVER-rendered elements passed
// down from app/page.tsx. Collaborations is an async server component that fetches
// Loom data -- importing it here (a client module) would push the fetch to the
// browser and break the ISR cache, so it arrives as a slot instead.
//
// SSR + first client render use the DEFAULT 'guest' order (matches the ISR-cached
// HTML), then the provider applies the real cookie in an effect -- no hydration
// mismatch, and the CLS-measured guest load keeps the exact prior section order.
import Hero from './Hero';
import ArtisanFlow from './ArtisanFlow';
import FeaturedProducts from './FeaturedProducts';
import WholesalePartner from './WholesalePartner';
import Reviews from './Reviews';
import FinishedProducts from './FinishedProducts';
import News from './News';
import { useBuyerMode } from './BuyerModeProvider';
import type { ReactNode } from 'react';

// Wholesale invitation -- shown to guest + b2c (retail) ONLY, framing the
// wholesale section. Copy is fixed (founder-approved). Clicking the CTA flips the
// session into logged-in wholesale (b2b) mode, which reveals the actual bulk data
// on product pages. Text + button only -> zero CLS.
function WholesaleInvitation() {
  const { setMode } = useBuyerMode();
  return (
    <section className='w-full bg-[#7D5B20] py-8'>
      <div className='max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left'>
          <p className='text-base sm:text-lg text-white leading-relaxed'>
            <span className='font-semibold'>Buying for a business?</span>{' '}
            <span className='text-white/90'>Log in as a wholesale buyer for bulk pricing, pre-order &amp; MOQ.</span>
          </p>
          <button
            type='button'
            onClick={() => setMode('b2b')}
            className='inline-flex items-center gap-2 whitespace-nowrap bg-white text-[#7D5B20] px-6 py-3 rounded-lg font-semibold hover:bg-[#fffcf7] transition-colors shadow-sm'>
            <span className='material-symbols-outlined text-[18px]'>storefront</span>
            Log in as a wholesale buyer
          </button>
        </div>
      </div>
    </section>
  );
}

export default function BuyerModeHome({
  manufacturing,
  collaborations,
}: {
  manufacturing?: ReactNode;
  collaborations?: ReactNode;
}) {
  const { isBusiness } = useBuyerMode();

  if (isBusiness) {
    // Capability-forward: manufacturing process + partner program lead, then
    // designer proof and fabric merchandising; B2C finished goods drop to
    // secondary. No invitation (b2b already sees bulk data).
    return (
      <>
        <Hero />
        {manufacturing}
        <WholesalePartner />
        {collaborations}
        <FeaturedProducts />
        <ArtisanFlow />
        <Reviews />
        <FinishedProducts />
        <News />
      </>
    );
  }

  // guest + b2c: shoppable-forward -- finished goods lead, manufacturing drops to
  // just above the wholesale invitation it supports.
  return (
    <>
      <Hero />
      <FinishedProducts />
      <FeaturedProducts />
      <ArtisanFlow />
      {collaborations}
      <Reviews />
      {manufacturing}
      <WholesaleInvitation />
      <WholesalePartner />
      <News />
    </>
  );
}
