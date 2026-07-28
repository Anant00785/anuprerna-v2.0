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

const COLLAB_STORIES: StoryItem[] = [
  {
    id: "collab-1",
    slug: "zero-waste-fashion-partnership",
    title: "Global Ethical Designers: Zero Waste Fashion",
    description:
      "Partnering with eco-conscious independent designers across Europe and North America to create low-carbon capsule collections.",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-4.png",
  },
  {
    id: "collab-2",
    slug: "artisan-community-empowerment",
    title: "Empowering 500+ Rural Weavers in West Bengal",
    description:
      "Co-creating fair-trade employment opportunities and fair wage standards directly benefiting East Indian weaving clusters.",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-3.png",
  },
];

const COLLAB_PRODUCTS: ProductItem[] = [
  {
    id: "collab-p1",
    name: "Co-Designed Linen Stole",
    heroImage:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/customisations.png",
    slug: "co-designed-linen-stole",
  },
  {
    id: "collab-p2",
    name: "Hand-Dyed Indigo Scarf",
    heroImage:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/custom-dyeing.png",
    slug: "hand-dyed-indigo-scarf",
  },
  {
    id: "collab-p3",
    name: "Organic Cotton Kimono",
    heroImage:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-2.png",
    slug: "organic-cotton-kimono",
  },
  {
    id: "collab-p4",
    name: "Handloom Cushion Cover",
    heroImage:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/swatch-bundle-min.jpg",
    slug: "handloom-cushion-cover",
  },
];

export function AllCollaborationsSection() {
  return (
    <section className="fb-home-blog-new w-full flex justify-center items-center py-10 bg-white">
      <div className="container flex flex-col justify-between items-center px-4 sm:px-6 lg:px-8">

        {/* Top Grid (grid-3: Story Card 1 + Story Card 2 + Product Card 1) */}
        <div className="fb-blog-gallery grid-3 w-full lg:mt-5">

          {/* Story 1 */}
          {COLLAB_STORIES[0] && (
            <Link
              href={`/stories/${COLLAB_STORIES[0].slug}/${COLLAB_STORIES[0].id}`}
              target="_blank"
              className="fb-blog-container shadow-md hover:shadow-xl transition-all"
            >
              <div className="fb-blog-content">
                <h3 className="fb-blog-title text-xl font-medium text-white">{COLLAB_STORIES[0].title}</h3>
                <p className="fb-blog-description text-sm text-white/90 line-clamp-3">
                  {COLLAB_STORIES[0].description}
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
                src={COLLAB_STORIES[0].bannerImageDesktop}
                alt={COLLAB_STORIES[0].title}
              />
            </Link>
          )}

          {/* Story 2 */}
          {COLLAB_STORIES[1] && (
            <Link
              href={`/stories/${COLLAB_STORIES[1].slug}/${COLLAB_STORIES[1].id}`}
              target="_blank"
              className="fb-blog-container shadow-md hover:shadow-xl transition-all"
            >
              <div className="fb-blog-content">
                <h3 className="fb-blog-title text-xl font-medium text-white">{COLLAB_STORIES[1].title}</h3>
                <p className="fb-blog-description text-sm text-white/90 line-clamp-3">
                  {COLLAB_STORIES[1].description}
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
                src={COLLAB_STORIES[1].bannerImageDesktop}
                alt={COLLAB_STORIES[1].title}
              />
            </Link>
          )}

          {/* Product Card 1 */}
          {COLLAB_PRODUCTS[0] && (
            <Link
              href={`/products/finished?search=${COLLAB_PRODUCTS[0].slug}`}
              className="fb-fp-card flex flex-col justify-center items-center relative group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="fb-fp-image w-full h-[400px] object-cover object-top rounded-2xl group-hover:scale-102 transition-transform duration-500"
                src={COLLAB_PRODUCTS[0].heroImage}
                alt={COLLAB_PRODUCTS[0].name}
              />
              <div className="w-[90%] max-w-[300px] flex justify-between items-center fb-fp-view px-3 py-2 absolute bottom-5">
                <p className="text-white text-xs sm:text-sm font-semibold truncate max-w-[170px]">
                  {COLLAB_PRODUCTS[0].name}
                </p>
                <button className="rounded-xl text-white bg-[#6c5b48] hover:bg-[#584938] px-3 py-1 text-xs font-semibold">
                  View
                </button>
              </div>
            </Link>
          )}

        </div>

        {/* Bottom Grid (Title Block + 3 Product Cards) */}
        <div className="fb-blog-gallery w-full lg:mt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">

            {/* Header Block */}
            <div className="w-full flex flex-col justify-center my-4">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl text-gray-900 font-normal">All</h2>
              <h2 className="text-3xl sm:text-5xl lg:text-6xl text-[#7D5B20] font-medium mb-2">Collaborations</h2>
              <Link
                href="/stories?category=collaborations"
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

            {/* Remaining 3 Product Cards */}
            {COLLAB_PRODUCTS.slice(1, 4).map((prod) => (
              <Link
                key={prod.id}
                href={`/products/finished?search=${prod.slug}`}
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
