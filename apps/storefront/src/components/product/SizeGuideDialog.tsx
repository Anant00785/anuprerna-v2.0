'use client';

import { useMemo, useState } from 'react';
import Img from '@/components/ui/Img';
import type { SizeProfile } from './types';

interface SizeGuideDialogProps {
  open: boolean;
  onClose: () => void;
  sizeProfile: SizeProfile;
  productGroup: 'finished' | 'fabric';
}

// Port of ProductSizeGuideDialogComponent. For finished products it builds a
// measurement table keyed by guide name (e.g. Width / Height) across all sizes,
// with an Inches/Centimeters toggle. Image on the right.
export default function SizeGuideDialog({ open, onClose, sizeProfile, productGroup }: SizeGuideDialogProps) {
  const [isCm, setIsCm] = useState(false);

  // guideMap: guide name -> values (one per size option, ascending) — mirrors source.
  const rows = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const g of sizeProfile.sizeProfileGuideList ?? []) {
      const arr = map.get(g.guide) ?? [];
      arr.push(g.value);
      arr.sort((a, b) => a - b);
      map.set(g.guide, arr);
    }
    return Array.from(map.entries()).map(([label, guideNumber]) => ({ label, guideNumber }));
  }, [sizeProfile]);

  const sizes = sizeProfile.sizeProfileOptionList ?? [];

  if (!open) return null;

  const conv = (n: number) => (isCm ? (n * 2.54).toFixed(0) : n.toFixed(0));

  return (
    <div className='fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4' onClick={onClose}>
      <div
        className='relative w-full max-w-[900px] max-h-[90vh] overflow-y-auto rounded-xl bg-white p-5 md:p-7'
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label='Close'
          className='absolute right-4 top-4 grid h-8 w-8 place-items-center rounded bg-clay text-white'
        >
          <span className='material-symbols-outlined text-[18px]'>close</span>
        </button>

        <h2 className='mb-4 text-center text-lg md:text-2xl font-semibold text-black'>
          {productGroup === 'finished' ? 'Size' : 'Pantone'} Guide
        </h2>

        {sizeProfile.disclaimer && (
          <div className='mb-4 flex items-start gap-2 rounded-lg bg-cream p-3 text-xs text-black/70'>
            <span className='material-symbols-outlined text-[18px] text-clay'>error</span>
            <p className='whitespace-pre-line'>{sizeProfile.disclaimer}</p>
          </div>
        )}

        <div className='flex flex-col lg:flex-row items-start justify-between gap-4'>
          {productGroup === 'finished' && rows.length > 0 && (
            <div className='w-full'>
              <div className='mb-3 flex items-center justify-between'>
                <h3 className='font-semibold text-black'>Product Measurements</h3>
                <label className='flex items-center gap-2 text-sm'>
                  <span className={isCm ? 'text-black/40' : 'text-black'}>Inches</span>
                  <button
                    type='button'
                    role='switch'
                    aria-checked={isCm}
                    onClick={() => setIsCm((v) => !v)}
                    className={'relative h-5 w-9 rounded-full transition-colors ' + (isCm ? 'bg-clay' : 'bg-bark/30')}
                  >
                    <span className={'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ' + (isCm ? 'left-[18px]' : 'left-0.5')} />
                  </button>
                  <span className={isCm ? 'text-black' : 'text-black/40'}>Centimeters</span>
                </label>
              </div>
              <table className='w-full border-b border-sand text-sm'>
                <tbody>
                  <tr>
                    <th className='bg-cream p-1.5 text-center font-medium'>Size</th>
                    {sizes.map((s) => (
                      <th key={s.id} className='bg-cream p-1.5 text-center font-medium'>{s.label}</th>
                    ))}
                  </tr>
                  {rows.map((r) => (
                    <tr key={r.label}>
                      <td className='bg-cream p-1 text-center capitalize'>{r.label.toLowerCase()}</td>
                      {r.guideNumber.map((n, i) => (
                        <td key={i} className='p-1 text-center'>{conv(n)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {sizeProfile.image && (
            <div className='relative w-full lg:w-[320px] aspect-square shrink-0'>
              <Img src={sizeProfile.image} alt={sizeProfile.displayName || 'Size guide'} fill sizes='320px' className='object-contain' />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
