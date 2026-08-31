'use client';

import { useMemo, useState } from 'react';
import SizeGuideDialog from './SizeGuideDialog';
import type { CustomSizeProfileItem, ProductDetail, ProductSizeProfileItem, SizeProfile } from './types';

interface SizeSelectorProps {
  product: ProductDetail;
  /** purchasable size variants (S/M/L/XL). */
  productSizeProfile: ProductSizeProfileItem[];
  /** profile used by the Size Guide dialog (productSpecific preferred). */
  sizeProfile: SizeProfile;
  selectedLabel: string | null;
  onSelect: (size: ProductSizeProfileItem | null, custom: boolean) => void;
  /** Lifts the entered custom-size measurement object (keyed by field LABEL, like
   *  live's customSizeFormGroup.value) up to ProductInfoPanel so it flows into the
   *  price (+ customSizeProfile.price) and the cart body. null => not (yet) entered. */
  onCustomSizeChange?: (values: Record<string, string> | null) => void;
}

// Port of ProductSizeProfileComponent (finished branch). Renders the size option
// buttons, the selected size's dimensions (keyFeature), a Custom button (when
// customSizeProfileEnabled), and the Size Guide button -> dialog. The measurement
// object is lifted up on submit (onCustomSizeChange) so it drives the price + cart.
export default function SizeSelector({
  product,
  productSizeProfile,
  sizeProfile,
  selectedLabel,
  onSelect,
  onCustomSizeChange,
}: SizeSelectorProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  const customItems = product.customSizeProfile?.customSizeProfileItemList ?? [];
  const customEnabled = !!(product.customSizeProfileEnabled && customItems.length > 0);
  // Controlled inputs keyed by field id (for React); the emitted object is keyed by
  // field LABEL to match live's customSizeFormGroup.value shape.
  const [customValues, setCustomValues] = useState<Record<number, string>>({});
  const [customSaved, setCustomSaved] = useState(false);
  const [customError, setCustomError] = useState(false);

  // Sort by the source size profile order, restricted to the profile's labels.
  const sizes = useMemo(() => {
    const order = (sizeProfile.sizeProfileOptionList ?? []).map((o) => o.label);
    const allowed = new Set(order);
    return [...productSizeProfile]
      .filter((s) => order.length === 0 || allowed.has(s.sizeProfileOption.label))
      .sort((a, b) => (a.sizeProfileOption.sortOrder ?? 0) - (b.sizeProfileOption.sortOrder ?? 0));
  }, [productSizeProfile, sizeProfile]);

  const selected = sizes.find((s) => s.sizeProfileOption.label === selectedLabel) ?? null;
  const keyFeature = sizeProfile.sizeProfileOptionList?.find((o) => o.label === selectedLabel)?.keyFeature
    ?? selected?.sizeProfileOption.keyFeature
    ?? '';

  const productGroup = product.productGroup === 'finished' ? 'finished' : 'fabric';

  if (sizes.length === 0) return null;

  // Build the label-keyed measurement object (live's customSizeFormGroup.value).
  const buildCustomObject = (): Record<string, string> => {
    const out: Record<string, string> = {};
    for (const item of customItems) out[item.label] = customValues[item.id] ?? '';
    return out;
  };

  const selectSize = (s: ProductSizeProfileItem) => {
    onSelect(s, false);
    // Selecting a concrete size clears any entered custom measurements (live emits
    // customSizeSelected(null) on size select) so custom-size price drops off.
    setCustomSaved(false);
    setCustomError(false);
    onCustomSizeChange?.(null);
  };

  const selectCustom = () => {
    onSelect(null, true);
    // Custom measurements are not applied until the shopper submits the form.
    setCustomSaved(false);
    setCustomError(false);
    onCustomSizeChange?.(null);
  };

  const submitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    // Mandatory fields must be filled (mirrors the live required validators).
    const missing = customItems.some(
      (it) => it.mandatory && !(customValues[it.id] ?? '').trim(),
    );
    if (missing) {
      setCustomError(true);
      setCustomSaved(false);
      onCustomSizeChange?.(null);
      return;
    }
    setCustomError(false);
    setCustomSaved(true);
    onCustomSizeChange?.(buildCustomObject());
  };

  return (
    <div className='flex flex-col gap-2'>
      <p className='font-semibold text-black'>{sizeProfile.displayName || 'Choose Size'}</p>

      {selectedLabel && selectedLabel !== 'custom' && keyFeature && (
        <p className='text-xs text-black/50'>{keyFeature}</p>
      )}

      <div className='flex flex-wrap items-center gap-2'>
        {sizes.map((s) => {
          const label = s.sizeProfileOption.label;
          const active = selectedLabel === label;
          return (
            <button
              key={s.id}
              type='button'
              onClick={() => selectSize(s)}
              className={
                'min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded border px-3 text-sm transition-colors ' +
                (active ? 'border-clay bg-clay text-white' : 'border-bark/30 text-black/70 hover:border-clay')
              }
            >
              {label}
            </button>
          );
        })}

        {product.customSizeProfileEnabled && (
          <button
            type='button'
            onClick={selectCustom}
            className={
              'min-h-[44px] inline-flex items-center justify-center rounded border px-3 text-sm transition-colors ' +
              (selectedLabel === 'custom' ? 'border-clay bg-clay text-white' : 'border-bark/30 text-black/70 hover:border-clay')
            }
          >
            Custom {productGroup === 'finished' ? 'Size' : 'Dye'}
          </button>
        )}

        <button
          type='button'
          onClick={() => setGuideOpen(true)}
          className='inline-flex min-h-[44px] items-center gap-1 rounded border border-bark/30 px-3 text-sm text-black/70 hover:border-clay'
        >
          {productGroup === 'finished' ? 'Size' : ''} Guide
          <svg width='14' height='14' viewBox='0 0 16 16' fill='none'>
            <path d='M8 .16A7.84 7.84 0 1 0 15.84 8 7.85 7.85 0 0 0 8 .16Zm0 3.21a1.02 1.02 0 1 1 0 2.05 1.02 1.02 0 0 1 0-2.05Zm1.88 8.86H6.43a.63.63 0 0 1 0-1.25h1.1V7.53h-.63a.63.63 0 0 1 0-1.25h1.26c.34 0 .62.28.62.62v4.08h1.1a.63.63 0 0 1 0 1.25Z' fill='currentColor' />
          </svg>
        </button>
      </div>

      {selectedLabel === 'custom' && customEnabled && (
        <div className='mt-2 flex flex-col gap-3'>
          {product.customSizeProfile?.disclaimer && (
            <div className='flex items-start gap-2 rounded border border-bark/20 bg-cream p-2 text-xs text-black/60'>
              <span className='material-symbols-outlined text-[16px] leading-none text-clay'>error</span>
              <p>{product.customSizeProfile.disclaimer}</p>
            </div>
          )}
          <form
            onSubmit={submitCustom}
            className='grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-end'
          >
            {customItems.map((item: CustomSizeProfileItem) => (
              <div key={item.id} className='flex flex-col gap-1'>
                <label htmlFor={'custom-size-' + item.id} className='text-sm text-black/70'>
                  {item.label}
                  {item.mandatory && <sup className='font-bold text-red-600'> *</sup>}
                </label>
                <input
                  id={'custom-size-' + item.id}
                  type={item.fieldType === 1 ? 'number' : 'text'}
                  required={item.mandatory}
                  placeholder={item.placeholder || ''}
                  value={customValues[item.id] ?? ''}
                  onChange={(e) => {
                    setCustomSaved(false);
                    // Editing after a save invalidates the applied measurements.
                    onCustomSizeChange?.(null);
                    setCustomValues((prev) => ({ ...prev, [item.id]: e.target.value }));
                  }}
                  className='min-h-[40px] w-full rounded border border-bark/30 p-1.5 text-sm focus:border-clay focus:outline-none'
                />
              </div>
            ))}
            <button
              type='submit'
              className='mt-2 min-h-[40px] rounded border border-clay bg-clay px-3 text-sm text-white transition-colors hover:opacity-90'
            >
              Apply Measurements
            </button>
          </form>
          {customError && (
            <p className='text-xs text-red-600'>Please fill in all required measurements.</p>
          )}
          {customSaved && (
            <p className='text-xs text-green-700'>Measurements applied for this item.</p>
          )}
        </div>
      )}

      <SizeGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} sizeProfile={sizeProfile} productGroup={productGroup} />
    </div>
  );
}
