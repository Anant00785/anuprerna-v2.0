// Internal-routing footer (parity with the live site footer, element-by-element match).
// Column structure: ABOUT US | ORDER DASHBOARD | DETAILED POLICY | CONTACT INFO

import NewsletterSignupInline from './NewsletterSignupInline';

const S = '/media/';

const COLS = [
  {
    title: 'ABOUT US',
    links: [
      { t: 'About the Brand',       h: '/content/about-us/about-the-brand/56485' },
      { t: 'About Our Impact',      h: '/content/about-us/about-our-impact/56484' },
      { t: 'Our Production Studio', h: '/content/about-us/our-production-studio/56483' },
      { t: 'Wholesale Production',  h: '/fabric-wholesaler' },
      { t: 'Custom Clothing & More', h: '/content/about-us/custom-clothing-more/56482' },
      { t: 'Global Fabric Wholesaler', h: '/fabric-wholesaler' },
    ],
  },
  {
    title: 'ORDER DASHBOARD',
    links: [
      { t: 'Past Orders',            h: '/profile/order' },
      { t: 'Order Fabric Swatches',  h: '/content/about-us/order-fabric-swatches/56481' },
      { t: 'Natural & Organic Dyeing', h: '/content/about-us/natural-organic-dyeing/56480' },
      { t: 'Read Our Stories',       h: '/stories' },
    ],
  },
  {
    title: 'DETAILED POLICY',
    links: [
      { t: 'Privacy Policy',           h: '/content/policies/privacy-policy/173823' },
      { t: 'Return & Exchange Policy', h: '/content/policies/return-exchange-policy/170896' },
      { t: 'Terms & Conditions',       h: '/content/policies/terms-conditions/174271' },
      { t: 'International Orders',     h: '/content/policies/international-orders/174182' },
      { t: 'Production Policy',        h: '/content/policies/production-policy/177227' },
    ],
  },
];

const SOCIAL = [
  { alt: 'Twitter',   href: 'https://twitter.com/Anuprerna6',               img: 'https://anuprerna.com/assets/img/twitter.svg' },
  { alt: 'Facebook',  href: 'https://www.facebook.com/anuprernatelier/',    img: S + 'facebook.svg' },
  { alt: 'Pinterest', href: 'https://in.pinterest.com/anuprernas/',         img: S + 'pininterest.svg' },
  { alt: 'Instagram', href: 'https://www.instagram.com/anuprerna_atelier/', img: S + 'instagram.svg' },
  { alt: 'LinkedIn',  href: 'https://www.linkedin.com/company/anuprerna/',  img: S + 'linkedin-anuprerna.svg' },
];

export default function SiteFooter() {
  return (
    <footer className='w-full bg-[#211c16] text-white'>
      <div className='mx-auto max-w-screen-xl px-5 py-12 grid grid-cols-1 lg:grid-cols-4 gap-10'>
        {COLS.map((col) => (
          <div key={col.title}>
            <h2 className='text-sm font-semibold tracking-[.12em] uppercase text-[#d8c7a8] mb-4'>{col.title}</h2>
            <ul className='space-y-2.5 text-sm text-white/70'>
              {col.links.map((l) => (
                <li key={l.t}>
                  <a
                    href={l.h}
                    className='hover:text-[#d8c7a8] transition-colors'
                  >
                    {l.t}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Contact column */}
        <div>
          <a href='/contact'>
            <h2 className='text-sm font-semibold tracking-[.12em] uppercase text-[#d8c7a8] mb-4 hover:underline'>CONTACT INFO</h2>
          </a>
          <div className='flex items-center gap-2 mb-3 text-sm text-white/80'>
            <span className='material-symbols-outlined text-[20px] text-[#b7a990]'>mail</span>
            <a href='mailto:support@anuprerna.com' className='hover:text-[#d8c7a8]'>support@anuprerna.com</a>
          </div>
          <div className='flex items-center gap-2 mb-4 text-sm text-white/80'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src='https://anuprerna.com/assets/img/whatsapp.svg' alt='WhatsApp' width={22} height={22} loading='lazy' />
            <a href='https://wa.me/918653403212' target='_blank' rel='noopener' className='hover:text-[#d8c7a8]'>+91 8653403212</a>
          </div>
          <a href='/contact'
             className='w-max rounded-md px-3 py-2 bg-[#b7a990] hover:bg-[#8d7961] text-black hover:text-white transition-all flex justify-center items-center gap-2 mb-5'>
            <span className='material-symbols-outlined text-[20px]'>contact_support</span>
            <span className='text-sm'>Contact us</span>
          </a>
          <div className='flex items-center gap-3'>
            <p className='text-sm text-white/70 mr-1'>Follow Us:</p>
            {SOCIAL.map((s) => (
              <a key={s.alt} href={s.href} target='_blank' rel='noopener' aria-label={s.alt} className='opacity-80 hover:opacity-100 transition-opacity'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={s.alt} width={26} height={26} className='brightness-0 invert' loading='lazy' />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className='border-t border-white/10'>
        <div className='mx-auto max-w-screen-xl px-5 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <h3 className='text-sm font-semibold tracking-[.12em] uppercase text-[#d8c7a8] mb-1'>Stay in the loop</h3>
            <p className='text-xs text-white/60'>Occasional notes on new collections &amp; craft stories.</p>
          </div>
          <NewsletterSignupInline />
        </div>
      </div>

      <div className='border-t border-white/10'>
        <div className='mx-auto max-w-screen-xl px-5 py-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/50'>
          <span>Anuprerna Artisan Alliance Pvt. Ltd. &copy; {new Date().getFullYear()} All Rights Reserved</span>
          <span>Next.js storefront demo</span>
        </div>
      </div>
    </footer>
  );
}
