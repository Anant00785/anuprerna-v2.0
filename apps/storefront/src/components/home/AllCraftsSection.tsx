"use client";

import Link from "next/link";

interface StoryItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  bannerImageDesktop: string;
}

interface ProductItem {
  id: string;
  name: string;
  displayName: string;
  heroImage: string;
  slug: string;
}

const CRAFT_STORIES: StoryItem[] = [
  {
    id: "14799",
    slug: "jamdani-loom-embroidery",
    title: "JAMDANI LOOM EMBROIDERY",
    description:
      "Jamdani Cotton Fabric Is A Fine Woven Fabric Crafted By Supplementary Weft Technique Of Weaving. Historically Referred To As Muslin, The Jamdani Textile Is One Of The Most Unique Crafts For Which Anuprerna Is Working Along With Around 100+ Jamda...",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/CH64NIS6VJWMX8LG7U4KPO4F5UH007416.jpg",
  },
  {
    id: "16676",
    slug: "mulberry-silk",
    title: "MULBERRY SILK",
    description:
      "Mulberry Silk Fabric Is The Highest Quality Silk Available For Purchase. The Unique Thing About Mulberry Silk Is How It Is Produced. Mulberry Silk Has Its History In China, Where Local Farmers Grow Mulberry Trees And Harvest The Leaves For ...",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/I5WK5HKCKITOBB59DJXFHROSUNLF06938.jpg",
  },
  {
    id: "9149",
    slug: "dyeable-khadi-cotton",
    title: "DYEABLE KHADI COTTON",
    description:
      "Khadi Or Indian Khadi Is A Term That Basically To An Indian Fabric That Has Been Handspun & Handwoven Using Natural Fibres Like Cotton, Wool, Silk Or Linen. Being A Manual Process, No Two Khadi Fabrics Are The Same. Each Piece Is Unique In Its Be...",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/P0H1HJB366U7L8JHK81UB0031E6F08376.jpg",
  },
];

const CRAFT_PRODUCTS: ProductItem[] = [
  {
    id: "cp-1",
    name: "Geometric Light Yellow Jamdani Fabric",
    displayName: "Geometric Light...",
    heroImage:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/9Q2P6GYIFSC8GD6366UG6FIEIMCL03302.jpg",
    slug: "geometric-light-yellow-jamdani-fabric",
  },
  {
    id: "cp-2",
    name: "Plain Natural Dyeable Khadi Cotton",
    displayName: "Plain Natural D...",
    heroImage:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/R7GSB11RJXZZWOWJML3V6EWBQW2100072.jpg",
    slug: "plain-natural-dyeable-khadi-cotton",
  },
];

