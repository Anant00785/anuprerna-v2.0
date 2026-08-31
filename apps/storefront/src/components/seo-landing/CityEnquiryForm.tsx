'use client';

import { useState, FormEvent } from 'react';

interface CityEnquiryFormProps {
  city: string;
}

interface FormState {
  fullName: string;
  companyname: string;
  email: string;
  phnumber: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const INIT: FormState = { fullName: '', companyname: '', email: '', phnumber: '', notes: '' };

export default function CityEnquiryForm({ city }: CityEnquiryFormProps) {
  const [form, setForm] = useState<FormState>(INIT);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.fullName.trim()) errs.fullName = 'Name is required.';
    if (!form.companyname.trim()) errs.companyname = 'Company is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address.';
    if (!form.phnumber.trim() || form.phnumber.trim().length < 7)
      errs.phnumber = 'Enter a valid phone number.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    // DEMO MODE — enquiry NOT sent (preview demo). No network POST to Loom or any endpoint.
    // Simulate a successful submission after a short delay.
    setTimeout(() => {
      setStatus('success');
      setForm(INIT);
    }, 600);
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span aria-hidden="true" className="material-symbols-outlined text-5xl text-[#2d3748] mb-4">
          check_circle
        </span>
        <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2">Thank you!</h3>
        <p className="text-gray-600 max-w-md">
          Your enquiry has been received. Our team will get back to you within 1-2 business days
          about fabric wholesale in {city}.
        </p>
        <button
          type="button"
          className="mt-6 px-6 py-2 text-sm border border-[#2d3748] text-[#2d3748] rounded-full hover:bg-[#2d3748] hover:text-white transition-colors"
          onClick={() => setStatus('idle')}
        >
          Submit another enquiry
        </button>
      </div>
    );
  }

  const inputBase =
    'w-full px-4 py-3 border border-gray-300 rounded focus:border-[#2d3748] focus:outline-none focus:ring-1 focus:ring-[#2d3748]';

  return (
    <form id="contact" onSubmit={onSubmit} noValidate className="space-y-6 text-left">
      <div>
        <label htmlFor="enq-fullName" className="block text-gray-700 mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="enq-fullName"
          name="fullName"
          placeholder="Your name"
          value={form.fullName}
          onChange={set('fullName')}
          required
          aria-required="true"
          autoComplete="name"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? 'enq-fullName-error' : undefined}
          className={inputBase + (errors.fullName ? ' border-red-400' : '')}
        />
        {errors.fullName && <p id="enq-fullName-error" className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
      </div>

      <div>
        <label htmlFor="enq-company" className="block text-gray-700 mb-2">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="enq-company"
          name="companyname"
          placeholder="Your company"
          value={form.companyname}
          onChange={set('companyname')}
          required
          aria-required="true"
          autoComplete="organization"
          aria-invalid={!!errors.companyname}
          aria-describedby={errors.companyname ? 'enq-company-error' : undefined}
          className={inputBase + (errors.companyname ? ' border-red-400' : '')}
        />
        {errors.companyname && <p id="enq-company-error" className="text-xs text-red-500 mt-1">{errors.companyname}</p>}
      </div>

      <div>
        <label htmlFor="enq-email" className="block text-gray-700 mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="enq-email"
          name="email"
          placeholder="your.email@company.com"
          value={form.email}
          onChange={set('email')}
          required
          aria-required="true"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'enq-email-error' : undefined}
          className={inputBase + (errors.email ? ' border-red-400' : '')}
        />
        {errors.email && <p id="enq-email-error" className="text-xs text-red-500 mt-1">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="enq-phone" className="block text-gray-700 mb-2">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="enq-phone"
          name="phnumber"
          placeholder="(123) 456-7890"
          value={form.phnumber}
          onChange={set('phnumber')}
          required
          aria-required="true"
          autoComplete="tel"
          aria-invalid={!!errors.phnumber}
          aria-describedby={errors.phnumber ? 'enq-phone-error' : undefined}
          className={inputBase + (errors.phnumber ? ' border-red-400' : '')}
        />
        {errors.phnumber && <p id="enq-phone-error" className="text-xs text-red-500 mt-1">{errors.phnumber}</p>}
      </div>

      <div>
        <label htmlFor="enq-message" className="block text-gray-700 mb-2">
          Tell us about your needs
        </label>
        <textarea
          id="enq-message"
          name="notes"
          rows={4}
          placeholder="Describe your project, quantities needed, and any specific requirements"
          value={form.notes}
          onChange={set('notes')}
          className={inputBase + ' resize-vertical'}
        />
      </div>

      <p className="text-gray-500 text-xs">
        Note: this is a preview demo — your message will not be sent.
      </p>

      <div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="md:w-[50%] w-full bg-[#2d3748] text-white py-3 rounded-lg whitespace-nowrap hover:bg-opacity-90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Submitting…' : 'Submit Inquiry'}
        </button>
      </div>
    </form>
  );
}
