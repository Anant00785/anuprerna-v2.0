import AuthCard from '@/components/auth/AuthCard';
import EmailVerifyClient from '@/components/auth/EmailVerifyClient';

export const metadata = { title: 'Email Verification — Anuprerna' };

// /auth/email-verification/[token]
// The token is extracted from the URL and passed to the client component
// which calls /api/auth/verify-email on mount. This is a server component
// (no 'use client') — the client component handles all interaction.
export default async function EmailVerificationTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <AuthCard title='Email Verification'>
      <EmailVerifyClient token={token} />
    </AuthCard>
  );
}
