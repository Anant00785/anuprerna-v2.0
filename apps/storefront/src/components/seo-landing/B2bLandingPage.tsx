'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Img from '@/components/ui/Img';
import type { SeoProduct } from './loom';
import ProductGrid from './ProductGrid';
import WhyPartner from './WhyPartner';
import ReviewsSection from './ReviewsSection';
import CardPrice from './CardPrice';
import { buildB2bFaqs } from './b2bFaqs';

export type B2bVariant =
  | 'fabric-type'
  | 'fabric-pattern'
  | 'craft-material'
  | 'craft-pattern'
  | 'pattern-material'
  | 'craft-color';

interface B2bLandingPageProps {
  slug: string;
  variant: B2bVariant;
  products: SeoProduct[];
  heroImageUrl?: string;
}

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function extractColor(slug: string): string {
  const common = ['cotton', 'silk', 'linen', 'khadi', 'wool', 'fabric', 'pattern', 'craft', 'material', 'color'];
  const words = slug.split('-').filter((w) => !common.includes(w.toLowerCase()));
  return words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : 'Other';
}

function extractMaterial(slug: string): string {
  const materials = ['cotton', 'silk', 'linen', 'khadi', 'wool', 'jute', 'hemp'];
  const words = slug.split('-');
  const found = words.find((w) => materials.includes(w.toLowerCase()));
  return found ? found.charAt(0).toUpperCase() + found.slice(1) : 'Artisan';
}

const RELATED_COLORS = [
  { color: 'blue', label: 'Blue' },
  { color: 'red', label: 'Red' },
  { color: 'green', label: 'Green' },
  { color: 'yellow', label: 'Yellow' },
  { color: 'white', label: 'White' },
  { color: 'black', label: 'Black' },
  { color: 'grey', label: 'Grey' },
  { color: 'pink', label: 'Pink' },
  { color: 'purple', label: 'Purple' },
  { color: 'orange', label: 'Orange' },
  { color: 'teal', label: 'Teal' },
  { color: 'navy', label: 'Navy' },
  { color: 'maroon', label: 'Maroon' },
  { color: 'mustard', label: 'Mustard' },
  { color: 'beige', label: 'Beige' },
  { color: 'brown', label: 'Brown' },
];

const S3_BASE = 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/p-seo';

const COUNTRY_LIST_URL =
  'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/static-data/country_metadata.json';

// Fallback list used if the S3 country metadata fetch fails.
const FALLBACK_COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Australia', 'Canada',
  'Germany', 'France', 'Netherlands', 'Japan', 'United Arab Emirates',
  'Singapore', 'Bangladesh', 'China', 'Italy', 'Spain',
];

type FormState = 'idle' | 'busy' | 'done' | 'error';

/** FIX P-2/P-5: Lead-gen contact form matching live 7-field schema with dynamic country list */
function ContactForm({ title }: { title: string }) {
  const [state, setState] = useState<FormState>('idle');
  const [countries, setCountries] = useState<string[]>(FALLBACK_COUNTRIES);
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    country: '',
    quantityRequired: '',
    productDetails: '',
  });

  useEffect(() => {
    let active = true;
    fetch(COUNTRY_LIST_URL)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Array<{ name?: string }>) => {
        if (!active || !Array.isArray(data)) return;
        const names = data.map((c) => c?.name).filter((n): n is string => !!n);
        if (names.length) setCountries(names);
      })
      .catch(() => {
        /* keep fallback list */
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setState('busy');
    // In demo mode: simulate a short delay then show success
    setTimeout(() => setState('done'), 800);
  };

  if (state === 'done') {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-5xl text-green-600 mb-4 block" aria-hidden="true">check_circle</span>
        <h3 className="font-serif text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
        <p className="text-gray-600">
          We&rsquo;ll get back to you within 24 hours with pricing and samples for {title.toLowerCase()}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name *</label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          value={form.fullName}
          onChange={handleChange}
          placeholder="Enter your name"
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay/30"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="companyName" className="text-sm font-medium text-gray-700">Company Name *</label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          required
          value={form.companyName}
          onChange={handleChange}
          placeholder="Your company name"
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay/30"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address *</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          placeholder="your@email.com"
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay/30"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number *</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          value={form.phone}
          onChange={handleChange}
          placeholder="Enter your phone number"
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay/30"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="country" className="text-sm font-medium text-gray-700">Country *</label>
        <select
          id="country"
          name="country"
          required
          value={form.country}
          onChange={handleChange}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 bg-white focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay/30"
        >
          <option value="">Select your country</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="quantityRequired" className="text-sm font-medium text-gray-700">Quantity Required *</label>
        <input
          id="quantityRequired"
          name="quantityRequired"
          type="text"
          required
          value={form.quantityRequired}
          onChange={handleChange}
          placeholder="Enter required quantity"
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay/30"
        />
      </div>

      <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor="productDetails" className="text-sm font-medium text-gray-700">
          Product Details (Please share any customisation required)
        </label>
        <textarea
          id="productDetails"
          name="productDetails"
          rows={4}
          value={form.productDetails}
          onChange={handleChange}
          placeholder={`Tell us about your ${title.toLowerCase()} requirements, custom colours, and delivery timeline...`}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-clay focus:outline-none focus:ring-1 focus:ring-clay/30 resize-none"
        />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={state === 'busy'}
          className="w-full sm:w-auto px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {state === 'busy' ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </form>
  );
}

