'use client';

import { useEffect, useState } from 'react';
import type { CatalogueFilters, CatalogueFacets, FilterState, RangeSelection } from './types';
import { facetKey } from './filter-sort';

interface FilterSidebarProps {
  filters: CatalogueFilters;
  /** Amazon-style per-option result counts (slug -> count) for each dimension. */
  facets: CatalogueFacets;
  state: FilterState;
  onChange: (next: FilterState) => void;
  onClear: () => void;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// ---------------------------------------------------------------------------
// Collapsible section with a +/- header (live filter-control header: remove/add).
// `defaultOpen` controls the initial expanded state.
// FIX-6: Title-Case headers, near-black 18px semibold (not uppercase brown).
// ---------------------------------------------------------------------------
function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className='border-b border-gray-200 py-4'>
      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        className='flex w-full items-center justify-between text-lg font-semibold text-gray-900'
      >
        {title}
        <span className='material-symbols-outlined text-[18px] leading-none text-gray-500'>{open ? 'remove' : 'add'}</span>
      </button>
      {open && <div className='mt-3 space-y-2'>{children}</div>}
    </div>
  );
}

// FIX-14: checkbox option labels UPPERCASE (matching live .dd_tri text-transform:uppercase).
// FIX-15: checked fill #948467 (clay-ish brown from live source, not #7D5B20).
function CheckRow({
  label,
  checked,
  onToggle,
  swatch,
  icon,
  indent = false,
  emphasize = false,
  count,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  swatch?: string;
  /** Small thumbnail (subCategoryFeaturedImage from finished/apparel nav). */
  icon?: string;
  indent?: boolean;
  emphasize?: boolean;
  /** Amazon-style result count shown as a trailing badge. undefined => hidden. */
  count?: number;
  /** Zero-result option: grayed out + non-interactive (kept visible so the
   *  user can see it exists). Selected options are NEVER disabled. */
  disabled?: boolean;
}) {
  return (
    <label
      className={
        'flex items-center gap-2 text-sm select-none ' +
        (disabled ? 'cursor-not-allowed opacity-40 ' : 'cursor-pointer ') +
        (indent ? 'ml-5 ' : '') +
        (emphasize ? 'font-medium text-[#9c8a6c] ' : 'text-gray-700 ')
      }
      title={disabled ? 'No products match this option with the current filters' : undefined}
    >
      <input
        type='checkbox'
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className='h-3.5 w-3.5'
        style={{ accentColor: '#948467' }}
      />
      {swatch && (
        <span
          className='h-4 w-4 rounded-full border border-black shrink-0'
          style={{ backgroundColor: swatch }}
        />
      )}
      {icon && !swatch && (
        <img
          src={icon}
          alt=""
          width={18}
          height={18}
          className="h-[18px] w-[18px] rounded object-cover shrink-0 border border-gray-200"
        />
      )}
      <span className='truncate capitalize text-sm'>{label}</span>
      {typeof count === 'number' && (
        <span className='ml-auto shrink-0 text-xs tabular-nums text-gray-400'>{count}</span>
      )}
    </label>
  );
}

// PLP-11: "Show More / Show Less" expander button.
function ShowMore({ full, onClick }: { full: boolean; onClick: () => void }) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='w-full rounded border-2 border-[#8E7862]/60 text-[#8E7862] py-1 px-3 hover:border-[#6c5b48] transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm mt-1'
    >
      {full ? 'Show Less' : 'Show More'}
      <span className='material-symbols-outlined text-[16px]'>{full ? 'expand_less' : 'expand_more'}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Range slider thumb + track styles injected via a <style> block.
// FIX-1+2: brown thumb #795548/20px round; filled track #8e7860.
// Scoped to .ap-range class so we don't touch globals.css.
// ---------------------------------------------------------------------------
const rangeSliderStyles = `
.ap-range {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  pointer-events: none;
}
.ap-range::-webkit-slider-runnable-track {
  height: 6px;
  background: transparent;
  border-radius: 4px;
}
.ap-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #795548;
  border: 2px solid #ffffff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
  pointer-events: auto;
  cursor: pointer;
  margin-top: -7px;
}
.ap-range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #795548;
  border: 2px solid #ffffff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.25);
  pointer-events: auto;
  cursor: pointer;
}
.ap-range::-moz-range-track {
  height: 6px;
  background: transparent;
  border-radius: 4px;
}
`;

