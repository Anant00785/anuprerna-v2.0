import Img from '@/components/ui/Img';

const AF_CDN = 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/';

/* ------------------------------------------------------------------ */
/* 1. End-to-End Artisanal Workflow (static)                           */
/* ------------------------------------------------------------------ */

const WORKFLOW_STEPS = [
  { step: '1', img: AF_CDN + 'place-order.png', title: 'Place Your Order', desc: 'Choose from our catalogue or share your custom requirements.' },
  { step: '2', img: AF_CDN + 'progress.png', title: 'Track Progress', desc: "Follow your order's journey through our transparent, traceable system." },
  { step: '3', img: AF_CDN + 'updates.png', title: 'Receive Updates', desc: 'Receive notification on every step of the production process directly from the artisans.' },
  { step: '4', img: AF_CDN + 'insights.png', title: 'Get Insights', desc: "Follow your order's progress and get insights on behind the scenes production." },
  { step: '5', img: AF_CDN + 'engage.png', title: 'Engage & Approve', desc: 'View behind-the-scenes updates on your email/WhatsApp, interact with production teams, and provide feedback to ensure quality.' },
];

export function WorkflowSection() {
  return (
    <section className="bg-sand py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            End-to-End Artisanal Workflow
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From placing your order to real-time updates, experience complete transparency at every step.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {WORKFLOW_STEPS.map((s) => (
            <div key={s.step} className="bg-white rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
              <div className="relative w-20 h-20 mb-4">
                <Img src={s.img} alt={s.title} fill sizes="80px" className="object-contain" />
              </div>
              <span className="w-7 h-7 rounded-full bg-clay text-white text-xs font-bold flex items-center justify-center mb-3">
                {s.step}
              </span>
              <h3 className="font-serif text-base font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm font-light leading-relaxed text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Why Choose Anuprerna for Wholesale Fabrics in {City}? (templated) */
/* ------------------------------------------------------------------ */

const WHY_CHOOSE = [
  { icon: 'spa', title: 'Premium Natural Fabrics Collection', desc: 'Source from Khadi, Cotton, Linen, Mulberry Silk, Ketya Silk, Matka Silk, Jamdani, and Kantha—crafted from organic, 100% natural fibres including cotton, silk, wool, bamboo, hemp, banana, and corn.' },
  { icon: 'palette', title: 'Custom Design & Printing Options', desc: 'Choose from digital printing, hand block printing, handprinted batik, screen printing, and distinctive dyed prints like Ikat, Shibori, and Tie-Dye.' },
  { icon: 'factory', title: 'End-to-End Manufacturing', desc: 'Complete solutions for apparel, home textiles, and accessories—from design customization to bulk production.' },
  { icon: 'verified', title: 'Global Quality Standards', desc: 'Every fabric undergoes strict quality checks, ensuring only the finest materials reach your brand.' },
];

export function WhyChooseSection({ city }: { city: string }) {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Choose Anuprerna for Wholesale Fabrics in {city}?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We pride ourselves on delivering exceptional quality, service and value to all our customers.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_CHOOSE.map((c) => (
            <div key={c.title} className="bg-[#F9F4F5] rounded-2xl p-6 flex flex-col gap-3">
              <span aria-hidden="true" className="material-symbols-outlined text-clay text-3xl">{c.icon}</span>
              <h3 className="font-serif text-lg font-semibold text-gray-900">{c.title}</h3>
              <p className="text-sm font-light leading-relaxed text-gray-600">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. {City}'s Trusted Wholesale Fabric Supplier (templated)           */
/* ------------------------------------------------------------------ */

const TRUSTED_STATS = [
  { value: '500+', label: 'Active Fashion Brands' },
  { value: '15+', label: 'Years of Excellence' },
  { value: '50k+', label: 'Orders Delivered' },
  { value: '98%', label: 'Client Satisfaction' },
];

export function TrustedSupplierSection({ city }: { city: string }) {
  return (
    <section className="bg-[#2d3748] text-white py-16 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">
          {city}&rsquo;s Trusted Wholesale Fabric Supplier for Fashion Brands &amp; Designers
        </h2>
        <p className="text-white/80 max-w-3xl mx-auto leading-relaxed mb-12">
          Anuprerna is your premium source for artisanal, sustainable fabrics trusted by fashion
          brands, independent designers, and boutiques worldwide. As a leading wholesale fabric
          supplier, we combine India&rsquo;s rich textile heritage with modern design, customization,
          and reliable bulk sourcing—tailored for creative businesses in {city}.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          {TRUSTED_STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-serif text-3xl md:text-4xl font-bold text-white">{s.value}</p>
              <p className="text-white/60 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href="#contact-form" className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors">
            Start Wholesale Journey
          </a>
          <a href="#contact-form" className="inline-flex items-center px-6 py-3 border-2 border-white text-white rounded-full font-medium hover:bg-white/10 transition-colors">
            Contact With Us
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. A Supply Chain That Empowers & Sustains (static)                 */
/* ------------------------------------------------------------------ */

export function SupplyChainSection() {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            A Supply Chain That Empowers &amp; Sustains
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Our transparent, tech-enabled supply chain promotes decentralized production, empowering
            local artisans while providing full traceability from fibre to finished product.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#E9F1ED] rounded-2xl p-6">
            <h3 className="font-serif text-lg font-semibold text-gray-900 mb-4">
              Over the last four years, Anuprerna has partnered with:
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-2"><span aria-hidden="true" className="material-symbols-outlined text-clay text-lg">groups</span>500+ artisans across 30+ clusters (West Bengal, Odisha, Assam, Jharkhand, Jaipur)</li>
              <li className="flex gap-2"><span aria-hidden="true" className="material-symbols-outlined text-clay text-lg">favorite</span>Touching 2,000+ lives</li>
              <li className="flex gap-2"><span aria-hidden="true" className="material-symbols-outlined text-clay text-lg">history_edu</span>Preserving 23 indigenous crafts</li>
            </ul>
          </div>
          <div className="bg-[#EBE9F2] rounded-2xl p-6">
            <h3 className="font-serif text-lg font-semibold text-gray-900 mb-4">Environmental Stewardship</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-2"><span aria-hidden="true" className="material-symbols-outlined text-clay text-lg">bolt</span>30% less energy consumption with handlooms</li>
              <li className="flex gap-2"><span aria-hidden="true" className="material-symbols-outlined text-clay text-lg">co2</span>Reduced carbon emissions &amp; pollution</li>
              <li className="flex gap-2"><span aria-hidden="true" className="material-symbols-outlined text-clay text-lg">water_drop</span>Water-saving production practices</li>
              <li className="flex gap-2"><span aria-hidden="true" className="material-symbols-outlined text-clay text-lg">solar_power</span>Use of solar dyeing, azo-free dyes, and natural vegetable dyes</li>
              <li className="flex gap-2"><span aria-hidden="true" className="material-symbols-outlined text-clay text-lg">recycling</span>Repurposing deadstock fabrics for packaging</li>
            </ul>
          </div>
          <div className="bg-[#F9F4F5] rounded-2xl p-6">
            <h3 className="font-serif text-lg font-semibold text-gray-900 mb-4">People &amp; Planet Focus</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Our mission is to build a transparent, ethical, and eco-friendly ecosystem that benefits
              both people and the planet. By choosing Anuprerna, you not only access premium
              fabrics—you invest in craftsmanship, community, and a sustainable future.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Trusted by Leading Brands (subtitle templated)                   */
/* ------------------------------------------------------------------ */

const CLIENT_SEGMENTS = [
  { icon: 'checkroom', label: 'Independent Designers' },
  { icon: 'storefront', label: 'Boutique Retailers' },
  { icon: 'eco', label: 'Sustainable Labels' },
  { icon: 'public', label: 'Export Houses' },
];

export function TrustedBrandsSection({ city }: { city: string }) {
  return (
    <section className="bg-sand py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Trusted by Fashion Brands &amp; Designers Worldwide
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-12">
          From independent designers to established labels, creative businesses partner with
          Anuprerna for artisan-crafted fabrics, flexible MOQs, and reliable bulk sourcing.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {CLIENT_SEGMENTS.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3 shadow-sm">
              <span aria-hidden="true" className="material-symbols-outlined text-clay text-4xl">{s.icon}</span>
              <span className="font-serif font-semibold text-gray-900">{s.label}</span>
            </div>
          ))}
        </div>
        <p className="text-gray-600 mb-6">Serving fashion brands and designers across {city} and beyond</p>
        <a href="#contact-form" className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-700 transition-colors">
          Join Our Network
        </a>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Introducing Artisan Flow ({City} location label)                 */
/* ------------------------------------------------------------------ */

const AF_TAGS = [
  { label: 'COLLABORATION', desc: 'Custom development with skilled craftspeople' },
  { label: 'HERITAGE', desc: 'Preserving traditional techniques with modern applications' },
  { label: 'SUSTAINABILITY', desc: 'Environmentally conscious practices with cultural authenticity' },
];

export function ArtisanFlowSection({ city }: { city: string }) {
  return (
    <section className="bg-[#1a1410] text-white py-16 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-amber-200/80 mb-2">LOCATION</p>
        <p className="font-serif text-xl text-white/90 mb-6">{city}</p>
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-6">Introducing Artisan Flow</h2>
        <p className="text-white/70 max-w-3xl mx-auto leading-relaxed mb-12">
          Managing an artisanal supply chain has never been easier. Our platform simplifies supply
          chain complexity by providing real-time tracking &amp; analytics at every stage of production.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {AF_TAGS.map((t) => (
            <div key={t.label} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-xs uppercase tracking-widest text-amber-300 mb-2">{t.label}</p>
              <p className="text-sm text-white/70 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
        <a href="/artisanflow" className="inline-flex items-center px-6 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors">
          Explore Program
        </a>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Complete Fabric Sourcing Solution (body templated)               */
/* ------------------------------------------------------------------ */

const SOURCING_CARDS = [
  { icon: 'manage_search', title: 'Fabric Sourcing', desc: 'Global network of suppliers providing access to exclusive materials and specialty fabrics.' },
  { icon: 'content_cut', title: 'Custom Development', desc: 'Bespoke fabric creation to match your exact specifications and design requirements.' },
  { icon: 'science', title: 'Quality Testing', desc: 'Comprehensive testing for durability, colorfastness, and performance to ensure consistency.' },
  { icon: 'local_shipping', title: 'Logistics', desc: 'Streamlined delivery with real-time tracking and flexible scheduling options.' },
  { icon: 'fact_check', title: 'Compliance', desc: 'Ensuring all materials meet industry standards and regulatory requirements.' },
  { icon: 'recycling', title: 'Sustainability', desc: 'Eco-friendly options and transparent supply chain for responsible sourcing.' },
];

export function SourcingSolutionSection({ city }: { city: string }) {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-clay mb-3 flex items-center justify-center gap-2">
            <span aria-hidden="true" className="material-symbols-outlined text-lg">hub</span>
            Integrated Solution
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Complete Fabric Sourcing Solution
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Whether you require greige fabrics, ready-for-dyeing (RFD) materials, or finished prints,
            Anuprerna offers flexible MOQs and seamless logistics for fashion businesses in {city}.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SOURCING_CARDS.map((c) => (
            <div key={c.title} className="border border-gray-200 rounded-2xl p-6 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <span aria-hidden="true" className="material-symbols-outlined text-clay text-3xl">{c.icon}</span>
              <h3 className="font-serif text-lg font-semibold text-gray-900">{c.title}</h3>
              <p className="text-sm font-light leading-relaxed text-gray-600">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 8. Why Brands in {City} Prefer Anuprerna (heading templated)        */
/* ------------------------------------------------------------------ */

const PREFER = [
  { icon: 'auto_awesome', title: 'Rare Artisan Crafts & Weaves', desc: 'Access to unique handcrafted textiles and traditional weaving techniques preserved through generations of skilled artisans.' },
  { icon: 'eco', title: 'Sustainable, Eco-friendly Production', desc: 'Environmentally conscious processes that minimize carbon footprint while maintaining premium quality.' },
  { icon: 'payments', title: 'Flexible Bulk Pricing & Low MOQ', desc: 'Competitive wholesale rates with MOQs starting from just 50 meters to suit businesses of all sizes.' },
  { icon: 'support_agent', title: 'Dedicated Sourcing & Support', desc: 'Personal assistance from fabric experts to help you find the perfect materials for your specific requirements.' },
  { icon: 'public', title: 'Worldwide Shipping & Delivery', desc: 'Reliable logistics ensuring timely delivery of your orders anywhere in the world.' },
  { icon: 'volunteer_activism', title: 'Social Impact', desc: 'Supporting and empowering local artisan communities while preserving traditional craft heritage.' },
];

export function PreferSection({ city }: { city: string }) {
  return (
    <section className="bg-sand py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Brands in {city} Prefer Anuprerna
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join hundreds of successful brands who trust Anuprerna for their fabric sourcing needs.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PREFER.map((c) => (
            <div key={c.title} className="bg-white rounded-2xl p-6 flex flex-col gap-3 shadow-sm">
              <span aria-hidden="true" className="material-symbols-outlined text-clay text-3xl">{c.icon}</span>
              <h3 className="font-serif text-lg font-semibold text-gray-900">{c.title}</h3>
              <p className="text-sm font-light leading-relaxed text-gray-600">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 9. Anuprerna Unveiled: The Journey of Our Textiles (static blogs)   */
/* ------------------------------------------------------------------ */

const S3 = 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/';
const JOURNEY = [
  { href: '/blogs/the-intricate-motifs-of-jamdani-meanings-behind-the-heritage-patterns/144677220', img: S3 + 'ROE92LR2JMP6K0X9D8G8BKCUWEDW08181.jpg', title: 'The Intricate Motifs of Jamdani: Meanings Behind the Heritage Patterns', excerpt: 'Designing a premium collection requires more than just selecting a visually appealing fabric; it demands a deep understanding of the textile’s origin and structural integrity. For designers working with fine muslin, understanding jamdani weave motifs…' },
  { href: '/blogs/advanced-weaving-techniques-beyond-the-plain-twill-and-satin-weaves/144673935', img: S3 + 'GDDIW3JHUKPGM1YXZXJ31TARRGCV02463.jpg', title: 'Advanced Weaving Techniques: Beyond the Plain, Twill, and Satin Weaves', excerpt: 'Designers are increasingly finding that standard plain and twill structures are too easily replicated by mass-market competitors. To justify premium pricing and establish a distinct tactile identity, sourcing teams must look toward advanced fabric weaves…' },
  { href: '/blogs/breathability-tested-why-handwoven-cotton-outperforms-blends-in-summer/144670673', img: S3 + 'P4M7XJ8JRKGXBTGUIE2X6ZJ4W4XU08974.jpg', title: 'Breathability Tested: Why Handwoven Cotton Outperforms Blends in Summer', excerpt: 'Designers creating resort collections for tropical climates face a recurring physical challenge. A garment might look light and airy on the hanger, but if the fabric traps heat and humidity against the skin, the wearer experiences immediate discomfort…' },
  { href: '/blogs/how-to-source-ethical-raw-silk-for-your-fashion-label/141677643', img: S3 + 'VY4IS3T5XKZJ4ICJHYSM0GAWMW0804616.jpg', title: 'How to Source Ethical Raw Silk for Your Fashion Label', excerpt: 'A designer looking at a swatch of Tussar silk is holding centuries of rural Indian sericulture in their hands. The process of sourcing raw silk fabric begins long before the loom, starting in the forests of Jharkhand and Assam where wild silk moths…' },
  { href: '/blogs/how-celebrity-environmental-activists-are-shaping-sustainable-fashion-trends/141674', img: S3 + 'QM19FWZ06D38OC8DE5JPLRHD1LZG02480.jpg', title: 'How Celebrity Environmental Activists are Shaping Sustainable Fashion Trends', excerpt: 'A designer watches a major film premiere where the lead actor refuses to wear anything but fully traceable, zero-impact garments. The influence of celebrity environmental activists has shifted consumer expectations from basic recycling claims to demand…' },
];

export function JourneySection() {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Anuprerna Unveiled: The Journey of Our Textiles
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Our Craft, Our Story: People, Process, Product.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {JOURNEY.map((b) => (
            <a
              key={b.href}
              href={b.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl overflow-hidden bg-[#F9F4F5] flex flex-col hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Img src={b.img} alt={b.title} fill sizes="(max-width:1024px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-5 flex flex-col gap-3 flex-1">
                <h3 className="font-serif text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-clay transition-colors">
                  {b.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1">{b.excerpt}</p>
                <span className="text-sm font-medium text-clay">Read More About This Blog</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 10. Start Your Fabric Sourcing Journey Today (final CTA, templated) */
/*     CTA scrolls to the on-page enquiry form (#contact-form).        */
/* ------------------------------------------------------------------ */

export function FinalCtaSection({ city }: { city: string }) {
  return (
    <section className="bg-[#2d3748] text-white py-16 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
          Start Your Fabric Sourcing Journey Today
        </h2>
        <p className="text-white/80 mb-2">Ready to source fabrics that make your designs stand out?</p>
        <p className="text-white/70 max-w-2xl mx-auto leading-relaxed mb-10">
          Contact us today for bulk fabric inquiries, estimates, or to discuss custom design solutions
          tailored for your brand in {city}.
        </p>

        <a href="#contact-form" className="inline-flex items-center px-8 py-3 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors mb-12">
          Start Your Fabric Sourcing Journey
        </a>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto pt-10 border-t border-white/10">
          <div className="flex gap-3">
            <span aria-hidden="true" className="material-symbols-outlined text-amber-300">storefront</span>
            <div>
              <p className="text-sm font-semibold mb-1">Address</p>
              <p className="text-sm text-white/70 leading-relaxed">
                Vill - Alipur P.O- Debipur(R.S), P.S Memari Dist - Burdwan (East), West Bengal, India - 713146
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span aria-hidden="true" className="material-symbols-outlined text-amber-300">call</span>
            <div>
              <p className="text-sm font-semibold mb-1">Phone</p>
              <a href="tel:+918653403212" className="text-sm text-white/70 hover:text-white">+91 8653403212</a>
            </div>
          </div>
          <div className="flex gap-3">
            <span aria-hidden="true" className="material-symbols-outlined text-amber-300">mail</span>
            <div>
              <p className="text-sm font-semibold mb-1">Email</p>
              <a href="mailto:support@anuprerna.com" className="text-sm text-white/70 hover:text-white">support@anuprerna.com</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 11. Certifications & Standards (static — honestly held)             */
/* ------------------------------------------------------------------ */

export const CERTIFICATIONS = [
  'Handloom Mark',
  'GOTS Certified',
  'GOTS-Certified Raw Material',
  'Natural Dyes',
];

export function CertificationsSection() {
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
          {CERTIFICATIONS.map((c) => (
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
