'use client';

/**
 * VideoModal — click-to-play thumbnail + modal for CDN video clips.
 *
 * Data strategy: zero video bytes downloaded on page load.
 * - Thumbnail: shows poster <img> + play-button overlay + label.
 * - On click: opens a modal and sets <video src> ONLY at that moment (preload="none").
 * - On close (× / click-outside / Esc): removes src entirely so browser releases the resource.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface VideoModalProps {
  videoSrc: string;
  poster: string;
  label: string;
  alt: string;
  /** Tailwind fill class to size the thumbnail grid cell */
  className?: string;
  priority?: boolean;
}

export default function VideoModal({
  videoSrc,
  poster,
  label,
  alt,
  className = '',
  priority = false,
}: VideoModalProps) {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const openModal = () => setOpen(true);

  const closeModal = useCallback(() => {
    setOpen(false);
    // Unload the video immediately to release network/memory
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, []);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKey);
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, closeModal]);

  // Assign src only when modal opens (lazy — no network hit until click)
  useEffect(() => {
    if (open && videoRef.current && !videoRef.current.src) {
      videoRef.current.src = videoSrc;
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [open, videoSrc]);

  return (
    <>
      {/* Thumbnail tile */}
      <button
        type='button'
        onClick={openModal}
        aria-label={'Play video: ' + label}
        className={'relative w-full h-full rounded-2xl overflow-hidden group cursor-pointer ' + className}
      >
        <Image
          src={poster}
          alt={alt}
          fill
          priority={priority}
          sizes='(max-width: 1280px) 22vw, 280px'
          className='object-cover transition duration-700 group-hover:scale-105'
          unoptimized
        />
        {/* Gradient overlay — same style as big panel */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent' />
        {/* Play button */}
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='flex items-center justify-center w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 group-hover:bg-white/35 transition'>
            <span className='material-symbols-outlined text-white text-[26px] translate-x-0.5'>play_arrow</span>
          </div>
        </div>
        {/* Label strip */}
        <div className='absolute bottom-0 left-0 w-full px-3 pb-2.5 pt-5 flex items-end gap-1'>
          <span className='material-symbols-outlined text-white text-[14px] shrink-0'>movie</span>
          <p className='text-white text-[11px] leading-snug font-medium drop-shadow'>{label}</p>
        </div>
      </button>

      {/* Modal lightbox */}
      {open && (
        <div
          className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm'
          role='dialog'
          aria-modal='true'
          aria-label={'Video: ' + label}
          onClick={closeModal}
        >
          <div
            className='relative w-[92vw] max-w-3xl rounded-2xl overflow-hidden bg-black shadow-2xl'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type='button'
              onClick={closeModal}
              aria-label='Close video'
              className='absolute top-3 right-3 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white transition'
            >
              <span className='material-symbols-outlined text-[20px]'>close</span>
            </button>
            {/* Video — src assigned dynamically on open */}
            <video
              ref={videoRef}
              preload='none'
              controls
              autoPlay
              playsInline
              poster={poster}
              className='w-full aspect-video object-contain bg-black'
            />
            {/* Label bar */}
            <div className='px-4 py-3 bg-[#1a1209] flex items-center gap-2'>
              <span className='material-symbols-outlined text-[#c9a96e] text-[18px]'>movie</span>
              <p className='text-[#fffcf7] text-sm font-medium'>{label}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
