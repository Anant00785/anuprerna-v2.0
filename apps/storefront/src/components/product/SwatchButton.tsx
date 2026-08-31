'use client';

import { useState } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { attachTo as attachAttribution } from '@/lib/ad-attribution';
import LoginModal from '@/components/auth/LoginModal';
import type { ProductDetail } from './types';

interface SwatchButtonProps {
  product: ProductDetail;
  recordId: number;
  /** Absolute swatch price = (SWATCH_PRICE_PERCENTAGE/100) * product.price */
  swatchPrice: number;
  onAdded?: () => void;
}

// Port of fb-product-swatch-button. Adds a swatch SKU to cart (productGroup:'swatch').
export default function SwatchButton({ product, recordId, swatchPrice, onAdded }: SwatchButtonProps) {
  const { formatCode } = useCurrency();
  const { user } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [state, setState] = useState<'idle' | 'adding' | 'added'>('idle');

  const addSwatch = async () => {
    if (!user) { setLoginOpen(true); return; }
    setState('adding');
    // Loom's swatch (productGroup:'swatch') validation is stricter than fabric/finished
    // — it 401s without selectedFabricId/selectedSizeOptionId/selectedFinishId/customSize.
    const body = {
      fabricProductId: recordId,
      quantity: 1,
      unit: 'UNIT',
      price: swatchPrice,
      selectedFabricId: 0,
      selectedSizeOptionId: 0,
      selectedFinishId: '',
      orderType: 'IN_STOCK',
      productGroup: 'swatch',
      makingCharge: product.price,
      customSize: {},
      sku: product.sku,
    };
    attachAttribution(body as Record<string, unknown>);
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (res.ok) {
        setState('added');
        onAdded?.();
        setTimeout(() => setState('idle'), 2000);
      } else {
        setState('idle');
      }
    } catch {
      setState('idle');
    }
  };

  return (
    <>
      <button
        type='button'
        onClick={addSwatch}
        disabled={state === 'adding'}
        className='flex w-full items-center gap-3 rounded-xl border border-sand bg-cream p-3 text-left transition-colors hover:border-clay'
      >
        <span
          className='h-12 w-12 flex-shrink-0 rounded-lg bg-cover bg-center'
          style={{ backgroundImage: `url(${product.heroImage})` }}
        />
        <span className='flex flex-col'>
          <span className='text-sm font-medium text-black'>
            {state === 'added' ? '✓ Swatch added' : 'Order a Swatch'}
          </span>
          <span className='text-sm font-bold text-clay'>
            {formatCode(swatchPrice)}
          </span>
        </span>
      </button>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
