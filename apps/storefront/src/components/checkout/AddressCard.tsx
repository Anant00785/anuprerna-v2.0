'use client';
import Link from 'next/link';
import type { Address } from './types';

// A single address block (shipping or billing). When onEdit is supplied the Edit
// control opens the inline checkout address modal (NO navigation); otherwise it
// falls back to the dashboard address book link. No write happens here.
export default function AddressCard({
  title,
  address,
  rightSlot,
  selectable,
  selected,
  onSelect,
  onEdit,
}: {
  title: string;
  address: Address | null;
  rightSlot?: React.ReactNode;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
}) {
  const editLabel = address ? 'Edit' : '+ Add address';
  return (
    <section className='rounded-lg border border-clay/15 bg-[#f6f2ea] p-5'>
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='text-sm font-semibold uppercase tracking-[.08em] text-clay'>{title}</h3>
        <div className='flex items-center gap-3'>
          {rightSlot}
          {onEdit ? (
            <button
              type='button'
              onClick={onEdit}
              className='text-sm font-medium text-clayd underline underline-offset-4'
            >
              {editLabel}
            </button>
          ) : (
            <Link href='/profile/address' className='text-sm font-medium text-clayd underline underline-offset-4'>
              {editLabel}
            </Link>
          )}
        </div>
      </div>

      {address ? (
        <button
          type={selectable ? 'button' : undefined}
          onClick={selectable ? onSelect : undefined}
          className={
            'block w-full text-left ' +
            (selectable
              ? 'rounded-md border p-3 transition ' + (selected ? 'border-clay bg-clay/5' : 'border-clay/15 hover:border-clay/40')
              : '')
          }
        >
          <p className='text-sm font-medium text-clay'>{address.name || address.companyName || 'Address'}</p>
          <p className='mt-1 text-sm leading-relaxed text-clayd/90'>
            {[address.addressLineOne, address.addressLineTwo].filter(Boolean).join(', ')}
            {address.addressLineOne ? <br /> : null}
            {[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}
            {address.country ? ', ' + address.country : ''}
          </p>
          {(address.primaryPhone || address.secondaryPhone) && (
            <p className='mt-1 text-sm text-clayd/80'>
              {[address.primaryPhone, address.secondaryPhone].filter(Boolean).join(', ')}
            </p>
          )}
          {address.contactEmail && <p className='text-sm text-clayd/80'>{address.contactEmail}</p>}
        </button>
      ) : (
        <p className='text-sm text-clayd/60'>No address on file.</p>
      )}
    </section>
  );
}