/** FIX 3b: FAQ accordion — 8-item "FAQs about <title>" section */
function FaqAccordion({ title }: { title: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = buildB2bFaqs(title);

  return (
    <div className="divide-y divide-gray-100">
      {faqs.map((faq, i) => (
        <div key={i} className="py-4">
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-start justify-between gap-4 text-left"
            aria-expanded={openIndex === i}
          >
            <span className="text-sm font-medium text-gray-900 leading-snug">{faq.q}</span>
            <span className="material-symbols-outlined text-clay flex-shrink-0 transition-transform duration-200" aria-hidden="true" style={{ transform: openIndex === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              expand_more
            </span>
          </button>
          {openIndex === i && (
            <p className="mt-3 text-sm text-gray-600 leading-relaxed pr-8">
              {faq.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function FeatureBadge({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 h-8 rounded-full bg-[#E9F1ED] flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-sm text-gray-700" aria-hidden="true">{icon}</span>
      </span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  );
}

/** P-1: Featured Products — 4 interactive tabs (Fabrics / Accessories / Homeware / Apparel) */
const FEATURED_TABS = ['Fabrics', 'Accessories', 'Homeware', 'Apparel'] as const;
function FeaturedProducts({ products, title }: { products: SeoProduct[]; title: string }) {
  const [activeTab, setActiveTab] = useState(0);

  // Demo data is a single product feed; partition it across the 4 tabs so each
  // tab swaps the visible cards (mirrors live, where each tab loads its own category).
  const buckets: SeoProduct[][] = [[], [], [], []];
  products.forEach((p, i) => {
    buckets[i % FEATURED_TABS.length].push(p);
  });
  // Ensure every tab has something to show; fall back to the head of the feed.
  const tabProducts = buckets.map((b) => (b.length ? b : products.slice(0, 4))).map((b) => b.slice(0, 4));
  const visible = tabProducts[activeTab];

  if (!products.length) return null;

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-clay mb-2">Our</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900">
              Featured Products
            </h2>
            <Link
              href="/products/fabric"
              className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-clay hover:underline"
            >
              Discover More
              <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
            </Link>
          </div>

          {/* Tab controls */}
          <div role="tablist" aria-label="Featured product categories" className="flex flex-wrap gap-2">
            {FEATURED_TABS.map((tab, i) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === i}
                onClick={() => setActiveTab(i)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === i
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visible.map((product) => {
            const href = `/product/${product.productGroup}-product/${product.slug}`;
            return (
              <a
                key={`${activeTab}-${product.id}`}
                href={href}
                className="group rounded-xl overflow-hidden bg-[#F9F4F5] flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.heroImage}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <h3 className="font-serif text-sm font-semibold text-gray-900 line-clamp-2">
                    {product.name}
                  </h3>
                  <span className="font-medium text-sm text-gray-900">
                    <CardPrice price={product.price} />
                    <span className="text-xs text-gray-500 font-normal">/{product.unit || 'meter'}</span>
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** P-4: Explore More Colors — View All / View Less toggle (initial subset → all) */
const EXPLORE_INITIAL_COUNT = 4;
function ExploreColors({
  variant,
  material,
  color,
}: {
  variant: B2bVariant;
  material: string;
  color: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const allColors = RELATED_COLORS.filter((c) => c.color !== color.toLowerCase());
  const visible = expanded ? allColors : allColors.slice(0, EXPLORE_INITIAL_COUNT);
  const canToggle = allColors.length > EXPLORE_INITIAL_COUNT;

  return (
    <section className="bg-[#EAEBF1] py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
          Explore More {material} Fabrics in Other Colors
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {visible.map((c) => (
            <a
              key={c.color}
              href={`/b2b/${variant}/${c.color}-${material.toLowerCase()}-fabric`}
              className="rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="relative aspect-square">
                <img
                  src={`${S3_BASE}/${c.color}/1.png`}
                  alt={`${c.label} ${material} fabric`}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-center text-sm font-medium text-gray-800 py-3 px-1 group-hover:text-clay transition-colors">
                {c.label}
              </p>
            </a>
          ))}
        </div>
        {canToggle && (
          <div className="text-center mt-8">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="px-6 py-3 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
            >
              {expanded ? 'View Less' : `View All ${material} Fabrics`}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function CertificationsRow() {
  const certs = ['Handloom Mark', 'GOTS Certified', 'GOTS-Certified Raw Material', 'Natural Dyes'];
  return (
    <section className="bg-white py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Certifications &amp; Standards
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-10">
          Our fabrics and raw materials are produced to recognised handloom and organic-textile standards.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {certs.map((c) => (
            <div key={c} className="bg-[#E9F1ED] rounded-2xl p-5 flex flex-col items-center gap-2">
              <span aria-hidden="true" className="material-symbols-outlined text-clay text-3xl">verified</span>
              <span className="text-sm font-medium text-gray-800">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function B2bLandingPage({
  slug,
  variant,
  products,
  heroImageUrl,
}: B2bLandingPageProps) {
  const title = slugToTitle(slug);
  const material = extractMaterial(slug);
  const color = extractColor(slug);

  const defaultHeroImage = `${S3_BASE}/blue/1.png`;
  const heroImg = heroImageUrl || (products[0]?.heroImage ?? defaultHeroImage);


  return (
    <main>
      {/* Section 1: Hero */}
      <section className="bg-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text column */}
            <div className="flex flex-col gap-6">
              <h1 className="font-serif text-4xl lg:text-6xl font-bold capitalize text-gray-900">
                {title} for Sustainable Fashion &amp; Bulk Sourcing
              </h1>
              <p className="max-w-xl text-lg text-gray-600">
                Discover premium handwoven {title.toLowerCase()} directly from master artisans across
                India. Flexible MOQs, custom dyeing, and global delivery for fashion brands and
                designers.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-4">
                <a
                  href="#explore-collection"
                  className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
                >
                  Explore Collection
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center px-6 py-3 border-2 border-gray-900 text-gray-900 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  Contact Us
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center px-6 py-3 bg-clay text-white rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                  Request a Quote (RFQ)
                </a>
                <Link
                  href="/products/fabric?category=swatchkit"
                  className="inline-flex items-center px-6 py-3 border-2 border-gray-900 text-gray-900 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  Order a SwatchKit
                </Link>
              </div>

              {/* Feature badges */}
              <div className="flex flex-wrap gap-4 pt-2">
                <FeatureBadge icon="verified" label="Quality Fabrics" />
                <FeatureBadge icon="sell" label="Wholesale Pricing" />
                <FeatureBadge icon="public" label="Global Delivery" />
              </div>
            </div>

            {/* Image column */}
            <div className="relative h-[400px] lg:h-[560px] w-full">
              <Img
                src={heroImg}
                alt={`${title} — Anuprerna`}
                fill
                className="rounded-[24px] object-cover shadow-2xl"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Explore Collection */}
      <section id="explore-collection" className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 text-center mb-10">
            Explore Our Collection
          </h2>
          <ProductGrid products={products} />
        </div>
      </section>

      {/* Section 3: For Brands content / intro text (P-6: warm pink-tint bg) */}
      <section className="bg-[#F9F4F5] py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Premium {title} for Designers &amp; Brands
          </h2>
          <div className="max-w-3xl space-y-4 text-gray-600 leading-relaxed">
            <p>
              Our {title.toLowerCase()} collection is crafted by artisans who have honed their skills
              across generations. Each piece represents hours of meticulous handwork — from the
              initial spinning of yarn to the final weave — resulting in fabrics that carry the
              character and warmth that only human hands can produce. We work directly with weaving
              clusters across Odisha, West Bengal, and Rajasthan to bring you authentic handloom at
              competitive wholesale prices.
            </p>
            <p>
              Whether you are a fashion designer sourcing signature fabrics, a sustainable brand
              building an ethical supply chain, or a retailer looking to differentiate your offering,
              our {title.toLowerCase()} delivers on all fronts. With flexible minimum order quantities,
              custom colorways, and dedicated sampling support, we make artisan textiles accessible at
              every scale.
            </p>
          </div>
          {/* Full-width image */}
          <div className="mt-10 relative h-[260px] md:h-[420px] w-full rounded-2xl overflow-hidden">
            <Img
              src={products[1]?.heroImage ?? heroImg}
              alt={`${title} fabric texture — Anuprerna`}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        </div>
      </section>

      {/* Section 4: Why Partner */}
      <WhyPartner />

      {/* Certifications & Standards */}
      <CertificationsRow />

      {/* Section 5: Reviews */}
      <ReviewsSection />

      {/* Section 6: Explore More Colors (P-4: View All / View Less toggle) */}
      <ExploreColors variant={variant} material={material} color={color} />

      {/* P-1: Our Featured Products — 4 interactive tabs that swap the product carousel */}
      <FeaturedProducts products={products} title={title} />

      {/* FIX 3b: FAQs about <title> — 8-item accordion */}
      <section className="bg-[#F9F4F5] py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-10">
            FAQs about {title}
          </h2>
          <FaqAccordion title={title} />
        </div>
      </section>

      {/* FIX 3a: "Start Your Fabric Sourcing Journey" lead-gen contact form */}
      <section id="contact" className="bg-white py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Start Your Fabric Sourcing Journey
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Fill in the form below and our wholesale team will get back to you within 24 hours with
              pricing, samples, and custom options for {title.toLowerCase()}.
            </p>
          </div>
          <ContactForm title={title} />
        </div>
      </section>
    </main>
  );
}
