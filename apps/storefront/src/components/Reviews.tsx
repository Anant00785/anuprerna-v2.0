'use client';
import Link from 'next/link';
import Image from 'next/image';
import { reviews } from '../lib/data';
import Carousel from './Carousel';

const LOGO = '/media/logo-brown.svg'; // rewritten to the sandbox media route (was live bloomscorp S3)

export default function Reviews() {
  if (!reviews.length) return null;
  return (
    <section className='fb-home-review w-full flex flex-col justify-center items-center py-10' style={{background:'#fffcf7'}}>
      <div className='w-full container mx-auto max-w-screen-xl px-4 lg:px-12'>
        <div className='flex items-center justify-between mb-10'>
          <h2 className='text-3xl sm:text-5xl text-[#7D5B20] font-medium'>Hear from our <span className='text-black'>Customers</span></h2>
          <Link href='/review' className='fb-view-all'>
            View all <span className='material-symbols-outlined text-[18px]'>arrow_forward</span>
          </Link>
        </div>
        <Carousel ariaLabel='Customer reviews'>
          {reviews.map((r, i) => (
            <div key={i} className='shrink-0 w-[85%] sm:w-[60%] lg:w-[calc((100%-2rem)/3)] flex flex-col p-3 rounded-md border-2 relative hover:shadow-lg' style={{height:'320px',transition:'box-shadow 1s'}}>
              <div className='flex justify-between items-start'>
                <div className='w-[80px] h-[80px] border border-[#6c5b48] rounded overflow-hidden flex-shrink-0 relative'>
                  {r.images[0]
                    ? <Image src={r.images[0]} alt='' fill sizes='80px' className='object-cover' />
                    : <img src={LOGO} alt='' className='w-full h-full object-contain p-2' />}
                </div>
                {r.createdAt && <span className='text-xs text-end text-[#7D5B20]'>{new Date(r.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>}
              </div>
              <div className='max-h-[160px] overflow-y-auto my-3'>
                {r.link
                  ? <a href={r.link} target='_blank' rel='noopener' className='text-sm text-[#7D5B20] block hover:underline'><q className='italic'>{r.text}</q></a>
                  : <p className='text-sm text-[#7D5B20]'><q className='italic'>{r.text}</q></p>}
              </div>
              <div className='flex flex-col justify-center items-end mt-auto'>
                <div className='flex items-center gap-1'>
                  {Array.from({length:5}).map((_,j)=>(<span key={j} style={{fontSize:'14px',color: r.rating>j ? '#8d7961':'#d3d3d3'}}>&#9733;</span>))}
                </div>
                <span className='text-[#6c5b48]'>{r.name}</span>
              </div>
              <p className='text-xs text-end text-[#7D5B20]'>{r.city && r.city+', '}{r.country}</p>
            </div>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
