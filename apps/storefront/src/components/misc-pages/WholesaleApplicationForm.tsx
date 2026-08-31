'use client';

import { useState, useEffect, FormEvent } from 'react';

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (opts: { url: string }) => void;
    };
  }
}

const CALENDLY_URL = 'https://calendly.com/amit-anuprerna/30min';
const CALENDLY_CSS_ID = 'calendly-widget-css';
const CALENDLY_JS_ID = 'calendly-widget-js';
const CURRENCY_STORAGE_KEY = 'anuprerna_wholesale_ccy';
const VALID_CURRENCIES = ['INR', 'GBP', 'USD', 'EUR', 'AUD'];

function openCalendlyPopup(e: { preventDefault: () => void }) {
  e.preventDefault();
  if (typeof window !== 'undefined' && window.Calendly) {
    window.Calendly.initPopupWidget({ url: CALENDLY_URL });
  } else if (typeof window !== 'undefined') {
    // Graceful fallback if the widget script hasn't finished loading yet.
    window.open(CALENDLY_URL, '_blank', 'noopener');
  }
}

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda',
  'Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain',
  'Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia',
  'Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso',
  'Burundi','Cabo Verde','Cambodia','Cameroon','Canada','Central African Republic',
  'Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica',"Cote d'Ivoire",
  'Croatia','Cuba','Cyprus','Czech Republic','Democratic Republic of the Congo',
  'Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt',
  'El Salvador','Equatorial Guinea','Eritrea','Estonia','Ethiopia','Fiji','Finland',
  'France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada',
  'Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary',
  'Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica',
  'Japan','Jordan','Kazakhstan','Kenya','Kiribati','Korea, North','Korea, South',
  'Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia',
  'Libya','Liechtenstein','Lithuania','Luxembourg','Macedonia','Madagascar','Malawi',
  'Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius',
  'Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco',
  'Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand',
  'Nicaragua','Niger','Nigeria','Niue','Norway','Oman','Pakistan','Palau',
  'Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland',
  'Portugal','Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis',
  'Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino',
  'Sao Tome and Principe','Saudi Arabia','Senegal','Serbia','Seychelles',
  'Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia',
  'South Africa','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Swaziland',
  'Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand',
  'Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu',
  'Uganda','Ukraine','United Arab Emirates','United Kingdom','United States',
  'Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen',
  'Zambia','Zimbabwe',
];

const BUSINESS_TYPES = [
  'Ethical Fashion House',
  'Designer / Creative Studio',
  'Home & Lifestyle Brand',
  'Boutique Store',
  'Retailer',
  'Interior Designer',
];

type Frequency = 'Monthly' | 'Quarterly' | 'Bi-Annually' | 'Annually' | 'other' | '';

interface WholesaleModel {
  fullName: string;
  brandName: string;
  website: string;
  email: string;
  phnumber: string;
  country: string;
  businessTypes: string[];
  businessTypeOtherChecked: boolean;
  businessTypeOtherText: string;
  orderFrequency: Frequency;
  orderFrequencyOtherText: string;
  currency: string;
  estimatedVolume: string;
  notes: string;
}

interface WholesaleErrors {
  fullName?: string;
  email?: string;
  phnumber?: string;
  country?: string;
  businessTypes?: string;
  orderFrequency?: string;
  estimatedVolume?: string;
  form?: string;
}

const INIT: WholesaleModel = {
  fullName: '', brandName: '', website: '', email: '', phnumber: '', country: '',
  businessTypes: [], businessTypeOtherChecked: false, businessTypeOtherText: '',
  orderFrequency: '', orderFrequencyOtherText: '',
  currency: 'USD', estimatedVolume: '', notes: '',
};

const inputCls = 'w-full px-4 py-3 border border-black/20 rounded-md text-sm focus:ring-2 focus:ring-[#F7C52D]/40 focus:border-[#F7C52D] transition outline-none';

