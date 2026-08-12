"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatedCounter } from "./AnimatedCounter";

export function ArtisanFlowShowcase() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => {
          if (videoRef.current) {
            videoRef.current.controls = true;
            videoRef.current.muted = false;
          }
        }).catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  return (
    <section className="w-full flex justify-center items-center bg-white py-8">
      <div className="max-w-screen-xl w-full flex flex-col md:flex-row justify-center md:justify-between items-center my-5 px-4 sm:px-6 lg:px-8">
        
        {/* Left Side Video Player */}
        <div className="relative my-3 mx-2 md:mx-6 max-w-[94vw] md:max-w-[32%] shrink-0">
          <video
            ref={videoRef}
            onClick={togglePlay}
            controls={isPlaying}
            className="rounded-xl w-full h-auto cursor-pointer shadow-md border border-gray-100"
            poster="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/artisan-flow-video-thumbnail.png"
            src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/artisan-flow-demo-mobile.mp4"
            playsInline
            preload="metadata"
            muted
            loop
          />
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-14 h-14 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all shadow-lg pointer-events-none"
            >
              <span className="material-symbols-outlined text-3xl">play_arrow</span>
            </button>
          )}
        </div>

        {/* Right Side Content & Stats */}
        <div className="md:flex-[60%] max-w-screen-md text-center md:text-start pt-4 md:pt-0">
          <p className="max-w-screen-md text-sm mb-1 mt-2 text-gray-700">
            <span className="text-[#7d5b20] font-bold">EMBRACE</span> transparency,{" "}
            <span className="text-[#7d5b20] font-bold">EMPOWER</span> artisans, and{" "}
            <span className="text-[#7d5b20] font-bold">ENABLE</span> a sustainable future.
          </p>

          <h2 className="text-3xl sm:text-5xl text-[#7D5B20] font-semibold mb-4">
            <span className="text-black">Introducing</span>{" "}
            <Link href="/artisanflow" target="_blank" className="hover:underline">
              ArtisanFlow
            </Link>
          </h2>

          {/* Stats Cards Section */}
          <div className="w-full grid grid-cols-3 gap-3 text-center text-xs md:text-sm my-4">
            <div className="rounded-md p-3 flex flex-col gap-2 justify-center items-center bg-[#faf8f5] border border-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="h-[80px] md:h-[120px] object-contain"
                src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/carbon-af.png"
                alt="Carbon offset"
              />
              <span className="text-xl md:text-2xl font-bold text-[#7d5b20]">
                <AnimatedCounter end={45708} />
              </span>
              <p className="font-bold text-gray-800 leading-tight">
                Kilograms of <br />
                Carbon Offset
              </p>
            </div>

            <div className="rounded-md p-3 flex flex-col gap-2 justify-center items-center bg-[#faf8f5] border border-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="h-[80px] md:h-[120px] object-contain"
                src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/artisan-hour-af.png"
                alt="Hours of artisan work"
              />
              <span className="text-xl md:text-2xl font-bold text-[#7d5b20]">
                <AnimatedCounter end={107548} />
              </span>
              <p className="font-bold text-gray-800 leading-tight">
                Hours of Work of <br />
                500+ Artisans
              </p>
            </div>

            <div className="rounded-md p-3 flex flex-col gap-2 justify-center items-center bg-[#faf8f5] border border-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="h-[80px] md:h-[120px] object-contain"
                src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/artisan-flow/water-saving-af.png"
                alt="Litres of water savings"
              />
              <span className="text-xl md:text-2xl font-bold text-[#7d5b20]">
                <AnimatedCounter end={966253} />
              </span>
              <p className="font-bold text-gray-800 leading-tight">
                Litres of Water <br />
                Savings
              </p>
            </div>
          </div>

          <p className="text-sm md:text-base text-gray-700 pt-2 leading-relaxed">
            Managing an <span className="font-bold">artisanal supply chain</span> has never been easier. Our platform{" "}
            <span className="font-bold">simplifies supply chain complexity</span> by providing{" "}
            <span className="font-bold">real-time tracking &amp; analytics</span> at every stage of production.
          </p>

          <div className="flex justify-center md:justify-start">
            <Link
              href="/artisanflow"
              target="_blank"
              className="w-full sm:w-max bg-[#fffcf7] hover:bg-white hover:shadow-md rounded md:rounded-lg border-2 border-[#8E7862] text-[#7D5B20] py-2 px-4 hover:border-[#6c5b48] transition flex items-center justify-center gap-2 text-base sm:text-xl mt-5 font-medium"
            >
              <i className="fb_animate">
                <b></b>
                <span></span>
              </i>
              Get Started with ArtisanFlow
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