export function AllCraftsSection() {
  return (
    <section className="fb-home-blog-new w-full flex justify-center items-center py-10 bg-white">
      <div className="container flex flex-col justify-between items-center px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid (grid-1: Title Block + Story Card 1 + Story Card 2) */}
        <div className="fb-blog-gallery grid-1 w-full lg:mt-5">
          
          {/* Header Block */}
          <div className="w-full flex flex-col justify-center">
            <h2 className="fb-font-dm text-5xl lg:text-6xl text-gray-900 font-normal">All</h2>
            <h2 className="fb-font-dm text-5xl lg:text-7xl text-[#7D5B20] font-medium mb-2">Crafts</h2>
            <Link
              href="/stories"
              target="_blank"
              className="text-xl py-2 fb_animate_icon_button font-medium text-gray-900 flex items-center gap-2"
            >
              <i className="fb_animate">
                <b></b>
                <span></span>
              </i>
              Discover More
            </Link>
          </div>

          {/* Story 1 Card (Jamdani Loom Embroidery) */}
          {CRAFT_STORIES[0] && (
            <Link
              href={`/stories/${CRAFT_STORIES[0].slug}/${CRAFT_STORIES[0].id}`}
              target="_blank"
              className="fb-blog-container shadow-md hover:shadow-xl transition-all"
            >
              <div className="fb-blog-content">
                <h3 className="fb-blog-title text-xl font-medium text-white">{CRAFT_STORIES[0].title}</h3>
                <p className="fb-blog-description text-sm text-white/90 line-clamp-3">
                  {CRAFT_STORIES[0].description}
                </p>
                <div className="text-base py-2 fb_story_button flex items-center gap-2 text-white font-medium">
                  <span>Learn More</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 0 24 24"
                    width="24px"
                    fill="#FFFFFF"
                  >
                    <path d="M0 0h24v24H0V0z" fill="none" />
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                  </svg>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="fb-blog-image"
                src={CRAFT_STORIES[0].bannerImageDesktop}
                alt={CRAFT_STORIES[0].title}
              />
            </Link>
          )}

          {/* Story 2 Card (Mulberry Silk) */}
          {CRAFT_STORIES[1] && (
            <Link
              href={`/stories/${CRAFT_STORIES[1].slug}/${CRAFT_STORIES[1].id}`}
              target="_blank"
              className="fb-blog-container shadow-md hover:shadow-xl transition-all"
            >
              <div className="fb-blog-content">
                <h3 className="fb-blog-title text-xl font-medium text-white">{CRAFT_STORIES[1].title}</h3>
                <p className="fb-blog-description text-sm text-white/90 line-clamp-3">
                  {CRAFT_STORIES[1].description}
                </p>
                <div className="text-base py-2 fb_story_button flex items-center gap-2 text-white font-medium">
                  <span>Learn More</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 0 24 24"
                    width="24px"
                    fill="#FFFFFF"
                  >
                    <path d="M0 0h24v24H0V0z" fill="none" />
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                  </svg>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="fb-blog-image"
                src={CRAFT_STORIES[1].bannerImageDesktop}
                alt={CRAFT_STORIES[1].title}
              />
            </Link>
          )}

        </div>

        {/* Bottom Grid (grid-2: Story Card 3 + Product Cards Grid) */}
        <div className="fb-blog-gallery grid-2 w-full mt-5">
          
          {/* Story 3 Card (Dyeable Khadi Cotton) */}
          {CRAFT_STORIES[2] && (
            <Link
              href={`/stories/${CRAFT_STORIES[2].slug}/${CRAFT_STORIES[2].id}`}
              target="_blank"
              className="fb-blog-container shadow-md hover:shadow-xl transition-all"
            >
              <div className="fb-blog-content">
                <h3 className="fb-blog-title text-xl font-medium text-white">{CRAFT_STORIES[2].title}</h3>
                <p className="fb-blog-description text-sm text-white/90 line-clamp-3">
                  {CRAFT_STORIES[2].description}
                </p>
                <div className="text-base py-2 fb_story_button flex items-center gap-2 text-white font-medium">
                  <span>Learn More</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 0 24 24"
                    width="24px"
                    fill="#FFFFFF"
                  >
                    <path d="M0 0h24v24H0V0z" fill="none" />
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                  </svg>
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="fb-blog-image"
                src={CRAFT_STORIES[2].bannerImageDesktop}
                alt={CRAFT_STORIES[2].title}
              />
            </Link>
          )}

          {/* Product Cards Container */}
          <div className="fb-product-container grid-product-2">
            {CRAFT_PRODUCTS.map((prod) => (
              <Link
                key={prod.id}
                href={`/products/fabric?search=${prod.slug}`}
                className="fb-fp-card flex flex-col justify-center items-center relative group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="fb-fp-image w-full h-[400px] object-cover object-top rounded-2xl group-hover:scale-102 transition-transform duration-500"
                  src={prod.heroImage}
                  alt={prod.name}
                />
                <div className="w-[90%] max-w-[300px] flex justify-between items-center fb-fp-view px-3 py-2 absolute bottom-5">
                  <p className="text-white text-xs sm:text-sm font-semibold truncate max-w-[170px]">
                    {prod.displayName}
                  </p>
                  <button className="rounded-xl text-white bg-[#6c5b48] hover:bg-[#584938] px-3 py-1 text-xs font-semibold">
                    View
                  </button>
                </div>
              </Link>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
