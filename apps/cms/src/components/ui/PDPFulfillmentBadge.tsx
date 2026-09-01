import React from 'react';

interface PDPFulfillmentBadgeProps {
  onContactSales?: () => void;
}

export default function PDPFulfillmentBadge({ onContactSales }: PDPFulfillmentBadgeProps) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md py-2.5 px-3 my-4 font-sans max-w-[400px]">
      <div className="flex items-center gap-2.5">
        <div className="text-[18px] leading-none">✨</div>
        <div className="flex-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-semibold text-[13px] text-slate-900">Made to Order</span>
          <span className="text-[13px] text-slate-600">Handcrafted, ships in ~30 days.</span>
        </div>
      </div>
      {/* B2B Lead Gen Modal Trigger (Desktop visible, mobile stacked) */}
      <div className="mt-1.5 ml-7 text-[12px]">
        <button 
          onClick={onContactSales}
          className="bg-transparent border-none p-0 text-blue-600 hover:text-blue-700 underline cursor-pointer font-medium"
        >
          Need it faster or ordering for a project?
        </button>
      </div>
    </div>
  );
}
