'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyFeedbackOrderFeedbackRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/manage-feedback');
  }, [router]);

  return null;
}
