'use client';

// WholesaleUpgradeClient — the /wholesale/upgrade page body. Gates the instant
// self-declare form by auth state:
//   loading       -> spinner
//   guest         -> prompt to log in as a wholesale buyer
//   already b2b    -> "you're already wholesale" (no form)
//   logged-in b2c  -> the SelfDeclareWholesaleForm (instant upgrade)

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useBuyerMode } from '@/components/BuyerModeProvider';
import SelfDeclareWholesaleForm from './SelfDeclareWholesaleForm';

export default function WholesaleUpgradeClient() {
  const { user, loading } = useAuth();
  const { isBusiness } = useBuyerMode();

  return (
    <main className='bg-gray-50 text-black min-h-[70vh]'>
      <section className='py-14 px-5'>
        <div className='max-w-3xl mx-auto'>
          <div className='text-center mb-8'>
            <span className='inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-[#F7C52D]/50 text-[#7d5b20] mb-4'
              style={{ background: 'rgba(247,197,45,0.1)' }}>
              <span className='material-symbols-outlined text-base' style={{ color: '#F7C52D' }}>bolt</span>
              Instant wholesale — no approval wait
            </span>
            <h1 className='text-2xl sm:text-3xl font-bold text-black mb-3'>Upgrade to a wholesale account</h1>
            <p className='text-black/60 max-w-xl mx-auto text-sm'>
              Tell us a little about your business and your account switches to wholesale
              immediately — unlocking bulk pricing, volume-discount tiers, MOQ and pre-order across the store.
            </p>
          </div>

          {loading ? (
            <div className='flex justify-center py-16 text-black/50 text-sm'>Loading…</div>
          ) : !user ? (
            <div className='flex justify-center py-12'>
              <div className='w-full max-w-md rounded-xl border border-black/10 bg-white shadow-sm px-8 py-10 flex flex-col items-center text-center'>
                <span aria-hidden='true' className='material-symbols-outlined text-5xl text-clay mb-4'>lock</span>
                <h2 className='text-xl font-medium mb-2'>Please sign in first</h2>
                <p className='text-black/60 text-sm mb-6'>
                  Sign in to your storefront account, then upgrade to wholesale in seconds.
                </p>
                <Link
                  href='/auth'
                  className='inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-[#1a1a1a] rounded-lg transition'
                  style={{ background: 'linear-gradient(135deg, #F7C52D 0%, #FFD700 100%)', boxShadow: '0 4px 12px rgba(247, 197, 45, 0.3)' }}
                >
                  Sign in
                </Link>
              </div>
            </div>
          ) : isBusiness ? (
            <div className='flex justify-center py-12'>
              <div className='w-full max-w-md rounded-xl border border-black/10 bg-white shadow-sm px-8 py-10 flex flex-col items-center text-center'>
                <span aria-hidden='true' className='material-symbols-outlined text-5xl text-[#F7C52D] mb-4'>verified</span>
                <h2 className='text-xl font-medium mb-2'>You&apos;re already a wholesale buyer</h2>
                <p className='text-black/60 text-sm mb-6'>
                  Bulk pricing, volume tiers, MOQ and pre-order are unlocked across the store.
                </p>
                <Link href='/' className='text-clay text-sm font-medium hover:underline'>Browse the catalogue</Link>
              </div>
            </div>
          ) : (
            <SelfDeclareWholesaleForm />
          )}
        </div>
      </section>
    </main>
  );
}
