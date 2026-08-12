"use client";

import { useState } from "react";

interface PressNewsItem {
  id: string;
  outletName: string;
  link: string;
  image: string;
  logo: string;
  articleText: string;
  isEtsy?: boolean;
}

const CDN_LINK = "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/news/";

const PRESS_ITEMS: PressNewsItem[] = [
  {
    id: "press-1",
    outletName: "2024 Meaningful Business 100",
    link: "https://meaningful.business/team/amit-singha/",
    image: CDN_LINK + "mb-100-news.png",
    logo: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/m-business.png",
    articleText:
      "Chosen for our commitment of using business as a force for good—combining purpose and profit to tackle social and environmental challenges",
  },
  {
    id: "press-2",
    outletName: "Acumen",
    link: "https://acumen.org/blog/anuprerna-creates-equitable-green-jobs-for-underserved-artisans-in-india/?utm_medium=social&utm_source=linkedin&utm_campaign=inv-sum-anurprena&utm_content=post-1&c_src=social&c_src2=linkedin-inv-sum-anurprena-post-1",
    image: CDN_LINK + "acumen-news.png",
    logo: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/acumen.png",
    articleText:
      "Anuprerna creates equitable green jobs for underserved artisans in India",
  },
  {
    id: "press-3",
    outletName: "60 decibels",
    link: "https://60decibels.com/insights/india-artisans-anuprerna/",
    image: CDN_LINK + "60db-press.png",
    logo: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/60db.png",
    articleText:
      "Empowering India’s Artisans: Anuprerna’s Journey to Impactful, Sustainable Craftsmanship",
  },
  {
    id: "press-4",
    outletName: "Nest",
    link: "https://www.buildanest.org/preserving-indias-khadi-tradition-with-anuprerna/",
    image: CDN_LINK + "nest-news.jpg",
    logo: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/nest.png",
    articleText:
      "Preserving India’s Khadi Tradition with Guild Member, Anuprerna",
  },
  {
    id: "press-5",
    outletName: "The Craft Atlas",
    link: "https://craftatlas.co/artisans/anuprerna-artisanal-heritage-textiles-of-bengal",
    image: CDN_LINK + "craft-news.png",
    logo: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/the_craft_atlas.png",
    articleText: "Anuprerna - Artisanal heritage textiles of Bengal",
  },
  {
    id: "press-6",
    outletName: "Etsy Speaks",
    link: "https://www.etsy.com/in-en/shop/Anuprerna/reviews?ref=shop_info",
    image: CDN_LINK + "etsy-news.png",
    logo: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/etsy.png",
    articleText:
      "Anuprerna - East India's Handwoven Natural Ethical Textile & Crafts",
    isEtsy: true,
  },
  {
    id: "press-7",
    outletName: "The Textile Atlas",
    link: "https://www.thetextileatlas.com/craft-stories/jamdani-weaving",
    image: CDN_LINK + "textile-news.jpg",
    logo: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/the_textail_atlas.png",
    articleText:
      "Anuprerna, creating Jamdani fabrics in 4 clusters at the Burdwan district in West Bengal, India.",
  },
  {
    id: "press-8",
    outletName: "Fashion Network",
    link: "https://in.fashionnetwork.com/news/Anuprerna-launches-e-commerce-platform-eyes-international-handloom-trade,1222271.html",
    image: CDN_LINK + "fashion-network-news.jpg",
    logo: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/fashion_network.png",
    articleText:
      "Anuprerna launches e-commerce platform, eyes international handloom trade",
  },
  {
    id: "press-9",
    outletName: "Paypal",
    link: "https://www.paypal.com/IN/webapps/mpp/supportlocal#",
    image: CDN_LINK + "paypal-news.jpg",
    logo: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/paypal.png",
    articleText: "Championing slow fashion before it was fashionable",
  },
  {
    id: "press-10",
    outletName: "LBB",
    link: "https://lbb.in/kolkata/anuprerna-fabrics-scarves-sarees/",
    image: CDN_LINK + "lbb-news.jpg",
    logo: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/lbb.png",
    articleText:
      "Shop For Handwoven Fabrics, Scarves And Sarees From This Bengal-Based Brand",
  },
  {
    id: "press-11",
    outletName: "NDTV",
    link: "https://www.youtube.com/watch?v=zCz3Z-t7q9E&ab_channel=NDTV",
    image: CDN_LINK + "ndtv-news.jpg",
    logo: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/ndtv.png",
    articleText:
      "Sustainable, Upcycled And Repurposed - Meet the masters of their craft",
  },
  {
    id: "press-12",
    outletName: "Fibre2Fashion",
    link: "https://www.fibre2fashion.com/interviews/face2face/anuprerna/amit-singha/12581-1/",
    image: CDN_LINK + "fibre-news.jpg",
    logo: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/fibre_fashion.png",
    articleText: "Interview With Amit Singha, Founder of Anuprerna",
  },
];

export function PressNewsSection() {
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerPage = 4;

  const nextSlide = () => {
    setStartIndex((prev) => (prev + 1) % PRESS_ITEMS.length);
  };

  const prevSlide = () => {
    setStartIndex((prev) => (prev - 1 + PRESS_ITEMS.length) % PRESS_ITEMS.length);
  };

  // Get current visible items wrapped around
  const visibleItems = [];
  for (let i = 0; i < itemsPerPage; i++) {
    visibleItems.push(PRESS_ITEMS[(startIndex + i) % PRESS_ITEMS.length]);
  }

  return (
    <section className="fb-third-party w-full flex flex-col justify-center items-center py-10 bg-[#fffcf7]">
      <h2 className="text-3xl sm:text-5xl text-[#7D5B20] font-medium mb-10 text-center px-4">
        We are in the <span className="text-black">news</span>
      </h2>

      <div className="w-full container lg:px-12 relative px-4">
        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#9c8a6c] text-white hover:bg-[#7D5B20] flex items-center justify-center shadow-md transition-all"
        >
          &larr;
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#9c8a6c] text-white hover:bg-[#7D5B20] flex items-center justify-center shadow-md transition-all"
        >
          &rarr;
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-8">
          {visibleItems.map((item, idx) => (
            <a
              key={`${item.id}-${idx}`}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="fb-third-party-card bg-white p-3 rounded-md hover:shadow-lg transition-all duration-500 min-h-[260px] flex flex-col justify-between border border-gray-100"
            >
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={`fb-tp-news w-full h-[200px] aspect-video object-cover rounded mb-2 ${
                    item.isEtsy ? "etsy" : ""
                  }`}
                  src={item.image}
                  alt={item.outletName}
                />
                <div className="icon w-full flex flex-col justify-start text-left">
                  <div className="fb-third-party-header w-full flex justify-between items-center flex-row-reverse mt-3 mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.logo}
                      alt={item.outletName}
                      className="max-w-[40px] max-h-[30px] object-contain"
                    />
                    <p className="text-[#6c5b48] font-semibold text-lg lg:text-xl">
                      {item.outletName}
                    </p>
                  </div>
                  <article className="text-[#7D5B20] text-xs sm:text-sm">
                    {item.articleText}
                  </article>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
