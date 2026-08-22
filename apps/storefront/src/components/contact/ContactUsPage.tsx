"use client";

import React, { useState } from "react";

export function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    productType: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="relative w-full min-h-[88vh] bg-white text-gray-900 py-10 flex flex-col justify-center items-center overflow-hidden font-sans">
      {/* Background Mandala with Lotus Petals and Triangular Spire Apex (Exact to anuprerna.com) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-35 select-none">
        <svg
          viewBox="0 0 900 900"
          className="w-[900px] h-[900px] sm:w-[1050px] sm:h-[1050px] text-[#C5B49D] max-w-none translate-y-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          {/* Top Spire Triangular Apex */}
          <polygon points="450,20 520,280 450,380 380,280" strokeWidth="1.4" />
          <polygon points="450,70 500,280 450,350 400,280" opacity="0.75" />
          <polygon points="450,130 480,280 450,320 420,280" opacity="0.6" />
          
          {/* Spire Internal Horizontal Struts */}
          <line x1="380" y1="280" x2="520" y2="280" strokeWidth="1.2" />
          <line x1="395" y1="220" x2="505" y2="220" opacity="0.7" />
          <line x1="415" y1="160" x2="485" y2="160" opacity="0.7" />

          {/* Central Vertical Axis & Diagonal Extension Rays */}
          <line x1="450" y1="10" x2="450" y2="880" strokeWidth="1.2" opacity="0.8" />
          <line x1="450" y1="20" x2="100" y2="780" strokeWidth="1" opacity="0.5" />
          <line x1="450" y1="20" x2="800" y2="780" strokeWidth="1" opacity="0.5" />
          <line x1="450" y1="20" x2="220" y2="840" strokeWidth="0.9" opacity="0.4" />
          <line x1="450" y1="20" x2="680" y2="840" strokeWidth="0.9" opacity="0.4" />

          {/* Concentric Circular Arcs & Guides for Lotus Rosette */}
          <circle cx="450" cy="560" r="320" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.5" />
          <circle cx="450" cy="560" r="280" strokeWidth="1.2" opacity="0.65" />
          <circle cx="450" cy="560" r="220" strokeWidth="1" opacity="0.6" />
          <circle cx="450" cy="560" r="160" strokeWidth="1.1" opacity="0.7" />
          <circle cx="450" cy="560" r="100" strokeWidth="1.2" opacity="0.7" />
          <circle cx="450" cy="560" r="50" strokeWidth="1" opacity="0.5" />

          {/* Outer Diamond Pyramidal Bounds */}
          <polygon points="450,140 820,560 450,880 80,560" strokeWidth="1" opacity="0.5" />
          <polygon points="450,220 740,560 450,840 160,560" strokeWidth="0.9" opacity="0.4" />

          {/* Tier 1: Primary Radiating Lotus Petals */}
          {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map((deg) => (
            <g key={`t1-${deg}`} transform={`rotate(${deg} 450 560)`}>
              {/* Pointed Lotus Outer Petal */}
              <path
                d="M450,280 C485,370 485,460 450,560 C415,460 415,370 450,280 Z"
                strokeWidth="1.1"
                opacity="0.65"
              />
              {/* Petal Central Spine */}
              <line x1="450" y1="280" x2="450" y2="560" strokeWidth="0.8" opacity="0.45" />
              {/* Inner Secondary Pointed Petal */}
              <path
                d="M450,380 C472,440 472,500 450,560 C428,500 428,440 450,380 Z"
                strokeWidth="1"
                opacity="0.55"
              />
            </g>
          ))}

          {/* Tier 2: Intermediate Radiating Arch Crowns */}
          {[11.25, 33.75, 56.25, 78.75, 101.25, 123.75, 146.25, 168.75, 191.25, 213.75, 236.25, 258.75, 281.25, 303.75, 326.25, 348.75].map((deg) => (
            <g key={`t2-${deg}`} transform={`rotate(${deg} 450 560)`}>
              <path
                d="M450,340 C468,410 468,480 450,560 C432,480 432,410 450,340 Z"
                strokeWidth="0.9"
                opacity="0.5"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Main Form Container */}
      <div className="relative z-10 w-full max-w-[860px] mx-auto px-4 sm:px-6 md:px-8 my-2">
        <h1 className="text-2xl sm:text-3xl text-center font-normal tracking-[0.22em] text-gray-950 mb-10 sm:mb-12 uppercase">
          CONTACT US
        </h1>

        {submitted ? (
          <div className="p-8 bg-[#fdfbf7] border border-[#B7A98F]/60 rounded text-center flex flex-col items-center gap-4 max-w-lg mx-auto shadow-sm">
            <span className="material-symbols-outlined text-5xl text-[#7D5B20]">
              check_circle
            </span>
            <h2 className="font-serif text-2xl text-gray-900 font-bold">
              Thank You!
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Your message has been received. Our studio team will get back to you at <strong>{formData.email}</strong> shortly.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: "", email: "", productType: "", description: "" });
              }}
              className="mt-2 bg-[#635543] hover:bg-[#524535] text-white px-6 py-2 text-xs font-semibold uppercase tracking-wider transition-colors rounded-[3px]"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
            {/* Row 1: Name and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* Name Input with Left Icon Badge */}
              <div className="flex border border-[#d6cec3] focus-within:border-[#8E7862] transition-colors bg-white">
                <div className="bg-[#B5A187] text-[#222222] w-[46px] h-[44px] flex items-center justify-center gap-0.5 shrink-0 select-none">
                  <span className="material-symbols-outlined text-[20px] font-light">person</span>
                  <span className="text-sm font-semibold leading-none -mt-1">*</span>
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Name"
                  className="w-full h-[44px] px-3.5 text-sm text-gray-800 placeholder-[#9ca3af] placeholder:font-light focus:outline-none bg-transparent"
                />
              </div>

              {/* Email Input with Left Icon Badge */}
              <div className="flex border border-[#d6cec3] focus-within:border-[#8E7862] transition-colors bg-white">
                <div className="bg-[#B5A187] text-[#222222] w-[46px] h-[44px] flex items-center justify-center gap-0.5 shrink-0 select-none">
                  <span className="material-symbols-outlined text-[19px] font-light">mail</span>
                  <span className="text-sm font-semibold leading-none -mt-1">*</span>
                </div>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="E-mail"
                  className="w-full h-[44px] px-3.5 text-sm text-gray-800 placeholder-[#9ca3af] placeholder:font-light focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Row 2: Product Type */}
            <div className="w-full">
              <div className="flex border border-[#d6cec3] focus-within:border-[#8E7862] transition-colors bg-white">
                <div className="bg-[#B5A187] text-[#222222] w-[46px] h-[44px] flex items-center justify-center shrink-0 select-none">
                  <span className="material-symbols-outlined text-[20px] font-light">inventory_2</span>
                </div>
                <input
                  type="text"
                  value={formData.productType}
                  onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                  placeholder="Product Type (Fabrics, Apparels, Accessories)"
                  className="w-full h-[44px] px-3.5 text-sm text-gray-800 placeholder-[#9ca3af] placeholder:font-light focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Row 3: Product Description Textarea */}
            <div className="w-full">
              <div className="border border-[#d6cec3] focus-within:border-[#8E7862] transition-colors bg-white">
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product Description (Please share any customization required)"
                  className="w-full py-3.5 px-3.5 text-sm text-gray-800 placeholder-[#9ca3af] placeholder:font-light focus:outline-none bg-transparent resize-y min-h-[140px]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center mt-3">
              <button
                type="submit"
                className="bg-[#635543] hover:bg-[#524535] text-white px-12 py-3.5 text-[13px] font-medium tracking-[0.2em] uppercase transition-all duration-300 shadow-xs hover:shadow-sm cursor-pointer rounded-[3px]"
              >
                Send Message
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Floating Help Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => {
            window.location.href = "mailto:collaborate@anuprerna.com";
          }}
          className="flex items-center gap-1.5 bg-[#B5A187] hover:bg-[#a39077] text-white px-4 py-2 rounded-full shadow-lg text-xs font-semibold tracking-wide transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">help</span>
          <span>Help</span>
        </button>
      </div>
    </div>
  );
}
