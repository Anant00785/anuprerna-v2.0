'use client';

import React from 'react';

/**
 * Shared loading / error wrapper for the profile pages.
 *
 * These pages used to seed themselves from `lib/profile/dummy-data.ts` and only
 * overwrite it when a live call returned a non-empty result, so a failed request —
 * or an account with no orders — rendered invented data indistinguishable from the
 * real thing. Failing loudly is the point of this component: never substitute
 * plausible-looking data for an answer we do not have.
 */
export function ProfileDataState({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="w-full space-y-4 animate-pulse" role="status" aria-label="Loading">
        <div className="h-8 w-1/3 bg-gray-100 rounded" />
        <div className="h-40 bg-gray-100 rounded-xl" />
        <div className="h-40 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-semibold text-red-800">We couldn&apos;t load this page.</p>
        <p className="mt-1 text-xs text-red-700 break-words">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded border-2 border-[#8E7862] px-4 py-1.5 text-sm font-semibold text-[#8E7862] transition-colors hover:bg-[#fbf4e8]"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}

/** Honest empty state — used where we really did get an answer and it was "none". */
export function ProfileEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-[#efeee9] p-8 text-center text-sm font-semibold text-gray-600">
      {message}
    </div>
  );
}
