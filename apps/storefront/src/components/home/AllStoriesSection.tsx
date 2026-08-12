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
    slug: "what-makes-tussar-silk-different-from-other-silks",
    title: "What Makes Tussar Silk Different From Other Silks?",
    description:
      "Designers building a low-impact collection often face a choice between conventional cultivated fibers and wild-harvested alternatives. Selecting tussar silk is a specific technical decision that alters a garment's drape, dye uptake, and thermal prope...",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/9QDJ806REOW2EW7RA77T6Z9URVR905103.jpg",
  },
  {
    id: "blog-2",
    slug: "banana-fiber-fabric-and-bamboo-fiber-fabric-the-future-of-plant-based-textiles",
    title: "Banana Fiber Fabric and Bamboo Fiber Fabric: The Future of Plant-Based Textiles",
    description:
      "Designers are actively replacing synthetic blends and thirsty conventional cotton with bast fibers that offer both structural integrity and a low carbon footprint. Sourcing authentic bamboo fabric has become a critical technical choice for brands aim...",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/7P07S3313ZZZE23ZJ9UFR2RXP5O409733.jpg",
  },
  {
    id: "blog-3",
    slug: "modern-indian-batik-how-traditional-prints-are-evolving",
    title: "Modern Indian Batik: How Traditional Prints Are Evolving",
    description:
      "Designers building contemporary collections often face a tension between preserving heritage craft and meeting the minimalist aesthetic of current global fashion. Sourcing authentic batik that fits into modern resort wear or tailored separates requir...",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/2WAI0BLYUG28X4X5B4SPB7X3WETQ05933.jpg",
  },
  {
    id: "blog-4",
    slug: "what-is-a-sustainable-designer-roles-responsibilities-and-impact",
    title: "What Is A Sustainable Designer? Roles, Responsibilities, and Impact",
    description:
      "A modern fashion collection often begins with a sketch, but the reality of bringing that vision to life requires balancing aesthetic ambition with strict environmental compliance. A sustainable designer steps into this exact tension, acting as the cr...",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/VL2AW0LNZTCIJUSZY0H2C55ECJON00764.jpg",
  },
  {
    id: "blog-5",
    slug: "what-is-french-terry-material-a-deep-dive-into-loop-back-cotton",
    title: "What Is French Terry Material? A Deep Dive Into Loop-Back Cotton",
    description:
      "Designers building trans-seasonal collections face a constant tension between structural integrity and breathability. A heavy winter fleece causes overheating during transitional months, while a standard jersey lacks the drape required for oversized ...",
    bannerImageDesktop:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/8ZD3HFK72W2Q3XSJOYRIICSUOVFB04503.jpg",
  },
];

export function AllStoriesSection() {
  const [blogListShow, setBlogListShow] = useState<boolean[]>([true, false, false, false, false]);

  const handleMouseEnter = (index: number) => {
    const updated = [false, false, false, false, false];
    updated[index] = true;
    setBlogListShow(updated);
  };

  const handleMouseLeave = () => {
    setBlogListShow([true, false, false, false, false]);
  };

  return (
    <section className="fb-home-stories-new w-full flex justify-center items-center py-10 bg-white">
      <div className="container flex flex-col lg:flex-row justify-between items-center px-4 sm:px-6 lg:px-8 gap-6">
        
        {/* Left Column Title & Info */}
        <div className="my-5 lg:my-0 lg:flex-[30%] mx-2 lg:mx-0 w-full">
          <h2 className="fb-font-dm text-5xl lg:text-6xl text-gray-900 font-normal">All</h2>
          <h2 className="fb-font-dm text-5xl lg:text-7xl text-[#7D5B20] font-medium">Stories</h2>
          <p className="text-xl sm:text-2xl my-3 text-gray-800">
            About <span className="text-[#9c8a6c] font-semibold">People</span>, Processes and Products
          </p>
          <Link
            href="/blogs"
            target="_blank"
            className="text-2xl sm:text-3xl py-2 fb_animate_icon_button text-gray-900 font-medium flex items-center gap-2"
          >
            <i className="fb_animate">
              <b></b>
              <span></span>
            </i>
            Discover More
          </Link>
        </div>

        {/* Desktop Accordion Story Cards Gallery */}
        <div className="hidden lg:flex flex-col justify-center items-end lg:flex-[70%] h-[460px] relative w-full">
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
        <div className="lg:hidden w-full overflow-x-auto pb-4 fb-disable-scrollbar">
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
                  <div className="text-xs text-white flex items-center gap-1 font-medium">
                    <span>Read More</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="16px"
                      viewBox="0 0 24 24"
                      width="16px"
                      fill="#FFFFFF"
                    >
                      <path d="M0 0h24v24H0V0z" fill="none" />
                      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="flex gap-1 justify-end mx-3 mt-3 text-xs text-gray-500">
            Swipe for more
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="16px"
              viewBox="0 0 24 24"
              width="16px"
              fill="#000000"
            >
              <path d="M0 0h24v24H0V0z" fill="none" />
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
            </svg>
          </div>
        </div>

      </div>
    </section>
  );
}
