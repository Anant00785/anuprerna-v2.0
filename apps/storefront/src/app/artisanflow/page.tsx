import Image from 'next/image';
import type { CSSProperties } from 'react';
import JsonLd from '@/components/seo/JsonLd';

export const metadata = { title: 'ArtisanFlow — Anuprerna' };

const CDN = 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/';

const FEATURES = [
  { img: CDN + 'af-1.jpg', title: 'Real Time Tracking', desc: 'Track your order from the initial preparation of fiber, through weaving and dyeing, to quality checks of your apparel, home, or accessory products.' },
  { img: CDN + 'af-2.jpg', title: 'Behind The Scenes Insights', desc: 'Get an exclusive glimpse into the artisanal process. Learn about the dedicated artisans who bring your product to life and witness their exceptional craftsmanship.' },
  { img: CDN + 'af-3.jpg', title: 'End-to-End Transparency', desc: 'Real-time data on every phase of production: Access photos, videos, and inspection reports for every production milestone.' },
];

const HOW_IT_WORKS = [
  { step: '01', img: CDN + 'place-order.png', title: 'Place Your Order', desc: 'Choose from our catalogue or share your custom requirements.' },
  { step: '02', img: CDN + 'progress.png', title: 'Track Progress', desc: "Follow your order's journey through our transparent, traceable system." },
  { step: '03', img: CDN + 'updates.png', title: 'Receive Updates', desc: 'Receive notification on every step of the production process directly from the artisans.' },
  { step: '04', img: CDN + 'insights.png', title: 'Get Insights', desc: "Follow your order's progress and get insights on behind the scenes production." },
  { step: '05', img: CDN + 'engage.png', title: 'Engage & Approve', desc: 'View behind-the-scenes updates on your email/WhatsApp, interact with production teams, and provide feedback to ensure quality.' },
];

const FAQS = [
  { q: 'Can I use ArtisanFlow for small orders?', a: 'Absolutely! Track orders for your sampling & small production as well.' },
  { q: 'How do artisans interact with the platform?', a: 'Our team closely works with every artisan at every step of the production to provide you live updates.' },
  { q: 'How does ArtisanFlow ensure transparency in the production process?', a: 'Every step of production is logged in real-time, allowing you to track timelines, materials, and artisan contributions with complete visibility.' },
  { q: 'Can I communicate directly with artisans?', a: 'While artisans update their progress via the platform, our team acts as a bridge to facilitate seamless communication and feedback.' },
];

// Labels corrected to match the live source (fabric-flow-stats.component.html) — see the
// same fix already applied in components/ArtisanFlow.tsx (F-H9). Previously mislabeled as
// "Production Meters" / "KM Travelled", which did not match these metrics.
const STATS: { value: string; label: string }[] = [
  { value: '45708+', label: 'Kilograms of Carbon Offset' },
  { value: '107546+', label: 'Artisan Hours' },
  { value: '966252+', label: 'Litres of Water Savings' },
];

