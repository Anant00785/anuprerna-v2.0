"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { AnimatedCounter } from "../home/AnimatedCounter";

const ARTISANFLOW_FAQS = [
  {
    question: "What is ArtisanFlow?",
    answer: "ArtisanFlow is Anuprerna's proprietary traceability platform that provides brands with end-to-end visibility across artisanal handloom supply chains, from yarn sourcing to final fabric creation."
  },
  {
    question: "How do I get access to ArtisanFlow?",
    answer: "ArtisanFlow is available for all wholesale brand partners ordering custom fabric or finished products with Anuprerna."
  },
  {
    question: "Can I share ArtisanFlow insights with my end customers?",
    answer: "Yes! ArtisanFlow generates custom QR codes and embeddable widgets that brands can display on product hangtags, websites, and marketing campaigns to showcase authentic supply chain transparency."
  }
];

export function ArtisanFlowPage() {
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleDemoVideo = () => {
    if (videoRef.current) {
      if (isPlayingVideo) {
        videoRef.current.pause();
        setIsPlayingVideo(false);
      } else {
        videoRef.current.play();
        setIsPlayingVideo(true);
      }
    }
  };

  return (
    <div className="w-full bg-white text-[#1f1f1f] fb-font-inter">
      {/* 1. HERO SECTION */}
      <section className="w-full flex flex-col justify-center items-center py-12 md:py-20 border-b border-[#EFEEE9]">
        <div className="container max-w-screen-lg px-4 text-center flex flex-col items-center gap-4">
          <p className="text-xs md:text-sm text-gray-700 tracking-wider">
            <span className="text-[#7d5b20] font-bold">EMBRACE</span> transparency,{" "}
            <span className="text-[#7d5b20] font-bold">EMPOWER</span> artisans, and{" "}
            <span className="text-[#7d5b20] font-bold">ENABLE</span> a sustainable future.
          </p>

          <h1 className="fb-font-dm text-3xl sm:text-5xl text-[#7D5B20] font-medium mb-2">
            <span className="text-black">Introducing</span> ArtisanFlow
          </h1>

          <div className="w-full max-w-[768px] my-2 rounded-xl overflow-hidden shadow-md border border-gray-100">
            <video
              src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/artisan-flow-mist.mp4"
              autoPlay
              playsInline
              muted
              loop
              className="object-cover w-full h-auto"
            />
          </div>

          <p className="max-w-screen-md text-sm md:text-base text-gray-700 leading-relaxed mt-2">
            Our proprietary tech solution ensures full transparency and visibility across our artisanal supply chain, empowering you with real-time insights at every production stage.
          </p>

          <div className="w-full flex flex-wrap justify-center gap-4 items-center mt-4">
            <a
              href="https://calendly.com/store-anuprerna/artisanflow"
              target="_blank"
              rel="noreferrer"
              className="bg-[#93805D] hover:bg-[#fffcf7] hover:shadow-md border-2 border-[#93805D] text-white hover:text-[#93805D] py-2 px-6 rounded-lg text-sm md:text-base font-medium transition-all flex items-center gap-2"
            >
              Book Your Live Demo
            </a>
            <a
              href="#af-video"
              className="bg-[#fffcf7] hover:bg-white hover:shadow-md border-2 border-[#8E7862] text-[#7D5B20] py-2 px-6 rounded-lg text-sm md:text-base font-medium transition-all flex items-center gap-2"
            >
              Watch Demo Video
            </a>
          </div>

          {/* Environmental Impact Stats */}
          <div className="w-full max-w-screen-md mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-xs md:text-sm">
            <div className="rounded-xl p-4 bg-[#FAF9F6] border border-[#EFEEE9] flex flex-col items-center gap-2">
              <img
                src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/carbon-af.png"
                alt="Carbon offset"
                className="h-[90px] md:h-[120px] object-contain"
              />
              <span className="text-xl md:text-2xl font-bold text-[#7D5B20]">
                <AnimatedCounter end={45708} />
              </span>
              <p className="font-bold text-[#1f1f1f]">Kilograms of <br />Carbon Offset</p>
            </div>

            <div className="rounded-xl p-4 bg-[#FAF9F6] border border-[#EFEEE9] flex flex-col items-center gap-2">
              <img
                src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/artisan-hour-af.png"
                alt="Hours of artisan work"
                className="h-[90px] md:h-[120px] object-contain"
              />
              <span className="text-xl md:text-2xl font-bold text-[#7D5B20]">
                <AnimatedCounter end={107548} />
              </span>
              <p className="font-bold text-[#1f1f1f]">Hours of Work of <br />500+ Artisans</p>
            </div>

            <div className="rounded-xl p-4 bg-[#FAF9F6] border border-[#EFEEE9] flex flex-col items-center gap-2">
              <img
                src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/water-saving-af.png"
                alt="Litres of water savings"
                className="h-[90px] md:h-[120px] object-contain"
              />
              <span className="text-xl md:text-2xl font-bold text-[#7D5B20]">
                <AnimatedCounter end={966253} />
              </span>
              <p className="font-bold text-[#1f1f1f]">Litres of Water <br />Savings</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DEMO VIDEO PLAYER SECTION */}
      <section id="af-video" className="w-full flex flex-col justify-center items-center py-12 bg-[#f7f7f7] border-b border-[#EFEEE9]">
        <div className="container max-w-[989px] px-4 flex flex-col items-center text-center">
          <div className="relative w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 cursor-pointer" onClick={toggleDemoVideo}>
            <video
              ref={videoRef}
              src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/artisan-flow-demo-desktop.mp4"
              poster="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/artisan-flow-video-thumnail-desktop.png"
              playsInline
              muted
              className="w-full h-auto object-cover"
            />
            {!isPlayingVideo && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#93805D] text-white flex items-center justify-center shadow-xl">
                  <span className="material-symbols-outlined text-4xl">play_arrow</span>
                </div>
              </div>
            )}
          </div>
          <p className="text-sm md:text-base text-gray-700 font-medium mt-4">
            ArtisanFlow: Weaving trust through transparency
          </p>
        </div>
      </section>

      {/* 3. KEY FEATURES SECTION */}
      <section className="w-full py-16 bg-[#FAF9F6] border-b border-[#EFEEE9]">
        <div className="container max-w-screen-md mx-auto px-4">
          <h2 className="fb-font-dm text-2xl sm:text-4xl text-black font-medium text-center mb-10">
            <span className="text-[#7D5B20]">Key Features</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="rounded-xl p-6 bg-white border border-gray-100 shadow-xs flex flex-col gap-3">
              <span className="material-symbols-outlined text-3xl text-[#7D5B20]">update</span>
              <h3 className="font-bold text-base text-[#1f1f1f]">Real Time Tracking</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Track your order from the initial preparation of fiber, through weaving and dyeing, to quality checks of your apparel, home, or accessory products.
              </p>
            </div>

            <div className="rounded-xl p-6 bg-white border border-gray-100 shadow-xs flex flex-col gap-3">
              <span className="material-symbols-outlined text-3xl text-[#7D5B20]">interactive_space</span>
              <h3 className="font-bold text-base text-[#1f1f1f]">Behind The Scenes Insights</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Get an exclusive glimpse into the artisanal process. Learn about the dedicated artisans who bring your product to life and witness their exceptional craftsmanship.
              </p>
            </div>

            <div className="rounded-xl p-6 bg-white border border-gray-100 shadow-xs flex flex-col gap-3">
              <span className="material-symbols-outlined text-3xl text-[#7D5B20]">subscriptions</span>
              <h3 className="font-bold text-base text-[#1f1f1f]">End-to-End Transparency</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Real-time data on every phase of production: Access photos, videos, and inspection reports for every production milestone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. REAL-TIME TRACKING FEATURE BLOCK */}
      <section className="w-full py-16 bg-white border-b border-[#EFEEE9]">
        <div className="container max-w-screen-lg mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <img
            src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/af-1.jpg"
            alt="Simplifying Supply Chains with Real-Time Tracking"
            className="rounded-xl max-h-[370px] object-contain shadow-sm"
          />
          <div className="flex-1">
            <h3 className="fb-font-dm text-2xl font-medium text-[#1f1f1f] mb-3">
              Simplifying Supply Chains with Real-Time Tracking
            </h3>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              Managing an <strong>artisanal supply chain</strong> has never been easier. Our platform <strong>simplifies supply chain complexity</strong> by providing <strong>real-time tracking &amp; analytics</strong> at every stage of production. From <strong>sourcing raw materials</strong> to final delivery, users gain complete <strong>transparency &amp; visibility</strong> into their <strong>manufacturing workflow</strong>, ensuring they stay informed and in control.
            </p>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS TIMELINE */}
      <section className="w-full py-16 md:py-24 bg-[#FAF9F6] border-b border-[#EFEEE9]">
        <div className="container max-w-screen-lg mx-auto px-4">
          <h2 className="fb-font-dm text-2xl sm:text-4xl text-black font-medium text-center mb-12">
            How It <span className="text-[#7D5B20]">Works</span>
          </h2>

          <div className="space-y-12">
            {[
              {
                num: "01",
                title: "Place Your Order",
                desc: "Choose from our catalogue or share your custom requirements",
                img: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/place-order.png"
              },
              {
                num: "02",
                title: "Track Progress",
                desc: "Follow your order’s journey through our transparent, traceable system.",
                img: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/progress.png"
              },
              {
                num: "03",
                title: "Receive Updates",
                desc: "Receive notification on every step of the production process directly from the artisans",
                img: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/updates.png"
              },
              {
                num: "04",
                title: "Get Insights",
                desc: "Follow your order’s progress and get insights on behind the scenes production",
                img: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/insights.png"
              },
              {
                num: "05",
                title: "Engage & Approve",
                desc: "View behind-the-scenes updates on your email/whatsapp, interact with production teams, and provide feedback to ensure quality.",
                img: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/engage.png"
              }
            ].map((step, idx) => (
              <div key={idx} className={`flex flex-col md:flex-row items-center gap-8 ${idx % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
                <div className="flex-1 bg-white p-6 md:p-8 rounded-xl shadow-xs border border-gray-100">
                  <span className="text-2xl font-bold text-[#7D5B20] block mb-2">{step.num}</span>
                  <h3 className="fb-font-dm text-xl font-medium text-[#1f1f1f] mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
                <div className="w-full md:w-[350px] shrink-0 flex justify-center">
                  <img src={step.img} alt={step.title} className="w-full max-w-[280px] h-auto object-contain" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CONNECTING ARTISANS SECTION */}
      <section className="w-full py-16 bg-white border-b border-[#EFEEE9]">
        <div className="container max-w-screen-lg mx-auto px-4 flex flex-col-reverse md:flex-row justify-between items-center gap-8">
          <div className="flex-1">
            <h3 className="fb-font-dm text-2xl font-medium text-[#1f1f1f] mb-3">
              Connecting Artisans to Global Buyers
            </h3>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              We bridge the gap between skilled <strong>artisans from distant rural villages</strong> and global buyers, enabling <strong>seamless connections</strong> within the supply chain. By <strong>connecting more than 500 artisans</strong>, we empower small-scale manufacturers to showcase their craft while ensuring <strong>quality of the outcome</strong>. This streamlined process fosters efficiency, reduces lead times, and delivers <strong>tangible value</strong> to businesses that prioritize authenticity and sustainability.
            </p>
          </div>
          <img
            src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/af-2.jpg"
            alt="Connecting Artisans to Global Buyers"
            className="rounded-xl max-h-[370px] object-contain shadow-sm"
          />
        </div>
      </section>

      {/* 7. FAQS SECTION */}
      <section className="w-full py-16 bg-[#FAF9F6] border-b border-[#EFEEE9]">
        <div className="container max-w-screen-md mx-auto px-4">
          <h2 className="fb-font-dm text-2xl md:text-3xl font-medium text-[#1f1f1f] text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-4">
            {ARTISANFLOW_FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="p-4 md:p-5 rounded-xl border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full flex justify-between items-center text-left font-medium text-base text-[#1f1f1f] hover:text-[#7D5B20] transition-colors"
                  >
                    <span>{faq.question}</span>
                    <span className="material-symbols-outlined text-gray-500">
                      {isOpen ? "arrow_drop_up" : "arrow_drop_down"}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="text-xs md:text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100 leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. ETHICAL SOURCING SECTION */}
      <section className="w-full py-16 bg-white border-b border-[#EFEEE9]">
        <div className="container max-w-screen-lg mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <img
            src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/af-3.jpg"
            alt="Driving Impact Through Ethical Sourcing"
            className="rounded-xl max-h-[370px] object-contain shadow-sm"
          />
          <div className="flex-1">
            <h3 className="fb-font-dm text-2xl font-medium text-[#1f1f1f] mb-3">
              Driving Impact Through Ethical Sourcing
            </h3>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              Our mission extends beyond efficiency—we focus on <strong>impact creation</strong> by fostering ethical sourcing and sustainable production. With end-to-end tracking, businesses can ensure that every step of the process adheres to fair trade and responsible manufacturing practices. By optimizing <strong>artisanal supply chain efficiency</strong>, we help brands unlock new opportunities while making a meaningful impact on artisan communities.
            </p>
          </div>
        </div>
      </section>

      {/* 9. BOOK A LIVE DEMO SECTION */}
      <section className="w-full py-16 md:py-24 bg-[#FAF9F6]">
        <div className="container max-w-screen-lg mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start gap-4">
            <h2 className="fb-font-dm text-3xl sm:text-5xl text-black font-medium leading-tight">
              Book A <span className="text-[#7D5B20]">Live Demo</span>
            </h2>
            <p className="text-sm md:text-base text-gray-700 max-w-md">
              Join 100+ brands trusting ArtisanFlow for ethical, transparent production.
            </p>
            <p className="text-xs md:text-sm text-gray-600 max-w-lg leading-relaxed">
              Discover how our platform streamlines operations while upholding the highest standards of accountability and integrity in every step of the production process. Experience the ArtisanFlow advantage today.
            </p>
            <a
              href="https://calendly.com/store-anuprerna/artisanflow"
              target="_blank"
              rel="noreferrer"
              className="bg-[#93805D] hover:bg-[#fffcf7] hover:shadow-md border-2 border-[#93805D] text-white hover:text-[#93805D] py-3 px-8 rounded-lg text-base font-medium transition-all inline-flex items-center gap-2 mt-2"
            >
              Book Your Live Demo
            </a>
          </div>

          <div className="w-full md:w-[48%] flex justify-center">
            <img
              src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/artisanflow-banner.png"
              alt="Artisan Flow Banner"
              className="w-full h-auto object-contain max-h-[350px]"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
