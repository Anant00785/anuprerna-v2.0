"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface HeroCard {
  type: string;
  src: string;
  poster: string;
  text: string;
}

const HERO_CARDS: HeroCard[] = [
  {
    type: "video",
    src: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/artisan-flow-demo-desktop.mp4",
    poster: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/video-thumbnails.png",
    text: "Combining Technology with Traditions",
  },
  {
    type: "video",
    src: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/dyeing.mp4",
    poster: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-2.png",
    text: "Naturally Dyed, Ethically Sourced",
  },
  {
    type: "video",
    src: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/stitching.mp4",
    poster: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-3.png",
    text: "Empowering 500+ Artisans from East India",
  },
  {
    type: "video",
    src: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/bts.mp4",
    poster: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-4.png",
    text: "From Fabrics, Apparel, Homeware & More, Custom-Crafted for You",
  },
];

export function HeroSection() {
  const [blogListShow, setBlogListShow] = useState<boolean[]>([true, false, false, false]);
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBlogListShow([true, false, false, false]);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseEnter = (index: number) => {
    const updated = [false, false, false, false];
    updated[index] = true;
    setBlogListShow(updated);
  };

  const handleMouseLeave = (index: number) => {
    if (index !== 0) {
      setBlogListShow([true, false, false, false]);
    }
  };

  return (
    <>
      <section className="fb-home-stories-new w-full flex flex-col justify-center items-center py-6 md:py-10 bg-white">
        <div className="container flex flex-col lg:flex-row justify-between items-center gap-4 md:gap-8 lg:mb-9 relative px-4 sm:px-6 lg:px-8">
          
          {/* Left Column Text & Action Buttons */}
          <div className="mb-5 lg:my-0 lg:flex-[40%] mx-2 lg:mx-0 w-full">
            <h1 className="text-3xl sm:text-5xl text-[#7D5B20] font-medium mb-4 md:mb-10 leading-tight">
              <a
                href="https://anuprerna.com/products/fabric?page=1&sort-by=availability"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Handwoven Artisanal
              </a>{" "}
              <span className="text-black">Textiles</span> &{" "}
              <span className="text-black">Products</span>
            </h1>

            <p className="text-base md:text-2xl my-2 text-gray-900">
              <span className="text-[#7D5B20] font-semibold">100%</span> Natural Fibres
            </p>
            <p className="text-base md:text-2xl my-2 text-gray-900">
              Fully <span className="text-[#7D5B20] font-semibold">customised</span> fabrics at low MOQ
            </p>
            <p className="text-base md:text-2xl my-2 text-gray-900">
              Seamless manufacturing{" "}
              <span className="text-[#7D5B20] font-semibold">Apparel</span>,{" "}
              <span className="text-[#7D5B20] font-semibold">Home</span> &amp;{" "}
              <span className="text-[#7D5B20] font-semibold">Accessories</span>
            </p>

            <div className="w-full flex justify-between gap-3 items-center pt-2">
              <Link
                href="/products/fabric"
                target="_blank"
                className="w-full bg-[#fffcf7] hover:bg-white hover:shadow-md rounded md:rounded-lg border-2 border-[#8E7862] text-[#7D5B20] py-2 px-3 hover:border-[#6c5b48] transition flex items-center justify-center gap-2 text-sm sm:text-xl mt-4 font-medium"
              >
                <i className="fb_animate">
                  <b></b>
                  <span></span>
                </i>
                Fabrics
              </Link>
              <Link
                href="/products/finished"
                target="_blank"
                className="w-full bg-[#fffcf7] hover:bg-white hover:shadow-md rounded md:rounded-lg border-2 border-[#8E7862] text-[#7D5B20] py-2 px-3 hover:border-[#6c5b48] transition flex items-center justify-center gap-2 text-sm sm:text-xl mt-4 font-medium"
              >
                <i className="fb_animate">
                  <b></b>
                  <span></span>
                </i>
                Finished Goods
              </Link>
            </div>
          </div>

          {/* Desktop Accordion Flex Cards Gallery */}
          <div className="hidden lg:flex flex-col justify-center items-end lg:flex-[60%] h-[400px] relative w-full">
            <div className="fb_story_gallery">
              {HERO_CARDS.map((blog, i) => (
                <div
                  key={i}
                  className={`fb_story_container ${blogListShow[i] ? "fb_content_hover" : ""}`}
                  onMouseEnter={() => handleMouseEnter(i)}
                  onMouseLeave={() => handleMouseLeave(i)}
                  onClick={() => setActiveVideoModal(blog.src)}
                >
                  <span className="material-symbols-outlined top">youtube_activity</span>
                  <div className="fb_story_content flex justify-start gap-1.5 items-center">
                    <span className="material-symbols-outlined">movie</span>
                    <h3
                      className="fb_story_title"
                      dangerouslySetInnerHTML={{ __html: blog.text }}
                    />
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={blog.poster} alt={blog.text} />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Hero Card View */}
          <div className="lg:hidden w-full">
            <div className="w-full relative cursor-pointer" onClick={() => setActiveVideoModal(HERO_CARDS[0].src)}>
              <div className="fb-home-hero-mobile rounded-lg m-2 overflow-hidden relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-full h-full aspect-video object-cover relative z-[1]"
                  src={HERO_CARDS[0].poster}
                  alt={HERO_CARDS[0].text}
                />
              </div>
              <div className="fb_story_content absolute bottom-4 left-1 w-full z-[2]">
                <h3
                  className="fb_story_title text-sm text-center text-white font-medium drop-shadow"
                  dangerouslySetInnerHTML={{ __html: HERO_CARDS[0].text }}
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Video Modal Player */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideoModal(null)}
              className="absolute top-3 right-3 z-10 text-white bg-black/60 hover:bg-black p-2 rounded-full transition"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <video
              src={activeVideoModal}
              controls
              autoPlay
              className="w-full max-h-[85vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
