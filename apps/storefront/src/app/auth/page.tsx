import { Suspense } from 'react';
import AuthShell from '@/components/auth/AuthShell';

export const metadata = { title: 'Sign In / Create Account — Anuprerna' };

// /auth — combined login + sign-up page (Wave 4: functional).
// AuthShell is 'use client'; we wrap in Suspense because it calls useSearchParams().
export default function AuthPage() {
  return (
    <Suspense>
      <AuthShell />
    </Suspense>
  );
}
