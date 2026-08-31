'use client';

// SelfDeclareWholesaleForm -- the INSTANT (fast-lane) wholesale onboarding.
// A logged-in B2C buyer fills this short business form; on submit it POSTs to the
// BFF (/api/customer/b2b-profile) which captures the profile AND flips the native
// buyerType b2c -> b2b in one flow. On success we refresh auth (/api/auth/me) so
// BuyerModeProvider picks up buyerType:'b2b' and the storefront switches to B2B
// mode immediately (bulk / volume / MOQ / pre-order visible).
//
// This is DISTINCT from components/misc-pages/WholesaleApplicationForm.tsx (the
// WPP Gmail deep-lane intake, which is stubbed / preview-only). Field taxonomy is
// reused; the wiring is real. GST/tax id is OPTIONAL by design.

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { useBuyerMode } from '@/components/BuyerModeProvider';

const COUNTRIES = [
  'Australia','Bangladesh','Canada','China','France','Germany','India','Indonesia',
  'Ireland','Italy','Japan','Malaysia','Nepal','Netherlands','New Zealand','Portugal',
  'Singapore','South Africa','Spain','Sri Lanka','Sweden','Switzerland','Thailand',
  'United Arab Emirates','United Kingdom','United States','Vietnam','Other',
];

const BUSINESS_TYPES = [
  'Ethical Fashion House',
  'Designer / Creative Studio',
  'Home & Lifestyle Brand',
  'Boutique Store',
  'Retailer',
  'Interior Designer',
];

const SOURCING_CATEGORIES = ['Fabric', 'Apparel', 'Home & Lifestyle'];

const FREQUENCIES = ['Monthly', 'Quarterly', 'Bi-Annually', 'Annually'];

interface Model {
  companyName: string;
  businessTypes: string[];
  gstTaxId: string;
  sourcingCategories: string[];
  currency: string;
  estimatedVolume: string;
  orderFrequency: string;
  website: string;
  socialHandles: string;
  country: string;
  phone: string;
}

interface Errors {
  companyName?: string;
  businessTypes?: string;
  country?: string;
  form?: string;
}

const INIT: Model = {
  companyName: '', businessTypes: [], gstTaxId: '', sourcingCategories: [],
  currency: 'USD', estimatedVolume: '', orderFrequency: '',
  website: '', socialHandles: '', country: '', phone: '',
};

const inputCls =
  'w-full px-4 py-3 border border-black/20 rounded-md text-sm focus:ring-2 focus:ring-[#F7C52D]/40 focus:border-[#F7C52D] transition outline-none';

