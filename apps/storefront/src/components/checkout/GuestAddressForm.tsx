'use client';
import { useState } from 'react';
import type { Address } from './types';

// =====================================================================================
// GuestAddressForm — the shipping/billing address a GUEST enters during checkout.
//
// A logged-in buyer picks from their saved address book (/get/address-list, and
// AddressFormModal saves new ones through /add/address). A guest has no address
// book and no account to hang one off, so the address is collected here and
// travels WITH the order (orders.address jsonb) — exactly how Shopify treats a
// guest address. Nothing is written to an address table.
// =====================================================================================

interface Props {
  email: string;
  initial?: Address | null;
  onSave: (addr: Address) => void;
  onCancel?: () => void;
}

const FIELD =
  'w-full rounded-md border border-clay/25 bg-white px-3 py-2 text-sm text-clay outline-none focus:border-clay';
const LABEL = 'mb-1 block text-xs font-semibold uppercase tracking-[.08em] text-clayd';

export default function GuestAddressForm({ email, initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [primaryPhone, setPrimaryPhone] = useState(initial?.primaryPhone ?? '');
  const [addressLineOne, setAddressLineOne] = useState(initial?.addressLineOne ?? '');
  const [addressLineTwo, setAddressLineTwo] = useState(initial?.addressLineTwo ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [state, setState] = useState(initial?.state ?? '');
  const [postalCode, setPostalCode] = useState(initial?.postalCode ?? '');
  const [country, setCountry] = useState(initial?.country ?? 'INDIA');
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !addressLineOne.trim() || !city.trim() || !postalCode.trim() || !country.trim()) {
      setError('Please fill in name, address, city, postal code and country.');
      return;
    }
    setError('');
    onSave({
      name: name.trim(),
      contactEmail: email,
      primaryPhone: primaryPhone.trim(),
      addressLineOne: addressLineOne.trim(),
      addressLineTwo: addressLineTwo.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      country: country.trim().toUpperCase(),
      addressType: 'SHIPPING',
      primaryShippingAddress: true,
    });
  }

  return (
    <form onSubmit={submit} className='space-y-3' data-testid='guest-address-form'>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div>
          <label className={LABEL} htmlFor='ga-name'>Full name *</label>
          <input id='ga-name' className={FIELD} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={LABEL} htmlFor='ga-phone'>Phone</label>
          <input id='ga-phone' className={FIELD} value={primaryPhone} onChange={(e) => setPrimaryPhone(e.target.value)} />
        </div>
      </div>
      <div>
        <label className={LABEL} htmlFor='ga-l1'>Address line 1 *</label>
        <input id='ga-l1' className={FIELD} value={addressLineOne} onChange={(e) => setAddressLineOne(e.target.value)} />
      </div>
      <div>
        <label className={LABEL} htmlFor='ga-l2'>Address line 2</label>
        <input id='ga-l2' className={FIELD} value={addressLineTwo} onChange={(e) => setAddressLineTwo(e.target.value)} />
      </div>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div>
          <label className={LABEL} htmlFor='ga-city'>City *</label>
          <input id='ga-city' className={FIELD} value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <label className={LABEL} htmlFor='ga-state'>State</label>
          <input id='ga-state' className={FIELD} value={state} onChange={(e) => setState(e.target.value)} />
        </div>
      </div>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div>
          <label className={LABEL} htmlFor='ga-zip'>Postal code *</label>
          <input id='ga-zip' className={FIELD} value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
        </div>
        <div>
          <label className={LABEL} htmlFor='ga-country'>Country *</label>
          <input id='ga-country' className={FIELD} value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
      </div>

      {error && (
        <p className='rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900'>{error}</p>
      )}

      <div className='flex gap-2'>
        <button
          type='submit'
          className='rounded-md bg-clay/80 px-4 py-2.5 text-sm font-semibold uppercase tracking-[.08em] text-white transition hover:bg-clay'
        >
          Save address
        </button>
        {onCancel && (
          <button type='button' onClick={onCancel} className='rounded-md border border-clay/30 px-4 py-2.5 text-sm font-medium text-clay hover:bg-clay/5'>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
