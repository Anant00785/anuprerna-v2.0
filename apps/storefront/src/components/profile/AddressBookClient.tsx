'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface Address {
  id: number;
  name?: string;
  addressLineOne?: string;
  addressLineTwo?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  companyName?: string;
  primaryPhone?: string;
  contactEmail?: string;
  addressType?: string;
  primaryShippingAddress?: boolean;
  primaryBillingAddress?: boolean;
}

type Mode =
  | { kind: 'add'; book: 'SHIPPING' | 'BILLING'; makePrimary: boolean }
  | { kind: 'edit'; addr: Address }
  | null;

// Address book. ADD opens a real form that PERSISTS via POST /api/profile/addresses
// (wrapper add/address, customer-scoped). EDIT/set-default/delete remain
// signposted-disabled in this demo (those wrapper writes are not wired here).
export default function AddressBookClient({ addresses }: { addresses: Address[] }) {
  const [mode, setMode] = useState<Mode>(null);

  const shippingAddrs = addresses.filter(
    (a) => a.addressType === 'SHIPPING' || a.primaryShippingAddress || (!a.primaryBillingAddress && a.addressType !== 'BILLING'),
  );
  const billingAddrs = addresses.filter((a) => a.addressType === 'BILLING' || a.primaryBillingAddress);

  function Book({ title, book, list }: { title: string; book: 'SHIPPING' | 'BILLING'; list: Address[] }) {
    return (
      <div>
        <div className="text-center mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-800">{title}</h2>
        </div>

        {/* Add Address card -- opens a real, persisting form */}
        <button
          type="button"
          onClick={() => setMode({ kind: 'add', book, makePrimary: list.length === 0 })}
          className="w-full mb-3 border border-dashed border-gray-300 rounded py-3 flex items-center justify-center gap-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Address
        </button>

        <div className="space-y-3">
          {list.map((addr) => (
            <Card key={addr.id} addr={addr} />
          ))}
          {list.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No {book === 'SHIPPING' ? 'shipping' : 'billing'} addresses.</p>
          )}
        </div>
      </div>
    );
  }

  function Card({ addr }: { addr: Address }) {
    const isDefault = addr.primaryShippingAddress || addr.primaryBillingAddress;
    return (
      <div className={'bg-white border rounded p-5 relative ' + (isDefault ? 'border-gray-300' : 'border-gray-200')}>
        <div className="flex items-start justify-between mb-3">
          <p className="font-semibold text-gray-800 uppercase text-sm tracking-wide">
            {addr.name ?? '--'}
            {isDefault && <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-gray-500">(DEFAULT)</span>}
          </p>
          {/* Edit -- opens a prefilled form (edit persistence not wired in demo) */}
          <button
            type="button"
            onClick={() => setMode({ kind: 'edit', addr })}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Edit address"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        </div>

        <hr className="border-gray-200 mb-3" />

        <div className="text-sm text-gray-700 space-y-0.5 mb-3">
          {addr.addressLineOne && <p>{addr.addressLineOne}</p>}
          {addr.addressLineTwo && <p>{addr.addressLineTwo}</p>}
          <p>{[addr.city, addr.state, addr.country, addr.postalCode].filter(Boolean).join(', ')}</p>
        </div>

        {addr.primaryPhone && (
          <p className="text-sm text-gray-600 flex items-center gap-1 mb-0.5">
            <span className="material-symbols-outlined text-[14px] text-gray-400">phone</span>
            {addr.primaryPhone}
          </p>
        )}
        {addr.contactEmail && (
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-gray-400">mail</span>
            {addr.contactEmail}
          </p>
        )}

        {!isDefault && (
          <button
            disabled
            title="Disabled in demo mode"
            className="mt-3 text-[11px] uppercase tracking-wider border border-gray-300 text-gray-500 px-3 py-1 rounded cursor-not-allowed opacity-50"
          >
            Set Default Address
          </button>
        )}
        {!isDefault && (
          <button
            disabled
            title="Disabled in demo mode"
            className="absolute top-3 right-8 text-gray-300 cursor-not-allowed opacity-50"
            aria-label="Delete address"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-6">
        <Book title="Shipping Address Book" book="SHIPPING" list={shippingAddrs} />
        <Book title="Billing Address Book" book="BILLING" list={billingAddrs} />
      </div>

      {mode && <AddressDialog mode={mode} onClose={() => setMode(null)} />}
    </>
  );
}

function AddressDialog({ mode, onClose }: { mode: Exclude<Mode, null>; onClose: () => void }) {
  const router = useRouter();
  const seed = mode.kind === 'edit' ? mode.addr : ({} as Address);
  const title = mode.kind === 'edit' ? 'Edit Address' : 'Add Address';
  const isAdd = mode.kind === 'add';

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields: Array<{ key: keyof Address; label: string; full?: boolean }> = [
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // EDIT persistence is not wired in this demo -> just close.
    if (!isAdd) {
      onClose();
      return;
    }
    setError(null);
    const form = new FormData(e.currentTarget);
    const book = mode.kind === 'add' ? mode.book : 'SHIPPING';
    const makePrimary = mode.kind === 'add' ? mode.makePrimary : false;
    const payload: Record<string, unknown> = { addressType: book };
    for (const f of fields) {
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
        // Re-run the server component so the new address appears in the list.
        router.refresh();
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
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form className="p-5 grid grid-cols-2 gap-4" onSubmit={onSubmit}>
          {fields.map((f) => (
            <div key={f.key as string} className={f.full ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              <input
                name={f.key as string}
                defaultValue={(seed[f.key] as string) ?? ''}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-clay focus:outline-none"
              />
            </div>
          ))}

          {!isAdd && (
            <p className="col-span-2 text-xs text-gray-400">
              Editing an existing address isn&apos;t available in this demo — add a new one instead.
            </p>
          )}
          {error && (
            <p className="col-span-2 text-xs text-red-600">{error}</p>
          )}

          <div className="col-span-2 flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-clay px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
