'use client';

import { useState, useRef, FormEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

const CATEGORIES = [
  { id: 'fabric', label: 'Fabric & Quality', icon: 'texture' },
  { id: 'artisan', label: 'Artisan Craftsmanship', icon: 'palette' },
  { id: 'website', label: 'Website Experience', icon: 'devices' },
  { id: 'delivery', label: 'Shipping & Delivery', icon: 'local_shipping' },
  { id: 'suggestion', label: 'Idea / Suggestion', icon: 'lightbulb' },
];

export default function HomeFeedbackSection() {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('fabric');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file size must be under 10MB');
        return;
      }
      setError('');
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please write your feedback or suggestion');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim() || (user?.name as string) || 'Valued Customer');
      formData.append('email', email.trim() || (user?.email as string) || '');
      formData.append('rating', String(rating));
      formData.append('category', category);
      formData.append('message', message.trim());
      formData.append('pageUrl', typeof window !== 'undefined' ? window.location.pathname : '/');

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSubmitted(true);
      setMessage('');
      setImageFile(null);
      setImagePreview(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error submitting feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className='w-full py-14 lg:py-20 bg-[#FAF7F2] border-t border-b border-[#EBE4D8]'>
      <div className='max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-[#E9E3D8] overflow-hidden'>
          {/* Header */}
          <div className='bg-[#7D5B20] text-white px-6 sm:px-10 py-8 text-center relative overflow-hidden'>
            <div className='absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none' />
            <div className='absolute -left-6 -top-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none' />

            <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs uppercase tracking-wider font-semibold mb-3'>
              <span className='material-symbols-outlined text-[15px]'>chat_bubble</span>
              Your Voice Matters
            </span>
            <h2 className='text-2xl sm:text-3xl font-medium tracking-tight mb-2'>
              Share Your Feedback &amp; Stories
            </h2>
            <p className='text-white/80 text-sm sm:text-base max-w-lg mx-auto leading-relaxed'>
              Help us elevate handloom craftsmanship and refine your sourcing experience. Upload photos or leave thoughts.
            </p>
          </div>

          {submitted ? (
            <div className='p-8 sm:p-12 text-center'>
              <div className='w-16 h-16 bg-[#EBF5EE] text-[#2E7D32] rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='material-symbols-outlined text-3xl'>check_circle</span>
              </div>
              <h3 className='text-2xl font-semibold text-black mb-2'>
                Thank You for Your Feedback!
              </h3>
              <p className='text-black/60 max-w-md mx-auto text-sm sm:text-base mb-6'>
                Your review has been securely saved to our team dashboard. Your insights guide our artisans and collections.
              </p>
              <button
                type='button'
                onClick={() => setSubmitted(false)}
                className='px-6 py-2.5 rounded-lg bg-[#7D5B20] text-white font-medium hover:bg-[#684b1a] transition-colors text-sm shadow-sm'
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='p-6 sm:p-10 space-y-6'>
              {/* Rating */}
              <div className='text-center space-y-2'>
                <label className='block text-xs font-bold uppercase tracking-wider text-black/60'>
                  How was your experience?
                </label>
                <div className='flex items-center justify-center gap-2'>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type='button'
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className='p-1 transition-transform hover:scale-125 focus:outline-none'
                        aria-label={`${star} Stars`}
                      >
                        <span
                          className={`material-symbols-outlined text-3xl sm:text-4xl transition-colors ${
                            active ? 'text-amber-400 font-variation-settings-fill' : 'text-gray-300'
                          }`}
                        >
                          star
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className='text-xs text-black/50 font-medium'>
                  {rating === 5 && 'Outstanding & Inspiring'}
                  {rating === 4 && 'Very Good'}
                  {rating === 3 && 'Average / Needs Refinement'}
                  {rating === 2 && 'Below Expectation'}
                  {rating === 1 && 'Needs Immediate Attention'}
                </p>
              </div>

              {/* Categories */}
              <div>
                <label className='block text-xs font-bold uppercase tracking-wider text-black/60 mb-2'>
                  Topic Category
                </label>
                <div className='flex flex-wrap gap-2'>
                  {CATEGORIES.map((cat) => {
                    const active = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type='button'
                        onClick={() => setCategory(cat.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                          active
                            ? 'bg-[#7D5B20] text-white border-[#7D5B20] shadow-xs'
                            : 'bg-white text-black/70 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className='material-symbols-outlined text-[16px]'>{cat.icon}</span>
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor='fb-message' className='block text-xs font-bold uppercase tracking-wider text-black/60 mb-1.5'>
                  Your Feedback / Message <span className='text-red-500'>*</span>
                </label>
                <textarea
                  id='fb-message'
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder='Tell us what you loved, or what we can do better for your custom sourcing / products...'
                  className='w-full rounded-xl border border-gray-300 p-3.5 text-sm outline-none focus:border-[#7D5B20] focus:ring-1 focus:ring-[#7D5B20] transition placeholder:text-black/35'
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className='block text-xs font-bold uppercase tracking-wider text-black/60 mb-1.5'>
                  Attach a Photo / Screenshot <span className='text-black/40 font-normal'>(Optional)</span>
                </label>

                {imagePreview ? (
                  <div className='relative inline-block border-2 border-dashed border-[#7D5B20]/40 rounded-xl p-2 bg-[#FAF7F2]'>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt='Upload preview'
                      className='h-32 w-auto object-cover rounded-lg border border-black/10'
                    />
                    <button
                      type='button'
                      onClick={removeImage}
                      className='absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 transition'
                      title='Remove image'
                    >
                      <span className='material-symbols-outlined text-[16px] block'>close</span>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className='border-2 border-dashed border-gray-300 hover:border-[#7D5B20] rounded-xl p-4 sm:p-6 text-center cursor-pointer bg-gray-50/50 hover:bg-[#FAF7F2]/50 transition-all'
                  >
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='image/*'
                      onChange={handleImageChange}
                      className='hidden'
                    />
                    <span className='material-symbols-outlined text-3xl text-gray-400 mb-1 block'>
                      add_photo_alternate
                    </span>
                    <p className='text-xs sm:text-sm font-medium text-black/80'>
                      Click to upload a picture or drag &amp; drop
                    </p>
                    <p className='text-[11px] text-black/40 mt-0.5'>PNG, JPG, WEBP up to 10MB (stored in Neon S3)</p>
                  </div>
                )}
              </div>

              {/* User details */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                  <label htmlFor='fb-name' className='block text-xs font-bold uppercase tracking-wider text-black/60 mb-1.5'>
                    Your Name <span className='text-black/40 font-normal'>(Optional)</span>
                  </label>
                  <input
                    id='fb-name'
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={user?.name ? String(user.name) : 'e.g. Aditi Roy'}
                    className='w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-[#7D5B20] transition placeholder:text-black/35'
                  />
                </div>
                <div>
                  <label htmlFor='fb-email' className='block text-xs font-bold uppercase tracking-wider text-black/60 mb-1.5'>
                    Email Address <span className='text-black/40 font-normal'>(Optional)</span>
                  </label>
                  <input
                    id='fb-email'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={user?.email ? String(user.email) : 'name@example.com'}
                    className='w-full rounded-xl border border-gray-300 p-2.5 text-sm outline-none focus:border-[#7D5B20] transition placeholder:text-black/35'
                  />
                </div>
              </div>

              {error && (
                <div className='p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2'>
                  <span className='material-symbols-outlined text-[16px] shrink-0'>error</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className='pt-2'>
                <button
                  type='submit'
                  disabled={submitting}
                  className='w-full sm:w-auto px-8 py-3 rounded-xl bg-[#7D5B20] hover:bg-[#684b1a] text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer'
                >
                  {submitting ? (
                    <>
                      <span className='material-symbols-outlined animate-spin text-[18px]'>progress_activity</span>
                      Uploading to Neon...
                    </>
                  ) : (
                    <>
                      <span className='material-symbols-outlined text-[18px]'>send</span>
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