export default function SelfDeclareWholesaleForm() {
  const [model, setModel] = useState<Model>(INIT);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const { refresh } = useAuth();
  const { setMode } = useBuyerMode();
  const router = useRouter();

  function setField<K extends keyof Model>(key: K, value: Model[K]) {
    setModel(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined, form: undefined }));
  }

  function toggle(list: 'businessTypes' | 'sourcingCategories', key: string, checked: boolean) {
    setModel(prev => {
      const set = new Set(prev[list]);
      if (checked) set.add(key); else set.delete(key);
      return { ...prev, [list]: Array.from(set) };
    });
    if (list === 'businessTypes') setErrors(prev => ({ ...prev, businessTypes: undefined }));
  }

  function validate(): boolean {
    const errs: Errors = {};
    if (!model.companyName.trim()) errs.companyName = 'Company / business name is required.';
    if (model.businessTypes.length < 1) errs.businessTypes = 'Please select at least one business type.';
    if (!model.country) errs.country = 'Country is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) {
      setErrors(prev => ({ ...prev, form: 'Please complete the required fields (marked *).' }));
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/customer/b2b-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: model.companyName.trim(),
          businessTypes: model.businessTypes,
          gstTaxId: model.gstTaxId.trim(), // OPTIONAL -- blank is accepted
          sourcingCategories: model.sourcingCategories,
          estimatedVolumeCurrency: model.currency,
          estimatedVolumeAmount: model.estimatedVolume ? Number(model.estimatedVolume) : null,
          orderFrequency: model.orderFrequency,
          website: model.website.trim(),
          socialHandles: model.socialHandles.trim(),
          country: model.country,
          phone: model.phone.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || data?.reauth) {
        setStatus('idle');
        setErrors({ form: 'Please sign in as a wholesale buyer to upgrade your account.' });
        return;
      }
      if (res.ok && data?.success && data?.buyerType === 'b2b') {
        // Switch buyer mode NOW (instant), then refresh auth so the profile-driven
        // bridge in BuyerModeProvider confirms buyerType:'b2b' from the server.
        setMode('b2b');
        try { await refresh(); } catch { /* non-blocking */ }
        setStatus('success');
        return;
      }
      setStatus('idle');
      setErrors({ form: data?.message || 'Could not upgrade your account. Please try again.' });
    } catch {
      setStatus('idle');
      setErrors({ form: 'Something went wrong. Please try again.' });
    }
  }

  if (status === 'success') {
    return (
      <div className='flex justify-center py-10'>
        <div className='w-full max-w-md rounded-xl border border-black/10 bg-sand/40 shadow-sm px-8 py-10 flex flex-col items-center text-center'>
          <span aria-hidden='true' className='material-symbols-outlined text-5xl text-[#F7C52D] mb-4'>verified</span>
          <h2 className='text-2xl font-medium mb-2'>You&apos;re now a wholesale buyer</h2>
          <p className='text-black/60'>
            Bulk pricing, volume-discount tiers, MOQ and pre-order are now unlocked across the store.
          </p>
          <div className='w-full border-t border-black/10 my-6' />
          <Link
            href='/'
            className='inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-[#1a1a1a] rounded-lg transition w-full sm:w-auto'
            style={{ background: 'linear-gradient(135deg, #F7C52D 0%, #FFD700 100%)', boxShadow: '0 4px 12px rgba(247, 197, 45, 0.3)' }}
          >
            <span aria-hidden='true' className='material-symbols-outlined text-[18px]'>storefront</span>
            Browse wholesale catalogue
          </Link>
          <button
            type='button'
            onClick={() => router.back()}
            className='mt-4 px-6 py-2 text-sm text-black/50 hover:text-clay hover:underline transition'
          >
            Back to the product
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className='space-y-8'>
      {/* Business details */}
      <div className='bg-white rounded-lg shadow-sm p-6 border border-black/10'>
        <h3 className='text-lg font-semibold text-black mb-5 pb-2 border-b border-black/10'>Business details</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label htmlFor='sd-company' className='block text-sm font-medium text-black/70 mb-2'>
              Company / Business Name <span className='text-red-500'>*</span>
            </label>
            <input
              id='sd-company' type='text' placeholder='Your company name'
              value={model.companyName} onChange={e => setField('companyName', e.target.value)}
              required aria-required='true' autoComplete='organization'
              aria-invalid={!!errors.companyName}
              className={inputCls + (errors.companyName ? ' border-red-400' : '')}
            />
            {errors.companyName && <p className='text-xs text-red-500 mt-1'>{errors.companyName}</p>}
          </div>
          <div>
            <label htmlFor='sd-gst' className='block text-sm font-medium text-black/70 mb-2'>
              GST / Tax ID <span className='text-black/40'>(Optional)</span>
            </label>
            <input
              id='sd-gst' type='text' placeholder='Leave blank if you don&apos;t have one yet / international'
              value={model.gstTaxId} onChange={e => setField('gstTaxId', e.target.value)}
              className={inputCls}
            />
            <p className='text-xs text-black/40 mt-1'>No GST? No problem — international &amp; newly-formed buyers can leave this blank.</p>
          </div>
          <div>
            <label htmlFor='sd-website' className='block text-sm font-medium text-black/70 mb-2'>Website (If Any)</label>
            <input
              id='sd-website' type='url' placeholder='https://your-website.com'
              value={model.website} onChange={e => setField('website', e.target.value)}
              autoComplete='url' className={inputCls}
            />
          </div>
          <div>
            <label htmlFor='sd-social' className='block text-sm font-medium text-black/70 mb-2'>Social handle (If Any)</label>
            <input
              id='sd-social' type='text' placeholder='@yourbrand'
              value={model.socialHandles} onChange={e => setField('socialHandles', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor='sd-country' className='block text-sm font-medium text-black/70 mb-2'>
              Country <span className='text-red-500'>*</span>
            </label>
            <select
              id='sd-country' value={model.country} onChange={e => setField('country', e.target.value)}
              required aria-required='true' autoComplete='country-name'
              aria-invalid={!!errors.country}
              className={inputCls + ' cursor-pointer' + (errors.country ? ' border-red-400' : '')}
            >
              <option value=''>Select your country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.country && <p className='text-xs text-red-500 mt-1'>{errors.country}</p>}
          </div>
          <div>
            <label htmlFor='sd-phone' className='block text-sm font-medium text-black/70 mb-2'>Phone <span className='text-black/40'>(Optional)</span></label>
            <input
              id='sd-phone' type='tel' placeholder='Contact number'
              value={model.phone} onChange={e => setField('phone', e.target.value)}
              autoComplete='tel' className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Business type */}
      <div className='bg-white rounded-lg shadow-sm p-6 border border-black/10'>
        <h3 className='text-lg font-semibold text-black mb-2 pb-2 border-b border-black/10'>
          Business Type <span className='text-red-500'>*</span>
        </h3>
        <p className='text-xs text-black/40 mb-3'>Select one or more</p>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
          {BUSINESS_TYPES.map(bt => (
            <label key={bt} className='flex items-center gap-2 text-sm cursor-pointer'>
              <input type='checkbox' className='accent-[#F59E0B] w-5 h-5'
                checked={model.businessTypes.includes(bt)}
                onChange={e => toggle('businessTypes', bt, e.target.checked)} />
              {bt}
            </label>
          ))}
        </div>
        {errors.businessTypes && <p className='text-xs text-red-500 mt-2'>{errors.businessTypes}</p>}
      </div>

      {/* Sourcing + volume */}
      <div className='bg-white rounded-lg shadow-sm p-6 border border-black/10'>
        <h3 className='text-lg font-semibold text-black mb-5 pb-2 border-b border-black/10'>Sourcing &amp; volume</h3>
        <div className='mb-6'>
          <label className='block text-sm font-medium text-black/70 mb-2'>Sourcing categories</label>
          <div className='flex flex-wrap gap-4'>
            {SOURCING_CATEGORIES.map(sc => (
              <label key={sc} className='flex items-center gap-2 text-sm cursor-pointer'>
                <input type='checkbox' className='accent-[#F59E0B] w-5 h-5'
                  checked={model.sourcingCategories.includes(sc)}
                  onChange={e => toggle('sourcingCategories', sc, e.target.checked)} />
                {sc}
              </label>
            ))}
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div>
            <label htmlFor='sd-freq' className='block text-sm font-medium text-black/70 mb-2'>Order frequency</label>
            <select id='sd-freq' value={model.orderFrequency} onChange={e => setField('orderFrequency', e.target.value)}
              className={inputCls + ' cursor-pointer'}>
              <option value=''>Select</option>
              {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor='sd-currency' className='block text-sm font-medium text-black/70 mb-2'>Currency</label>
            <select id='sd-currency' value={model.currency} onChange={e => setField('currency', e.target.value)}
              className={inputCls + ' cursor-pointer'}>
              <option value='INR'>INR (&#8377;)</option>
              <option value='GBP'>GBP (&#163;)</option>
              <option value='USD'>USD ($)</option>
              <option value='EUR'>EUR (&#8364;)</option>
              <option value='AUD'>AUD (A$)</option>
            </select>
          </div>
          <div>
            <label htmlFor='sd-volume' className='block text-sm font-medium text-black/70 mb-2'>
              Est. order volume ({model.currency})
            </label>
            <input id='sd-volume' type='number' min={1} placeholder='Approx per order cycle'
              value={model.estimatedVolume} onChange={e => setField('estimatedVolume', e.target.value)}
              className={inputCls} />
          </div>
        </div>
      </div>

      {errors.form && <p className='text-sm text-red-500'>{errors.form}</p>}

      <button
        type='submit' disabled={status === 'loading'}
        className='w-full py-4 text-[#1a1a1a] text-sm font-medium tracking-wide disabled:opacity-50 transition rounded-lg'
        style={{ background: 'linear-gradient(135deg, #F7C52D 0%, #FFD700 100%)', boxShadow: '0 4px 12px rgba(247, 197, 45, 0.3)' }}
      >
        {status === 'loading' ? 'Upgrading…' : 'Upgrade to wholesale — instantly'}
      </button>
      <p className='text-center text-xs text-black/40 -mt-4'>
        Your account switches to wholesale immediately. No approval wait.
      </p>
    </form>
  );
}
