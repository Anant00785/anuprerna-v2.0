'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyManageReviewRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/review');
  }, [router]);

  return null;
}
