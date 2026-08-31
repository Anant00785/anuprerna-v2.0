import AuthCard from '@/components/auth/AuthCard';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata = { title: 'Forgot Password — Anuprerna' };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title='Forgot Password?'
      subtitle='Enter your email registered with us'
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
