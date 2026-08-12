"use client";

import React, { useState } from "react";

export function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full bg-white text-gray-900 pb-20">
      {/* Hero Header */}
      <section className="w-full bg-[#fdfbf7] py-16 px-4 border-b border-[#EFEEE9] text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8E7862] bg-[#fcf4e8] px-3.5 py-1 rounded-full">
            Get In Touch
          </span>
          <h1 className="text-4xl sm:text-6xl font-serif text-[#7D5B20] font-semibold mt-4 mb-3">
            Contact Our Studio
          </h1>
          <p className="max-w-xl mx-auto text-base md:text-lg text-gray-600 leading-relaxed">
            Have questions about custom fabric development, bulk ordering, natural dyeing, or artisan partnerships? Reach out to us.
          </p>
        </div>
      </section>

      {/* Main Grid: Form + Info */}
      <div className="max-w-[1290px] mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Inquiry Form */}
        <div className="lg:col-span-7 bg-[#FAF7F2] p-8 rounded-2xl border border-amber-100/60 shadow-sm">
          <h2 className="font-serif font-bold text-2xl text-gray-900 mb-2">Send Us a Message</h2>
          <p className="text-xs text-gray-600 mb-6">
            Fill out the form below and our studio team will respond within 24 business hours.
          </p>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex flex-col items-center text-center gap-3">
              <span className="material-symbols-outlined text-4xl text-emerald-700">check_circle</span>
              <h3 className="font-serif font-bold text-xl">Thank You for Reaching Out!</h3>
              <p className="text-xs text-emerald-800">
                Your message has been received. Our team will contact you at <strong>{formData.email}</strong> shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E7862] bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@example.com"
                    className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E7862] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E7862] bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Inquiry Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E7862] bg-white"
                  >
                    <option value="">Select Topic...</option>
                    <option value="wholesale">Wholesale Partner Program</option>
                    <option value="custom">Custom Fabric Production</option>
                    <option value="dyeing">Natural & Organic Dyeing</option>
                    <option value="swatch">Order Swatches Inquiry</option>
                    <option value="other">General Query</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Message *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your project, fabric requirements, target GSM, or order specifications..."
                  className="px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E7862] bg-white"
                />
              </div>

              <button
                type="submit"
                className="bg-[#8E7862] hover:bg-[#73604d] text-white font-bold py-3.5 px-6 rounded-xl transition-colors text-sm uppercase tracking-wider mt-2"
              >
                Submit Inquiry
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Studio Contact Info */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="p-6 bg-[#FAF7F2] rounded-2xl border border-amber-100/60 shadow-sm flex flex-col gap-5">
            <h2 className="font-serif font-bold text-2xl text-gray-900">Studio Details</h2>

            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-[#8E7862] text-2xl">location_on</span>
              <div>
                <strong className="block text-sm text-gray-900">Studio & Registered Office</strong>
                <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                  Anuprerna Craft Studio<br />
                  Kolkata, West Bengal & Burdwan Handloom Cluster, India
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 border-t border-gray-200/60 pt-4">
              <span className="material-symbols-outlined text-[#8E7862] text-2xl">mail</span>
              <div>
                <strong className="block text-sm text-gray-900">Email Address</strong>
                <a href="mailto:support@anuprerna.com" className="text-xs text-[#8E7862] font-bold hover:underline">
                  support@anuprerna.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 border-t border-gray-200/60 pt-4">
              <span className="material-symbols-outlined text-[#8E7862] text-2xl">phone_iphone</span>
              <div>
                <strong className="block text-sm text-gray-900">Phone / WhatsApp Studio Support</strong>
                <a href="https://wa.me/918653403212" target="_blank" rel="noopener noreferrer" className="text-xs text-[#8E7862] font-bold hover:underline">
                  +91 8653403212
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 border-t border-gray-200/60 pt-4">
              <span className="material-symbols-outlined text-[#8E7862] text-2xl">schedule</span>
              <div>
                <strong className="block text-sm text-gray-900">Operating Hours</strong>
                <p className="text-xs text-gray-600 mt-0.5">
                  Monday &ndash; Saturday: 9:30 AM &ndash; 6:30 PM IST
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