// ---------------------------------------------------------------------------
// PLP-03/04/05: range control — min/max number inputs + dual-thumb slider +
// reset + Apply (live filter-range-control).
// FIX-7: range number-input border #8e7860 brown (not grey).
// FIX-17: reset icon colour #8e7860 brown.
// ---------------------------------------------------------------------------
function RangeControl({
  bound,
  value,
  onApply,
}: {
  bound: { min: number; max: number };
  value: RangeSelection;
  onApply: (next: RangeSelection) => void;
}) {
  const committedMin = value.min ?? bound.min;
  const committedMax = value.max ?? bound.max;
  const [lo, setLo] = useState(committedMin);
  const [hi, setHi] = useState(committedMax);

  useEffect(() => {
    setLo(value.min ?? bound.min);
    setHi(value.max ?? bound.max);
  }, [value.min, value.max, bound.min, bound.max]);

  const dirty = lo !== committedMin || hi !== committedMax;
  const span = Math.max(1, bound.max - bound.min);
  const loPct = ((lo - bound.min) / span) * 100;
  const hiPct = ((hi - bound.min) / span) * 100;

  const clamp = (v: number) => Math.min(bound.max, Math.max(bound.min, v));

  const apply = () => {
    onApply({
      min: lo <= bound.min ? null : lo,
      max: hi >= bound.max ? null : hi,
    });
  };

  const reset = () => {
    setLo(bound.min);
    setHi(bound.max);
    onApply({ min: null, max: null });
  };

  return (
    <div className='space-y-3'>
      <style>{rangeSliderStyles}</style>
      <div className='flex items-center gap-2'>
        <input
          type='number'
          name='min'
          value={lo}
          min={bound.min}
          max={hi}
          onChange={(e) => setLo(clamp(Number(e.target.value)))}
          className='w-20 rounded px-2 py-1 text-sm text-gray-900'
          style={{ border: '1px solid #8e7860' }}
        />
        <span className='text-bark text-xs'>-</span>
        <input
          type='number'
          name='max'
          value={hi}
          min={lo}
          max={bound.max}
          onChange={(e) => setHi(clamp(Number(e.target.value)))}
          className='w-20 rounded px-2 py-1 text-sm text-gray-900'
          style={{ border: '1px solid #8e7860' }}
        />
        <button
          type='button'
          aria-label='Reset range'
          onClick={reset}
          className='ml-auto hover:opacity-70'
          style={{ color: '#8e7860' }}
        >
          <span className='material-symbols-outlined text-[18px]'>restart_alt</span>
        </button>
      </div>

      {/* Dual-thumb slider. FIX-2: filled track bg #8e7860, height 6px, rounded. */}
      <div className='relative h-6'>
        <div className='absolute top-1/2 left-0 right-0 h-[6px] -translate-y-1/2 rounded-full bg-gray-200' />
        <div
          className='absolute top-1/2 h-[6px] -translate-y-1/2 rounded-full'
          style={{ left: loPct + '%', right: 100 - hiPct + '%', backgroundColor: '#8e7860' }}
        />
        <input
          type='range'
          min={bound.min}
          max={bound.max}
          value={lo}
          onChange={(e) => setLo(Math.min(Number(e.target.value), hi))}
          className='ap-range absolute inset-0 w-full'
          aria-label='Minimum'
        />
        <input
          type='range'
          min={bound.min}
          max={bound.max}
          value={hi}
          onChange={(e) => setHi(Math.max(Number(e.target.value), lo))}
          className='ap-range absolute inset-0 w-full'
          aria-label='Maximum'
        />
      </div>

      {dirty && (
        <button
          type='button'
          onClick={apply}
          className='flex items-center gap-1 rounded bg-clay text-white px-2 py-1 text-sm'
        >
          <span className='material-symbols-outlined text-[16px]'>check_circle</span>
          Apply Change
        </button>
      )}
    </div>
  );
}

// First-N + Show More wrapper for a flat checkbox group.
function LimitedGroup<T>({
  items,
  limit,
  render,
}: {
  items: T[];
  limit: number;
  render: (item: T) => React.ReactNode;
}) {
  const [full, setFull] = useState(false);
  const shown = full ? items : items.slice(0, limit);
  return (
    <>
      {shown.map((it) => render(it))}
      {items.length > limit && <ShowMore full={full} onClick={() => setFull((f) => !f)} />}
    </>
  );
}

