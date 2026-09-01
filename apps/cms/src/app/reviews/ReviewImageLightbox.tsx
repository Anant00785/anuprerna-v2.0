"use client";

/**
 * ReviewImageLightbox — simple gallery modal for a review's productImages
 * (comma-separated URL list). Mirrors live's review-preview-card.component.ts:
 * onViewImages -> ImageViewer over review.productImages.split(',').
 */

import React from "react";
import Image from "next/image";

export function ReviewImageLightbox({
  images,
  onClose,
}: {
  images: string[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col gap-3 overflow-auto rounded-xl bg-white p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: "#1A1714" }}>
            Review photos ({images.length})
          </span>
          <button onClick={onClose} className="text-xl leading-none" style={{ color: "#847D77" }}>
            ×
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative aspect-square overflow-hidden rounded-lg border"
              style={{ borderColor: "#E8E4DE" }}
            >
              <Image src={src} alt={`Review photo ${i + 1}`} fill unoptimized className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
