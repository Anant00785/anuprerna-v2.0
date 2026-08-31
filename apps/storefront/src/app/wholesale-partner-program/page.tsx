import WholesaleApplicationForm from '@/components/misc-pages/WholesaleApplicationForm';
import WholesalePricing from '@/components/misc-pages/WholesalePricing';
import JsonLd from '@/components/seo/JsonLd';

export const metadata = { title: 'Wholesale Partner Program — Anuprerna' };

const WHY_PARTNER = [
  {
    icon: 'diversity_3',
    title: 'Direct From Artisan Clusters',
    desc: 'Ethically sourced from 500+ artisans across 30+ craft clusters in India.',
  },
  {
    icon: 'price_change',
    title: 'Flexible Minimums & Custom Pricing',
    desc: 'Minimum order amount, pricing tiers, and order frequency — all tailored to your business needs.',
  },
  {
    icon: 'support_agent',
    title: 'Dedicated Account Support',
    desc: 'Personalized support from sourcing to sampling, production to delivery.',
  },
  {
    icon: 'eco',
    title: 'Sustainability at the Core',
    desc: 'Powered by our traceable supply chain — ArtisanFlow — ensuring fair wages, transparency, and impact.',
  },
];

const FOR_WHO = [
  { icon: 'apparel', label: 'Ethical Fashion Houses' },
  { icon: 'palette', label: 'Designers & Creative Studios' },
  { icon: 'home', label: 'Home & Lifestyle Brands' },
  { icon: 'storefront', label: 'Concept & Boutique Stores' },
  { icon: 'shopping_bag', label: 'Retailers' },
  { icon: 'weekend', label: 'Interior Designers' },
];

const MEMBER_PERKS = [
  {
    icon: 'sell',
    title: 'Custom Trade Discounts',
    desc: 'Applied to textiles and finished goods based on your needs.',
  },
  {
    icon: 'design_services',
    title: 'Custom Development',
    desc: 'Tailored colorways, patterns, and dimensions for your line.',
  },
  {
    icon: 'local_shipping',
    title: 'Priority Production & Delivery',
    desc: 'Expedited timelines and dedicated support for launches.',
  },
];

const MOQ_ROWS = [
  { cat: 'Standard handloom fabric', moq: '25 m per design' },
  { cat: 'Premium hand-processes (Kantha, Batik, Block-print, Screen-print, Tie-Dye)', moq: '12 m per design' },
  { cat: 'Finished apparel', moq: '1 piece' },
];

const DISCOUNT_LADDER = [
  { qty: '25 m', discount: '3%' },
  { qty: '50 m', discount: '5%' },
  { qty: '100 m', discount: '10%' },
  { qty: '300 m', discount: '12%' },
];

const HOW_IT_WORKS = [
  {
    step: '1',
    title: 'Apply',
    desc: 'Create your trade account.',
    note: 'Takes approximately 2 minutes',
  },
  {
    step: '2',
    title: 'Discuss',
    desc: 'Share your business needs and agree on a partner plan.',
    note: null,
  },
  {
    step: '3',
    title: 'Unlock',
    desc: 'Access your custom perks and start ordering.',
    note: 'Exclusive Benefits',
  },
];

