'use client';
import type { CheckoutStep } from './types';

// Three-node progress stepper: Cart -> Shipping -> Payment, dashed connectors.
const NODES: { key: 'cart' | 'shipping' | 'payment'; label: string }[] = [
  { key: 'cart', label: 'Cart' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'payment', label: 'Payment' },
];

function rank(step: CheckoutStep): number {
  if (step === 'cart') return 0;
  if (step === 'shipping') return 1;
  if (step === 'payment') return 2;
  return 3; // confirm — all filled
}

export default function Stepper({ step }: { step: CheckoutStep }) {
  const active = rank(step);
  return (
    <div className='flex items-center justify-center gap-2 sm:gap-4 py-2'>
      {NODES.map((n, i) => {
        const done = i < active;
        const isActive = i === active;
        const filled = done || isActive;
        return (
          <div key={n.key} className='flex items-center'>
            <div className='flex flex-col items-center'>
              <div
                className={
                  'flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border-2 transition ' +
                  (filled
                    ? 'border-clay bg-clay/80 text-white'
                    : 'border-clay/40 bg-transparent text-clay/40')
                }
              >
                {done || isActive ? (
                  <span className='material-symbols-outlined text-[22px]'>check</span>
                ) : (
                  <span className='material-symbols-outlined text-[22px]'>check</span>
                )}
              </div>
              <span
                className={
                  'mt-2 text-sm sm:text-base font-medium ' + (filled ? 'text-clay' : 'text-clay/40')
                }
              >
                {n.label}
              </span>
            </div>
            {i < NODES.length - 1 && (
              <div
                className={
                  'mx-1 sm:mx-3 mb-7 h-0 w-10 sm:w-24 border-t-2 border-dashed ' +
                  (i < active ? 'border-clay' : 'border-clay/30')
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
