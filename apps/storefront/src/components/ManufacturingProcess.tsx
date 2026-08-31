import Image from 'next/image';
import Link from 'next/link';

const CDN = 'https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/';
const CARDS = [
  { href:'/content/wholesale/order-fabric-swatches/59195', img:CDN+'swatch-bundle-min.jpg', title:'Order Fabric Swatches', body:'We offer fabric swatches for you to explore. Receive samples of our exquisite handloom fabrics to assess their texture, colour, and quality.' },
  { href:'/content/wholesale/wholesale-production-preorder/59335', img:CDN+'bulk-order.png', title:'Bulk Orders & Customisations', body:'Planning ahead? Our preorder service is crafted for bulk orders, ensuring timely delivery and optimal stock levels for large-scale orders.' },
  { href:'/content/wholesale/natural-sustainable-custom-dyeing/59105', img:CDN+'custom-dyeing.png', title:'100% Natural Custom Dyeing', body:'We offer natural and sustainable custom dyeing options that allow you to create the perfect shade for your fabrics and apparel.' },
  { href:'/content/wholesale/custom-clothing-accessories-homewares/703160', img:CDN+'customisations.png', title:'Custom Clothing & Accessories', body:'We specialise in customised designs for clothing, accessories, and homewares, crafted meticulously to fit your requirements.' },
];

export default function ManufacturingProcess() {
  return (
    <section className='w-full flex flex-col justify-center items-center bg-[#F0EEE9] py-10'>
      <h2 className='text-2xl sm:text-4xl text-black font-medium mb-5 md:mb-10 text-center px-3'>
        <Link href='/content/wholesale/custom-clothing-accessories-homewares/703160' className='text-[#7D5B20]'>End to End</Link> Manufacturing Process
      </h2>
      <div className='container mx-auto max-w-screen-xl w-full px-8 mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-10 xl:gap-3 content-center'>
        {CARDS.map(c => (
          <Link key={c.title} href={c.href}
             className='relative flex w-full xl:max-w-[320px] flex-col rounded-xl bg-gradient-to-br from-white to-gray-50 text-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group'>
            <div className='relative mx-4 -mt-6 h-44 overflow-hidden rounded-xl shadow-lg'>
              <Image src={c.img} alt={c.title} fill sizes='320px' className='object-cover' />
            </div>
            <div className='p-4'>
              <h3 className='mb-2 block text-base md:text-lg font-semibold leading-snug text-gray-900 group-hover:text-blue-600 transition-colors'>{c.title}</h3>
              <p className='block text-sm font-light leading-relaxed text-gray-700'>{c.body}</p>
            </div>
            <div className='p-4 pt-0 mt-auto'>
              <span className='group relative w-full inline-flex items-center justify-center px-4 py-2 font-bold text-white rounded-lg bg-gradient-to-r from-[#9C8A6C] to-[#B7A98F] group-hover:from-[#8c7961] group-hover:to-[#9C8A6C] shadow-lg transition-all duration-300'>
                <span className='relative flex items-center gap-2'>Read More
                  <svg viewBox='0 0 24 24' stroke='currentColor' fill='none' className='w-5 h-5'><path d='M17 8l4 4m0 0l-4 4m4-4H3' strokeWidth='2' strokeLinejoin='round' strokeLinecap='round'/></svg>
                </span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
