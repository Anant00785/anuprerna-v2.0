'use client';
import { useState } from 'react';

type OptInPhase = 'prompt' | 'opted-in' | 'dismissed';

export default function WhatsAppOptIn() {
  const [phase, setPhase] = useState<OptInPhase>('prompt');

  if (phase === 'dismissed') {
    return (
      <label className='flex items-center gap-2 text-sm text-gray-500 cursor-pointer'>
        <input
          type='checkbox'
          className='accent-green-600'
          onChange={(e) => { if (e.target.checked) setPhase('prompt'); }}
        />
        Get Order Updates on WhatsApp
      </label>
    );
  }

  if (phase === 'opted-in') {
    return (
      <div className='rounded-xl border border-green-200 bg-green-50 p-4'>
        <div className='flex items-center gap-3'>
          <span className='material-symbols-outlined text-green-600'>check_circle</span>
          <p className='text-sm font-semibold text-green-800'>You are opted in!</p>
        </div>
        <p className='mt-1 text-xs text-green-700 ml-9'>You will receive order updates on WhatsApp.</p>
      </div>
    );
  }

  return (
    <div className='rounded-xl border border-green-100 bg-green-50 p-4'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-start gap-3'>
          <div className='flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-lg text-green-600 shrink-0'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.557 4.118 1.531 5.846L.058 23.625a.75.75 0 00.918.918l5.779-1.473A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22.5c-1.963 0-3.797-.52-5.378-1.427l-.386-.22-4.007 1.021 1.021-4.007-.22-.386A10.483 10.483 0 011.5 12C1.5 6.201 6.201 1.5 12 1.5S22.5 6.201 22.5 12 17.799 22.5 12 22.5z"/>
            </svg>
          </div>
          <div>
            <p className='text-sm font-semibold text-green-800 md:text-base'>Get order updates on WhatsApp</p>
            <p className='mt-1 text-sm text-green-700'>Stay updated on your order status, shipping, and artisan updates â straight to WhatsApp.</p>
          </div>
        </div>
        <div className='flex shrink-0 items-center justify-end gap-2'>
          <button
            type='button'
            onClick={() => setPhase('dismissed')}
            className='px-3 py-2 text-sm font-medium text-gray-400 hover:text-gray-600'
          >
            Not now
          </button>
          <button
            type='button'
            onClick={() => setPhase('opted-in')}
            className='rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700'
          >
            Yes, notify me
          </button>
        </div>
      </div>
    </div>
  );
}
