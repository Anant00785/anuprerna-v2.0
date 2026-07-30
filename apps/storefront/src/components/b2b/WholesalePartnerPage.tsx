"use client";

import React, { useState } from "react";
import Link from "next/link";

const WHOLESALE_PERKS = [
  {
    icon: "verified",
    title: "Tiered Bulk Discounts",
    desc: "Unlock competitive tiered pricing based on annual order volume, supporting emerging and established ethical fashion brands.",
  },
  {
    icon: "local_shipping",
    title: "Dedicated Production Studio",
    desc: "Direct access to our master weavers, dye houses, and artisan clusters with streamlined custom sampling and batch production.",
  },
  {
    icon: "qr_code_2",
    title: "ArtisanFlow Traceability Access",
    desc: "Every wholesale order receives digital traceability credentials to share authentic impact metrics with your eco-conscious buyers.",
  },
  {
    icon: "palette",
    title: "Custom Craft & Dyeing Options",
    desc: "Custom color matching, natural plant dyeing, GOTS organic cottons, and custom weave pattern developments.",
  },
];

const WHOLESALE_FAQS = [
  {
    q: "Who qualifies for the Wholesale Partner Program?",
    a: "Our wholesale program is designed for registered fashion brands, independent designers, boutique labels, and eco-textile retailers looking for ethically handcrafted fabrics or finished products.",
  },
  {
    q: "What is the Minimum Order Quantity (MOQ)?",
    a: "We offer low MOQs starting from 15-30 meters for stock fabrics, and flexible custom production runs depending on the craft and weave technique.",
  },
  {
    q: "How do I order fabric swatches?",
    a: "Wholesale partners can order swatch kits directly online or request custom fabric sample cards through our wholesale desk.",
  },
];

export function WholesalePartnerPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full bg-white text-gray-900">
      {/* Hero Section */}
      <section className="w-full bg-[#fdfbf7] py-16 px-4 border-b border-[#EFEEE9] flex flex-col items-center text-center">
        <div className="max-w-4xl w-full">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8E7862] bg-[#fcf4e8] px-3 py-1 rounded-full">
            B2B Brand Partnership
          </span>
          <h1 className="text-4xl sm:text-6xl font-serif text-[#7D5B20] font-semibold mt-4 mb-4">
            Wholesale Partner Program
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-600 leading-relaxed">
            Partner with Anuprerna to source GOTS organic cottons, handwoven silks, khadi, and sustainable artisanal textiles crafted directly by Bengal handloom weavers.
          </p>

          <div className="flex justify-center gap-4 mt-8">
            <a
              href="#wholesale-apply-form"
              className="bg-[#8E7862] hover:bg-[#73604d] text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors text-base"
            >
              Apply Now
            </a>
            <Link
              href="/content/wholesale/order-fabric-swatches/59195"
              className="bg-white border-2 border-[#8E7862] text-[#7D5B20] font-bold py-3 px-6 rounded-lg hover:bg-[#fffcf7] transition-colors text-base"
            >
              Order Swatch Kit
            </Link>
          </div>
        </div>
      </section>

      {/* Member Perks */}
      <section className="w-full py-16 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-bold text-gray-900">Partner Program Benefits</h2>
          <p className="text-gray-600 mt-2">Designed to empower sustainable fashion brands</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHOLESALE_PERKS.map((perk, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-[#fffcf7] border border-[#EFEEE9] flex flex-col items-start gap-3 shadow-sm hover:shadow-md transition-shadow">
              <span className="material-symbols-outlined text-3xl text-[#8E7862] p-2 bg-[#fcf4e8] rounded-xl">
                {perk.icon}
              </span>
              <h3 className="font-bold text-lg text-gray-900 mt-1">{perk.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{perk.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Application Form */}
      <section id="wholesale-apply-form" className="w-full py-16 px-4 bg-[#f7f7f7]">
        <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-serif font-bold text-gray-900">Apply for Wholesale Account</h2>
            <p className="text-sm text-gray-600 mt-2">Fill out the details below and our wholesale manager will reach out within 24 hours.</p>
          </div>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-800">
              <span className="material-symbols-outlined text-4xl text-emerald-600 mb-2">check_circle</span>
              <h3 className="font-bold text-xl mb-1">Application Received!</h3>
              <p className="text-sm">Thank you for applying to the Wholesale Partner Program. Our team will review your business profile and get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8E7862] text-sm"
                    placeholder="Your Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8E7862] text-sm"
                    placeholder="name@brand.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Company / Brand Name</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8E7862] text-sm"
                    placeholder="Brand Studio Ltd."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8E7862] text-sm"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Fabric Requirements & Estimated Quantities</label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8E7862] text-sm"
                  placeholder="Tell us about your upcoming collection, fabric types (e.g. Khadi Cotton, Peace Silk, Linen), and target volumes..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#8E7862] hover:bg-[#73604d] text-white font-bold py-3.5 px-6 rounded-lg shadow-md transition-colors text-base uppercase tracking-wider mt-2"
              >
                Submit Wholesale Application
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-16 px-4 max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="flex flex-col gap-4">
          {WHOLESALE_FAQS.map((faq, idx) => (
            <div key={idx} className="p-5 rounded-xl border border-gray-200 bg-[#fffcf7]">
              <h3 className="font-bold text-base text-gray-900">{faq.q}</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
