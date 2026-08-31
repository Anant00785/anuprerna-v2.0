import ResendVerificationForm from '@/components/auth/ResendVerificationForm';

export const metadata = { title: 'Verify Your Email — Anuprerna' };

// /auth/email-verification — actionable 'Resend Email Verification Link' form,
// ported from the live Angular verify-email.component (which renders verify-email-form).
// An email input + Resend button that calls /api/auth/resend-verification.
export default function EmailVerificationPage() {
  return (
    <main
      className='min-h-[80vh] flex items-center justify-center px-4 py-16'
      style={{ background: 'radial-gradient(ellipse at top, #f5f2ed 0%, #faf9f7 100%)' }}
    >
      <div className='w-full max-w-md bg-white rounded-2xl shadow-md px-8 py-10 sm:px-10'>
        {/* Brand mark */}
        <div className='flex items-center gap-3 mb-6'>
          <div className='w-9 h-9 rounded-full border border-clay flex items-center justify-center'>
            <span className='text-clay font-semibold text-base leading-none'>A</span>
          </div>
          <span className='text-xs font-medium tracking-[.22em] text-clay uppercase'>Anuprerna</span>
        </div>
        <ResendVerificationForm />
      </div>
    </main>
  );
}
