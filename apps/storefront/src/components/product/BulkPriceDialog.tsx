'use client';

import { useCurrency } from '@/contexts/CurrencyContext';
import { calculateVDProductPrice, type VDExtras } from './pricing';
import type { ProductDetail, VolumeDiscountItem } from './types';

interface BulkPriceDialogProps {
  open: boolean;
  onClose: () => void;
  product: ProductDetail;
  items: VolumeDiscountItem[];
  disclaimer?: string;
  profileName?: string;
  /** member percentileDiscount (0 when not an active member) */
  loyaltyDiscount?: number;
  isMember?: boolean;
  /** MTO fabric-consumption terms so tier prices stay consistent with the base. */
  vdExtras?: VDExtras;
}

// Port of ProductVolumeDiscountProfileComponent dialog. Per-tier ABSOLUTE prices,
// ascending by discount (cheapest tier shows the deepest discount last — source
// sorts a-b on discount).
export default function BulkPriceDialog({
  open,
  onClose,
  product,
  items,
  disclaimer,
  profileName,
  loyaltyDiscount = 0,
  isMember = false,
  vdExtras,
}: BulkPriceDialogProps) {
  const { format } = useCurrency();
  if (!open) return null;

  const sorted = [...items].sort((a, b) => a.discount - b.discount);
  const unit = (product.unit || 'METER').toLowerCase();

  return (
    <div
      className='fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-label='Bulk pricing tiers'
    >
      <div
        className='relative w-full max-w-[600px] max-h-[80vh] overflow-y-auto rounded-xl bg-white py-5 px-6'
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label='Close'
          onClick={onClose}
          className='absolute top-3 left-3 grid h-8 w-8 place-items-center rounded bg-bark text-white'
          style={{ backgroundColor: '#D4A373' }}
        >
          <span className='material-symbols-outlined text-[18px]'>close</span>
        </button>

        <h2 className='mb-2 text-center text-lg font-bold text-[#3c3c3c]'>
          {profileName || 'Bulk Pricing'}
        </h2>

        {isMember && (
          <div className='mb-3 flex items-center justify-center gap-1.5 text-clay'>
            <span className='material-symbols-outlined text-[16px]'>crown</span>
            <span className='text-xs font-medium'>Wholesale member pricing applied</span>
          </div>
        )}

        <div className='mt-2 flex flex-col gap-2'>
          {sorted.map((vd) => (
            <div
              key={vd.id}
              className='flex w-full items-center justify-between gap-3 border-b border-sand pb-2 capitalize last:border-0'
            >
              <span className='text-sm text-black/70'>
                For {vd.minimumOrderQuantity} {unit}s
                {vd.preOrder && <span className='ml-1.5 text-[11px] normal-case text-bark'>(pre-order)</span>}
              </span>
              <span className='text-sm font-medium text-clay'>
                {format(calculateVDProductPrice(product, vd, loyaltyDiscount, vdExtras))} / {unit}
              </span>
            </div>
          ))}
        </div>

        {disclaimer && (
          <div className='mt-6 flex items-start gap-2 rounded-lg bg-cream p-3'>
            <span className='material-symbols-outlined text-bark text-[18px]'>error</span>
            <p className='whitespace-pre-line text-xs text-black/60'>{disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
