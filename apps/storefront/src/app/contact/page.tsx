import ContactForm from '@/components/misc-pages/ContactForm';

export const metadata = { title: 'Contact Us — Anuprerna' };

export default function ContactPage() {
  return (
    <main className='min-h-[60vh] bg-white text-black'>
      {/* Hero — mandala motif background, centered, uppercase h1 */}
      <div
        className='relative py-[17px] px-5 text-center overflow-hidden'
        style={{
          backgroundImage: 'url(https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/tempnavmotif_top.svg)',
          backgroundSize: '50%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'top center',
        }}
      >
        <h1
          className='mt-[50px] text-[30px] sm:text-[30px] font-[500] text-center text-black uppercase'
        >
          CONTACT US
        </h1>
      </div>

      {/* Form — centered single column */}
      <div className='mx-auto max-w-screen-md px-5 pb-10'>
        <ContactForm />
      </div>

      {/* Address block — below form, centered */}
      <div className='mx-auto max-w-screen-md px-5 pb-20'>
        <div className='flex justify-center'>
          <div className='flex gap-6 items-start max-w-[700px] w-full flex-wrap sm:flex-nowrap justify-center'>
            {/* Location column */}
            <div className='text-center flex-1 min-w-[220px]'>
              <span
                className='material-symbols-outlined text-[50px] w-[100px] h-[100px] rounded-full border-2 border-[#8b7961] flex items-center justify-center text-[#8b7961] mx-auto mb-3'
                style={{ fontSize: '50px' }}
              >
                location_on
              </span>
              <h3 className='text-[22px] font-[500] uppercase text-center mt-5 mb-5 text-clay'>
                WEST BENGAL
              </h3>
              <p className='text-sm text-center mt-0 text-black/70'>
                Anuprerna Artisan Alliance Pvt. Ltd.
              </p>
              <address className='not-italic text-sm text-black/60 leading-relaxed text-center mt-2'>
                Vill - Alipur P.O- Debipur(R.S)<br />
                P.S Memari Dist - Burdwan (East)<br />
                West Bengal, India - 713146<br />
                Contact - 8653403212
              </address>
              <a
                href='https://maps.app.goo.gl/K1m4BcEzSw4AhstQA'
                target='_blank'
                rel='noopener noreferrer'
                className='block text-center text-sm text-[#8b7961] hover:underline mt-3'
              >
                View on Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
