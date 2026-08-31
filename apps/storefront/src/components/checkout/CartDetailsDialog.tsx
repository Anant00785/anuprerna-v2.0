'use client';

import { useCurrency } from '@/contexts/CurrencyContext';
import type { CartItem } from './types';
import { effectiveOrderType, ORDER_TYPE_SECTION, deliveryRange } from './types';

// Read-only per-line details modal. Mirrors the SizeGuideDialog / BulkPriceDialog
// pattern (fixed overlay, click-outside + close-button, a11y dialog role). Renders
// EVERYTHING already resolved onto the enriched CartItem — no new fetch:
//   product name + SKU, chosen fabric name + SKU, finish/dye name, selected size,
//   custom measurements / Pantone + notes, order type + estimated delivery, and a
//   price breakdown (base + finish add-on + custom-size add-on = line total).
export default function CartDetailsDialog({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: CartItem;
}) {
  const { formatCode2 } = useCurrency();
  if (!open) return null;

  const p = item.fabricProductPreview?.product;
  const isSwatch = (item.productGroup || p?.productGroup || '').toLowerCase() === 'swatch';
  const baseName = p?.name || 'Product';
  const displayName = (isSwatch ? 'Swatch - ' : '') + baseName;
  const productSku = item.sku || p?.sku || null;

  const d = item.customDetails || {};
  const et = effectiveOrderType(item);
  const pb = item.priceBreakdown;

  const rows: { label: string; value: string }[] = [];
  if (productSku) rows.push({ label: 'Product SKU', value: String(productSku) });
  if (d.fabricName)
    rows.push({
      label: 'Fabric',
      value: d.fabricName + (d.fabricSku ? ' (SKU ' + d.fabricSku + ')' : ''),
    });
  if (d.finishName) rows.push({ label: 'Finish / Dye', value: d.finishName });
  if (d.sizeLabel) rows.push({ label: 'Size', value: d.sizeLabel });
  if (d.customSize) rows.push({ label: 'Custom / Pantone', value: d.customSize });
  rows.push({ label: 'Order Type', value: ORDER_TYPE_SECTION[et] });
  rows.push({ label: 'Estimated Delivery', value: deliveryRange(item) });

  // Only surface add-on rows that are non-zero; base + total always shown.
  const showFinish = !!pb && pb.finishAddOn > 0;
  const showCustomSize = !!pb && pb.customSizeAddOn > 0;
  const showFabricConsumption = !!pb && typeof pb.fabricConsumptionCost === 'number' && pb.fabricConsumptionCost > 0;

  return (
    <div
      className='fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4'
      onClick={onClose}
      role='dialog'
      aria-modal='true'
      aria-label='Item details'
    >
      <div
        className='relative w-full max-w-[520px] max-h-[85vh] overflow-y-auto rounded-xl bg-white py-5 px-6'
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label='Close'
          onClick={onClose}
          className='absolute right-3 top-3 grid h-8 w-8 place-items-center rounded text-white'
          style={{ backgroundColor: '#D4A373' }}
        >
          <span className='material-symbols-outlined text-[18px]'>close</span>
        </button>

        <h2 className='mb-1 pr-10 text-lg font-bold text-[#3c3c3c]'>{displayName}</h2>
        <p className='mb-4 text-xs uppercase tracking-[.08em] text-clayd/60'>Item details</p>

        <dl className='flex flex-col gap-0'>
          {rows.map((r) => (
            <div key={r.label} className='flex items-start justify-between gap-4 border-b border-sand py-2 last:border-0'>
              <dt className='shrink-0 text-xs uppercase tracking-wide text-clayd/70'>{r.label}</dt>
              <dd className='text-right text-sm text-clay'>{r.value}</dd>
            </div>
          ))}
        </dl>

        {pb && (
          <div className='mt-5'>
            <h3 className='mb-2 text-sm font-semibold text-[#3c3c3c]'>Price breakdown</h3>
            <div className='flex flex-col gap-0 rounded-lg bg-cream px-3 py-1'>
              <div className='flex items-center justify-between border-b border-sand py-2'>
                <span className='text-sm text-black/70'>Base</span>
                <span className='text-sm font-medium text-clay'>{formatCode2(pb.base)}</span>
              </div>
              {showFinish && (
                <div className='flex items-center justify-between border-b border-sand py-2'>
                  <span className='text-sm text-black/70'>Finish / dye add-on</span>
                  <span className='text-sm font-medium text-clay'>+ {formatCode2(pb.finishAddOn)}</span>
                </div>
              )}
              {showCustomSize && (
                <div className='flex items-center justify-between border-b border-sand py-2'>
                  <span className='text-sm text-black/70'>Custom size / Pantone add-on</span>
                  <span className='text-sm font-medium text-clay'>+ {formatCode2(pb.customSizeAddOn)}</span>
                </div>
              )}
              {showFabricConsumption && (
                <div className='flex items-center justify-between border-b border-sand py-2'>
                  <span className='text-sm text-black/70'>Fabric consumption</span>
                  <span className='text-sm font-medium text-clay'>+ {formatCode2(pb.fabricConsumptionCost as number)}</span>
                </div>
              )}
              <div className='flex items-center justify-between py-2'>
                <span className='text-sm font-semibold text-[#3c3c3c]'>Line total (per unit)</span>
                <span className='text-sm font-bold text-clay'>{formatCode2(pb.total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
