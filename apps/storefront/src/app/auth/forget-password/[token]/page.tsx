import AuthCard from '@/components/auth/AuthCard';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata = { title: 'Reset Password — Anuprerna' };

// /auth/forget-password/[token] — reset password confirmation page.
// The token is the link Loom emails after /auth/forget-password is submitted.
export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <AuthCard
      title='Set New Password'
      subtitle='Enter a new password for your account'
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