export default function FilterSidebar({ filters, facets, state, onChange, onClear }: FilterSidebarProps) {
  const set = (patch: Partial<FilterState>) => onChange({ ...state, ...patch });

  // Per-option result counts (Amazon-style). Missing key => 0.
  // Guarded against a missing/null option name (e.g. a craft sub-category
  // without a name) — those otherwise reach facetKey()'s toLowerCase() call.
  const craftCount = (sub: string) => (sub ? facets.craft[facetKey(sub)] ?? 0 : 0);
  const colorCount = (name: string) => facets.color[facetKey(name)] ?? 0;
  const materialCount = (name: string) => facets.material[facetKey(name)] ?? 0;
  const patternCount = (name: string) => facets.pattern[facetKey(name)] ?? 0;

  const isFinished = filters.segmentLabel === 'Category';

  const [craftFull, setCraftFull] = useState(false);
  const craftGroups = filters.segments;
  const shownGroups = craftFull ? craftGroups : craftGroups.slice(0, 2);

  const activeCount =
    state.craft.length +
    state.color.length +
    state.material.length +
    state.pattern.length +
    (state.stockOnly ? 1 : 0) +
    (state.price.min != null || state.price.max != null ? 1 : 0) +
    (state.gsm.min != null || state.gsm.max != null ? 1 : 0) +
    (state.availability.min != null || state.availability.max != null ? 1 : 0);

  return (
    <div className='text-gray-800'>
      {/* PLP-09: in-stock toggle — FIX toggle track colors from live filter-toggle-control.scss */}
      <div className='flex items-center justify-between pb-4 border-b border-gray-200'>
        <span className='text-xs uppercase tracking-widest text-bark font-medium'>Show in-stock only</span>
        <button
          type='button'
          role='switch'
          aria-checked={state.stockOnly}
          aria-label='Show in-stock only'
          onClick={() => set({ stockOnly: !state.stockOnly })}
          className='relative rounded-full transition-colors'
          style={{
            width: 38,
            height: 22,
            backgroundColor: state.stockOnly ? '#8e7860' : '#d4d4d4',
          }}
        >
          <span
            className='absolute top-[3px] rounded-full transition-transform'
            style={{
              width: 16,
              height: 15,
              backgroundColor: '#efeee9',
              left: state.stockOnly ? 19 : 3,
            }}
          />
        </button>
      </div>

      {activeCount > 0 && (
        <button
          type='button'
          onClick={onClear}
          className='mt-3 text-xs text-clay underline underline-offset-2'
        >
          Clear all ({activeCount})
        </button>
      )}

      {/* FIX-6: Section renders title as Title-Case (segmentLabel = 'Craft' or 'Category') */}
      <Section title={filters.segmentLabel}>
        {craftGroups.length === 0 && <p className='text-xs text-gray-400'>No options</p>}

        {isFinished
          ? shownGroups.map((g) => {
              const subs = (g.optionList ?? []).filter((s) => s != null);
              const allSubsActive = subs.length > 0 && subs.every((s) => state.craft.includes(s.subCategoryName));
              const toggleParent = () => {
                const names = subs.map((s) => s.subCategoryName);
                const next = allSubsActive
                  ? state.craft.filter((c) => !names.includes(c))
                  : Array.from(new Set([...state.craft, ...names]));
                set({ craft: next });
              };
              return (
                <div key={g.id} className="space-y-2">
                  <CheckRow
                    label={g.segmentCategoryName}
                    checked={allSubsActive}
                    onToggle={toggleParent}
                    emphasize
                    count={subs.reduce((acc, s) => acc + craftCount(s.subCategoryName), 0)}
                    disabled={
                      subs.reduce((acc, s) => acc + craftCount(s.subCategoryName), 0) === 0 &&
                      !subs.some((s) => state.craft.includes(s.subCategoryName))
                    }
                  />
                  {subs.map((s) => (
                    <CheckRow
                      key={s.id}
                      label={s.subCategoryName}
                      indent
                      icon={s.icon}
                      checked={state.craft.includes(s.subCategoryName)}
                      onToggle={() => set({ craft: toggle(state.craft, s.subCategoryName) })}
                      count={craftCount(s.subCategoryName)}
                      disabled={craftCount(s.subCategoryName) === 0 && !state.craft.includes(s.subCategoryName)}
                    />
                  ))}
                </div>
              );
            })
          : shownGroups.map((g) => {
              const subs = (g.optionList ?? []).filter((s) => s != null);
              const allSubsActive = subs.length > 0 && subs.every((s) => state.craft.includes(s.subCategoryName));
              const toggleParent = () => {
                const names = subs.map((s) => s.subCategoryName);
                const next = allSubsActive
                  ? state.craft.filter((c) => !names.includes(c))
                  : Array.from(new Set([...state.craft, ...names]));
                set({ craft: next });
              };
              return (
                <div key={g.id} className='space-y-2'>
                  <CheckRow
                    label={g.segmentCategoryName}
                    checked={allSubsActive}
                    onToggle={toggleParent}
                    emphasize
                    count={subs.reduce((acc, s) => acc + craftCount(s.subCategoryName), 0)}
                    disabled={
                      subs.reduce((acc, s) => acc + craftCount(s.subCategoryName), 0) === 0 &&
                      !subs.some((s) => state.craft.includes(s.subCategoryName))
                    }
                  />
                  {subs.map((s) => (
                    <CheckRow
                      key={s.id}
                      label={s.subCategoryName}
                      indent
                      checked={state.craft.includes(s.subCategoryName)}
                      onToggle={() => set({ craft: toggle(state.craft, s.subCategoryName) })}
                      count={craftCount(s.subCategoryName)}
                      disabled={craftCount(s.subCategoryName) === 0 && !state.craft.includes(s.subCategoryName)}
                    />
                  ))}
                </div>
              );
            })}

        {craftGroups.length > 2 && (
          <ShowMore full={craftFull} onClick={() => setCraftFull((f) => !f)} />
        )}
      </Section>

      {filters.colors.length > 0 && (
        <Section title='Color'>
          <LimitedGroup
            items={filters.colors}
            limit={5}
            render={(c) => (
              <CheckRow
                key={c.id}
                label={c.name}
                swatch={c.hex}
                checked={state.color.includes(c.name)}
                onToggle={() => set({ color: toggle(state.color, c.name) })}
                count={colorCount(c.name)}
                disabled={colorCount(c.name) === 0 && !state.color.includes(c.name)}
              />
            )}
          />
        </Section>
      )}

      {filters.materials.length > 0 && (
        <Section title='Material' defaultOpen={true}>
          <LimitedGroup
            items={filters.materials}
            limit={5}
            render={(m) => (
              <CheckRow
                key={m.id}
                label={m.name}
                checked={state.material.includes(m.name)}
                onToggle={() => set({ material: toggle(state.material, m.name) })}
                count={materialCount(m.name)}
                disabled={materialCount(m.name) === 0 && !state.material.includes(m.name)}
              />
            )}
          />
        </Section>
      )}

      {filters.patterns.length > 0 && (
        <Section title='Pattern' defaultOpen={true}>
          <LimitedGroup
            items={filters.patterns}
            limit={5}
            render={(p) => (
              <CheckRow
                key={p.id}
                label={p.name}
                checked={state.pattern.includes(p.name)}
                onToggle={() => set({ pattern: toggle(state.pattern, p.name) })}
                count={patternCount(p.name)}
                disabled={patternCount(p.name) === 0 && !state.pattern.includes(p.name)}
              />
            )}
          />
        </Section>
      )}

      {filters.priceRange.max > filters.priceRange.min && (
        <Section title='Price' defaultOpen={true}>
          <RangeControl
            bound={filters.priceRange}
            value={state.price}
            onApply={(price) => set({ price })}
          />
        </Section>
      )}

      {filters.gsmRange.max > filters.gsmRange.min && (
        <Section title='GSM' defaultOpen={true}>
          <RangeControl
            bound={filters.gsmRange}
            value={state.gsm}
            onApply={(gsm) => set({ gsm })}
          />
        </Section>
      )}

      {filters.availabilityRange.max > filters.availabilityRange.min && (
        <Section title='Availability' defaultOpen={true}>
          <RangeControl
            bound={filters.availabilityRange}
            value={state.availability}
            onApply={(availability) => set({ availability })}
          />
        </Section>
      )}
    </div>
  );
}