const ABOUT_ARTICLES = [
  { href: '/content/about-us/about-the-brand/56485', img: 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/457WOCA00DLL3UJ6VOR1Z5LMYFW706547.jpg', label: 'ABOUT THE BRAND', title: 'About The Brand' },
  { href: '/content/about-us/the-artisans/56487', img: 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/27GKJDFKH793HBXR7JLQZH14Q6VV00195.jpg', label: 'ABOUT THE BRAND', title: 'About The Artisans' },
  { href: '/content/about-us/our-philosophy/56488', img: 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/61XJHL0BDUKIPBPUU39N7X1YFUHU02220.jpg', label: 'ABOUT THE BRAND', title: 'Our Philosophy' },
];

// FAQPage schema — mirrors the rendered FAQS content below (real, on-page Q&A).
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export default function ArtisanFlowPage() {
  return (
    <main className="bg-white text-black">
      <JsonLd data={faqJsonLd} />

      {/* Hero — dark background with mist video */}
      <section className="relative overflow-hidden bg-[#1a1410] text-white">
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-25"
          src={CDN + 'artisan-flow-mist.mp4'}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="relative mx-auto max-w-screen-xl px-5 py-16 sm:py-24 text-center">
          <p className="text-xs uppercase tracking-[.25em] text-amber-200/80 mb-4">
            EMBRACE transparency, EMPOWER artisans, and ENABLE a sustainable future.
          </p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium text-white mb-6">
            Introducing ArtisanFlow
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-white/70 mb-12">
            Our proprietary tech solution ensures full transparency and visibility across our artisanal
            supply chain, empowering you with real-time insights at every production stage.
          </p>
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <span className="text-2xl sm:text-3xl font-bold text-amber-300">{s.value}</span>
                <span className="text-[11px] text-white/50 mt-1 text-center leading-snug">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ArtisanFlow branded card section */}
      <section className="bg-[#f5f0e8] py-16 px-5">
        <div className="mx-auto max-w-screen-xl">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="w-full lg:w-auto lg:flex-shrink-0">
              <div className="relative mx-auto max-w-xs rounded-2xl overflow-hidden shadow-2xl border border-black/10">
                <Image
                  src={CDN + 'artisanflow-banner.png'}
                  alt="ArtisanFlow app"
                  width={340}
                  height={480}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            <div className="flex-1 text-center lg:text-left">
              <p className="text-[10px] uppercase tracking-widest text-clay mb-2">Anuprerna presents</p>
              <div className="mb-4">
                <span className="block text-4xl sm:text-6xl font-bold text-clay leading-tight">Artisan</span>
                <span className="block text-4xl sm:text-6xl font-bold text-clay leading-tight">Flow</span>
              </div>
              <p className="text-base text-black/70 max-w-lg leading-relaxed mb-8">
                Managing an artisanal supply chain has never been easier. Our platform simplifies supply
                chain complexity by providing real-time tracking &amp; analytics at every stage of production.
              </p>
              <div className="flex flex-col gap-3 max-w-xs mx-auto lg:mx-0">
                <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-md border border-black/5">
                  <span aria-hidden="true" className="material-symbols-outlined text-clay text-xl">mail</span>
                  <span className="text-sm font-medium text-black">Mail from Anuprerna</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-md border border-black/5">
                  <span aria-hidden="true" className="material-symbols-outlined text-clay text-xl">dashboard</span>
                  <span className="text-sm font-medium text-black">Anuprerna Dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features with photo cards */}
      <section className="py-16 px-5 bg-white">
        <div className="mx-auto max-w-screen-xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-medium text-clay mb-2">
              ArtisanFlow: Weaving trust through transparency
            </h2>
            <p className="text-sm text-bark uppercase tracking-widest mt-1">Key Features</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-sand rounded-xl overflow-hidden flex flex-col hover:shadow-md transition">
                <div className="relative w-full aspect-[4/3] overflow-hidden">
                  <Image src={f.img} alt={f.title} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
                </div>
                <div className="p-6 flex flex-col gap-2 flex-1">
                  <h3 className="text-base font-medium text-clay">{f.title}</h3>
                  <p className="text-sm text-black/70 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supply chain with image */}
      <section className="bg-sand py-16 px-5">
        <div className="mx-auto max-w-screen-xl flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-medium text-clay mb-4">
              Simplifying Supply Chains with Real-Time Tracking
            </h2>
            <p className="text-base text-black/70 leading-relaxed">
              Managing an artisanal supply chain has never been easier. Our platform simplifies supply
              chain complexity by providing real-time tracking &amp; analytics at every stage of
              production. From sourcing raw materials to final delivery, users gain complete
              transparency &amp; visibility into their manufacturing journey — ensuring quality,
              accountability, and trust at every step.
            </p>
          </div>
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
              <Image
                src={CDN + 'artisan-flow-video-thumnail-desktop.png'}
                alt="ArtisanFlow tracking dashboard"
                fill
                sizes="(max-width:1024px) 100vw, 320px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — vertical illustrated timeline */}
      <section className="mx-auto max-w-screen-xl px-5 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-medium text-clay mb-2 text-center">How It Works</h2>
        <p className="text-center text-black/60 mb-14 text-sm">A simple, traceable journey from order to delivery.</p>
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-clay/20 -translate-x-1/2 hidden sm:block" />
          <div className="flex flex-col gap-12">
            {HOW_IT_WORKS.map((s, i) => (
              <div
                key={s.step}
                className="flex flex-col sm:flex-row items-center gap-6"
                style={{ flexDirection: (i % 2 === 0 ? 'row' : 'row-reverse') } as CSSProperties}
              >
                <div className="flex-1" style={{ textAlign: (i % 2 === 0 ? 'right' : 'left') } as CSSProperties}>
                  <span className="text-4xl font-bold text-clay/20 leading-none">{s.step}</span>
                  <h3 className="text-base font-medium text-clay mt-1">{s.title}</h3>
                  <p className="text-sm text-black/60 mt-1 leading-relaxed">{s.desc}</p>
                </div>
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-clay text-white items-center justify-center font-bold text-xs flex-shrink-0 z-10 shadow-md">
                  {s.step}
                </div>
                <div className="flex-1 flex" style={{ justifyContent: (i % 2 === 0 ? 'flex-start' : 'flex-end') } as CSSProperties}>
                  <div className="relative w-48 aspect-[4/3] rounded-xl overflow-hidden shadow-md bg-sand">
                    <Image src={s.img} alt={s.title} fill sizes="200px" className="object-contain p-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Connecting Artisans with photo */}
      <section className="bg-sand py-16 px-5">
        <div className="mx-auto max-w-screen-xl flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-medium text-clay mb-4">
              Connecting Artisans to Global Buyers
            </h2>
            <p className="text-base text-black/70 leading-relaxed">
              We bridge the gap between skilled artisans from distant rural villages and global buyers,
              enabling seamless connections within the supply chain. By connecting more than 500
              artisans, we empower small-scale manufacturers to showcase their craft while ensuring
              quality of the outcome. This streamlined approach not only benefits buyers but also
              uplifts artisan communities by providing them with fair wages and sustainable livelihoods.
            </p>
          </div>
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-lg">
              <Image
                src={CDN + 'af-2.jpg'}
                alt="Artisan at work"
                fill
                sizes="(max-width:1024px) 100vw, 288px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-screen-xl px-5 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-medium text-clay mb-8 text-center">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {FAQS.map((item) => (
            <div key={item.q} className="border-l-2 border-clay/30 pl-5">
              <h3 className="font-medium text-sm mb-2">{item.q}</h3>
              <p className="text-sm text-black/60 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact CTA */}
      <section className="bg-clay text-white py-16 sm:py-20 px-5 text-center">
        <h2 className="text-2xl sm:text-3xl font-medium mb-4">Driving Impact Through Ethical Sourcing</h2>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-white/80 leading-relaxed mb-8">
          Our mission extends beyond efficiency — we focus on impact creation by fostering ethical
          sourcing and sustainable production. With end-to-end tracking, businesses can ensure that
          every step of the process adheres to fair trade and responsible manufacturing practices.
        </p>
        <a href="/contact" className="inline-block px-8 py-3 bg-white text-clay text-sm font-medium hover:bg-white/90 transition rounded">
          Book a Demo
        </a>
      </section>

      {/* Read More About Us */}
      <section className="mx-auto max-w-screen-xl px-5 py-14 sm:py-16">
        <h2 className="text-xl sm:text-2xl font-medium text-clay mb-8">Read More About Us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {ABOUT_ARTICLES.map((a) => (
            <a key={a.href} href={a.href} className="group block rounded-xl overflow-hidden border border-black/8 hover:shadow-md transition">
              <div className="relative w-full aspect-[4/3] overflow-hidden bg-sand">
                <Image src={a.img} alt={a.title} fill sizes="(max-width:640px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-widest text-bark mb-1">{a.label}</p>
                <h3 className="text-sm font-medium text-black group-hover:text-clay transition-colors">{a.title}</h3>
              </div>
            </a>
          ))}
        </div>
      </section>

    </main>
  );
}
