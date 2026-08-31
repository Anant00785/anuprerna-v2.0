'use client';
import { useState } from 'react';

interface GuestB2BModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { companyName: string; email: string; name: string }) => Promise<void>;
  productName: string;
  qty: number;
}

export default function GuestB2BModal({ open, onClose, onSubmit, productName, qty }: GuestB2BModalProps) {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({ companyName, email, name: name || companyName });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit inquiry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4' role='dialog'>
      <div className='relative w-full max-w-[400px] rounded-xl bg-white p-6'>
        <button onClick={onClose} className='absolute top-3 right-3 material-symbols-outlined'>close</button>
        <h2 className='text-lg font-bold text-clay mb-2'>Guest Bulk Pre-Order</h2>
        
        {success ? (
          <div className='text-center py-6'>
            <span className='material-symbols-outlined text-green-600 text-4xl mb-2'>check_circle</span>
            <p className='text-clay font-medium'>Inquiry Submitted Successfully!</p>
            <p className='text-sm text-black/60 mt-2'>We have gracefully provisioned your B2B account in the background. Check your email for details.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='flex flex-col gap-4 mt-4'>
            <p className='text-sm text-black/70'>You are requesting {qty} of {productName}. Please provide your details to proceed.</p>
            <div>
              <label className='block text-xs font-medium text-black/60 mb-1'>Full Name</label>
              <input required type='text' value={name} onChange={(e) => setName(e.target.value)} className='w-full border border-sand rounded px-3 py-2 text-sm' />
            </div>
            <div>
              <label className='block text-xs font-medium text-black/60 mb-1'>Company Name</label>
              <input required type='text' value={companyName} onChange={(e) => setCompanyName(e.target.value)} className='w-full border border-sand rounded px-3 py-2 text-sm' />
            </div>
            <div>
              <label className='block text-xs font-medium text-black/60 mb-1'>Email</label>
              <input required type='email' value={email} onChange={(e) => setEmail(e.target.value)} className='w-full border border-sand rounded px-3 py-2 text-sm' />
            </div>
            {error && <p className='text-red-500 text-xs'>{error}</p>}
            <button type='submit' disabled={loading} className='w-full bg-clay text-white rounded py-2 text-sm font-medium'>
              {loading ? 'Submitting...' : 'Submit Inquiry'}
            </button>
            <div className='text-center text-xs mt-2'>
              <a href="#" onClick={(e) => { e.preventDefault(); onClose(); window.dispatchEvent(new CustomEvent('open-login-modal')); }} className='text-clay underline'>Already have an account? Login</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
