'use client';

import { useState } from 'react';
import type { FaqQuestion } from './loom';

// ---------------------------------------------------------------------------
// FaqAccordion — collapsible FAQ rows (client component)
// ---------------------------------------------------------------------------

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
      className={
        'w-4 h-4 flex-shrink-0 transition-transform duration-200 ' +
        (open ? 'rotate-90' : 'rotate-0')
      }
    >
      <polyline points='9 18 15 12 9 6' />
    </svg>
  );
}

function FaqRow({ item }: { item: FaqQuestion }) {
  const [open, setOpen] = useState(false);

  return (
    <div className='border-b border-black/10 last:border-b-0'>
      <button
        onClick={() => setOpen((o) => !o)}
        className='flex w-full items-center gap-3 py-4 text-left group'
        aria-expanded={open}
      >
        {/* Green square icon */}
        <span className='w-3 h-3 flex-shrink-0 bg-green-700 rounded-sm' />
        <span className='flex-1 text-sm font-medium text-black group-hover:text-clay transition-colors'>
          {item.question}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className='pb-4 pl-6 text-sm text-black/70 leading-relaxed'>
          {item.answer}
        </div>
      )}
    </div>
  );
}

interface FaqAccordionProps {
  heading?: string;
  questions: FaqQuestion[];
}

export default function FaqAccordion({ heading, questions }: FaqAccordionProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <section className='mt-12 pt-8 border-t border-black/10'>
      {heading && (
        <h2 className='text-xl font-bold text-black mb-6'>{heading}</h2>
      )}
      <div>
        {questions.map((q) => (
          <FaqRow key={q.id} item={q} />
        ))}
      </div>
    </section>
  );
}
