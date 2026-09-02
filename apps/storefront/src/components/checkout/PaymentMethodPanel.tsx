'use client';

import { useState } from 'react';

interface Props {
  isINR: boolean;
  /** Amount to be collected now, already formatted for display. */
  amountLabel: string;
  /** Payment provider in force */
  provider: string;
  busy: boolean;
  busyLabel: string;
  error: string;
  onPay: (selectedProvider?: string) => void;
}

export default function PaymentMethodPanel({ isINR, amountLabel, provider, busy, busyLabel, error, onPay }: Props) {
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'razorpay'>(isINR ? 'razorpay' : 'stripe');

  const activeProvider = isINR ? 'razorpay' : selectedGateway;

  return (
    <div className='space-y-5'>
      <h2 className='text-sm font-semibold uppercase tracking-[.08em] text-clay'>Payment Method</h2>

      <div className='space-y-3'>
        {isINR ? (
          /* Domestic INR: Razorpay */
          <div
            onClick={() => setSelectedGateway('razorpay')}
            className='rounded-xl border border-[#ca9b6d] ring-1 ring-[#ca9b6d] bg-white p-5 cursor-pointer transition-all shadow-xs'
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <input
                  type='radio'
                  name='paymentGateway'
                  checked={true}
                  readOnly
                  className='accent-[#ca9b6d] w-4 h-4 cursor-pointer'
                />
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-bold text-gray-900'>Razorpay</span>
                  <svg className='w-5 h-5 text-[#0c2340]' viewBox='0 0 24 24' fill='currentColor'>
                    <path
                      d='M22.436 0l-11.91 7.773-1.174 4.276 6.625-4.324-4.908 16.275h4.153l7.214-24zM1.564 24l5.632-18.665 4.316-2.817-4.135 13.708 4.908-3.204-2.148 10.978h-8.573z'
                      fill='#0284c7'
                    />
                  </svg>
                </div>
              </div>
              <span className='text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200'>
                UPI &amp; Cards
              </span>
            </div>

            <p className='text-xs text-gray-600 mt-2 ml-7'>
              Credit/Debit Card, UPI, Net Banking, Wallets
            </p>

            <div className='bg-[#f8f9fa] border border-gray-100 rounded-lg p-3 mt-3 ml-7 text-xs text-gray-500 leading-relaxed'>
              Secure payment powered by Razorpay. All major Indian cards, UPI apps &amp; banks accepted.
            </div>
          </div>
        ) : (
          /* International (USD, EUR, GBP, etc.): Show BOTH Stripe and Razorpay */
          <>
            {/* 1. Stripe Option */}
            <div
              onClick={() => setSelectedGateway('stripe')}
              className={`rounded-xl border p-5 cursor-pointer transition-all ${
                selectedGateway === 'stripe'
                  ? 'border-[#ca9b6d] ring-1 ring-[#ca9b6d] bg-white shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 bg-[#fafafa]'
              }`}
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <input
                    type='radio'
                    name='paymentGateway'
                    checked={selectedGateway === 'stripe'}
                    onChange={() => setSelectedGateway('stripe')}
                    className='accent-[#ca9b6d] w-4 h-4 cursor-pointer'
                  />
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-bold text-gray-900'>Credit / Debit Card (Stripe)</span>
                  </div>
                </div>
                <span className='text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200'>
                  Stripe
                </span>
              </div>

              <p className='text-xs text-gray-600 mt-2 ml-7'>
                Visa, MasterCard, American Express, Discover, Apple Pay
              </p>

              {selectedGateway === 'stripe' && (
                <div className='bg-[#f8f9fa] border border-gray-100 rounded-lg p-3 mt-3 ml-7 text-xs text-gray-500 leading-relaxed'>
                  Secure international payment powered by Stripe. You will be taken to Stripe&apos;s secure payment window.
                </div>
              )}
            </div>

            {/* 2. Razorpay International Option */}
            <div
              onClick={() => setSelectedGateway('razorpay')}
              className={`rounded-xl border p-5 cursor-pointer transition-all ${
                selectedGateway === 'razorpay'
                  ? 'border-[#ca9b6d] ring-1 ring-[#ca9b6d] bg-white shadow-xs'
                  : 'border-gray-200 hover:border-gray-300 bg-[#fafafa]'
              }`}
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <input
                    type='radio'
                    name='paymentGateway'
                    checked={selectedGateway === 'razorpay'}
                    onChange={() => setSelectedGateway('razorpay')}
                    className='accent-[#ca9b6d] w-4 h-4 cursor-pointer'
                  />
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-bold text-gray-900'>Razorpay (International)</span>
                    <svg className='w-5 h-5 text-[#0c2340]' viewBox='0 0 24 24' fill='currentColor'>
                      <path
                        d='M22.436 0l-11.91 7.773-1.174 4.276 6.625-4.324-4.908 16.275h4.153l7.214-24zM1.564 24l5.632-18.665 4.316-2.817-4.135 13.708 4.908-3.204-2.148 10.978h-8.573z'
                        fill='#0284c7'
                      />
                    </svg>
                  </div>
                </div>
                <span className='text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200'>
                  Razorpay
                </span>
              </div>

              <p className='text-xs text-gray-600 mt-2 ml-7'>
                International Cards, Net Banking, Multi-Currency Wallets
              </p>

              {selectedGateway === 'razorpay' && (
                <div className='bg-[#f8f9fa] border border-gray-100 rounded-lg p-3 mt-3 ml-7 text-xs text-gray-500 leading-relaxed'>
                  Secure payment powered by Razorpay. A secure Razorpay modal will open to complete checkout.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Policy links */}
      <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-clayd/60'>
        <a href='/content/policies/privacy-policy/173823' target='_blank' rel='noopener' className='underline underline-offset-2 hover:text-clay'>Privacy Policy</a>
        <a href='/return-policy' target='_blank' rel='noopener' className='underline underline-offset-2 hover:text-clay'>Return Policy</a>
        <a href='/content/policies/terms-conditions/174271' target='_blank' rel='noopener' className='underline underline-offset-2 hover:text-clay'>Terms &amp; Conditions</a>
        <a href='/international-orders' target='_blank' rel='noopener' className='underline underline-offset-2 hover:text-clay'>International Orders</a>
      </div>

      {error && (
        <p role='alert' className='rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800'>
          {error}
        </p>
      )}

      <button
        type='button'
        onClick={() => onPay(activeProvider)}
        disabled={busy}
        data-testid='pay-now'
        className='flex w-full items-center justify-center gap-2 rounded-md bg-clay/80 px-4 py-3.5 text-sm font-semibold uppercase tracking-[.08em] text-white transition hover:bg-clay disabled:opacity-60 cursor-pointer'
      >
        {busy ? busyLabel : 'Pay ' + amountLabel}
        {!busy && <span className='material-symbols-outlined text-[18px]'>lock</span>}
      </button>

      <p className='flex items-center justify-center gap-1.5 text-center text-xs text-clayd/60'>
        <span className='material-symbols-outlined text-[15px]'>lock</span>
        Your details are handled securely.
      </p>
    </div>
  );
}
