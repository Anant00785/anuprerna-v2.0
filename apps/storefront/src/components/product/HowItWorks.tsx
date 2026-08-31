'use client';

import { useState } from 'react';

interface HowItWorksProps {
  productGroup: 'finished' | 'fabric';
}

const TUTORIAL_BASE = 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/product-tutorial/';

export default function HowItWorks({ productGroup }: HowItWorksProps) {
  const [open, setOpen] = useState(false);
  const slug = productGroup === 'finished' ? 'finished' : 'fabric';
  const url = TUTORIAL_BASE + 'tutorial-' + slug + '-desktop.mp4';
  const poster = TUTORIAL_BASE + 'tutorial-' + slug + '-desktop-thumbail.png';

  return (
    <div className="w-full my-4">
      {/* Subtle non-intrusive banner */}
      <button
        type='button'
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 p-3 bg-sand/30 hover:bg-sand/60 text-clay rounded-md border border-clay/20 transition-colors"
      >
        <span className='material-symbols-outlined text-[20px]'>play_circle</span>
        <span className="text-sm font-medium">See How It Works</span>
      </button>

      {open && (
        <div className='fixed inset-0 z-[200] flex items-center justify-center bg-black/80 px-4' onClick={() => setOpen(false)} role='dialog'>
          <div className='w-full max-w-[800px] overflow-hidden rounded-xl bg-black' onClick={(e) => e.stopPropagation()}>
            <div className='flex items-center justify-between bg-black p-3'>
              <h2 className='text-lg font-medium text-white'>How it Works</h2>
              <button onClick={() => setOpen(false)} className='rounded-full bg-white/20 hover:bg-white/30 p-2 text-white material-symbols-outlined text-sm leading-none'>close</button>
            </div>
            <video
              className='w-full bg-black'
              src={url}
              poster={poster}
              playsInline
              preload='metadata'
              controls
              autoPlay
            />
          </div>
        </div>
      )}
    </div>
  );
}
