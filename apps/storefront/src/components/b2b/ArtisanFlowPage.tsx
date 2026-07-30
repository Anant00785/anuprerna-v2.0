"use client";

import React, { useState } from "react";
import Link from "next/link";

const ARTISAN_FLOW_FAQS = [
  {
    q: "What is ArtisanFlow?",
    a: "ArtisanFlow is Anuprerna's proprietary traceability platform that provides brands with end-to-end visibility across artisanal handloom supply chains, from yarn sourcing to final fabric creation.",
  },
  {
    q: "How does real-time tracking work?",
    a: "Every order is assigned a unique digital tracking profile. Artisans and production managers update milestones via mobile apps, allowing buyers to view real-time progress, craft metrics, and impact stats.",
  },
  {
    q: "Can I share traceability data with my end consumers?",
    a: "Yes! ArtisanFlow generates custom QR codes and embeddable widgets that brands can display on product hangtags, websites, and marketing campaigns to showcase authentic supply chain transparency.",
  },
  {
    q: "How do I get access to ArtisanFlow?",
    a: "ArtisanFlow is available for all wholesale brand partners ordering custom fabric or finished products with Anuprerna.",
  },
];

export function ArtisanFlowPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scrollToVideo = () => {
    const el = document.getElementById("af-demo-video");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full bg-white text-gray-900">
      {/* 1. Hero Section */}
      <section className="w-full bg-[#fdfbf7] py-16 px-4 flex flex-col justify-center items-center border-b border-[#EFEEE9]">
        <div className="max-w-4xl w-full text-center flex flex-col items-center gap-4">
          <p className="text-sm md:text-base font-medium text-gray-700 tracking-wide">
            <span className="text-[#7D5B20] font-bold uppercase">Embrace</span> transparency,{" "}
            <span className="text-[#7D5B20] font-bold uppercase">Empower</span> artisans, and{" "}
            <span className="text-[#7D5B20] font-bold uppercase">Enable</span> a sustainable future.
          </p>

          <h1 className="text-4xl sm:text-6xl font-serif text-[#7D5B20] font-semibold tracking-tight">
            <span className="text-gray-900 font-sans">Introducing</span> ArtisanFlow
          </h1>

          <div className="w-full max-w-3xl my-4 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
            <video
              className="w-full h-auto object-cover"
              src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/artisan-flow-mist.mp4"
              autoPlay
              playsInline
              muted
              loop
            />
          </div>

          <p className="max-w-2xl text-base md:text-lg text-gray-600 leading-relaxed">
            Our proprietary tech solution ensures full transparency and visibility across our artisanal supply chain, empowering you with real-time insights at every production stage.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 mt-2">
            <a
              href="https://calendly.com/store-anuprerna/artisanflow"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#93805D] hover:bg-[#7D5B20] text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors text-sm md:text-base"
            >
              Book Your Live Demo
            </a>
            <button
              type="button"
              onClick={scrollToVideo}
              className="bg-[#fffcf7] hover:bg-white text-[#7D5B20] border-2 border-[#8E7862] font-semibold py-3 px-6 rounded-lg shadow-sm transition-colors text-sm md:text-base"
            >
              Watch Demo Video
            </button>
          </div>
        </div>
      </section>

      {/* 2. Main Demo Video Section */}
      <section id="af-demo-video" className="w-full bg-[#f7f7f7] py-16 px-4 flex flex-col justify-center items-center">
        <div className="max-w-4xl w-full flex flex-col items-center">
          <video
            className="w-full rounded-xl shadow-2xl border-4 border-white max-w-[950px]"
            poster="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/artisan-flow-video-thumnail-desktop.png"
            src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/artisan-flow-demo-desktop.mp4"
            controls
            playsInline
            preload="metadata"
          />
          <p className="text-sm md:text-base font-serif italic text-gray-600 mt-4">
            ArtisanFlow: Weaving trust through transparency
          </p>
        </div>
      </section>

      {/* 3. Feature Section 1 */}
      <section className="w-full py-16 px-4 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/2 flex justify-center">
          <img
            src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/af-1.jpg"
            alt="Simplifying Supply Chains with Real-Time Tracking"
            className="rounded-2xl shadow-lg max-h-[380px] object-cover"
          />
        </div>
        <div className="w-full md:w-1/2 flex flex-col gap-3">
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            Simplifying Supply Chains with Real-Time Tracking
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Managing an <strong className="text-gray-900 font-semibold">artisanal supply chain</strong> has never been easier. Our platform <strong className="text-gray-900 font-semibold">simplifies supply chain complexity</strong> by providing <strong className="text-gray-900 font-semibold">real-time tracking & analytics</strong> at every stage of production. From <strong className="text-gray-900 font-semibold">sourcing raw materials</strong> to final delivery, users gain complete transparency into their manufacturing workflow.
          </p>
        </div>
      </section>

      {/* 4. Feature Section 2 */}
      <section className="w-full py-16 px-4 bg-[#f7f7f7]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row-reverse items-center gap-8">
          <div className="w-full md:w-1/2 flex justify-center">
            <img
              src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/af-2.jpg"
              alt="Connecting Artisans to Global Buyers"
              className="rounded-2xl shadow-lg max-h-[380px] object-cover"
            />
          </div>
          <div className="w-full md:w-1/2 flex flex-col gap-3">
            <h3 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
              Connecting Artisans to Global Buyers
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              We bridge the gap between skilled <strong className="text-gray-900 font-semibold">artisans from distant rural villages</strong> and global buyers, enabling <strong className="text-gray-900 font-semibold">seamless connections</strong> within the supply chain. By <strong className="text-gray-900 font-semibold">connecting more than 500 artisans</strong>, we empower small-scale manufacturers to showcase their craft while ensuring superior quality outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Feature Section 3 */}
      <section className="w-full py-16 px-4 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/2 flex justify-center">
          <img
            src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/af-3.jpg"
            alt="Driving Impact Through Ethical Sourcing"
            className="rounded-2xl shadow-lg max-h-[380px] object-cover"
          />
        </div>
        <div className="w-full md:w-1/2 flex flex-col gap-3">
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-gray-900">
            Driving Impact Through Ethical Sourcing
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Our mission extends beyond efficiency—we focus on <strong className="text-gray-900 font-semibold">impact creation</strong> by fostering ethical sourcing and sustainable production. With end-to-end tracking, businesses ensure every step adheres to fair trade and responsible manufacturing practices.
          </p>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="w-full py-16 px-4 bg-[#fdfbf7] border-t border-b border-[#EFEEE9]">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <h3 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-8">
            Frequently Asked Questions
          </h3>

          <div className="w-full flex flex-col gap-3">
            {ARTISAN_FLOW_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left font-bold text-base text-gray-900 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="material-symbols-outlined text-gray-500">
                      {isOpen ? "remove" : "add"}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. CTA Book Appointment Banner */}
      <section className="w-full bg-[#8E7862] text-white py-14 px-4 text-center">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
          <h3 className="text-3xl font-serif font-bold">Experience ArtisanFlow Live</h3>
          <p className="text-base text-gray-100 max-w-xl">
            Schedule a 1-on-1 walkthrough with our platform team and learn how traceability can elevate your sustainable fashion brand.
          </p>
          <a
            href="https://calendly.com/store-anuprerna/artisanflow"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 bg-white text-[#8E7862] hover:bg-[#fffcf7] font-bold py-3 px-8 rounded-lg shadow-lg transition-colors text-base"
          >
            Book Appointment
          </a>
        </div>
      </section>
    </div>
  );
}
