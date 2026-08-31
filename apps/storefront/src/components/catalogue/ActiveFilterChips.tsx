'use client';

import type { CatalogueFilters, FilterState } from './types';

interface ActiveFilterChipsProps {
  state: FilterState;
  filters: CatalogueFilters;
  /** Called with the updated FilterState after removing a single filter. */
  onRemove: (next: FilterState) => void;
  /** Called when "Clear all" is clicked. */
  onClearAll: () => void;
}

interface Chip {
  label: string;
  remove: (s: FilterState) => FilterState;
}

/**
 * Renders one chip per active filter (color, material, pattern, craft, range chips,
 * in-stock) plus a "Clear all" button. Matches the live fb-filter-active-controls
 * styling: bg-[#fcf4e8], rounded-lg, small text, close icon.
 */
export default function ActiveFilterChips({ state, filters, onRemove, onClearAll }: ActiveFilterChipsProps) {
  const chips: Chip[] = [];

  // Craft chips
  state.craft.forEach((v) => {
    chips.push({
      label: v,
      remove: (s) => ({ ...s, craft: s.craft.filter((x) => x !== v) }),
    });
  });

  // Color chips — resolve display name from filters
  state.color.forEach((v) => {
    const displayName = filters.colors.find(
      (c) => c.name.toLowerCase() === v.toLowerCase(),
    )?.name ?? v;
    chips.push({
      label: displayName,
      remove: (s) => ({ ...s, color: s.color.filter((x) => x !== v) }),
    });
  });

  // Material chips
  state.material.forEach((v) => {
    const displayName = filters.materials.find(
      (m) => m.name.toLowerCase() === v.toLowerCase(),
    )?.name ?? v;
    chips.push({
      label: displayName,
      remove: (s) => ({ ...s, material: s.material.filter((x) => x !== v) }),
    });
  });

  // Pattern chips
  state.pattern.forEach((v) => {
    const displayName = filters.patterns.find(
      (p) => p.name.toLowerCase() === v.toLowerCase(),
    )?.name ?? v;
    chips.push({
      label: displayName,
      remove: (s) => ({ ...s, pattern: s.pattern.filter((x) => x !== v) }),
    });
  });

  // In-stock chip
  if (state.stockOnly) {
    chips.push({
      label: 'In Stock',
      remove: (s) => ({ ...s, stockOnly: false }),
    });
  }

  // Price range chip
  if (state.price.min != null || state.price.max != null) {
    const lo = state.price.min ?? filters.priceRange.min;
    const hi = state.price.max ?? filters.priceRange.max;
    chips.push({
      label: `Price: ${lo.toLocaleString('en-IN')}–${hi.toLocaleString('en-IN')}`,
      remove: (s) => ({ ...s, price: { min: null, max: null } }),
    });
  }

  // GSM range chip
  if (state.gsm.min != null || state.gsm.max != null) {
    const lo = state.gsm.min ?? filters.gsmRange.min;
    const hi = state.gsm.max ?? filters.gsmRange.max;
    chips.push({
      label: `GSM: ${lo}–${hi}`,
      remove: (s) => ({ ...s, gsm: { min: null, max: null } }),
    });
  }

  // Availability range chip
  if (state.availability.min != null || state.availability.max != null) {
    const lo = state.availability.min ?? filters.availabilityRange.min;
    const hi = state.availability.max ?? filters.availabilityRange.max;
    chips.push({
      label: `Qty: ${lo}–${hi}`,
      remove: (s) => ({ ...s, availability: { min: null, max: null } }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="filter-active-controls flex flex-wrap items-center gap-1.5 mb-4">
      {chips.map((chip, i) => (
        <span
          key={i}
          className="filter-chip inline-flex items-center gap-1 bg-[#fcf4e8] text-[12px] rounded-lg px-2 py-1 border border-[#75787F]/20"
        >
          <span className="lowercase">{chip.label}</span>
          <button
            type="button"
            aria-label={`Remove ${chip.label} filter`}
            onClick={() => onRemove(chip.remove(state))}
            className="material-symbols-outlined text-[14px] leading-none text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            close
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="inline-flex items-center gap-1 bg-white text-[12px] rounded-lg px-2 py-1 border border-[#75787F]/20 cursor-pointer hover:bg-[#fcf4e8]"
      >
        clear
        <span className="material-symbols-outlined text-[14px] leading-none">close</span>
      </button>
    </div>
  );
}
