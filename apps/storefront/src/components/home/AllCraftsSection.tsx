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
  heroImage: string;
  slug: string;
}

const CRAFT_STORIES: StoryItem[] = [
  {
    id: "craft-1",
    slug: "jamdani-weaving-heritage",
    title: "Jamdani Weaving: The Fine Art of Feathery Motifs",
    description:
      "Explore the UNESCO-recognized heritage of Jamdani weaving from Bengal, handcrafted meticulously on traditional handlooms.",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-2.png",
  },
  {
    id: "craft-2",
    slug: "khadi-cotton-revolution",
    title: "Khadi Cotton: The Freedom Fabric of India",
    description:
      "Hand-spun and handwoven, Khadi cotton represents India's rich artisanal legacy and sustainable textile heritage.",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/swatch-bundle-min.jpg",
  },
  {
    id: "craft-3",
    slug: "natural-dyeing-tradition",
    title: "100% Natural Botanical Dyeing Processes",
    description:
      "Extracting vibrant shades from indigo, madder root, marigold, and pomegranate peels without synthetic chemical pollutants.",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/custom-dyeing.png",
  },
];

const CRAFT_PRODUCTS: ProductItem[] = [
  {
    id: "cp-1",
    name: "Jamdani Handwoven Fabric",
    heroImage:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-3.png",
    slug: "jamdani-handwoven-fabric",
  },
  {
    id: "cp-2",
    name: "Khadi Cotton Fabric",
    heroImage:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/bulk-order.png",
    slug: "khadi-cotton-fabric",
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
            <h2 className="text-3xl sm:text-5xl lg:text-6xl text-gray-900 font-normal">All</h2>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl text-[#7D5B20] font-medium mb-2">Crafts</h2>
            <Link
              href="/stories"
              target="_blank"
              className="text-xl py-2 fb_animate_icon_button font-medium text-gray-900"
            >
              <i className="fb_animate">
                <b></b>
                <span></span>
              </i>
              Discover More
            </Link>
          </div>

          {/* Story 1 Card */}
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

          {/* Story 2 Card */}
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
          
          {/* Story 3 Card */}
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
                    {prod.name}
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
