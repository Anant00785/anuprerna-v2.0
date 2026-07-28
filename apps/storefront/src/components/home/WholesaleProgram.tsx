"use client";

import Link from "next/link";

export function WholesaleProgram() {
  return (
    <section className="py-10 bg-white relative overflow-hidden">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
            Wholesale Partners Program
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover the advantages of joining Anuprerna&apos;s exclusive wholesale program for ethical fashion businesses.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10 mb-10">
          {/* Card 1 */}
          <div className="group relative">
            <div
              className="p-10 rounded-3xl border border-gray-100 hover:border-gray-200 transition-all duration-500 h-full relative overflow-hidden"
              style={{ backgroundColor: "#EAEBF1" }}
            >
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-500 rounded-full opacity-20"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center mb-8 relative z-[1]">
                <span className="material-symbols-outlined text-white text-2xl">
                  sell
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Discounted Trade Pricing
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Enjoy exclusive partner rates on our premium organic textiles, ensuring you get the best value for your wholesale business.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative">
            <div
              className="p-10 rounded-3xl border border-gray-100 hover:border-gray-200 transition-all duration-500 h-full relative overflow-hidden"
              style={{ backgroundColor: "#F9F4F5" }}
            >
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-rose-500 rounded-full opacity-20"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center mb-8 relative z-[1]">
                <span className="material-symbols-outlined text-white text-2xl">
                  design_services
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Custom Development
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Custom development services for colorways, patterns, and product design support.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="group relative">
            <div
              className="p-10 rounded-3xl border border-gray-100 hover:border-gray-200 transition-all duration-500 h-full relative overflow-hidden"
              style={{ backgroundColor: "#EBE9F2" }}
            >
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500 rounded-full opacity-20"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center mb-8 relative z-[1]">
                <span className="material-symbols-outlined text-white text-2xl">
                  speed
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Priority &amp; Transparency
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Get faster sampling, production &amp; delivery slots to our premium organic textiles with priority orders and transparent supply chain visibility via ArtisanFlow.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="text-center bg-gray-50 rounded-3xl p-12 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Take full benefit by partnering with us
          </h3>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join our network of ethical partners and artisans and begin your wholesale journey with Anuprerna.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/wholesale-partner-program"
              className="px-8 py-3 rounded-lg font-semibold bg-[#7D5B20] text-white hover:bg-[#6c5b48] transition-all duration-300 whitespace-nowrap shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
