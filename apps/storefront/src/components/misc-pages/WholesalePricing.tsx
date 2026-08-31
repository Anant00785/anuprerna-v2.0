'use client';

import { useState } from 'react';
import Img from '@/components/ui/Img';

const CDN = 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/';

// Indicative FX — update periodically. INR per 1 unit.
const CURRENCIES = [
  { code: 'INR', symbol: '₹', perUnitINR: 1 },
  { code: 'USD', symbol: '$', perUnitINR: 83 },
  { code: 'GBP', symbol: '£', perUnitINR: 106 },
  { code: 'EUR', symbol: '€', perUnitINR: 90 },
  { code: 'AUD', symbol: 'A$', perUnitINR: 55 },
] as const;

type CurrencyCode = (typeof CURRENCIES)[number]['code'];

const FABRIC_FAMILIES = [
  {
    name: 'Handloom Cotton',
    desc: 'Our core pillar — 91 live qualities, plain to fine-count',
    minINR: 378,
    maxINR: 1200,
    img: CDN + 'home/swatch-bundle-min.jpg',
    alt: 'Bundle of handwoven cotton fabric swatches in a range of natural and dyed colours',
  },
  {
    name: 'Khadi (handspun cotton)',
    desc: '61 qualities — hand-spun, hand-woven, the sustainability signature',
    minINR: 450,
    maxINR: 1400,
    img: CDN + 'home/hero/home-hero-1.png',
    alt: 'Folded indigo and black hand block-printed handloom fabric with a wooden printing block',
  },
  {
    name: 'Peace Silk (premium)',
    desc: 'Eri · Muga · Matka. Cruelty-free — 19 qualities',
    minINR: 1100,
    maxINR: 2677,
    img: CDN + 'home/custom-dyeing.png',
    alt: 'Naturally dyed pink yarn hanks hand-dried outdoors',
  },
  {
    name: 'Linen',
    desc: 'Breathable natural linen for apparel & heavier drape',
    minINR: 700,
    maxINR: 1500,
    img: CDN + 'home/hero/home-hero-2.png',
    alt: 'Flat-lay of naturally dyed cream and pastel linen and cotton fabric with plant-based dye ingredients',
  },
];

const ASSORTMENT_MIN_INR = 378;
const ASSORTMENT_MAX_INR = 2677;

const STORAGE_KEY = 'anuprerna_wholesale_ccy';

function formatPrice(inr: number, currency: (typeof CURRENCIES)[number]): string {
  if (currency.code === 'INR') {
    return currency.symbol + inr.toLocaleString('en-IN');
  }
  const converted = Math.round(inr / currency.perUnitINR);
  return currency.symbol + converted.toLocaleString('en-US');
}

export default function WholesalePricing() {
  const [ccyCode, setCcyCode] = useState<CurrencyCode>('INR');
  const currency = CURRENCIES.find(c => c.code === ccyCode) ?? CURRENCIES[0];

  function selectCurrency(code: CurrencyCode) {
    setCcyCode(code);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore (private browsing / storage disabled)
    }
  }

  return (
    <>
      {/* Currency selector */}
      <div className='mt-8 flex flex-col items-center gap-3'>
        <span className='text-sm font-semibold text-[#2C3E50]'>Show prices in:</span>
        <div className='flex flex-wrap justify-center gap-2'>
          {CURRENCIES.map(c => {
            const active = c.code === ccyCode;
            return (
              <button
                key={c.code}
                type='button'
                onClick={() => selectCurrency(c.code)}
                aria-pressed={active}
                className={
                  'px-4 py-2 rounded-full text-sm font-semibold border transition ' +
                  (active
                    ? 'text-[#1a1a1a] border-transparent'
                    : 'text-[#7d5b20] border-black/10 bg-sand hover:bg-sand/70')
                }
                style={
                  active
                    ? {
                        background: 'linear-gradient(135deg, #F7C52D 0%, #FFD700 100%)',
                        boxShadow: '0 4px 12px rgba(247, 197, 45, 0.3)',
                      }
                    : undefined
                }
              >
                {c.symbol} {c.code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fabric Families & Price Bands */}
      <div className='mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {FABRIC_FAMILIES.map((f) => (
          <div key={f.name} className='bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition'>
            <div className='relative w-full aspect-[4/3]'>
              <Img
                src={f.img}
                alt={f.alt}
                fill
                sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw'
                className='object-cover'
              />
            </div>
            <div className='p-5'>
              <h3 className='text-base font-bold text-[#7d5b20] mb-1.5'>{f.name}</h3>
              <p className='text-sm text-black/60 leading-relaxed mb-3'>{f.desc}</p>
              <p className='text-sm font-semibold text-clay'>
                {formatPrice(f.minINR, currency)} – {formatPrice(f.maxINR, currency)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className='mt-10 text-sm text-black/60 max-w-3xl mx-auto text-center leading-relaxed'>
        Our assortment spans {formatPrice(ASSORTMENT_MIN_INR, currency)} – {formatPrice(ASSORTMENT_MAX_INR, currency)}/m
        across 185 active qualities. Priced at genuine handloom wage cost and export finishing — we don&apos;t
        compete on the power-loom floor, and the cloth carries the hand and traceability mill fabric can&apos;t.
      </p>
      <p className='mt-2 text-xs text-black/40 max-w-3xl mx-auto text-center'>
        Indicative — final quote confirmed on enquiry.
      </p>
    </>
  );
}
