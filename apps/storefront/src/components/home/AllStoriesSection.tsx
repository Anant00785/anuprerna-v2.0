"use client";

import { useState } from "react";
import Link from "next/link";

interface BlogItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  bannerImageDesktop: string;
}

const ALL_STORIES: BlogItem[] = [
  {
    id: "blog-1",
    slug: "reviving-indias-khadi-tradition",
    title: "Preserving India's Heritage: The Khadi Movement",
    description:
      "How hand-spun Khadi continues to provide sustainable livelihood for thousands of rural Indian artisans.",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/swatch-bundle-min.jpg",
  },
  {
    id: "blog-2",
    slug: "sustainable-handloom-manufacturing",
    title: "Zero Chemical Dyeing & Eco-Friendly Processing",
    description:
      "Understanding our closed-loop water treatment and 100% plant-based natural dye formulations.",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/custom-dyeing.png",
  },
  {
    id: "blog-3",
    slug: "empowering-artisan-women",
    title: "Empowering Rural Women Through Textile Craftsmanship",
    description:
      "Building economic independence and skill development programs in remote Bengal villages.",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-3.png",
  },
  {
    id: "blog-4",
    slug: "traceable-supply-chain-artisanflow",
    title: "ArtisanFlow: Bringing Supply Chain Transparency to Life",
    description:
      "Real-time tracking from yarn sourcing to hand-weaving and final delivery for ethical fashion brands.",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/video-thumbnails.png",
  },
];

export function AllStoriesSection() {
  const [blogListShow, setBlogListShow] = useState<boolean[]>([true, false, false, false]);

  const handleMouseEnter = (index: number) => {
    const updated = [false, false, false, false];
    updated[index] = true;
    setBlogListShow(updated);
  };

  const handleMouseLeave = () => {
    setBlogListShow([true, false, false, false]);
  };

  return (
    <section className="fb-home-stories-new w-full flex justify-center items-center py-10 bg-white">
      <div className="container flex flex-col lg:flex-row justify-between items-center px-4 sm:px-6 lg:px-8 gap-6">
        
        {/* Left Column Title & Info */}
        <div className="my-5 lg:my-0 lg:flex-[30%] mx-2 lg:mx-0 w-full">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl text-gray-900 font-normal">All</h2>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl text-[#7D5B20] font-medium">Stories</h2>
          <p className="text-xl sm:text-2xl my-3 text-gray-800">
            About <span className="text-[#9c8a6c] font-semibold">People</span>, Processes and Products
          </p>
          <Link
            href="/blogs"
            target="_blank"
            className="text-2xl sm:text-3xl py-2 fb_animate_icon_button text-gray-900 font-medium"
          >
            <i className="fb_animate">
              <b></b>
              <span></span>
            </i>
            Discover More
          </Link>
        </div>

        {/* Desktop Accordion Story Cards Gallery */}
        <div className="hidden lg:flex flex-col justify-center items-end lg:flex-[70%] h-[420px] relative w-full">
          <div className="fb_story_gallery">
            {ALL_STORIES.map((blog, i) => (
              <Link
                key={blog.id}
                href={`/blogs/${blog.slug}/${blog.id}`}
                target="_blank"
                className={`fb_story_container ${blogListShow[i] ? "fb_content_hover" : ""}`}
                onMouseEnter={() => handleMouseEnter(i)}
                onMouseLeave={handleMouseLeave}
              >
                <div className="fb_story_content flex flex-col justify-start">
                  <h3 className="fb_story_title text-lg font-medium text-white">{blog.title}</h3>
                  <p className="fb_story_description text-sm text-white/90 line-clamp-3">
                    {blog.description}
                  </p>
                  <div className="text-sm py-2 fb_story_button flex items-center gap-2 text-white font-medium mt-2">
                    <span>Read More About This Blog</span>
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
                <img src={blog.bannerImageDesktop} alt={blog.title} />
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile View Scrollable Story Cards */}
        <div className="lg:hidden w-full overflow-x-auto pb-4">
          <div className="flex gap-4 w-max px-2">
            {ALL_STORIES.map((blog) => (
              <Link
                key={blog.id}
                href={`/blogs/${blog.slug}/${blog.id}`}
                target="_blank"
                className="w-[280px] h-[360px] relative rounded-xl overflow-hidden shrink-0 shadow-md block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blog.bannerImageDesktop}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end">
                  <h3 className="text-base font-semibold text-white mb-1 line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-2 mb-2">
                    {blog.description}
                  </p>
                  <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                    Read More &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
