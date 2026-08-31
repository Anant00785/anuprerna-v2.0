'use client';

import { useState, FormEvent, useRef, useCallback } from 'react';

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

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];

interface FormState {
  name: string;
  email: string;
  phone: string;
  country: string;
  company: string;
  companyWebsite: string;
  productType: string;
  productDescription: string;
  quantity: string;
  deliveryDate: string;
}

type FormErrors = Partial<FormState> & { files?: string };

const INIT: FormState = {
  name: '', email: '', phone: '', country: '',
  company: '', companyWebsite: '',
  productType: '', productDescription: '', quantity: '', deliveryDate: '',
};

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(INIT);
  const [errors, setErrors] = useState<FormErrors>({});
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [serverMsg, setServerMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };
  }

  function onPhoneKeyPress(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!/[0-9]/.test(e.key)) e.preventDefault();
  }

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter(f => ACCEPTED_TYPES.includes(f.type));
    if (valid.length < incoming.length) {
      setErrors(prev => ({ ...prev, files: 'Only jpeg, jpg, png, svg, webp images are accepted.' }));
    } else {
      setErrors(prev => ({ ...prev, files: undefined }));
    }
    setFiles(prev => [...prev, ...valid]);
  }, []);

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  }

  function removeFile(idx: number) {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Invalid email format.';
    if (!form.phone.trim() || form.phone.trim().length < 7)
      errs.phone = 'Phone number should be more than 7 characters long.';
    if (!form.country) errs.country = 'Country is required.';
    setErrors(prev => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, hp: honeypotRef.current?.value || '' }),
      });
      const data = await res.json().catch(() => ({ success: false, message: 'Unexpected response.' }));
      if (data.success) {
        setStatus('success');
        setForm(INIT);
        setFiles([]);
      } else {
        setStatus('error');
        setServerMsg(data.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setServerMsg('Network error. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <span aria-hidden='true' className='material-symbols-outlined text-5xl text-clay mb-4'>check_circle</span>
        <h2 className='text-2xl font-medium text-clay mb-2'>Thank you!</h2>
        <p className='text-black/60 max-w-md'>
          Your enquiry has been submitted. Our team will get back to you within 1-2 business days.
        </p>
        <button
          className='mt-6 px-6 py-2 text-sm border border-clay text-clay hover:bg-clay hover:text-white transition rounded'
          onClick={() => setStatus('idle')}
        >
          Submit another enquiry
        </button>
      </div>
    );
  }

  const inputBase =
    'w-full border border-[#b7a88e] bg-white/85 py-2 px-3 text-sm placeholder:text-black/40 focus:outline-none focus:border-clay transition';

  return (
    <form onSubmit={onSubmit} noValidate autoComplete='off' className='w-full'>
      {/* Row 1: Name + Email */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-4 mb-4 sm:mb-[40px]'>
        <div className='mb-4 sm:mb-0'>
          <div className='flex items-stretch'>
            <span className='w-[45px] h-[39px] flex items-center justify-center bg-[#b7a88e] shrink-0'>
              <span aria-hidden='true' className='material-symbols-outlined text-sm text-white'>person</span>
            </span>
            <input
              type='text'
              placeholder='Name *'
              aria-label='Name'
              value={form.name}
              onChange={set('name')}
              required
              aria-required='true'
              autoComplete='name'
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'cf-name-error' : undefined}
              className={inputBase + (errors.name ? ' border-red-400' : '')}
            />
          </div>
          {errors.name && <p id='cf-name-error' className='text-xs text-red-500 mt-1'>{errors.name}</p>}
        </div>
        <div>
          <div className='flex items-stretch'>
            <span className='w-[45px] h-[39px] flex items-center justify-center bg-[#b7a88e] shrink-0'>
              <span aria-hidden='true' className='material-symbols-outlined text-sm text-white'>mail</span>
            </span>
            <input
              type='email'
              placeholder='E-mail *'
              aria-label='Email'
              value={form.email}
              onChange={set('email')}
              required
              aria-required='true'
              autoComplete='email'
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'cf-email-error' : undefined}
              className={inputBase + (errors.email ? ' border-red-400' : '')}
            />
          </div>
          {errors.email && <p id='cf-email-error' className='text-xs text-red-500 mt-1'>{errors.email}</p>}
        </div>
      </div>

      {/* Row 2: Company + Company Website */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-4 mb-4 sm:mb-[40px]'>
        <div className='mb-4 sm:mb-0'>
          <div className='flex items-stretch'>
            <span className='w-[45px] h-[39px] flex items-center justify-center bg-[#b7a88e] shrink-0'>
              <span aria-hidden='true' className='material-symbols-outlined text-sm text-white'>business</span>
            </span>
            <input
              type='text'
              placeholder='Company Name'
              aria-label='Company name'
              value={form.company}
              onChange={set('company')}
              autoComplete='organization'
              className={inputBase}
            />
          </div>
        </div>
        <div>
          <div className='flex items-stretch'>
            <span className='w-[45px] h-[39px] flex items-center justify-center bg-[#b7a88e] shrink-0'>
              <span aria-hidden='true' className='material-symbols-outlined text-sm text-white'>language</span>
            </span>
            <input
              type='url'
              placeholder='Company Website'
              aria-label='Company website'
              value={form.companyWebsite}
              onChange={set('companyWebsite')}
              autoComplete='url'
              className={inputBase}
            />
          </div>
        </div>
      </div>

      {/* Row 3: Product Type */}
      <div className='mb-4 sm:mb-[40px]'>
        <div className='flex items-stretch'>
          <span className='w-[45px] h-[39px] flex items-center justify-center bg-[#b7a88e] shrink-0'>
            <span aria-hidden='true' className='material-symbols-outlined text-sm text-white'>inventory_2</span>
          </span>
          <input
            type='text'
            placeholder='Product Type (Fabrics, Apparels, Accessories)'
            aria-label='Product type'
            value={form.productType}
            onChange={set('productType')}
            className={inputBase}
          />
        </div>
      </div>

      {/* Row 4: Product Description */}
      <div className='mb-4 sm:mb-[40px]'>
        <textarea
          rows={3}
          placeholder='Product Description (Please share any customization required)'
          aria-label='Product description'
          value={form.productDescription}
          onChange={set('productDescription')}
          className='w-full min-h-[120px] border border-[#b7a88e] p-[10px] bg-white/35 text-sm placeholder:text-black/40 focus:outline-none focus:border-clay transition resize-none'
        />
      </div>

      {/* Row 5: Quantity + Delivery Date */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-4 mb-4 sm:mb-[40px]'>
        <div className='mb-4 sm:mb-0'>
          <div className='flex items-stretch'>
            <span className='w-[45px] h-[39px] flex items-center justify-center bg-[#b7a88e] shrink-0'>
              <span aria-hidden='true' className='material-symbols-outlined text-sm text-white'>weight</span>
            </span>
            <input
              type='number'
              placeholder='Quantity required'
              aria-label='Quantity required'
              value={form.quantity}
              onChange={set('quantity')}
              min={1}
              className={inputBase}
            />
          </div>
        </div>
        <div>
          <div className='flex items-stretch'>
            <span className='w-[45px] h-[39px] flex items-center justify-center bg-[#b7a88e] shrink-0'>
              <span aria-hidden='true' className='material-symbols-outlined text-sm text-white'>calendar_month</span>
            </span>
            <input
              type='date'
              placeholder='Required delivery date'
              aria-label='Required delivery date'
              value={form.deliveryDate}
              onChange={set('deliveryDate')}
              className={inputBase}
            />
          </div>
        </div>
      </div>

      {/* Row 6: Phone + Country */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-4 mb-4 sm:mb-[40px]'>
        <div className='mb-4 sm:mb-0'>
          <div className='flex items-stretch'>
            <span className='w-[45px] h-[39px] flex items-center justify-center bg-[#b7a88e] shrink-0'>
              <span aria-hidden='true' className='material-symbols-outlined text-sm text-white'>phone</span>
            </span>
            <input
              type='tel'
              placeholder='Phone *'
              aria-label='Phone'
              value={form.phone}
              onChange={set('phone')}
              onKeyPress={onPhoneKeyPress}
              required
              aria-required='true'
              autoComplete='tel'
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'cf-phone-error' : undefined}
              className={inputBase + (errors.phone ? ' border-red-400' : '')}
            />
          </div>
          {errors.phone && <p id='cf-phone-error' className='text-xs text-red-500 mt-1'>{errors.phone}</p>}
        </div>
        <div>
          <div className='flex items-stretch'>
            <span className='w-[45px] h-[39px] flex items-center justify-center bg-[#b7a88e] shrink-0'>
              <span aria-hidden='true' className='material-symbols-outlined text-sm text-white'>globe_asia</span>
            </span>
            <select
              aria-label='Country'
              value={form.country}
              onChange={set('country')}
              required
              aria-required='true'
              autoComplete='country-name'
              aria-invalid={!!errors.country}
              aria-describedby={errors.country ? 'cf-country-error' : undefined}
              className={inputBase + ' cursor-pointer' + (errors.country ? ' border-red-400' : '')}
            >
              <option value=''>Country *</option>
              {COUNTRIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {errors.country && <p id='cf-country-error' className='text-xs text-red-500 mt-1'>{errors.country}</p>}
        </div>
      </div>

      {/* Image Upload Dropzone */}
      <div className='mb-[40px]'>
        <p className='text-xs text-[#b7a88e] font-medium uppercase tracking-wide mb-2'>
          Attach image of the product
        </p>
        <div
          className={'relative border-2 border-dashed rounded p-6 text-center transition cursor-pointer ' +
            (dragActive ? 'border-clay bg-clay/5' : 'border-[#b7a88e] bg-white/50 hover:bg-[#b7a88e]/5')}
          onDragOver={e => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role='button'
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
          aria-label='Upload product images'
        >
          <input
            ref={fileInputRef}
            type='file'
            multiple
            accept='.jpeg,.jpg,.png,.svg,.webp'
            className='hidden'
            onChange={e => addFiles(e.target.files)}
          />
          <span aria-hidden='true' className='material-symbols-outlined text-3xl text-[#b7a88e] mb-2 block'>upload</span>
          <p className='text-sm text-black/50'>
            Drag &amp; drop images here, or click to browse
          </p>
          <p className='text-xs text-black/30 mt-1'>Accepts jpeg, jpg, png, svg, webp</p>
        </div>
        {errors.files && <p className='text-xs text-red-500 mt-1'>{errors.files}</p>}
        {files.length > 0 && (
          <ul className='mt-2 space-y-1'>
            {files.map((f, i) => (
              <li key={i} className='flex items-center gap-2 text-xs text-[#b7a88e] font-medium'>
                <span aria-hidden='true' className='material-symbols-outlined text-sm'>image</span>
                <span className='truncate max-w-[200px]'>{f.name}</span>
                <button
                  type='button'
                  onClick={() => removeFile(i)}
                  className='ml-auto text-red-400 hover:text-red-600 transition'
                  aria-label='Remove file'
                >
                  <span aria-hidden='true' className='material-symbols-outlined text-sm'>close</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* reCAPTCHA stub */}
      <div className='mb-[30px] flex justify-center'>
        <div className='border border-[#b7a88e] rounded px-4 py-3 flex items-center gap-3 bg-[#f9f9f9] w-[300px]'>
          <input type='checkbox' className='accent-clay w-5 h-5' disabled aria-label='reCAPTCHA placeholder' />
          <span className='text-sm text-black/50 select-none'>I&apos;m not a robot</span>
          <div className='ml-auto text-right'>
            <div className='text-[10px] text-black/30 leading-tight'>reCAPTCHA</div>
            <div className='text-[9px] text-black/20 leading-tight'>Privacy &middot; Terms</div>
          </div>
        </div>
      </div>

      {/* Honeypot -- visually hidden, a real visitor never fills this. Bots
          that auto-fill every input trip it; the submit then silently
          no-ops server-side (see app/api/contact/route.ts). */}
      <input
        ref={honeypotRef}
        type='text'
        name='hp'
        tabIndex={-1}
        autoComplete='off'
        aria-hidden='true'
        className='absolute -left-[9999px] w-px h-px opacity-0'
      />

      {status === 'error' && (
        <p className='text-sm text-red-500 mb-4'>{serverMsg}</p>
      )}

      <button
        type='submit'
        disabled={status === 'loading'}
        className='w-full max-w-[500px] block mx-auto py-[10px] px-4 bg-[#8b7961] text-white text-sm font-medium tracking-wide uppercase hover:opacity-90 disabled:opacity-50 transition mb-[50px]'
      >
        {status === 'loading' ? 'Submitting…' : 'Submit Request'}
      </button>
    </form>
  );
}
