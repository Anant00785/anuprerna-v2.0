'use client';
import { useState } from 'react';
import type { Address } from './types';

// =====================================================================================
// Inline ADD/EDIT address modal for the CHECKOUT page (no navigation away).
// ADD persists via POST /api/profile/addresses (wrapper add/address, customer-scoped),
// then fires onSaved() so the checkout re-fetches /api/checkout/address in place.
// EDIT is prefilled but — mirroring the dashboard address book — persistence for an
// existing address is NOT wired in this demo, so submit just closes.
// This is a read/enquiry demo: NO irreversible commit endpoints are touched.
// =====================================================================================

export type AddressModalMode =
  | { kind: 'add'; book: 'SHIPPING' | 'BILLING'; makePrimary: boolean }
  | { kind: 'edit'; addr: Address; book: 'SHIPPING' | 'BILLING' };

const FIELDS: Array<{ key: keyof Address; label: string; full?: boolean }> = [
  { key: 'name', label: 'Full name', full: true },
  { key: 'companyName', label: 'Company (optional)', full: true },
  { key: 'addressLineOne', label: 'Address line 1', full: true },
  { key: 'addressLineTwo', label: 'Address line 2', full: true },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postalCode', label: 'Postal code' },
  { key: 'country', label: 'Country' },
  { key: 'primaryPhone', label: 'Phone' },
  { key: 'contactEmail', label: 'Email' },
];

export default function AddressFormModal({
  mode,
  onClose,
  onSaved,
}: {
  mode: AddressModalMode;
  onClose: () => void;
  onSaved: () => void;
}) {
  const seed = mode.kind === 'edit' ? mode.addr : ({} as Address);
  const isAdd = mode.kind === 'add';
  const title = isAdd
    ? 'Add ' + (mode.book === 'BILLING' ? 'Billing' : 'Shipping') + ' Address'
    : 'Edit Address';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // EDIT persistence is not wired in this demo -> just close.
    if (!isAdd) {
      onClose();
      return;
    }
    setError(null);
    const form = new FormData(e.currentTarget);
    const book = mode.book;
    const makePrimary = mode.makePrimary;
    const payload: Record<string, unknown> = { addressType: book };
    for (const f of FIELDS) {
      const v = String(form.get(f.key as string) ?? '').trim();
      if (v) payload[f.key as string] = v;
    }
    if (book === 'SHIPPING') payload.primaryShippingAddress = makePrimary;
    else payload.primaryBillingAddress = makePrimary;

    if (!payload.name || !payload.addressLineOne || !payload.city) {
      setError('Please fill in at least name, address line 1 and city.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/profile/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        onSaved(); // re-fetch the checkout address list in place
        onClose();
        return;
      }
      setError((data && (data.message || data.error)) || 'Could not save address. Please try again.');
    } catch {
      setError('Could not save address. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label={title}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
      onClick={onClose}
    >
      <div
        className='w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[85vh] overflow-y-auto'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-3'>
          <h3 className='text-base font-semibold text-gray-900'>{title}</h3>
          <button type='button' onClick={onClose} aria-label='Close' className='text-gray-400 hover:text-gray-700'>
            <span className='material-symbols-outlined text-[20px]'>close</span>
          </button>
        </div>

        <form className='p-5 grid grid-cols-2 gap-4' onSubmit={onSubmit}>
          {FIELDS.map((f) => (
            <div key={f.key as string} className={f.full ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
              <label className='block text-xs font-medium text-gray-600 mb-1'>{f.label}</label>
              <input
                name={f.key as string}
                defaultValue={(seed[f.key] as string) ?? ''}
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-clay focus:outline-none'
              />
            </div>
          ))}

          {!isAdd && (
            <p className='col-span-2 text-xs text-gray-400'>
              Editing an existing address isn&apos;t available in this demo — add a new one instead.
            </p>
          )}
          {error && <p className='col-span-2 text-xs text-red-600'>{error}</p>}

          <div className='col-span-2 flex items-center justify-end gap-2 pt-1'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className='rounded-md bg-clay px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50'
            >
              {saving ? 'Saving…' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
