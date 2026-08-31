// WholesalePartner — simplified (removed gradient decorations, tightened spacing).
// Calm layout matching Nicobar/Jaggery aesthetic — fewer decorative elements.
import Link from 'next/link';

const CARDS = [
  { bg:'#EAEBF1', icon:'sell',            title:'Discounted Trade Pricing',  body:'Enjoy exclusive partner rates on our premium organic textiles, ensuring you get the best value for your wholesale business.' },
  { bg:'#F9F4F5', icon:'design_services', title:'Custom Development',         body:'Custom development services for colorways, patterns, and product design support.' },
  { bg:'#EBE9F2', icon:'speed',           title:'Priority & Transparency',    body:'Faster sampling, production & delivery slots with priority orders and transparent supply chain visibility via ArtisanFlow.' },
];

export default function WholesalePartner() {
  return (
    <section id='wholesale' className='py-12 bg-white'>
      <div className='max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8'>

        {/* Heading */}
        <div className='text-center mb-10'>
          <p className='text-xs sm:text-sm uppercase tracking-[.2em] text-[#8E7862] mb-2'>For brands &amp; buyers</p>
          <h2 className='text-3xl sm:text-4xl font-medium text-black mb-3'>
            Wholesale <span className='text-[#7D5B20]'>Partners Program</span>
          </h2>
          <p className='text-base text-gray-600 max-w-2xl mx-auto leading-relaxed'>
            Discover the advantages of joining Anuprerna&apos;s exclusive wholesale program for ethical fashion businesses.
          </p>
        </div>

        {/* Benefit cards */}
        <div className='grid lg:grid-cols-3 gap-6 mb-10'>
          {CARDS.map(c => (
            <div key={c.title}
                 className='flex flex-col p-8 rounded-2xl border border-gray-100 hover:border-[#c9bfa6] transition-colors'
                 style={{ backgroundColor: c.bg }}>
              <div className='w-12 h-12 bg-[#7D5B20] rounded-xl flex items-center justify-center mb-6'>
                <span className='material-symbols-outlined text-white text-xl'>{c.icon}</span>
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>{c.title}</h3>
              <p className='text-sm text-gray-600 leading-relaxed'>{c.body}</p>
            </div>
          ))}
        </div>

        {/* CTA strip */}
        <div className='text-center bg-[#fffcf7] rounded-2xl py-10 px-8 border border-[#e3dcc9]'>
          <h3 className='text-xl font-semibold text-gray-900 mb-2'>
            Take full benefit by partnering with us
          </h3>
          <p className='text-sm text-gray-600 mb-6 max-w-xl mx-auto'>
            Join our network of ethical partners and artisans and begin your wholesale journey with Anuprerna.
          </p>
          <Link href='/wholesale-partner-program'
               className='inline-flex items-center gap-2 bg-[#7D5B20] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#6c5b48] transition-colors shadow-sm'>
            Become a Partner
          </Link>
        </div>

      </div>
    </section>
  );
}
