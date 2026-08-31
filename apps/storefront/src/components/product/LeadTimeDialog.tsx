'use client';

// Lead-time CONFIRMATION modal shown at Add-to-Cart for made-to-order / custom-dyed
// / pre-order items. Mirrors the SizeGuideDialog / CartDetailsDialog overlay pattern.
// Confirms the ship window + estimated delivery date + minimum order, then the
// caller proceeds with the existing add. In-stock retail items never see it.

interface LeadTimeDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** e.g. 'Made to Order' | 'Custom Dyed' | 'Pre-Order' */
  label: string;
  fromDays?: number | null;
  toDays?: number | null;
  /** Formatted estimated-delivery date (shared delivery.ts formatter). */
  deliveryDate: string;
  /** Minimum order quantity (>1 => shown). */
  moq?: number;
  /** unit label already lowercased (e.g. 'meter'). */
  unit?: string;
  productName?: string;
  busy?: boolean;
}

export default function LeadTimeDialog({
  open,
  onCancel,
  onConfirm,
  label,
  fromDays,
  toDays,
  deliveryDate,
  moq,
  unit = 'unit',
  productName,
  busy = false,
}: LeadTimeDialogProps) {
  if (!open) return null;

  const hasWindow = typeof toDays === 'number' && toDays > 0;
  const shipCopy = hasWindow
    ? (typeof fromDays === 'number' && fromDays > 0 && fromDays !== toDays
        ? 'ships in ~' + fromDays + '–' + toDays + ' days'
        : 'ships in ~' + toDays + ' days')
    : 'ships after crafting';
  const showMoq = typeof moq === 'number' && moq > 1;

  return (
    <div
      className='fixed inset-0 z-[210] flex items-center justify-center bg-black/50 px-4'
      onClick={onCancel}
      role='dialog'
      aria-modal='true'
      aria-label='Confirm lead time'
    >
      <div
        className='relative w-full max-w-[420px] rounded-xl bg-white p-6'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='mx-auto mb-3 flex max-w-max items-center gap-2 rounded-full bg-[#FBF3E4] px-3 py-1 text-[12px] font-medium text-[#7D5A20]'>
          <span className='material-symbols-outlined text-[15px]'>schedule</span>
          {label}
        </div>

        <h3 className='text-center text-lg font-semibold text-black'>Confirm your order</h3>

        <p className='mt-3 text-center text-sm leading-relaxed text-black/70'>
          {productName ? <span className='font-medium text-black'>{productName}</span> : 'This item'}{' '}
          is <span className='font-medium text-clay'>{label.toLowerCase()}</span> and {shipCopy}.
        </p>

        <div className='mt-4 flex flex-col gap-2 rounded-lg border border-sand bg-cream px-4 py-3 text-sm'>
          <div className='flex items-start gap-2'>
            <span className='material-symbols-outlined text-[18px] text-clay'>local_shipping</span>
            <span className='text-black/70'>
              <span className='font-semibold text-black'>Estimated delivery:</span> {deliveryDate}
            </span>
          </div>
          {showMoq && (
            <div className='flex items-start gap-2'>
              <span className='material-symbols-outlined text-[18px] text-clay'>inventory_2</span>
              <span className='text-black/70'>
                <span className='font-semibold text-black'>Minimum order:</span> {moq} {unit}{moq === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>

        <div className='mt-5 flex gap-3'>
          <button
            type='button'
            onClick={onCancel}
            disabled={busy}
            className='flex-1 rounded-lg border border-bark/30 py-3 text-sm font-medium text-black/70 hover:bg-sand transition-colors disabled:opacity-60'
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={busy}
            className='flex-1 rounded-lg bg-clay py-3 text-sm font-medium text-white hover:bg-clayd active:scale-[.98] transition-all disabled:opacity-70'
          >
            {busy ? 'Adding…' : 'Confirm & Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