// FAQ wording sourced from live loyalty-faq.component.html
const FAQS = [
  {
    q: 'How do I join?',
    a: 'Simply fill out the Application Form. Our team will respond within 1–2 business days.',
  },
  {
    q: 'Is there a minimum order?',
    a: 'No fixed minimums — these are defined together based on your expected scale and goals.',
  },
  {
    q: 'Can I qualify based on past orders?',
    a: 'Yes, if your past orders align with the agreed frequency, you may qualify immediately.',
  },
  {
    q: 'Can I request custom development?',
    a: 'Yes! We offer custom designs, colorways, and dimensions based on your creative brief.',
  },
  {
    q: 'What kind of support will I get?',
    a: 'A dedicated account manager will guide you throughout — from product selection to delivery.',
  },
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

export default function WholesalePartnerPage() {
  return (
    <main className='bg-white text-black'>
      <JsonLd data={faqJsonLd} />

      {/* Hero — AI photo background with white-to-transparent gradient overlay */}
      <section
        className='relative min-h-[500px] sm:min-h-[600px] pt-20 sm:pt-24 overflow-hidden'
        style={{
          backgroundImage: 'url(https://readdy.ai/api/search-image?query=high-quality%20photograph%20showing%20artisans%20working%20on%20traditional%20Indian%20handloom%20with%20natural%20materials%2C%20soft%20lighting%2C%20muted%20earthy%20tones%2C%20showing%20hands%20working%20with%20textiles%2C%20subtle%20texture%20patterns%2C%20warm%20ambient%20lighting%2C%20natural%20cotton%20and%20indigo%20dyes%20visible%2C%20artisanal%20craftsmanship%2C%20with%20soft%20gradient%20on%20left%20side%20for%20text%20overlay&width=1600&height=800&seq=hero1&orientation=landscape)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* White-to-transparent gradient overlay */}
        <div
          className='absolute inset-0'
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.4) 100%)',
          }}
        />
        <div className='relative z-10 container mx-auto px-4 py-12 sm:py-16 md:py-24 flex flex-col justify-center min-h-[500px] sm:min-h-[600px]'>
          <div className='w-full max-w-2xl'>
            <h1 className='text-3xl sm:text-4xl md:text-5xl font-bold text-[#2C3E50] leading-tight mb-4 sm:mb-6'>
              Anuprerna Wholesale Partner Program
            </h1>
            <h3 className='text-sm sm:text-base lg:text-2xl font-bold text-[#2C3E50] leading-tight mb-4 sm:mb-6'>
              For Designers, Brands &amp; Retailers
            </h3>
            <div className='mt-6 sm:mt-8 border-t border-slate-200/60 pt-8 pb-8'>
              <ul className='grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-base text-[#2C3E50]'>
                <li className='flex items-center gap-3'>
                  <span className='material-symbols-outlined'>sell</span>
                  <span><strong>Discounted Trade Pricing</strong> – enjoy exclusive partner rates</span>
                </li>
                <li className='flex items-center gap-3'>
                  <span className='material-symbols-outlined'>design_services</span>
                  <span><strong>Custom Development</strong> – colorways, patterns &amp; product design support</span>
                </li>
                <li className='flex items-center gap-3'>
                  <span className='material-symbols-outlined'>speed</span>
                  <span><strong>Priority Orders</strong> – faster sampling, production &amp; delivery slots</span>
                </li>
                <li className='flex items-center gap-3'>
                  <span className='material-symbols-outlined'>visibility</span>
                  <span><strong>Transparency</strong> – artisan photos, videos &amp; traceability via <em>ArtisanFlow</em></span>
                </li>
              </ul>
            </div>
            <a
              href='#apply-now'
              className='inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-bold text-[#1a1a1a] rounded-lg transition'
              style={{
                background: 'linear-gradient(135deg, #F7C52D 0%, #FFD700 100%)',
                boxShadow: '0 4px 12px rgba(247, 197, 45, 0.3)',
              }}
            >
              Apply for a Trade Account
              <span className='material-symbols-outlined text-base'>arrow_forward</span>
            </a>
          </div>
        </div>
      </section>

      {/* Why Partner */}
      <section id='why-partner' className='py-20 px-5 bg-white'>
        <div className='mx-auto max-w-screen-xl'>
          <div className='text-center mb-14'>
            <h2 className='text-2xl sm:text-4xl font-bold text-[#2C3E50] mb-3'>Why Partner With Us</h2>
            <p className='text-black/60 max-w-xl mx-auto text-sm sm:text-base'>
              Discover the advantages of joining Anuprerna&apos;s exclusive wholesale program for ethical fashion businesses.
            </p>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
            {WHY_PARTNER.map(item => (
              <div
                key={item.title}
                className='bg-white p-8 rounded shadow-md hover:shadow-lg transition hover:-translate-y-1 transform'
              >
                <div className='w-16 h-16 flex items-center justify-center bg-sand rounded-full mb-6'>
                  <span aria-hidden='true' className='material-symbols-outlined text-clay text-2xl'>{item.icon}</span>
                </div>
                <h3 className='text-lg font-bold text-[#7d5b20] mb-2'>{item.title}</h3>
                <p className='text-sm text-black/60'>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section id='who-its-for' className='py-20 px-5 bg-[#fffbf8]'>
        <div className='mx-auto max-w-screen-xl'>
          <div className='text-center mb-14'>
            <h2 className='text-2xl sm:text-4xl font-bold text-[#2C3E50] mb-3'>Who It&apos;s For</h2>
            <p className='text-black/60 max-w-xl mx-auto text-sm sm:text-base'>
              Our wholesale program is designed for businesses that value ethical sourcing and artisanal craftsmanship.
            </p>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8'>
            {FOR_WHO.map(item => (
              <div
                key={item.label}
                className='bg-white p-8 rounded shadow-md border-t-4 border-clay hover:shadow-lg transition flex flex-col items-center text-center'
              >
                <div className='w-20 h-20 flex items-center justify-center bg-sand rounded-full mb-4'>
                  <span aria-hidden='true' className='material-symbols-outlined text-clay text-3xl'>{item.icon}</span>
                </div>
                <h3 className='text-lg font-bold text-[#7d5b20]'>{item.label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exclusive Member Perks */}
      <section id='member-perks' className='py-20 px-5 bg-gradient-to-b from-sand to-white'>
        <div className='mx-auto max-w-screen-xl'>
          <div className='mx-auto max-w-3xl text-center mb-10'>
            <span className='inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border border-[#F7C52D]/50 text-[#7d5b20]'
              style={{ background: 'rgba(247,197,45,0.1)' }}>
              <span className='material-symbols-outlined text-base' style={{ color: '#F7C52D' }}>crown</span>
              Exclusive Member Perks
            </span>
          </div>
          <div className='flex justify-center'>
            <div className='bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-black/5 p-8 md:p-10'>
              <ul className='space-y-5'>
                {MEMBER_PERKS.map(p => (
                  <li key={p.title} className='flex gap-4'>
                    <span className='shrink-0 inline-flex h-10 w-10 rounded-full bg-sand items-center justify-center'>
                      <span aria-hidden='true' className='material-symbols-outlined text-clay'>{p.icon}</span>
                    </span>
                    <div>
                      <p className='font-semibold text-[#7d5b20]'>{p.title}</p>
                      <p className='text-sm text-black/60'>{p.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Ranges, MOQ & Pricing */}
      <section id='ranges-pricing' className='py-20 px-5 bg-white'>
        <div className='mx-auto max-w-screen-xl'>
          <div className='text-center mb-4'>
            <h2 className='text-2xl sm:text-4xl font-bold text-[#2C3E50] mb-3'>Ranges, MOQ &amp; Pricing</h2>
            <p className='text-black/60 max-w-2xl mx-auto text-sm sm:text-base'>
              All prices per running metre (m), ex-works India. Handloom, woven to export quality.
            </p>
          </div>

          {/* Currency-aware pricing (selector + fabric family cards + assortment note) */}
          <WholesalePricing />

          {/* Minimum Order Quantity */}
          <div className='mt-20 text-center mb-10'>
            <h3 className='text-xl sm:text-2xl font-bold text-[#2C3E50] mb-3'>Minimum Order Quantity</h3>
            <p className='text-black/60 max-w-2xl mx-auto text-sm sm:text-base'>
              Low commitment by design — trial a quality before you commit to a production run.
            </p>
          </div>
          <div className='max-w-3xl mx-auto overflow-x-auto rounded-xl border border-black/10'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='bg-sand'>
                  <th className='px-5 py-3 text-sm font-semibold text-[#2C3E50]'>Category</th>
                  <th className='px-5 py-3 text-sm font-semibold text-[#2C3E50] whitespace-nowrap'>MOQ</th>
                </tr>
              </thead>
              <tbody>
                {MOQ_ROWS.map((r, i) => (
                  <tr key={r.cat} className={i % 2 === 1 ? 'bg-[#fffbf8]' : 'bg-white'}>
                    <td className='px-5 py-4 text-sm text-black/80 border-t border-black/5'>{r.cat}</td>
                    <td className='px-5 py-4 text-sm font-semibold text-clay border-t border-black/5 whitespace-nowrap'>
                      {r.moq}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className='mt-6 text-sm text-black/60 max-w-2xl mx-auto text-center leading-relaxed'>
            Build and test a full capsule with us at a fraction of typical mill yardage minimums.
          </p>

          {/* Volume Discount Ladder */}
          <div className='mt-20 text-center mb-10'>
            <h3 className='text-xl sm:text-2xl font-bold text-[#2C3E50] mb-3'>Volume Discount Ladder</h3>
            <p className='text-black/60 max-w-2xl mx-auto text-sm sm:text-base'>Applied per design, on the fabric line value.</p>
          </div>
          <div className='max-w-2xl mx-auto overflow-x-auto rounded-xl border border-black/10'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='bg-sand'>
                  <th className='px-5 py-3 text-sm font-semibold text-[#2C3E50]'>Order quantity (per design)</th>
                  <th className='px-5 py-3 text-sm font-semibold text-[#2C3E50] whitespace-nowrap'>Discount</th>
                </tr>
              </thead>
              <tbody>
                {DISCOUNT_LADDER.map((r, i) => (
                  <tr key={r.qty} className={i % 2 === 1 ? 'bg-white' : 'bg-[#fffbf8]'}>
                    <td className='px-5 py-4 text-sm text-black/80 border-t border-black/5'>{r.qty}</td>
                    <td className='px-5 py-4 text-sm font-semibold text-clay border-t border-black/5 whitespace-nowrap'>
                      {r.discount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How to Qualify */}
      <section id='how-to-qualify' className='py-20 px-5 bg-sand'>
        <div className='mx-auto max-w-screen-xl'>
          <div className='text-center max-w-2xl mx-auto mb-10'>
            <h2 className='text-2xl sm:text-4xl font-bold text-[#2C3E50] mb-2'>How to Qualify</h2>
            <p className='text-black/60'>We believe every partner is unique — so we offer a flexible model:</p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
            <div className='relative overflow-hidden rounded-2xl bg-white border border-black/10 p-8'>
              <div className='absolute top-0 left-0 h-[3px] w-full' style={{ background: 'linear-gradient(90deg, #F7C52D, #FFD700)' }} />
              <div className='flex items-center gap-4 mb-3'>
                <span className='inline-flex h-10 w-10 items-center justify-center rounded-full text-[#7d5b20] font-bold'
                  style={{ background: 'rgba(247,197,45,0.15)' }}>01</span>
                <h3 className='font-semibold text-[#7d5b20]'>Choose Your Order Rhythm</h3>
              </div>
              <p className='text-sm text-black/60'>
                Commit to a <strong className='text-[#7d5b20]'>minimum spend</strong> and a{' '}
                <strong className='text-[#7d5b20]'>committed order frequency</strong>. Discount tiers are set{' '}
                <strong className='text-[#7d5b20]'>mutually</strong> based on your needs.
              </p>
            </div>
            <div className='relative overflow-hidden rounded-2xl bg-white border border-black/10 p-8'>
              <div className='absolute top-0 left-0 h-[3px] w-full' style={{ background: 'linear-gradient(90deg, #F7C52D, #FFD700)' }} />
              <div className='flex items-center gap-4 mb-3'>
                <span className='inline-flex h-10 w-10 items-center justify-center rounded-full text-[#7d5b20] font-bold'
                  style={{ background: 'rgba(247,197,45,0.15)' }}>02</span>
                <h3 className='font-semibold text-[#7d5b20]'>Qualify from Past Purchases</h3>
              </div>
              <p className='text-sm text-black/60'>
                Your previous orders can qualify you — aligned with your{' '}
                <strong className='text-[#7d5b20]'>agreed order frequency</strong>.
              </p>
            </div>
          </div>
          <div className='mt-8 flex flex-col sm:flex-row items-center justify-center gap-3'>
            <a
              href='#apply-now'
              className='inline-flex items-center gap-1 px-8 py-4 text-[#1a1a1a] text-sm font-bold transition rounded-xl'
              style={{
                background: 'linear-gradient(135deg, #F7C52D 0%, #FFD700 100%)',
                boxShadow: '0 4px 12px rgba(247, 197, 45, 0.3)',
              }}
            >
              Apply Now
              <span className='material-symbols-outlined text-base'>keyboard_arrow_right</span>
            </a>
            <a
              href='#faq'
              className='inline-flex items-center justify-center rounded-lg border border-black/20 px-5 py-3 text-sm font-medium text-[#7d5b20] hover:bg-black/5 transition'
            >
              See FAQs
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id='how-it-works' className='py-20 px-5 bg-sand'>
        <div className='mx-auto max-w-screen-xl'>
          <div className='text-center mb-14'>
            <h2 className='text-2xl sm:text-4xl font-bold text-[#2C3E50] mb-3'>How It Works</h2>
            <p className='text-black/60 max-w-xl mx-auto text-sm'>
              A simple process to join our wholesale program and start sourcing artisanal products.
            </p>
          </div>
          <div className='max-w-2xl mx-auto space-y-6'>
            {HOW_IT_WORKS.map(s => (
              <div key={s.step} className='relative pl-16'>
                <div
                  className='absolute left-0 top-0 w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl text-[#1a1a1a]'
                  style={{ background: 'linear-gradient(135deg, #F7C52D 0%, #FFD700 100%)' }}
                >
                  {s.step}
                </div>
                <div className='bg-white p-6 rounded-lg shadow-md'>
                  <h3 className='font-bold text-[#7d5b20] mb-1'>{s.title}</h3>
                  <p className='text-sm text-black/60'>{s.desc}</p>
                  {s.note && (
                    <span className='inline-flex items-center gap-1 mt-2 text-xs text-[#F7C52D]'>
                      <span className='material-symbols-outlined text-sm'>
                        {s.step === '3' ? 'crown' : 'timer'}
                      </span>
                      {s.note}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id='apply-now' className='py-16 px-5 bg-gray-50'>
        <div className='max-w-3xl mx-auto'>
          <div className='text-center mb-8'>
            <h2 className='text-2xl sm:text-3xl font-bold text-black mb-3'>Partnership Application Form</h2>
            <p className='text-black/60 max-w-xl mx-auto text-sm'>
              Join our network of ethical partners and artisans. Please fill out the form below to begin
              your partnership journey with Anuprerna.
            </p>
          </div>
          <WholesaleApplicationForm />
        </div>
      </section>

      {/* FAQ */}
      <section id='faq' className='py-20 px-5 bg-white'>
        <div className='mx-auto max-w-screen-xl'>
          <h2 className='text-2xl sm:text-3xl font-bold text-[#2C3E50] mb-10 text-center'>
            Frequently Asked Questions
          </h2>
          <div className='max-w-3xl mx-auto space-y-6'>
            {FAQS.map(item => (
              <div key={item.q} className='border-b border-black/10 pb-6'>
                <h3 className='font-medium text-base mb-2'>{item.q}</h3>
                <p className='text-sm text-black/60 leading-relaxed'>{item.a}</p>
              </div>
            ))}
          </div>
          <div className='text-center mt-10'>
            <p className='text-sm text-black/50 mb-3'>Don&apos;t see your question answered here?</p>
            <a href='#apply-now' className='text-clay text-sm hover:underline font-medium'>
              Contact our wholesale team
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
