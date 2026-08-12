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

const CLUSTER_STORIES: StoryItem[] = [
  {
    id: "8392",
    slug: "jamdani-cluster",
    title: "JAMDANI CLUSTER",
    description:
      "Indian Traditional Textiles Are Treasured Across The Globe For Their Richness And Quality. These Beautiful Fabrics Are Woven By The Skilled Weavers On A Loom. Jamdani In One Such Craft That Requires Experienced Weavers. These Artisans Take Immense Pr...",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/YL56QKLUWOIMXYNZ2ZVTWIHC3TK302594.png",
  },
  {
    id: "8700",
    slug: "mulberry-silk-cluster",
    title: "MULBERRY SILK CLUSTER",
    description:
      "Mulberry Silk Is The Highest Quality Silk Available For Purchase. It Is Made From Silkworms That Are Raised In Captivity Under Exacting Conditions. It Is Also The Most Expensive Type Of Silk.",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/76FL3JYVLQZOMGPO0N5QSJQUWDYA03019.png",
  },
  {
    id: "8798",
    slug: "peace-silk-cluster",
    title: "PEACE SILK CLUSTER",
    description:
      "Peace silk, also known as Ahimsa silk, is an eco-friendly fabric crafted without harming silkworms. Renowned for its soft texture, natural sheen, and breathable quality, it is ideal for luxury garments and accessories.",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/F0FVLMSQ5OSQPG13FWWV2TGSW7E706718.jpg",
  },
];

const CLUSTER_PRODUCTS: ProductItem[] = [
  {
    id: "cl-p1",
    name: "Check Olive and Cream Jamdani Pure Khadi Fabric",
    displayName: "Check Olive and...",
    heroImage:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/9PIE4UM0AVLUJ77FU3GRGECRLSDH05484.jpg",
    slug: "check-olive-and-cream-jamdani-pure-khadi-120-gsm-handwoven-fabric-69",
  },
  {
    id: "cl-p2",
    name: "Plain Natural Pink Silk Fabric",
    displayName: "Plain Natural P...",
    heroImage:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/WL6KO3R8ZLWAT4LC8JTGN2J1NBI403607.jpg",
    slug: "plain-natural-pink-silk-fabric",
  },
];

export function AllClustersSection() {
  return (
    <section className="fb-home-blog-new w-full flex justify-center items-center py-10 bg-white">
      <div className="container flex flex-col justify-between items-center px-4 sm:px-6 lg:px-8">

        {/* Top Grid (grid-1: Title Block + Story Card 1 + Story Card 2) */}
        <div className="fb-blog-gallery grid-1 w-full lg:mt-5">

          {/* Header Block */}
          <div className="w-full flex flex-col justify-center">
            <h2 className="fb-font-dm text-5xl lg:text-6xl text-gray-900 font-normal">All</h2>
            <h2 className="fb-font-dm text-5xl lg:text-7xl text-[#7D5B20] font-medium mb-2">Clusters</h2>
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

          {/* Story 1 Card (Jamdani Cluster) */}
          {CLUSTER_STORIES[0] && (
            <Link
              href={`/stories/${CLUSTER_STORIES[0].slug}/${CLUSTER_STORIES[0].id}`}
              target="_blank"
              className="fb-blog-container shadow-md hover:shadow-xl transition-all"
            >
              <div className="fb-blog-content">
                <h3 className="fb-blog-title text-xl font-medium text-white">{CLUSTER_STORIES[0].title}</h3>
                <p className="fb-blog-description text-sm text-white/90 line-clamp-3">
                  {CLUSTER_STORIES[0].description}
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
                src={CLUSTER_STORIES[0].bannerImageDesktop}
                alt={CLUSTER_STORIES[0].title}
              />
            </Link>
          )}

          {/* Story 2 Card (Mulberry Silk Cluster) */}
          {CLUSTER_STORIES[1] && (
            <Link
              href={`/stories/${CLUSTER_STORIES[1].slug}/${CLUSTER_STORIES[1].id}`}
              target="_blank"
              className="fb-blog-container shadow-md hover:shadow-xl transition-all"
            >
              <div className="fb-blog-content">
                <h3 className="fb-blog-title text-xl font-medium text-white">{CLUSTER_STORIES[1].title}</h3>
                <p className="fb-blog-description text-sm text-white/90 line-clamp-3">
                  {CLUSTER_STORIES[1].description}
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
                src={CLUSTER_STORIES[1].bannerImageDesktop}
                alt={CLUSTER_STORIES[1].title}
              />
            </Link>
          )}

        </div>

        {/* Bottom Grid (grid-2: Story Card 3 + Product Cards Grid) */}
        <div className="fb-blog-gallery grid-2 w-full mt-5">

          {/* Story 3 Card (Peace Silk Cluster) */}
          {CLUSTER_STORIES[2] && (
            <Link
              href={`/stories/${CLUSTER_STORIES[2].slug}/${CLUSTER_STORIES[2].id}`}
              target="_blank"
              className="fb-blog-container shadow-md hover:shadow-xl transition-all"
            >
              <div className="fb-blog-content">
                <h3 className="fb-blog-title text-xl font-medium text-white">{CLUSTER_STORIES[2].title}</h3>
                <p className="fb-blog-description text-sm text-white/90 line-clamp-3">
                  {CLUSTER_STORIES[2].description}
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
                src={CLUSTER_STORIES[2].bannerImageDesktop}
                alt={CLUSTER_STORIES[2].title}
              />
            </Link>
          )}

          {/* Product Cards Container */}
          <div className="fb-product-container grid-product-2">
            {CLUSTER_PRODUCTS.map((prod) => (
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
