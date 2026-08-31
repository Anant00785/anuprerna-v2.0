'use client';
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import { fabrics, apparel, home, accessories, finishedHref, fabricHref, titleCase, type Featured } from '../lib/data';
import { ViewItemList, selectItem, type GtmItem } from './Gtm';
import Carousel from './Carousel';

const TABS = [
  { key:'fabrics',     label:'Fabrics',     data: fabrics,     finished:false },
  { key:'accessories', label:'Accessories', data: accessories, finished:true  },
  { key:'home',        label:'Homeware',    data: home,        finished:true  },
  { key:'apparel',     label:'Apparel',     data: apparel,     finished:true  },
] as const;

function toItems(list: Featured[], cat: string): GtmItem[] {
  return list.map((f, i) => ({ item_id:String(f.subId), item_name: titleCase(f.name), item_category: cat, item_category2: titleCase(f.segment), index: i }));
}

// FIX 2 (LCP): First 2 cards in the INITIAL tab (fabrics) are above-the-fold on
// most viewports — preload them eagerly. Subsequent tabs load on interaction, so
// their images are always lazy (no priority). Cards beyond index 1 in any tab are
// below-fold in the carousel — stay lazy.
const PRIORITY_ABOVE_FOLD = 2;

export default function FeaturedProducts() {
  const [tab, setTab] = useState(0);
  const t = TABS[tab];
  const href = (f: Featured) => t.finished ? finishedHref(f) : fabricHref(f);
  const items = toItems(t.data, t.label);

  return (
    <section className='fb-home-fp-new w-full flex flex-col justify-center items-center min-h-[50vh] pt-10 pb-7'>
      <div className='container mx-auto max-w-screen-xl px-4 flex flex-col lg:flex-row justify-between items-center'>
        <div className='my-5 lg:my-0 lg:flex-[30%] mx-2 lg:mx-0'>
          <h2 className='text-3xl sm:text-4xl'>Our</h2>
          <h2 className='text-3xl sm:text-4xl text-[#7D5B20] font-medium mb-3'>Featured Products</h2>
          <Link href='/products/finished' className='text-lg sm:text-3xl py-2 fb_animate_icon_button'>
            <i className='fb_animate'><b/><span/></i> Discover More
          </Link>
        </div>
        <div className='lg:flex-[70%]'>
          <div className='flex justify-end items-start flex-wrap'>
            {TABS.map((tb, i) => (
              <div key={tb.key} role='button' tabIndex={0} onClick={() => setTab(i)} className={'fb-fp-tab ' + (tab===i?'selected':'')}>{tb.label}</div>
            ))}
          </div>
        </div>
      </div>

      <ViewItemList key={t.key} listId={'home_featured_'+t.key} listName={'Home — Featured '+t.label} items={items}>
        <div className='container mx-auto max-w-screen-xl w-full px-4 py-6 my-4'>
          <Carousel ariaLabel={'Featured '+t.label}>
            {t.data.map((f, i) => (
              <a key={f.subId} href={href(f)} target='_blank' rel='noopener'
                 onClick={() => selectItem('home_featured_'+t.key, 'Home — Featured '+t.label, items[i])}
                 className='group block relative shrink-0 w-[78%] xs:w-[60%] sm:w-[46%] lg:w-[calc((100%-3rem)/4)] hover:drop-shadow-lg transition-shadow'>
                <div className='relative w-full overflow-hidden rounded-2xl bg-[#F0EEE9]' style={{aspectRatio:'330/400'}}>
                  <Image
                    src={f.image}
                    alt={titleCase(f.name)}
                    fill
                    // FIX 2: first 2 items in the initial tab (tab=0) are above-
                    // the-fold in the carousel viewport — preload them. Items
                    // beyond index 1, and ALL items in non-initial tabs (which
                    // aren't rendered yet) stay lazy.
                    priority={tab === 0 && i < PRIORITY_ABOVE_FOLD}
                    sizes='(max-width:1024px) 60vw, 23vw'
                    className='object-cover object-top transition duration-700 group-hover:scale-105'
                  />
                  <div className='absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[300px] flex justify-between items-center fb-fp-view px-2 py-1.5'>
                    <p className='text-white text-xs sm:text-sm font-semibold capitalize truncate'>{f.name.toLowerCase().slice(0,15)}</p>
                    <span className='rounded-xl text-white bg-[#6c5b48] px-2.5 py-1 text-xs sm:text-sm shrink-0'>View</span>
                  </div>
                </div>
              </a>
            ))}
          </Carousel>
        </div>
      </ViewItemList>
    </section>
  );
}
