"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";

interface FeaturedProductItem {
  segmentCategoryId?: number;
  segmentCategoryName: string;
  subCategoryId?: number;
  subCategoryName: string;
  subCategoryFeaturedImage: string;
}

const TABS = [
  { key: "fabrics", label: "Fabrics" },
  { key: "accessories", label: "Accessories" },
  { key: "home", label: "Homeware" },
  { key: "apparel", label: "Apparel" },
];

function prepareUrl(param?: string): string {
  if (!param) return "";
  const cleaned = param.toLowerCase().trim();
  if (cleaned.includes("-")) {
    return cleaned.replace(/\s+/g, "");
  }
  return cleaned.replace(/\s+/g, "-");
}

export function FeaturedProducts() {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [productsMap, setProductsMap] = useState<Record<string, FeaturedProductItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabKey = TABS[selectedTabIndex].key;
  const currentProducts = useMemo(
    () => productsMap[activeTabKey] || [],
    [productsMap, activeTabKey]
  );

  useEffect(() => {
    let isMounted = true;
    async function fetchFeatured(cat: string) {
      if (productsMap[cat]) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/featured/${cat}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (isMounted && json.data) {
          setProductsMap((prev) => ({ ...prev, [cat]: json.data }));
        }
      } catch (err) {
        console.error(`Failed to load featured products for ${cat}:`, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchFeatured(activeTabKey);
    return () => {
      isMounted = false;
    };
  }, [activeTabKey, productsMap]);

  // Autoplay infinite scroll interval matching Angular OwlCarousel (autoplayTimeout: 3000ms)
  useEffect(() => {
    if (isPaused || currentProducts.length <= 1) return;
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollContainerRef.current.scrollBy({ left: 310, behavior: "smooth" });
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused, currentProducts]);

  const onTabChange = (index: number) => {
    setSelectedTabIndex(index);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -340, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 340, behavior: "smooth" });
    }
  };

  const getRedirectionUrl = (item: FeaturedProductItem) => {
    const seg = prepareUrl(item.segmentCategoryName);
    const sub = prepareUrl(item.subCategoryName);
    if (activeTabKey === "fabrics") {
      return `/products/fabric?${seg}=${sub}`;
    } else {
      return `/products/finished?${seg}=${sub}`;
    }
  };

  return (
    <section className="fb-home-fp-new w-full flex flex-col justify-center items-center min-h-[50vh] pt-10 pb-7 bg-white">
      <div className="container flex flex-col lg:flex-row justify-between items-center px-4 sm:px-6 lg:px-8">
        
        {/* Left Column Section Title */}
        <div className="my-5 lg:my-0 lg:flex-[30%] mx-2 lg:mx-0 px-4 lg:px-0 w-full">
          <h2 className="text-3xl sm:text-4xl text-gray-900 font-normal">Our</h2>
          <h2 className="fb-font-dm text-3xl sm:text-4xl text-[#7D5B20] font-medium mb-3">
            Featured Products
          </h2>
          <Link
            href={activeTabKey === "fabrics" ? "/products/fabric" : "/products/finished"}
            target="_blank"
            className="text-lg sm:text-3xl py-2 fb_animate_icon_button text-gray-900 font-medium inline-flex items-center"
          >
            <i className="fb_animate">
              <b></b>
              <span></span>
            </i>
            <span>Discover More</span>
          </Link>
        </div>

        {/* Right Column Tabs */}
        <div className="lg:flex-[70%] w-full">
          <div className="fb-fp-tabs flex justify-start lg:justify-end items-center gap-2 border-b border-[#9c8a6c] overflow-x-auto pb-1 whitespace-nowrap w-full">
            {TABS.map((tab, idx) => (
              <div
                key={tab.key}
                onClick={() => onTabChange(idx)}
                className={`text-base sm:text-lg lg:text-xl px-3 py-2 text-black cursor-pointer transition-all shrink-0 ${
                  selectedTabIndex === idx ? "tab-selected font-medium text-[#7D5B20] border-b-[1.5px] border-[#6c5b48]" : "hover:text-[#7D5B20]"
                }`}
              >
                {tab.label}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Product Cards Carousel Container */}
      <div className="fb-f-product container w-full px-4 py-6 my-4 relative">
        {loading && currentProducts.length === 0 ? (
          <div className="w-full h-[400px] flex flex-col justify-center items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#8E7862] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-xs">Loading featured products...</p>
          </div>
        ) : (
          <div
            className="relative group/carousel"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Scroll Prev/Next Arrow Buttons */}
            {currentProducts.length > 4 && (
              <>
                <button
                  type="button"
                  onClick={scrollLeft}
                  className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#7D5B20] shadow-md border border-gray-200 flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100"
                >
                  <span className="material-symbols-outlined text-2xl">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={scrollRight}
                  className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-[#7D5B20] shadow-md border border-gray-200 flex items-center justify-center transition-all opacity-0 group-hover/carousel:opacity-100"
                >
                  <span className="material-symbols-outlined text-2xl">chevron_right</span>
                </button>
              </>
            )}

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              className="flex items-center gap-5 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth"
            >
              {currentProducts.map((item, idx) => (
                <Link
                  key={idx}
                  href={getRedirectionUrl(item)}
                  target="_blank"
                  className="fb-fp-card flex flex-col justify-center items-center relative shrink-0 w-[260px] sm:w-[290px] group"
                >
                  <img
                    src={item.subCategoryFeaturedImage}
                    alt={item.subCategoryName}
                    className="fb-fp-image w-full max-w-[330px] h-[400px] object-cover object-top rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  {/* Floating Glassmorphism View Card */}
                  <div
                    className="w-[90%] max-w-[300px] flex justify-between items-center fb-fp-view px-3 py-1.5 absolute bottom-5"
                    style={{
                      background: "rgba(255, 252, 247, 0.45)",
                      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.27)",
                      backdropFilter: "blur(7px)",
                      WebkitBackdropFilter: "blur(7px)",
                      borderRadius: "15px",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                    }}
                  >
                    <p className="text-[#1f1f1f] text-xs sm:text-sm font-semibold capitalize truncate max-w-[170px]">
                      {item.subCategoryName.toLowerCase()}
                    </p>
                    <button
                      type="button"
                      className="rounded-xl text-white bg-[#6c5b48] hover:bg-[#584938] px-3 py-1 text-xs font-semibold transition-colors"
                    >
                      View
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
