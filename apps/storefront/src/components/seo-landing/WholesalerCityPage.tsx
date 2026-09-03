import Link from 'next/link';
import Img from '@/components/ui/Img';
import CardPrice from './CardPrice';
import type { SeoProduct } from './loom';
import WhyPartner from './WhyPartner';
import ReviewsSection from './ReviewsSection';
import CityEnquiryForm from './CityEnquiryForm';
import Link from 'next/link';
import {
  WorkflowSection,
  WhyChooseSection,
  TrustedSupplierSection,
  SupplyChainSection,
  CertificationsSection,
  TrustedBrandsSection,
  ArtisanFlowSection,
  SourcingSolutionSection,
  PreferSection,
  JourneySection,
  FinalCtaSection,
} from './WholesalerCitySections';

interface WholesalerCityPageProps {
  city: string;       // display name e.g. "New York City"
  slug: string;       // url slug e.g. "new-york-city"
  products: SeoProduct[];
}

function CityProductCard({ product }: { product: SeoProduct }) {
  const href = `/product/${product.productGroup}-product/${product.slug}`;
  return (
    <a
      href={href}
      className="rounded-2xl overflow-hidden shadow-sm bg-[#F9F4F5] flex flex-col hover:shadow-md transition-shadow group"
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.heroImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-serif text-base font-semibold text-gray-900 line-clamp-2">
          {product.name}
        </h3>
        {product.specialStatus && (
          <span className="inline-block text-xs font-medium text-clay bg-white px-2 py-0.5 rounded-full w-fit border border-clay/30">
            {product.specialStatus}
          </span>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-gray-900">
            <CardPrice price={product.price} />
            <span className="text-xs text-gray-500 font-normal">/{product.unit || 'meter'}</span>
          </span>
          <span className="text-xs text-gray-500">{product.sku}</span>
        </div>
      </div>
    </a>
  );
}

export default function WholesalerCityPage({ city, slug, products }: WholesalerCityPageProps) {
  const heroProduct = products[0];

  return (
    <main>
      {/* Hero: dark background */}
      <section className="bg-[#2d3748] relative overflow-hidden py-20 lg:py-28">
        {/* Decorative blur circles */}
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#7D5B20', filter: 'blur(80px)', transform: 'translate(-30%, -30%)' }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
          style={{ background: '#8E7862', filter: 'blur(60px)', transform: 'translate(30%, 30%)' }}
          aria-hidden="true"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero text */}
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-white mb-6">
              Premium Fabric Wholesale Supplier In {city}
            </h1>

            {/* Quote block */}
            <blockquote className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 text-left">
              <p className="text-white/90 text-base italic leading-relaxed">
                &ldquo;We collaborate with leading fashion brands and designers to deliver customized,
                artisan-crafted fabrics with flexible MOQs.&rdquo;
              </p>
              <cite className="block mt-3 text-white/60 text-sm not-italic font-medium">
                — Our Commitment
              </cite>
            </blockquote>

            {/* Feature boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <FeatureBox icon="verified" label="Quality Fabrics" />
              <FeatureBox icon="local_offer" label="Wholesale Prices" />
              <FeatureBox icon="local_shipping" label="Global Delivery" />
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4 justify-center mb-10">
              <a
                href="#fabric-collection"
                className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Explore Our Collection
              </a>
              <a
                href="#contact-form"
                className="inline-flex items-center px-6 py-3 border-2 border-white text-white rounded-full font-medium hover:bg-white/10 transition-colors"
              >
                Contact
              </a>
              <a
                href="#contact-form"
                className="inline-flex items-center px-6 py-3 bg-clay text-white rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                Request a Quote (RFQ)
              </a>
              <Link
                href="/products/fabric?category=swatchkit"
                className="inline-flex items-center px-6 py-3 border-2 border-white text-white rounded-full font-medium hover:bg-white/10 transition-colors"
              >
                Order a SwatchKit
              </Link>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-12">
              <div className="text-center">
                <p className="font-serif text-3xl font-bold text-white">3000+</p>
                <p className="text-white/60 text-sm">Artisanal Fabrics</p>
              </div>
              <div className="text-center">
                <p className="font-serif text-3xl font-bold text-white">500+</p>
                <p className="text-white/60 text-sm">Artisans</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            className="h-px w-[60%] mx-auto"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
            }}
          />

          {/* Hero image (if product available) */}
          {heroProduct?.heroImage && (
            <div className="mt-12 relative h-[300px] md:h-[420px] w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
              <Img
                src={heroProduct.heroImage}
                alt={`Handloom fabric for ${city}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 48rem"
                priority
              />
            </div>
          )}
        </div>
      </section>

      {/* Why Partner — "Precision in every thread" */}
      <WhyPartner />

      {/* End-to-End Artisanal Workflow */}
      <WorkflowSection />

      {/* Why Choose Anuprerna for Wholesale Fabrics in {city}? */}
      <WhyChooseSection city={city} />

      {/* {city}'s Trusted Wholesale Fabric Supplier */}
      <TrustedSupplierSection city={city} />

      {/* A Supply Chain That Empowers & Sustains */}
      <SupplyChainSection />

      {/* Certifications & Standards */}
      <CertificationsSection />

      {/* Trusted by Leading Brands */}
      <TrustedBrandsSection city={city} />

      {/* Introducing Artisan Flow */}
      <ArtisanFlowSection city={city} />

      {/* Products — "Curated excellence" / Our Premium Collection */}
      <section id="fabric-collection" className="bg-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 text-center mb-10">
            Fabric Collection for {city}
          </h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <CityProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-12">
              Explore our full collection of handloom fabrics available for wholesale.
            </p>
          )}
        </div>
      </section>

      {/* Complete Fabric Sourcing Solution */}
      <SourcingSolutionSection city={city} />

      {/* Why Brands in {city} Prefer Anuprerna */}
      <PreferSection city={city} />

      {/* Anuprerna Unveiled: The Journey of Our Textiles */}
      <JourneySection />

      {/* What Our Clients Say */}
      <ReviewsSection />

      {/* Start Your Fabric Sourcing Journey Today (final CTA → scrolls to #contact-form) */}
      <FinalCtaSection city={city} />

      {/* Contact section — on-page enquiry form */}
      <section id="contact-form" className="bg-white py-16">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-gray-600">
              Looking for a fabric wholesaler in {city}? Send us your requirements for pricing,
              samples, and custom fabric orders.
            </p>
          </div>

          {/* Enquiry form (demo-safe — no message is sent) */}
          <CityEnquiryForm city={city} />

          {/* Secondary channels */}
          <div className="mt-10 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-sm mb-4">Or reach us directly</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:hello@anuprerna.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">mail</span>
                hello@anuprerna.com
              </a>
              <a
                href="https://wa.me/918653403212"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-900 text-gray-900 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
                WhatsApp Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureBox({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center gap-2">
      <span className="material-symbols-outlined text-white text-2xl">{icon}</span>
      <span className="text-white/90 text-sm font-medium">{label}</span>
    </div>
  );
}
