'use client';

import React from 'react';

export function ProductionWarningBanner() {
  return (
    <div className="pwb" role="alert">
      <span className="pwb__emoji" aria-hidden="true">⚠️</span>
      <span className="pwb__text">
        <strong className="pwb__label">Production database</strong>
        <span className="pwb__divider">·</span>
        You&apos;re running locally against live data — changes here are real.
      </span>
    </div>
  );
}
