"use client";

import React, { useState } from "react";
import Link from "next/link";

interface PartnershipFormState {
  fullName: string;
  brandName: string;
  website: string;
  email: string;
  phnumber: string;
  country: string;
  businessTypes: string[];
  businessTypeOtherChecked: boolean;
  businessTypeOtherText: string;
  orderFrequency: string;
  orderFrequencyOtherText: string;
  currency: string;
  estimatedVolume: string;
  notes: string;
}

const COUNTRIES = [
  "India", "United States", "United Kingdom", "Australia", "Canada", "Germany",
  "France", "Italy", "Spain", "Netherlands", "Japan", "Singapore", "United Arab Emirates",
  "New Zealand", "Sweden", "Switzerland", "Denmark", "Norway", "Belgium", "Austria",
  "Mexico", "Brazil", "South Africa", "Other"
];

export function WholesalePartnerPage() {
  const [formData, setFormData] = useState<PartnershipFormState>({
    fullName: "",
    brandName: "",
    website: "",
    email: "",
    phnumber: "",
    country: "",
    businessTypes: [],
    businessTypeOtherChecked: false,
    businessTypeOtherText: "",
    orderFrequency: "Monthly",
    orderFrequencyOtherText: "",
    currency: "USD",
    estimatedVolume: "",
    notes: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const toggleBusinessType = (type: string, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.businessTypes;
      if (checked) {
        return { ...prev, businessTypes: [...current, type] };
      } else {
        return { ...prev, businessTypes: current.filter((t) => t !== type) };
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full bg-white text-[#1f1f1f] fb-font-inter">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[500px] sm:min-h-[600px] pt-20 sm:pt-24 bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: `url('https://readdy.ai/api/search-image?query=high-quality%20photograph%20showing%20artisans%20working%20on%20traditional%20Indian%20handloom%20with%20natural%20materials%2C%20soft%20lighting%2C%20muted%20earthy%20tones%2C%20showing%20hands%20working%20with%20textiles%2C%20subtle%20texture%20patterns%2C%20warm%20ambient%20lighting%2C%20natural%20cotton%20and%20indigo%20dyes%20visible%2C%20artisanal%20craftsmanship%2C%20with%20soft%20gradient%20on%20left%20side%20for%20text%20overlay&width=1600&height=800&seq=hero1&orientation=landscape')`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/40" />

        <div className="container mx-auto px-4 py-12 sm:py-16 md:py-24 relative z-10 flex flex-col justify-center min-h-[500px] sm:min-h-[600px]">
          <div className="w-full max-w-2xl">
            <h1 className="fb-font-dm text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium text-[#2C3E50] leading-tight mb-4 sm:mb-6">
              Anuprerna Wholesale Partner Program
            </h1>
            <h2 className="fb-font-dm text-sm sm:text-base md:text-lg lg:text-2xl font-medium text-[#2C3E50] leading-tight mb-4 sm:mb-6">
              For Designers, Brands &amp; Retailers
            </h2>

            <div className="mt-6 sm:mt-8 border-t border-slate-200/60 pt-8 pb-8">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm md:text-base text-[#2C3E50]">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#7d5b20]">sell</span>
                  <span><strong>Discounted Trade Pricing</strong> – enjoy exclusive partner rates</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#7d5b20]">design_services</span>
                  <span><strong>Custom Development</strong> – colorways, patterns &amp; product design support</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#7d5b20]">speed</span>
                  <span><strong>Priority Orders</strong> – faster sampling, production &amp; delivery slots</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#7d5b20]">visibility</span>
                  <span><strong>Transparency</strong> – artisan photos, videos &amp; traceability via <em>ArtisanFlow</em></span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#apply-now"
                className="bg-gradient-to-r from-[#F7C52D] to-[#FFD700] hover:from-[#E6B329] hover:to-[#F0C814] text-black font-medium px-8 py-4 text-base md:text-lg rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 w-max"
              >
                <span>Apply for a Trade Account</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHY PARTNERSHIP SECTION */}
      <section id="why-partner" className="py-16 md:py-24 bg-white border-b border-[#EFEEE9]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="fb-font-dm text-3xl md:text-4xl font-medium text-[#2C3E50] mb-4">
              Why Partner With Us
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the advantages of joining Anuprerna&apos;s exclusive wholesale program for ethical fashion businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-14 h-14 flex items-center justify-center bg-[#f7f7f7] rounded-full mb-6 text-[#7d5b20]">
                <span className="material-symbols-outlined text-3xl">diversity_3</span>
              </div>
              <h3 className="fb-font-dm text-xl font-medium text-[#2C3E50] mb-3">Direct From Artisan Clusters</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ethically sourced from 300+ artisans across 25+ craft clusters in India.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-14 h-14 flex items-center justify-center bg-[#f7f7f7] rounded-full mb-6 text-[#7d5b20]">
                <span className="material-symbols-outlined text-3xl">price_change</span>
              </div>
              <h3 className="fb-font-dm text-xl font-medium text-[#2C3E50] mb-3">Flexible Minimums &amp; Custom Pricing</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Minimum order amount, pricing tiers, and order frequency — all tailored to your business needs.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-14 h-14 flex items-center justify-center bg-[#f7f7f7] rounded-full mb-6 text-[#7d5b20]">
                <span className="material-symbols-outlined text-3xl">support_agent</span>
              </div>
              <h3 className="fb-font-dm text-xl font-medium text-[#2C3E50] mb-3">Dedicated Account Support</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Personalized support from sourcing to sampling, production to delivery.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-14 h-14 flex items-center justify-center bg-[#f7f7f7] rounded-full mb-6 text-[#7d5b20]">
                <span className="material-symbols-outlined text-3xl">eco</span>
              </div>
              <h3 className="fb-font-dm text-xl font-medium text-[#2C3E50] mb-3">Sustainability at the Core</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Powered by our traceable supply chain — ArtisanFlow — ensuring fair wages, transparency, and impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHO IT'S FOR SECTION */}
      <section id="who-its-for" className="py-16 md:py-24 bg-[#FAF9F6] border-b border-[#EFEEE9]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="fb-font-dm text-3xl md:text-4xl font-medium text-[#2C3E50] mb-4">
              Who It&apos;s For
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Our wholesale program is designed for businesses that value ethical sourcing and artisanal craftsmanship.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {[
              { icon: "apparel", title: "Ethical Fashion Houses" },
              { icon: "palette", title: "Designers & Creative Studios" },
              { icon: "home", title: "Home & Lifestyle Brands" },
              { icon: "storefront", title: "Concept & Boutique Stores" },
              { icon: "shopping_bag", title: "Retailers" },
              { icon: "weekend", title: "Interior Designers" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border-t-4 border-[#7d5b20] border-x border-b border-gray-100 hover:shadow-md transition-all flex flex-col items-center text-center"
              >
                <div className="w-16 h-16 flex items-center justify-center bg-[#FAF9F6] rounded-full mb-4 text-[#7d5b20]">
                  <span className="material-symbols-outlined text-3xl">{item.icon}</span>
                </div>
                <h3 className="fb-font-dm text-lg font-medium text-[#2C3E50]">{item.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. MEMBER PERKS SECTION */}
      <section id="member-perks" className="py-16 md:py-24 bg-white border-b border-[#EFEEE9]">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-base md:text-lg font-medium bg-[#FFF8D0] text-[#7D5A20] border border-[#8f780f]/30">
              <span className="material-symbols-outlined text-xl">crown</span>
              <span>Exclusive Member Perks</span>
            </span>
          </div>

          <div className="bg-[#FAF9F6] rounded-2xl p-8 md:p-12 shadow-sm border border-[#EFEEE9]">
            <ul className="space-y-6">
              <li className="flex gap-4 items-start">
                <span className="shrink-0 inline-flex h-10 w-10 rounded-full bg-[#dfd0bb]/40 items-center justify-center text-[#7d5b20]">
                  <span className="material-symbols-outlined">sell</span>
                </span>
                <div>
                  <h4 className="font-bold text-[#2C3E50] text-base md:text-lg">Custom Trade Discounts</h4>
                  <p className="text-gray-600 text-xs md:text-sm mt-0.5">Applied to textiles and finished goods based on your needs.</p>
                </div>
              </li>

              <li className="flex gap-4 items-start">
                <span className="shrink-0 inline-flex h-10 w-10 rounded-full bg-[#dfd0bb]/40 items-center justify-center text-[#7d5b20]">
                  <span className="material-symbols-outlined">design_services</span>
                </span>
                <div>
                  <h4 className="font-bold text-[#2C3E50] text-base md:text-lg">Custom Development</h4>
                  <p className="text-gray-600 text-xs md:text-sm mt-0.5">Tailored colorways, patterns, and dimensions for your line.</p>
                </div>
              </li>

              <li className="flex gap-4 items-start">
                <span className="shrink-0 inline-flex h-10 w-10 rounded-full bg-[#dfd0bb]/40 items-center justify-center text-[#7d5b20]">
                  <span className="material-symbols-outlined">local_shipping</span>
                </span>
                <div>
                  <h4 className="font-bold text-[#2C3E50] text-base md:text-lg">Priority Production &amp; Delivery</h4>
                  <p className="text-gray-600 text-xs md:text-sm mt-0.5">Expedited timelines and dedicated support for launches.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS TIMELINE */}
      <section id="how-it-works" className="py-16 md:py-24 bg-[#FAF9F6] border-b border-[#EFEEE9]">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="fb-font-dm text-3xl md:text-4xl font-medium text-[#2C3E50] mb-4">
              How It Works
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              A simple process to join our wholesale program and start sourcing artisanal products.
            </p>
          </div>

          <div className="space-y-8 relative">
            <div className="relative pl-14 pb-8 border-l-2 border-[#8E7862]/30 last:border-l-0">
              <div className="absolute left-[-25px] top-0 w-12 h-12 flex items-center justify-center bg-[#8E7862] text-white rounded-full font-bold text-lg shadow-md">
                1
              </div>
              <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100">
                <h3 className="fb-font-dm text-xl font-medium text-[#2C3E50] mb-2">Apply</h3>
                <p className="text-sm text-gray-600 mb-3">Create your trade account.</p>
                <div className="flex items-center text-xs text-[#7d5b20] font-semibold gap-1.5">
                  <span className="material-symbols-outlined text-base">timer</span>
                  <span>Takes approximately 2 minutes</span>
                </div>
              </div>
            </div>

            <div className="relative pl-14 pb-8 border-l-2 border-[#8E7862]/30 last:border-l-0">
              <div className="absolute left-[-25px] top-0 w-12 h-12 flex items-center justify-center bg-[#8E7862] text-white rounded-full font-bold text-lg shadow-md">
                2
              </div>
              <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100">
                <h3 className="fb-font-dm text-xl font-medium text-[#2C3E50] mb-2">Discuss</h3>
                <p className="text-sm text-gray-600">Share your business needs and agree on a partner plan.</p>
              </div>
            </div>

            <div className="relative pl-14 pb-4">
              <div className="absolute left-[-25px] top-0 w-12 h-12 flex items-center justify-center bg-[#8E7862] text-white rounded-full font-bold text-lg shadow-md">
                3
              </div>
              <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100">
                <h3 className="fb-font-dm text-xl font-medium text-[#2C3E50] mb-2">Unlock</h3>
                <p className="text-sm text-gray-600 mb-3">Access your custom perks and start ordering.</p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF8D0] text-[#7D5A20] border border-[#8f780f]/30">
                  <span className="material-symbols-outlined text-sm">crown</span> Exclusive Benefits
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PARTNERSHIP APPLICATION FORM */}
      <section id="apply-now" className="py-16 md:py-24 bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="fb-font-dm text-3xl font-medium text-gray-900 mb-3">Partnership Application Form</h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              Join our network of ethical partners and artisans. Please fill out the form below to begin your partnership journey with Anuprerna.
            </p>
          </div>

          {submitted ? (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-emerald-900 shadow-lg">
              <span className="material-symbols-outlined text-5xl text-emerald-600 mb-3">check_circle</span>
              <h3 className="fb-font-dm text-2xl font-medium mb-2">Application Submitted Successfully!</h3>
              <p className="text-sm max-w-md mx-auto leading-relaxed text-emerald-800">
                Thank you for applying to the Wholesale Partner Program. Our dedicated B2B manager will review your application and contact you within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div className="bg-white rounded-xl shadow-xs p-6 md:p-8 border border-gray-200">
                <h3 className="fb-font-dm text-xl font-medium text-gray-900 mb-6 pb-2 border-b border-[#A0845C]">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                      Brand / Business Name (If Any)
                    </label>
                    <input
                      type="text"
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      placeholder="Enter your brand name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                      Website (If Any)
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://your-website.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phnumber}
                      onChange={(e) => setFormData({ ...formData, phnumber: e.target.value })}
                      placeholder="Enter your phone number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="bg-white rounded-xl shadow-xs p-6 md:p-8 border border-gray-200">
                <h3 className="fb-font-dm text-xl font-medium text-gray-900 mb-6 pb-2 border-b border-[#A0845C]">
                  Business Details
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none bg-white"
                    >
                      <option value="">Select your country</option>
                      {COUNTRIES.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                      Business Type <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-3">Select one or more</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        "Ethical Fashion House",
                        "Designer / Creative Studio",
                        "Home & Lifestyle Brand",
                        "Boutique Store",
                        "Retailer",
                        "Interior Designer",
                      ].map((bType, bIdx) => (
                        <label
                          key={bIdx}
                          className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.businessTypes.includes(bType)}
                            onChange={(e) => toggleBusinessType(bType, e.target.checked)}
                            className="w-4 h-4 text-[#F59E0B] rounded border-gray-300 focus:ring-[#F59E0B]"
                          />
                          <span className="text-sm text-gray-700">{bType}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Preferences */}
              <div className="bg-white rounded-xl shadow-xs p-6 md:p-8 border border-gray-200">
                <h3 className="fb-font-dm text-xl font-medium text-gray-900 mb-6 pb-2 border-b border-[#A0845C]">
                  Order Preferences
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                      Preferred Order Frequency <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {["Monthly", "Quarterly", "Bi-Annually", "Annually"].map((freq, fIdx) => (
                        <label
                          key={fIdx}
                          className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer text-sm font-medium transition-all ${
                            formData.orderFrequency === freq
                              ? "bg-[#FFF8D0] border-[#8E7862] text-[#7D5A20]"
                              : "border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="orderFrequency"
                            value={freq}
                            checked={formData.orderFrequency === freq}
                            onChange={(e) => setFormData({ ...formData, orderFrequency: e.target.value })}
                            className="sr-only"
                          />
                          <span>{freq}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                      Estimated Total Order Volume <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#F59E0B] outline-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                      </select>
                      <input
                        type="number"
                        required
                        value={formData.estimatedVolume}
                        onChange={(e) => setFormData({ ...formData, estimatedVolume: e.target.value })}
                        placeholder="Enter estimated amount"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F59E0B] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-white rounded-xl shadow-xs p-6 md:p-8 border border-gray-200">
                <h3 className="fb-font-dm text-xl font-medium text-gray-900 mb-4 pb-2 border-b border-[#A0845C]">
                  Additional Information
                </h3>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-2">
                  Tell Us About Your Sourcing Needs or Custom Requests (Optional)
                </label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Describe design preferences, fabric specifications, sustainability goals..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F59E0B] outline-none"
                />
              </div>

              <div className="text-center pt-4">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#F7C52D] to-[#FFD700] hover:from-[#E6B329] hover:to-[#F0C814] text-black font-semibold px-10 py-4 text-lg rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Submit Partnership Application
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section className="py-16 md:py-24 max-w-3xl mx-auto px-4">
        <h2 className="fb-font-dm text-2xl md:text-3xl font-medium text-[#2C3E50] text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="flex flex-col gap-4">
          {[
            {
              q: "Who qualifies for the Wholesale Partner Program?",
              a: "Our wholesale program is designed for ethical fashion houses, independent designers, boutique labels, and eco-textile retailers looking for handcrafted organic fabrics or finished product developments.",
            },
            {
              q: "What is the Minimum Order Quantity (MOQ)?",
              a: "We offer flexible minimums starting from 15-30 meters for stock fabrics, and low MOQs for custom artisanal production runs depending on craft complexity.",
            },
            {
              q: "How does ArtisanFlow supply chain tracking work?",
              a: "Every wholesale order is integrated with our digital ArtisanFlow platform, providing photo, video, and milestone updates directly from weaver clusters to your partner dashboard.",
            },
            {
              q: "Can I request custom colors or Jamdani pattern developments?",
              a: "Yes, our team specializes in custom color matching using azo-free and natural plant dyes, as well as bespoke handloom pattern weaving.",
            },
          ].map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div key={idx} className="p-4 md:p-5 rounded-xl border border-gray-200 bg-[#FAF9F6]">
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full flex justify-between items-center text-left font-medium text-base text-[#2C3E50] hover:text-[#7d5b20] transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className="material-symbols-outlined text-gray-500">
                    {isOpen ? "arrow_drop_up" : "arrow_drop_down"}
                  </span>
                </button>
                {isOpen && (
                  <p className="text-xs md:text-sm text-gray-600 mt-3 pt-3 border-t border-gray-200/60 leading-relaxed">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
