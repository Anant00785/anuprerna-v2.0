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

const DEFAULT_FEATURED_PRODUCTS: Record<string, FeaturedProductItem[]> = {
  fabrics: [
    {
      segmentCategoryName: "PRINTED DESIGN",
      subCategoryName: "DIGITAL PRINT",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/96PZ0GYJBQAU772MWNQ1HMFM2MW904135.jpg",
    },
    {
      segmentCategoryName: "ORGANIC AND NATURAL",
      subCategoryName: "DYEABLE KHADI COTTON",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/TJNUV5A4N7HYHHU46LN0NCED0VO003890.jpg",
    },
    {
      segmentCategoryName: "PRINTED DESIGN",
      subCategoryName: "HAND BLOCK PRINTING",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/AUHJT3UL1UMPOLTHOQDA5D76CA5X07356.jpg",
    },
    {
      segmentCategoryName: "EMBROIDERY TECHNIQUE",
      subCategoryName: "HANDLOOM JACQUARD",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/85PU0XICI28HZN40HDDZWS3H9WAL05809.jpg",
    },
    {
      segmentCategoryName: "PRINTED DESIGN",
      subCategoryName: "HANDPRINTED BATIK",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/3IC401WDVQO2WUMGUG3E4AJ8CQ5S00453.png",
    },
  ],
  accessories: [
    {
      segmentCategoryName: "SCARF",
      subCategoryName: "Custom Stoles",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/O7L4ELP8YKCSPRNBYUH5KUD9I9SP00509.jpg",
    },
    {
      segmentCategoryName: "SCARF",
      subCategoryName: "Neckerchief",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/HMD31252OFCZQ08GK3X0WHDXFONU04019.png",
    },
    {
      segmentCategoryName: "SCARF",
      subCategoryName: "Stoles",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/6FPSW3EI1ZJ8V4K521TUTX5RUG6004222.jpg",
    },
    {
      segmentCategoryName: "BAGS",
      subCategoryName: "Tote Bags",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/JMA1172YLBJ145CR2F7DMHSXCDIY03262.png",
    },
    {
      segmentCategoryName: "BAGS",
      subCategoryName: "Bucket Bags",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/O12DPVP05FQ18GO1Y9PLULJQA4LC03552.jpg",
    },
  ],
  home: [
    {
      segmentCategoryName: "KITCHENWARE",
      subCategoryName: "Table Runner",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/VBMCHG7919BHDT3QO5KVOSUTUR4B09493.jpg",
    },
    {
      segmentCategoryName: "KITCHENWARE",
      subCategoryName: "Apron",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/FPU5QM1S5EYUZUKJSGDCIYN9QFZ000082.png",
    },
    {
      segmentCategoryName: "KITCHENWARE",
      subCategoryName: "Fabric Coasters",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/2B0PYQGE3DWQZMRGL8MWDNY6TJAR08161.jpg",
    },
    {
      segmentCategoryName: "KITCHENWARE",
      subCategoryName: "Table Napkin",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/59XZP290CHDAWH1IPOXAUE380WPU02829.jpg",
    },
    {
      segmentCategoryName: "KITCHENWARE",
      subCategoryName: "Table Placemat",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/78HBAH3D0ZUYH3NGSXBPRNML9LHB06404.jpg",
    },
  ],
  apparel: [
    {
      segmentCategoryName: "WOMEN",
      subCategoryName: "Dresses",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/57R5O8XJ7E2XDF6T257M9HQ92X7M05234.jpg",
    },
    {
      segmentCategoryName: "WOMEN",
      subCategoryName: "Tops & Tunics",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/B9495YF15B06450146P1Z3B56KCP08240.png",
    },
    {
      segmentCategoryName: "MEN",
      subCategoryName: "Shirts",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/N74V7Q28S57Z2V45E1J3L7C2R42F02146.jpg",
    },
    {
      segmentCategoryName: "KIDS",
      subCategoryName: "Kids Wear",
      subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/B10W87DFN22J3Z9CYT4R8P09E83N00389.jpg",
    },
  ],
};

export function FeaturedProducts() {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [productsMap, setProductsMap] = useState<Record<string, FeaturedProductItem[]>>(DEFAULT_FEATURED_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeTabKey = TABS[selectedTabIndex].key;
  const currentProducts = useMemo(
    () => productsMap[activeTabKey] || DEFAULT_FEATURED_PRODUCTS[activeTabKey] || [],
    [productsMap, activeTabKey]
  );

  useEffect(() => {
    let isMounted = true;
    async function fetchFeatured(cat: string) {
      try {
        const res = await fetch(`/api/featured/${cat}`);
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json.data && json.data.length > 0) {
          setProductsMap((prev) => ({ ...prev, [cat]: json.data }));
        }
      } catch (err) {
        // Fallback already in place
      }
    }

    fetchFeatured(activeTabKey);
    return () => {
      isMounted = false;
    };
  }, [activeTabKey]);

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
            className="group border border-[#8E7862] hover:border-[#6c5b48] bg-[#fffcf7] hover:bg-white rounded-lg px-4 py-1.5 text-sm sm:text-base text-[#7D5B20] hover:text-[#6c5b48] transition inline-flex items-center gap-1.5 shadow-2xs w-fit my-2"
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

      {/* Product Cards Grid matching anuprerna.com */}
      <div className="fb-f-product container w-full px-4 sm:px-6 lg:px-8 py-6 my-2 relative">
        {loading && currentProducts.length === 0 ? (
          <div className="w-full h-[380px] flex flex-col justify-center items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#8E7862] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-xs">Loading featured products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-4 w-full">
            {currentProducts.slice(0, 5).map((item, idx) => (
              <Link
                key={idx}
                href={getRedirectionUrl(item)}
                className="fb-fp-card flex flex-col justify-center items-center relative w-full h-[320px] sm:h-[360px] md:h-[380px] lg:h-[400px] group rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300"
              >
                <img
                  src={item.subCategoryFeaturedImage}
                  alt={item.subCategoryName}
                  className="fb-fp-image w-full h-full object-cover object-center rounded-2xl transition-transform duration-500 group-hover:scale-105"
                />
                {/* Floating Glassmorphism View Card */}
                <div
                  className="w-[90%] max-w-[280px] flex justify-between items-center fb-fp-view px-2.5 sm:px-3 py-1.5 absolute bottom-4 z-10 transition-transform duration-300 group-hover:translate-y-[-2px]"
                  style={{
                    background: "rgba(255, 252, 247, 0.55)",
                    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.22)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    borderRadius: "14px",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                  }}
                >
                  <p className="text-[#1f1f1f] text-xs sm:text-[13px] font-medium capitalize truncate max-w-[100px] sm:max-w-[120px] lg:max-w-[130px]">
                    {item.subCategoryName.toLowerCase()}
                  </p>
                  <button
                    type="button"
                    className="rounded-xl text-white bg-[#6c5b48] hover:bg-[#584938] px-2.5 sm:px-3 py-1 text-xs font-medium transition-colors cursor-pointer shrink-0"
                  >
                    View
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
