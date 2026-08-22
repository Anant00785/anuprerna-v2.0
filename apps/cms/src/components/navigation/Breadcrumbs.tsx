'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const segments = pathname.split('/').filter(Boolean);

  const formatSegment = (segment: string) => {
    return segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="wv-breadcrumb flex items-center gap-2">
      <Link href="/dashboard" className="wv-bc-home">
        <Home className="w-4 h-4" />
      </Link>
      {segments.map((segment, index) => {
        const url = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;

        return (
          <React.Fragment key={index}>
            <span className="wv-bc-sep">/</span>
            {isLast ? (
              <span className="bg-[#383b63] text-white px-2.5 py-1 rounded text-xs font-semibold tracking-wide">
                {formatSegment(segment)}
              </span>
            ) : (
              <Link href={url} className="wv-bc-segment text-slate-600 hover:text-slate-900">
                {formatSegment(segment)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
