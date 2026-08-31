'use client';

import { useState } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import Img from '@/components/ui/Img';
import SizeGuideDialog from './SizeGuideDialog';
import type { FabricProfileItem, ProductDetail, CustomSizeProfileItem } from './types';

export interface SelectedFinish {
  /** Loom finish-profile item id, sent as the cart's selectedFinishId (string). */
  id: string;
  /** Per-unit price add-on for this finish/dye (INR). */
  price: number;
  label: string;
}

export interface SelectedFabric {
  /** Loom fabric-preview id. */
  id: number;
  price: number;
  name: string;
}

interface CustomizationCardProps {
  product: ProductDetail;
  /** SINGLE-select finish/dye state (live is single-select in the demo: picking a
   *  dye/finish SWITCHES, never sums). null => no finish (base). Owned by ProductInfoPanel.
   *  For a FABRIC this is the "Custom Natural Vegetable Dye" (finishProfile) section. */
  selectedFinish: SelectedFinish | null;
  onFinishChange: (finish: SelectedFinish | null) => void;
  selectedFabric: SelectedFabric | null;
  onFabricChange: (fabric: SelectedFabric | null) => void;
  /** Custom-size / Custom-Pantone measurement object (label-keyed), null until applied.
   *  For a FABRIC dye product the "Custom Dye" (Custom Pantone) option lives IN this card
   *  and drives this; for finished products the size selector drives it (passthrough). */
  customSizeValues: Record<string, string> | null;
  onCustomSizeChange: (values: Record<string, string> | null) => void;
  /** FABRIC "Custom Organic Dye" (sizeProfile) selected option id — the Section-1
   *  single-select. null => the default (first) option. Reported to the cart as
   *  selectedSizeOptionId (mirrors live's field). Unused for finished products. */
  selectedSizeOptionId?: number | null;
  onSizeOptionChange?: (id: number | null) => void;
}

// Number of curated fabric tiles shown inline before the 'View All' dialog.
const CURATED_TILES = 3;

function FabricTile({
  item,
  active,
  onClick,
  format,
}: {
  item: FabricProfileItem;
  active: boolean;
  onClick: () => void;
  format: (n: number) => string;
}) {
  const fp = item.fabricPreview;
  return (
    <button
      type='button'
      onClick={onClick}
      className={
        'flex w-[150px] flex-col gap-1 rounded-lg border p-2 text-left text-xs transition-colors ' +
        (active ? 'border-clay ring-1 ring-clay' : 'border-bark/30 hover:border-clay')
      }
    >
      {fp.heroImage && (
        <div className='relative h-20 w-full overflow-hidden rounded'>
          <Img src={fp.heroImage} alt={fp.name} fill sizes='150px' className='object-cover' />
        </div>
      )}
      <span className='line-clamp-2 font-medium text-black/80'>{fp.name}</span>
      <span className='text-clay'>{format(fp.price)}</span>
    </button>
  );
}

// A single-select option tile (dye / finish). Radio semantics: exactly one active
// at a time within its section. Optional image (dyes + sleeve finishes carry one).
function OptionTile({
  label,
  price,
  image,
  active,
  onClick,
  format,
  showZero = false,
}: {
  label: string;
  price: number;
  image?: string;
  active: boolean;
  onClick: () => void;
  format: (n: number) => string;
  showZero?: boolean;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-pressed={active}
      className={
        'relative flex w-[132px] flex-col gap-1 rounded-lg border p-2 text-left text-xs transition-colors ' +
        (active ? 'border-clay ring-2 ring-clay' : 'border-bark/30 hover:border-clay')
      }
    >
      {image && (
        <div className='relative h-16 w-full overflow-hidden rounded'>
          <Img src={image} alt={label} fill sizes='132px' className='object-cover' />
        </div>
      )}
      <span className='line-clamp-2 font-medium capitalize text-black/80'>{label.toLowerCase()}</span>
      <span className='text-clay'>{price > 0 ? '+' + format(price) : showZero ? format(0) : 'Included'}</span>
      {active && (
        <span className='absolute -left-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-clay text-[11px] text-white'>
          &#10003;
        </span>
      )}
    </button>
  );
}