export default function WholesaleApplicationForm() {
  const [model, setModel] = useState<WholesaleModel>(INIT);
  const [errors, setErrors] = useState<WholesaleErrors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  // Carry over the currency chosen in the pricing section above (localStorage round-trip).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (stored && VALID_CURRENCIES.includes(stored)) {
        setField('currency', stored);
      }
    } catch {
      // ignore (private browsing / storage disabled)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load Calendly's popup widget assets once, guarded against double-injection
  // (e.g. React StrictMode double-invoking effects in dev).
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (!document.getElementById(CALENDLY_CSS_ID)) {
      const link = document.createElement('link');
      link.id = CALENDLY_CSS_ID;
      link.rel = 'stylesheet';
      link.href = 'https://assets.calendly.com/assets/external/widget.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById(CALENDLY_JS_ID)) {
      const script = document.createElement('script');
      script.id = CALENDLY_JS_ID;
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  function setField<K extends keyof WholesaleModel>(key: K, value: WholesaleModel[K]) {
    setModel(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined, form: undefined }));
  }

  function toggleBusinessType(key: string, checked: boolean) {
    setModel(prev => {
      const set = new Set(prev.businessTypes);
      checked ? set.add(key) : set.delete(key);
      return { ...prev, businessTypes: Array.from(set) };
    });
    setErrors(prev => ({ ...prev, businessTypes: undefined }));
  }

  function onFrequencyChange(value: Frequency) {
    setModel(prev => ({
      ...prev,
      orderFrequency: value,
      orderFrequencyOtherText: value !== 'other' ? '' : prev.orderFrequencyOtherText,
    }));
    setErrors(prev => ({ ...prev, orderFrequency: undefined }));
  }

  function validate(): boolean {
    const errs: WholesaleErrors = {};
    if (!model.fullName.trim()) errs.fullName = 'Full name is required.';
    if (!model.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(model.email))
      errs.email = 'Please enter a valid email address.';
    if (!model.phnumber.trim()) errs.phnumber = 'Phone number is required.';
    if (!model.country) errs.country = 'Country is required.';
    if (model.businessTypes.length < 1) errs.businessTypes = 'Please select at least one business type.';
    if (!model.orderFrequency) errs.orderFrequency = 'Please select an order frequency.';
    const vol = Number(model.estimatedVolume);
    if (!model.estimatedVolume || !isFinite(vol) || vol <= 0)
      errs.estimatedVolume = 'Estimated total order volume is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) {
      setErrors(prev => ({ ...prev, form: 'Please fix the form. Full name is required.' }));
      return;
    }
    setStatus('loading');
    // Stubbed: preview mode — simulate success after short delay
    setTimeout(() => setStatus('success'), 800);
  }

  if (status === 'success') {
    return (
      <div className='flex justify-center py-12'>
        <div className='w-full max-w-md rounded-xl border border-black/10 bg-sand/40 shadow-sm px-8 py-10 flex flex-col items-center text-center'>
          <span aria-hidden='true' className='material-symbols-outlined text-5xl text-[#F7C52D] mb-4'>check_circle</span>
          <h2 className='text-2xl font-medium mb-2'>Application sent</h2>
          <p className='text-black/60'>
            Thanks! Your partnership request has been submitted. Our team will respond within 1–2 business days.
          </p>

          <div className='w-full border-t border-black/10 my-6' />

          <p className='text-black/60 text-sm mb-4'>
            Prefer to talk sooner? Skip the wait and book a call — we&apos;ll walk you through ranges, MOQs and pricing.
          </p>
          <button
            type='button'
            onClick={openCalendlyPopup}
            className='inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-[#1a1a1a] rounded-lg transition w-full sm:w-auto'
            style={{
              background: 'linear-gradient(135deg, #F7C52D 0%, #FFD700 100%)',
              boxShadow: '0 4px 12px rgba(247, 197, 45, 0.3)',
            }}
          >
            <span aria-hidden='true' className='material-symbols-outlined text-[18px]'>calendar_month</span>
            Book a 15-minute call
          </button>

          <button
            className='mt-5 px-6 py-2 text-sm text-black/50 hover:text-clay hover:underline transition'
            onClick={() => { setModel(INIT); setStatus('idle'); setErrors({}); }}
          >
            Submit another application
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className='space-y-8'>
      {/* Personal Information */}
      <div className='bg-white rounded-lg shadow-sm p-6 border border-black/10'>
        <h3 className='text-lg font-semibold text-black mb-5 pb-2 border-b border-black/10'>
          Personal Information
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label htmlFor='ws-fullname' className='block text-sm font-medium text-black/70 mb-2'>
              Full Name <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              placeholder='Enter your name'
              id='ws-fullname'
              value={model.fullName}
              onChange={e => setField('fullName', e.target.value)}
              required
              aria-required='true'
              autoComplete='name'
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? 'ws-fullname-error' : undefined}
              className={inputCls + (errors.fullName ? ' border-red-400' : '')}
            />
            {errors.fullName && <p id='ws-fullname-error' className='text-xs text-red-500 mt-1'>{errors.fullName}</p>}
          </div>
          <div>
            <label htmlFor='ws-brandname' className='block text-sm font-medium text-black/70 mb-2'>
              Brand / Business Name (If Any)
            </label>
            <input
              type='text'
              placeholder='Enter your brand name'
              id='ws-brandname'
              value={model.brandName}
              onChange={e => setField('brandName', e.target.value)}
              autoComplete='organization'
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor='ws-website' className='block text-sm font-medium text-black/70 mb-2'>Website (If Any)</label>
            <input
              type='url'
              placeholder='https://your-website.com'
              id='ws-website'
              value={model.website}
              onChange={e => setField('website', e.target.value)}
              autoComplete='url'
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor='ws-email' className='block text-sm font-medium text-black/70 mb-2'>
              Email Address <span className='text-red-500'>*</span>
            </label>
            <input
              type='email'
              placeholder='Enter your email'
              id='ws-email'
              value={model.email}
              onChange={e => setField('email', e.target.value)}
              required
              aria-required='true'
              autoComplete='email'
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'ws-email-error' : undefined}
              className={inputCls + (errors.email ? ' border-red-400' : '')}
            />
            {errors.email && <p id='ws-email-error' className='text-xs text-red-500 mt-1'>{errors.email}</p>}
          </div>
          <div>
            <label htmlFor='ws-phnumber' className='block text-sm font-medium text-black/70 mb-2'>
              Phone Number <span className='text-red-500'>*</span>
            </label>
            <input
              type='tel'
              placeholder='Enter your phone number'
              id='ws-phnumber'
              value={model.phnumber}
              onChange={e => setField('phnumber', e.target.value)}
              required
              aria-required='true'
              autoComplete='tel'
              aria-invalid={!!errors.phnumber}
              aria-describedby={errors.phnumber ? 'ws-phnumber-error' : undefined}
              className={inputCls + (errors.phnumber ? ' border-red-400' : '')}
            />
            {errors.phnumber && <p id='ws-phnumber-error' className='text-xs text-red-500 mt-1'>{errors.phnumber}</p>}
          </div>
          <div>
            <label htmlFor='ws-country' className='block text-sm font-medium text-black/70 mb-2'>
              Country <span className='text-red-500'>*</span>
            </label>
            <select
              id='ws-country'
              value={model.country}
              onChange={e => setField('country', e.target.value)}
              required
              aria-required='true'
              autoComplete='country-name'
              aria-invalid={!!errors.country}
              aria-describedby={errors.country ? 'ws-country-error' : undefined}
              className={inputCls + ' cursor-pointer' + (errors.country ? ' border-red-400' : '')}
            >
              <option value=''>Select your country</option>
              {COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.country && <p id='ws-country-error' className='text-xs text-red-500 mt-1'>{errors.country}</p>}
          </div>
        </div>
      </div>

      {/* Business Type */}
      <div className='bg-white rounded-lg shadow-sm p-6 border border-black/10'>
        <h3 className='text-lg font-semibold text-black mb-5 pb-2 border-b border-black/10'>
          Business Type <span className='text-red-500'>*</span>
        </h3>
        <p className='text-xs text-black/40 mb-3'>Select one or more</p>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
          {BUSINESS_TYPES.map(bt => (
            <label key={bt} className='flex items-center gap-2 text-sm cursor-pointer'>
              <input
                type='checkbox'
                className='accent-[#F59E0B] w-5 h-5'
                checked={model.businessTypes.includes(bt)}
                onChange={e => toggleBusinessType(bt, e.target.checked)}
              />
              {bt}
            </label>
          ))}
          {/* Other */}
          <label className='flex items-center gap-2 text-sm cursor-pointer'>
            <input
              type='checkbox'
              className='accent-[#F59E0B] w-5 h-5'
              checked={model.businessTypeOtherChecked}
              onChange={e => {
                setModel(prev => ({
                  ...prev,
                  businessTypeOtherChecked: e.target.checked,
                  businessTypeOtherText: e.target.checked ? prev.businessTypeOtherText : '',
                }));
              }}
            />
            Other
          </label>
          {model.businessTypeOtherChecked && (
            <input
              type='text'
              placeholder='Please specify'
              aria-label='Other business type'
              value={model.businessTypeOtherText}
              onChange={e => setField('businessTypeOtherText', e.target.value)}
              className={inputCls + ' col-span-full'}
            />
          )}
        </div>
        {errors.businessTypes && <p className='text-xs text-red-500 mt-2'>{errors.businessTypes}</p>}
      </div>

      {/* Order Preferences */}
      <div className='bg-white rounded-lg shadow-sm p-6 border border-black/10'>
        <h3 className='text-lg font-semibold text-black mb-5 pb-2 border-b border-black/10'>
          Order Preferences
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {/* Order Frequency — radios */}
          <div>
            <label className='block text-sm font-medium text-black/70 mb-3'>
              Order Frequency <span className='text-red-500'>*</span>{' '}
              <span className='text-xs text-black/40'>(Select one)</span>
            </label>
            <div className='space-y-2'>
              {(['Monthly', 'Quarterly', 'Bi-Annually', 'Annually'] as Frequency[]).map(f => (
                <label key={f as string} className='flex items-center gap-2 text-sm cursor-pointer'>
                  <input
                    type='radio'
                    name='orderFrequency'
                    className='accent-[#F59E0B] w-4 h-4'
                    checked={model.orderFrequency === f}
                    onChange={() => onFrequencyChange(f)}
                  />
                  {f as string}
                </label>
              ))}
              <label className='flex items-center gap-2 text-sm cursor-pointer'>
                <input
                  type='radio'
                  name='orderFrequency'
                  className='accent-[#F59E0B] w-4 h-4'
                  checked={model.orderFrequency === 'other'}
                  onChange={() => onFrequencyChange('other')}
                />
                Other
              </label>
              {model.orderFrequency === 'other' && (
                <input
                  type='text'
                  placeholder='Please specify months'
                  aria-label='Other order frequency (months)'
                  value={model.orderFrequencyOtherText}
                  onChange={e => setField('orderFrequencyOtherText', e.target.value)}
                  className={inputCls}
                />
              )}
            </div>
            {errors.orderFrequency && <p className='text-xs text-red-500 mt-2'>{errors.orderFrequency}</p>}
          </div>

          {/* Currency + Estimated Volume */}
          <div className='space-y-5'>
            <div>
              <label htmlFor='ws-currency' className='block text-sm font-medium text-black/70 mb-2'>
                Currency
              </label>
              <select
                id='ws-currency'
                value={model.currency}
                onChange={e => setField('currency', e.target.value)}
                className={inputCls + ' cursor-pointer'}
              >
                <option value='INR'>INR (&#8377;)</option>
                <option value='GBP'>GBP (&#163;)</option>
                <option value='USD'>USD ($)</option>
                <option value='EUR'>EUR (&#8364;)</option>
                <option value='AUD'>AUD (A$)</option>
              </select>
            </div>
            <div>
              <label htmlFor='ws-volume' className='block text-sm font-medium text-black/70 mb-2'>
                Estimated Order Volume ({model.currency}) <span className='text-red-500'>*</span>
              </label>
              <input
                type='number'
                placeholder='As per preferred order frequency'
                id='ws-volume'
                value={model.estimatedVolume}
                onChange={e => setField('estimatedVolume', e.target.value)}
                min={1}
                required
                aria-required='true'
                aria-invalid={!!errors.estimatedVolume}
                aria-describedby={errors.estimatedVolume ? 'ws-volume-error' : undefined}
                className={inputCls + (errors.estimatedVolume ? ' border-red-400' : '')}
              />
              {errors.estimatedVolume && (
                <p id='ws-volume-error' className='text-xs text-red-500 mt-1'>{errors.estimatedVolume}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className='bg-white rounded-lg shadow-sm p-6 border border-black/10'>
        <h3 className='text-lg font-semibold text-black mb-5 pb-2 border-b border-black/10'>
          Additional Information
        </h3>
        <textarea
          rows={4}
          placeholder='Briefly describe design preferences, sustainability priorities, or upcoming projects'
          aria-label='Additional information'
          value={model.notes}
          onChange={e => setField('notes', e.target.value)}
          className={inputCls + ' resize-none'}
        />
      </div>

      {errors.form && (
        <p className='text-sm text-red-500'>{errors.form}</p>
      )}

      <p className='text-xs text-black/40'>
        Note: Form submission is in preview mode — your data will not be sent.
      </p>

      <button
        type='submit'
        disabled={status === 'loading'}
        className='w-full py-4 text-[#1a1a1a] text-sm font-medium tracking-wide disabled:opacity-50 transition rounded-lg'
        style={{
          background: 'linear-gradient(135deg, #F7C52D 0%, #FFD700 100%)',
          boxShadow: '0 4px 12px rgba(247, 197, 45, 0.3)',
        }}
      >
        {status === 'loading' ? 'Submitting…' : 'Submit Application'}
      </button>
      <p className='text-center -mt-4'>
        <a
          href={CALENDLY_URL}
          onClick={openCalendlyPopup}
          className='text-sm text-black/50 hover:text-clay hover:underline transition'
        >
          Prefer to talk first? Book a 15-minute call
        </a>
      </p>
    </form>
  );
}
