"use client";

import Link from "next/link";

export function PartnerBanner() {
  return (
    <section className="bg-white pb-16 md:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF8F5] rounded-3xl p-8 md:p-14 text-center border border-gray-100/80 shadow-xs">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 tracking-tight font-sans">
            Take full benefit by partnering with us
          </h2>

          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Join our network of ethical partners and artisans and begin your wholesale journey with Anuprerna.
          </p>

          <Link
            href="/wholesale-partner-program"
            className="inline-block px-8 py-3.5 bg-white hover:bg-[#fffcf8] text-gray-900 font-medium text-base rounded-xl border-2 border-[#cb9b6d] transition-all shadow-md hover:shadow-lg active:scale-98"
          >
            Become a Partner
          </Link>
        </div>
      </div>
    </section>
  );
}
