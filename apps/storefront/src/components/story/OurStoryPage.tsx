"use client";

import React from "react";
import Link from "next/link";

export function OurStoryPage() {
  return (
    <div className="w-full bg-white text-gray-900 pb-20">
      {/* Hero Header */}
      <section className="w-full bg-[#fdfbf7] py-20 px-4 border-b border-[#EFEEE9] text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto flex flex-col items-center relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8E7862] bg-[#fcf4e8] px-3.5 py-1 rounded-full">
            Our Journey & Artisan Vision
          </span>
          <h1 className="text-4xl sm:text-6xl font-serif text-[#7D5B20] font-semibold mt-4 mb-4">
            Empowering Artisans, Preserving Heritage
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-xl text-gray-600 leading-relaxed font-sans">
            Anuprerna was born to build a transparent, fair-trade bridge between rural West Bengal handloom artisans and eco-conscious global fashion brands.
          </p>
        </div>
      </section>

      {/* Main Narrative Content */}
      <div className="max-w-4xl mx-auto px-4 mt-16 flex flex-col gap-16">
        {/* Story Section 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold text-[#8E7862] uppercase tracking-wider">01. The Origin</span>
            <h2 className="font-serif font-bold text-3xl text-gray-900">
              Roots in Bengal&apos;s Weaving Clusters
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              For generations, villages across East Burdwan, Nadia, and Phulia have nurtured legendary weaving skills &mdash; from intricate Khadi and linen to tonal Jacquards and Khesh upcycled cotton fabrics.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              Anuprerna works directly with over 300 master weavers and natural dye artisans, bypassing intermediaries to ensure fair living wages and dignified working environments.
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">
            <img
              src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/ZWADZPMYSPI8Q00OID5TIASCOG3502523.jpg"
              alt="Artisan weaver"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Story Section 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center md:flex-row-reverse">
          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100 md:order-2">
            <img
              src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/PENTN7FGNSWP4W6PW254LI6JXG8907796.jpg"
              alt="Natural Dyeing"
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="flex flex-col gap-4 md:order-1">
            <span className="text-xs font-bold text-[#8E7862] uppercase tracking-wider">02. Sustainability First</span>
            <h2 className="font-serif font-bold text-3xl text-gray-900">
              Zero Chemical Impact & Botanical Dyeing
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Our dye house prioritizes GOTS-certified non-toxic dyes and 100% natural vegetable extraction using Madder root, Indigo plant leaves, Marigold flowers, and Myrobalan fruits.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              Every yard of fabric woven and dyed at Anuprerna protects waterways while delivering unmatched tactile softness on skin.
            </p>
          </div>
        </div>

        {/* Story Section 3: Impact Pillars */}
        <div className="bg-[#FAF7F2] p-8 md:p-12 rounded-3xl border border-amber-100/60 flex flex-col gap-8 text-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#8E7862]">Our Core Pillars</span>
            <h2 className="font-serif font-bold text-3xl text-gray-900 mt-2">What Drives Every Yard We Weave</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-[#8E7862]">verified_user</span>
              <h3 className="font-serif font-bold text-lg text-gray-900">100% Traceable</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                ArtisanFlow platform provides batch provenance from yarn sourcing to loom completion.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-[#8E7862]">eco</span>
              <h3 className="font-serif font-bold text-lg text-gray-900">Zero Plastic</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Natural organic fibers, biodegradable packaging, and zero plastic resins.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-[#8E7862]">handshake</span>
              <h3 className="font-serif font-bold text-lg text-gray-900">Fair Wages</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Direct economic empowerment for rural artisan families across Bengal villages.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Link
              href="/products/fabric"
              className="bg-[#8E7862] hover:bg-[#73604d] text-white font-bold px-8 py-3.5 rounded-xl text-sm transition-colors inline-block"
            >
              Explore Our Handloom Fabric Collection &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
