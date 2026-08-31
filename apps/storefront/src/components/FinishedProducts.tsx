'use client';
import Link from 'next/link';
import Image from 'next/image';
import { apparel, home, accessories, finishedHref, titleCase, type Featured } from '../lib/data';
import { ViewItemList, selectItem, type GtmItem } from './Gtm';
import Carousel from './Carousel';

// Prominent B2C 'Shop Finished Products' section — apparel, home & accessories (finished goods, not raw fabric).
const SEGMENTS = [
  { key:'apparel',     label:'Apparel',     blurb:'Ready-to-wear handwoven, naturally dyed clothing.', data: apparel,     icon:'checkroom',     href:'/products/finished?category=apparel' },
  { key:'home',        label:'Home',        blurb:'Quilts, cushions, curtains & linen for the home.',  data: home,        icon:'chair',         href:'/products/finished?category=home' },
  { key:'accessories', label:'Accessories', blurb:'Bags, scarves, pouches & artisan accessories.',     data: accessories, icon:'shopping_bag',  href:'/products/finished?category=accessories' },
] as const;

export default function FinishedProducts() {
  return (
    <section id='shop' className='w-full flex flex-col justify-center items-center bg-[#fffcf7] py-12'>
      <div className='container mx-auto max-w-screen-xl px-4'>
        <div className='text-center mb-8'>
          <p className='text-sm uppercase tracking-[.2em] text-[#8E7862] mb-2'>Shop the finished collection</p>
          <h2 className='text-3xl sm:text-5xl text-[#7D5B20] font-medium'>Finished <span className='text-black'>Products</span></h2>
          <p className='text-gray-600 max-w-2xl mx-auto mt-3'>Beyond the loom — handcrafted apparel, homeware &amp; accessories, made-to-order from our own naturally dyed handloom textiles.</p>
        </div>

        {SEGMENTS.map(seg => {
          const items: GtmItem[] = seg.data.map((f,i)=>({ item_id:String(f.subId), item_name:titleCase(f.name), item_category:seg.label, item_category2:titleCase(f.segment), index:i }));
          return (
            <div key={seg.key} className='mb-10'>
              <div className='flex items-center justify-between mb-4 px-1'>
                <h3 className='flex items-center gap-2 text-xl sm:text-2xl text-black font-medium'>
                  <span className='material-symbols-outlined text-[#7D5B20]'>{seg.icon}</span>{seg.label}
                  <span className='hidden sm:inline text-sm text-gray-500 font-normal'>— {seg.blurb}</span>
                </h3>
                <Link href={seg.href} className='fb-view-all'>
                  View all <span className='material-symbols-outlined text-[18px]'>arrow_forward</span>
                </Link>
              </div>
              <ViewItemList listId={'home_finished_'+seg.key} listName={'Home — Finished '+seg.label} items={items}>
                <Carousel ariaLabel={'Finished '+seg.label}>
                  {seg.data.map((f:Featured, i:number) => (
                    <a key={f.subId} href={finishedHref(f)} target='_blank' rel='noopener'
                       onClick={() => selectItem('home_finished_'+seg.key, 'Home — Finished '+seg.label, items[i])}
                       className='group shrink-0 w-[42%] xs:w-[34%] sm:w-[31%] lg:w-[calc((100%-5rem)/6)]'>
                      <div className='relative overflow-hidden rounded-xl bg-[#F0EEE9]' style={{aspectRatio:'1/1'}}>
                        <Image src={f.image} alt={titleCase(f.name)} fill sizes='(max-width:640px) 42vw, 16vw'
                               className='object-cover transition duration-700 group-hover:scale-105' />
                      </div>
                      <p className='mt-2 text-sm font-medium text-black capitalize group-hover:text-[#7D5B20] transition truncate'>{f.name.toLowerCase()}</p>
                      <p className='text-xs text-[#8E7862] capitalize'>{f.segment.toLowerCase()}</p>
                    </a>
                  ))}
                </Carousel>
              </ViewItemList>
            </div>
          );
        })}
      </div>
    </section>
  );
}
