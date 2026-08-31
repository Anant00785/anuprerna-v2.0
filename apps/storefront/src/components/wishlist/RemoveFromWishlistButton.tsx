'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Live wishlist-remove control. Posts the product SKU to /api/profile/wishlist/remove
// (which reads the current CSV, drops this SKU, and PUTs the remainder to the native
// /manage/wishlist route), then refreshes the server-rendered wishlist. Keeps the
// exact aria-label/markup the page shipped with so nothing else shifts.
export default function RemoveFromWishlistButton({ sku }: { sku: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);

  const remove = async () => {
    if (busy || gone || !sku) return;
    setBusy(true);
    try {
      const res = await fetch('/api/profile/wishlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku }),
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setGone(true);
        try { window.dispatchEvent(new CustomEvent('anuprerna:wishlist-updated')); } catch {}
        router.refresh();
      } else {
        setBusy(false);
      }
    } catch {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={remove}
      disabled={busy || gone || !sku}
      title="Remove from wishlist"
      aria-label="Remove from wishlist"
      className={
        'flex justify-center items-center top-2 right-2 absolute z-10 border border-white shadow-lg rounded-full bg-white text-black p-1 md:p-1.5 transition ' +
        (busy || gone ? 'opacity-50 cursor-wait' : 'hover:bg-red-50 hover:text-red-600')
      }
    >
      <span className="material-symbols-outlined text-[16px] md:text-[18px]">close</span>
    </button>
  );
}