// Port of the 'Customization Available' card. Renders ONLY the profiles the product
// enables. For a FABRIC dye product this mirrors live's TWO customization sections:
//   Section 1  "Custom Organic Dye"          (sizeProfile) grouped WITH the
//              "Custom Dye" (customSizeProfile / Custom Pantone Shade) option + Guide.
//   Section 2  "Custom Natural Vegetable Dye" (finishProfile) — the priced dye list,
//              single-select, its OWN separate section.
// For a FINISHED product: fabric picker + garment-finish (single-select). Size + custom
// measurements for finished live on the SizeSelector (ProductInfoPanel), not here.
export default function CustomizationCard({
  product,
  selectedFinish,
  onFinishChange,
  selectedFabric,
  onFabricChange,
  customSizeValues,
  onCustomSizeChange,
  selectedSizeOptionId = null,
  onSizeOptionChange,
}: CustomizationCardProps) {
  const { formatCode } = useCurrency();
  // Collapsed by default (matches live): the user clicks 'Show Customization
  // Options >' to reveal the fabric / dye / finish pickers.
  const [open, setOpen] = useState(false);
  const [fabricDialogOpen, setFabricDialogOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const isFinished = product.productGroup === 'finished';

  const fabrics = product.fabricProfileEnabled ? (product.fabricProfile?.fabricProfileItemList ?? []) : [];
  const finishes = product.finishProfileEnabled ? (product.finishProfile?.finishProfileItemList ?? []) : [];

  // Section-1 (fabric) size-profile options ("Custom Organic Dye" -> "As per Original").
  const sizeOptions = (!isFinished && product.sizeProfileEnabled)
    ? (product.sizeProfile?.sizeProfileOptionList ?? [])
    : [];
  // Custom-Pantone ("Custom Dye") lives inside Section 1 for the FABRIC dye case.
  const customItems = product.customSizeProfile?.customSizeProfileItemList ?? [];
  const dyeCustomEnabled = !isFinished && !!product.customSizeProfileEnabled && customItems.length > 0;
  const customPrice = product.customSizeProfile?.price ?? 0;

  // Section-1 heading + labels, from the data.
  const organicSectionLabel = product.sizeProfile?.displayName?.trim() || 'Custom Dye';
  // Section-2 (finish/dye) heading, from the data.
  const finishSectionLabel = product.finishProfile?.displayName?.trim()
    || (isFinished ? 'Choose Finish' : 'Custom Natural Vegetable Dye');

  const [pantoneOpen, setPantoneOpen] = useState(false);
  const [pantoneValues, setPantoneValues] = useState<Record<number, string>>({});
  const [pantoneError, setPantoneError] = useState(false);
  const pantoneApplied = !isFinished && customSizeValues != null && Object.keys(customSizeValues).length > 0;
  const pantoneActive = pantoneOpen || pantoneApplied;

  // Effective Section-1 size selection: explicit id, else the first option (default).
  const effectiveSizeOptionId = selectedSizeOptionId ?? sizeOptions[0]?.id ?? null;
  const selectedSizeOption = sizeOptions.find((o) => o.id === effectiveSizeOptionId) ?? sizeOptions[0] ?? null;
  const sizeKeyFeature = selectedSizeOption?.keyFeature?.trim() || '';

  // Curated inline tiles: put the backend-designated made-to-order fabric FIRST so the
  // default selection is always visible + highlighted (it may not be in the raw first-N of
  // the leaned list, or even in it at all). De-dupe, then cap at CURATED_TILES. "View All"
  // still exposes the full list for changing.
  const mtoFab = product.fabricProfileEnabled && product.madeToOrderFabric ? product.madeToOrderFabric : null;
  const curated: FabricProfileItem[] = (() => {
    if (!mtoFab) return fabrics.slice(0, CURATED_TILES);
    const mtoTile: FabricProfileItem = {
      fabricPreview: {
        id: mtoFab.id,
        name: mtoFab.name,
        slug: mtoFab.slug,
        price: mtoFab.price,
        heroImage: mtoFab.heroImage,
      },
    };
    const rest = fabrics.filter((f) => f.fabricPreview.id !== mtoFab.id);
    return [mtoTile, ...rest].slice(0, CURATED_TILES);
  })();
  const selectFabric = (item: FabricProfileItem) => {
    const fp = item.fabricPreview;
    const fid = fp.id ?? null;
    if (fid == null) return;
    if (selectedFabric?.id === fid) onFabricChange(null);
    else onFabricChange({ id: fid, price: fp.price ?? 0, name: fp.name });
  };

  // --- Section-1 handlers (sizeProfile option vs Custom Dye — mutually exclusive) ---
  const pickSizeOption = (id: number) => {
    onCustomSizeChange(null); // leaving Custom Dye
    setPantoneOpen(false);
    onSizeOptionChange?.(id);
  };
  const openPantone = () => {
    setPantoneError(false);
    setPantoneOpen(true);
  };
  const submitPantone = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = customItems.some((it) => it.mandatory && !(pantoneValues[it.id] ?? '').trim());
    if (missing) {
      setPantoneError(true);
      onCustomSizeChange(null);
      return;
    }
    setPantoneError(false);
    const out: Record<string, string> = {};
    for (const it of customItems) out[it.label] = pantoneValues[it.id] ?? '';
    onCustomSizeChange(out);
    setPantoneOpen(false);
  };

  // --- Section-2 handler (finish/veg-dye — single-select, deselect to none) ---
  const toggleFinish = (id: string, price: number, label: string) => {
    if (selectedFinish?.id === id) onFinishChange(null);
    else onFinishChange({ id, price, label });
  };

  const hasFabricCustomization =
    fabrics.length > 0 || finishes.length > 0 || sizeOptions.length > 0 || dyeCustomEnabled;

  return (
    <div className='flex flex-col gap-2 rounded-xl border border-[#D1D4DB] bg-cream/40 p-4'>
      <button type='button' onClick={() => setOpen((v) => !v)} className='flex flex-col gap-2 text-left'>
        <div className='flex items-center gap-2'>
          <svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
            <path d='M3.497 14.044 10.519 7.023A4.94 4.94 0 0 0 11.993 3.497 4.93 4.93 0 0 0 10.563 0L3.54 7.024A4.94 4.94 0 0 0 2.067 10.549c0 1.373.55 2.6 1.43 3.495ZM20.504 9.941 13.481 16.963A4.94 4.94 0 0 0 12.008 20.488c0 1.36.55 2.601 1.43 3.497L20.46 16.963A4.94 4.94 0 0 0 21.934 13.437c0-1.373-.55-2.6-1.43-3.496ZM20.46 7.037A4.94 4.94 0 0 0 21.934 3.512c0-1.36-.55-2.6-1.43-3.497L3.54 16.965A4.94 4.94 0 0 0 2.066 20.474 4.96 4.96 0 0 0 3.497 24L20.46 7.037Z' fill='#275E49' />
          </svg>
          <h2 className='text-lg md:text-xl font-medium text-black'>Customization Available</h2>
        </div>
        <p className='text-sm text-black/60'>
          {isFinished
            ? 'This product is customisable in different fabric options and sizes'
            : 'This product is available with customized fabrics, natural custom dyeing at low MOQ'}
        </p>
        <span className='w-max rounded border border-[#D1D4DB] bg-white px-4 py-1 text-sm text-[#275E49]'>
          {open ? 'Hide Customization Options' : 'Show Customization Options >'}
        </span>
      </button>

      {open && (
        <div className='mt-2 flex flex-col gap-4'>
          {fabrics.length > 0 && (
            <div className='flex flex-col gap-2'>
              <p className='font-semibold text-black'>
                Choose Fabric
                {product.fabricProfile?.profileName?.trim() ? (
                  <span className='ml-1.5 text-xs font-normal text-black/50'>({product.fabricProfile.profileName.trim()})</span>
                ) : null}
              </p>
              <div className='flex flex-wrap gap-2'>
                {curated.map((f, i) => {
                  const fid = f.fabricPreview.id ?? null;
                  const active = fid != null && selectedFabric?.id === fid;
                  return (
                    <FabricTile key={fid ?? i} item={f} active={active} onClick={() => selectFabric(f)} format={formatCode} />
                  );
                })}
                {fabrics.length > CURATED_TILES && (
                  <button
                    type='button'
                    onClick={() => setFabricDialogOpen(true)}
                    className='flex w-[150px] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-clay p-2 text-sm font-medium text-clay hover:bg-sand'
                  >
                    <span className='material-symbols-outlined text-[22px]'>grid_view</span>
                    View All ({fabrics.length})
                  </button>
                )}
              </div>
              {selectedFabric && (
                <p className='text-xs text-black/60'>
                  Selected fabric: <span className='font-medium text-black/80'>{selectedFabric.name}</span> ({formatCode(selectedFabric.price)}/m)
                </p>
              )}
            </div>
          )}

          {/* ---- SECTION 1 (fabric): "Custom Organic Dye" (sizeProfile) grouped with the
               "Custom Dye" (Custom Pantone) option + Guide. Single-select. ---- */}
          {!isFinished && (sizeOptions.length > 0 || dyeCustomEnabled) && (
            <div className='flex flex-col gap-2'>
              <p className='font-semibold text-black'>{organicSectionLabel}</p>
              {sizeKeyFeature && <p className='text-xs text-black/50'>{sizeKeyFeature}</p>}
              <div className='flex flex-wrap items-center gap-2'>
                {sizeOptions.map((opt) => {
                  const active = !pantoneActive && effectiveSizeOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type='button'
                      onClick={() => pickSizeOption(opt.id)}
                      className={
                        'min-h-[44px] inline-flex items-center justify-center rounded border px-3 text-sm transition-colors ' +
                        (active ? 'border-clay bg-clay text-white' : 'border-bark/30 text-black/70 hover:border-clay')
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
                {dyeCustomEnabled && (
                  <button
                    type='button'
                    onClick={openPantone}
                    aria-pressed={pantoneActive}
                    className={
                      'min-h-[44px] inline-flex items-center justify-center gap-1 rounded border px-3 text-sm transition-colors ' +
                      (pantoneActive ? 'border-clay bg-clay text-white' : 'border-bark/30 text-black/70 hover:border-clay')
                    }
                  >
                    Custom Dye{customPrice > 0 ? ' (+' + formatCode(customPrice) + ')' : ''}
                  </button>
                )}
                {product.sizeProfile && (
                  <button
                    type='button'
                    onClick={() => setGuideOpen(true)}
                    className='inline-flex min-h-[44px] items-center gap-1 rounded border border-bark/30 px-3 text-sm text-black/70 hover:border-clay'
                  >
                    Guide
                    <svg width='14' height='14' viewBox='0 0 16 16' fill='none'>
                      <path d='M8 .16A7.84 7.84 0 1 0 15.84 8 7.85 7.85 0 0 0 8 .16Zm0 3.21a1.02 1.02 0 1 1 0 2.05 1.02 1.02 0 0 1 0-2.05Zm1.88 8.86H6.43a.63.63 0 0 1 0-1.25h1.1V7.53h-.63a.63.63 0 0 1 0-1.25h1.26c.34 0 .62.28.62.62v4.08h1.1a.63.63 0 0 1 0 1.25Z' fill='currentColor' />
                    </svg>
                  </button>
                )}
              </div>

              {/* Custom Pantone ("Custom Dye") form */}
              {dyeCustomEnabled && pantoneActive && (
                <div className='mt-1 flex flex-col gap-3'>
                  {product.customSizeProfile?.disclaimer && (
                    <div className='flex items-start gap-2 rounded border border-bark/20 bg-cream p-2 text-xs text-black/60'>
                      <span className='material-symbols-outlined text-[16px] leading-none text-clay'>error</span>
                      <p>{product.customSizeProfile.disclaimer}</p>
                    </div>
                  )}
                  <form onSubmit={submitPantone} className='grid grid-cols-2 gap-3 md:flex md:flex-wrap md:items-end'>
                    {customItems.map((item: CustomSizeProfileItem) => (
                      <div key={item.id} className='flex flex-col gap-1'>
                        <label htmlFor={'pantone-' + item.id} className='text-sm text-black/70'>
                          {item.label}
                          {item.mandatory && <sup className='font-bold text-red-600'> *</sup>}
                        </label>
                        <input
                          id={'pantone-' + item.id}
                          type={item.fieldType === 1 ? 'number' : 'text'}
                          required={item.mandatory}
                          placeholder={item.placeholder || ''}
                          value={pantoneValues[item.id] ?? ''}
                          onChange={(e) => {
                            onCustomSizeChange(null); // editing invalidates the applied value
                            setPantoneValues((prev) => ({ ...prev, [item.id]: e.target.value }));
                          }}
                          className='min-h-[40px] w-full rounded border border-bark/30 p-1.5 text-sm focus:border-clay focus:outline-none'
                        />
                      </div>
                    ))}
                    <button
                      type='submit'
                      className='mt-2 min-h-[40px] rounded border border-clay bg-clay px-3 text-sm text-white transition-colors hover:opacity-90'
                    >
                      Apply Custom Dye
                    </button>
                  </form>
                  {pantoneError && <p className='text-xs text-red-600'>Please fill in all required fields.</p>}
                  {pantoneApplied && <p className='text-xs text-green-700'>Custom shade applied for this item.</p>}
                </div>
              )}
            </div>
          )}

          {/* ---- SECTION 2 (fabric): "Custom Natural Vegetable Dye" (finishProfile) ---- */}
          {finishes.length > 0 && !isFinished && (
            <div className='flex flex-col gap-2'>
              <p className='font-semibold text-black'>
                {finishSectionLabel} <span className='text-xs font-normal text-black/50'>(select one)</span>
              </p>
              <div className='flex flex-wrap gap-2'>
                {finishes.map((fn, i) => {
                  const fnId = fn.id != null ? String(fn.id) : null;
                  const label = fn.label || fn.name || 'Dye';
                  const active = fnId != null && selectedFinish?.id === fnId;
                  return (
                    <OptionTile
                      key={fnId ?? i}
                      label={label}
                      price={fn.price ?? 0}
                      image={fn.image}
                      active={active}
                      onClick={() => fnId != null && toggleFinish(fnId, fn.price ?? 0, label)}
                      format={formatCode}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- FINISHED FINISH: single-select (deselect to base) ---- */}
          {finishes.length > 0 && isFinished && (
            <div className='flex flex-col gap-2'>
              <p className='font-semibold text-black'>
                {finishSectionLabel} <span className='text-xs font-normal text-black/50'>(select one)</span>
              </p>
              <div className='flex flex-wrap gap-2'>
                {finishes.map((fn, i) => {
                  const fnId = fn.id != null ? String(fn.id) : null;
                  const label = fn.name || fn.label || 'Finish';
                  const active = fnId != null && selectedFinish?.id === fnId;
                  return (
                    <OptionTile
                      key={fnId ?? i}
                      label={label}
                      price={fn.price ?? 0}
                      image={fn.image}
                      active={active}
                      onClick={() => fnId != null && toggleFinish(fnId, fn.price ?? 0, label)}
                      format={formatCode}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {!hasFabricCustomization && (
            <p className='text-sm text-black/50'>Contact us to customise fabric, finish and size for this product.</p>
          )}
        </div>
      )}

      {/* View-All fabric dialog. */}
      {fabricDialogOpen && (
        <div
          className='fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4'
          onClick={() => setFabricDialogOpen(false)}
        >
          <div
            className='flex max-h-[85vh] w-full max-w-[720px] flex-col rounded-xl bg-white p-4'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='mb-3 flex items-center justify-between'>
              <h3 className='text-base font-medium text-black'>Choose Fabric ({fabrics.length})</h3>
              <button type='button' onClick={() => setFabricDialogOpen(false)} className='text-black/40 hover:text-black' aria-label='Close'>
                <span className='material-symbols-outlined'>close</span>
              </button>
            </div>
            <div className='grid grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4'>
              {fabrics.map((f, i) => {
                const fid = f.fabricPreview.id ?? null;
                const active = fid != null && selectedFabric?.id === fid;
                return (
                  <FabricTile
                    key={fid ?? i}
                    item={f}
                    active={active}
                    onClick={() => { selectFabric(f); setFabricDialogOpen(false); }}
                    format={formatCode}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Section-1 "Guide" dialog (fabric sizeProfile). */}
      {product.sizeProfile && (
        <SizeGuideDialog
          open={guideOpen}
          onClose={() => setGuideOpen(false)}
          sizeProfile={product.sizeProfile}
          productGroup={isFinished ? 'finished' : 'fabric'}
        />
      )}
    </div>
  );
}
