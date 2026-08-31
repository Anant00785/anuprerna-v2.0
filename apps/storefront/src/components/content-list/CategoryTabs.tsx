'use client';

interface Tab {
  label: string;
  value: string;
}

interface CategoryTabsProps {
  tabs: Tab[];
  active: string;
  onSelect: (value: string) => void;
}

// Brand brown for the selected-tab underline (live: #6c5b48, 1.5px).
const SELECTED_BORDER = '#6c5b48';
// Unselected tab-row border tint (live: #9c8a6c).
const ROW_BORDER = '#9c8a6c';

export default function CategoryTabs({ tabs, active, onSelect }: CategoryTabsProps) {
  return (
    <div
      className='flex flex-wrap gap-x-0 mb-8'
      style={{ borderBottom: '1px solid ' + ROW_BORDER }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onSelect(tab.value)}
            className={[
              'px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors -mb-px',
              isActive ? 'text-clay' : 'text-black/60 hover:text-black',
            ].join(' ')}
            style={
              isActive
                ? { borderBottom: '1.5px solid ' + SELECTED_BORDER }
                : undefined
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
