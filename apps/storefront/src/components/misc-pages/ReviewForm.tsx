'use client';

import { useState, FormEvent } from 'react';

const STAR_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

interface ReviewFormState {
  orderId: string;
  rating: number;
  comment: string;
  name: string;
  email: string;
}

const INIT: ReviewFormState = {
  orderId: '',
  rating: 0,
  comment: '',
  name: '',
  email: '',
};

export default function ReviewForm() {
  const [form, setForm] = useState<ReviewFormState>(INIT);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<keyof ReviewFormState, string>>>({});
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  function validate(): boolean {
    const errs: Partial<Record<keyof ReviewFormState, string>> = {};
    if (!form.orderId.trim()) errs.orderId = 'Order ID is required.';
    if (!form.rating) errs.rating = 'Please select a star rating.';
    if (!form.name.trim()) errs.name = 'Your name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'A valid email is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    // STUBBED: review submit is a content write — showing success state instead of
    // calling /add/order/feedback to avoid unintended data writes.
    setStatus('success');
  }

  if (status === 'success') {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <span className='material-symbols-outlined text-5xl text-clay mb-4'>rate_review</span>
        <h2 className='text-2xl font-medium text-clay mb-2'>Thank you for your review!</h2>
        <p className='text-black/60 max-w-md'>
          Your feedback helps us improve and helps other customers make better choices.
        </p>
        <button
          className='mt-6 px-6 py-2 text-sm border border-clay text-clay hover:bg-clay hover:text-white transition rounded'
          onClick={() => { setForm(INIT); setErrors({}); setStatus('idle'); }}
        >
          Write another review
        </button>
      </div>
    );
  }

  const inputBase =
    'w-full border-b border-black/20 bg-transparent py-2 text-sm placeholder:text-black/40 focus:outline-none focus:border-clay transition';

  const displayStars = hoveredStar || form.rating;

  return (
    <form onSubmit={onSubmit} noValidate className='w-full max-w-lg'>
      {/* Order ID */}
      <div className='mb-6'>
        <label className='block text-xs uppercase tracking-widest text-black/50 mb-2'>Order ID *</label>
        <input
          type='text'
          placeholder='e.g. DSG086000J'
          value={form.orderId}
          onChange={e => { setForm(p => ({ ...p, orderId: e.target.value })); setErrors(p => ({ ...p, orderId: undefined })); }}
          className={inputBase + (errors.orderId ? ' border-red-400' : '')}
        />
        {errors.orderId && <p className='text-xs text-red-500 mt-1'>{errors.orderId}</p>}
      </div>

      {/* Star rating */}
      <div className='mb-6'>
        <label className='block text-xs uppercase tracking-widest text-black/50 mb-3'>Rating *</label>
        <div className='flex items-center gap-1'>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type='button'
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => { setForm(p => ({ ...p, rating: star })); setErrors(p => ({ ...p, rating: undefined })); }}
              className={'text-3xl transition ' + (displayStars >= star ? 'text-clay' : 'text-black/20')}
              aria-label={STAR_LABELS[star - 1]}
            >
              ★
            </button>
          ))}
          {displayStars > 0 && (
            <span className='ml-2 text-sm text-black/60'>{STAR_LABELS[displayStars - 1]}</span>
          )}
        </div>
        {errors.rating && <p className='text-xs text-red-500 mt-1'>{errors.rating}</p>}
      </div>

      {/* Comment */}
      <div className='mb-6'>
        <label className='block text-xs uppercase tracking-widest text-black/50 mb-2'>Your Review</label>
        <textarea
          rows={4}
          placeholder='Share your experience with this product…'
          value={form.comment}
          onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
          className={inputBase + ' resize-none'}
        />
      </div>

      {/* Name + Email */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8'>
        <div>
          <input
            type='text'
            placeholder='Your Name *'
            value={form.name}
            onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: undefined })); }}
            className={inputBase + (errors.name ? ' border-red-400' : '')}
          />
          {errors.name && <p className='text-xs text-red-500 mt-1'>{errors.name}</p>}
        </div>
        <div>
          <input
            type='email'
            placeholder='Email *'
            value={form.email}
            onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: undefined })); }}
            className={inputBase + (errors.email ? ' border-red-400' : '')}
          />
          {errors.email && <p className='text-xs text-red-500 mt-1'>{errors.email}</p>}
        </div>
      </div>

      <p className='text-xs text-black/40 mb-4'>
        Note: Review submission is in preview mode — your data will not be sent.
      </p>

      <button
        type='submit'
        className='w-full sm:w-auto px-10 py-3 bg-clay text-white text-sm font-medium tracking-wide hover:bg-clay/90 transition rounded'
      >
        Submit Review
      </button>
    </form>
  );
}
