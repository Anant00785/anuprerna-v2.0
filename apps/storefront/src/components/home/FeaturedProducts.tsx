"use client";

import { useState } from "react";
import Link from "next/link";

interface FeaturedProductItem {
  id: string;
  subCategoryName: string;
  segmentCategoryName: string;
  subCategoryFeaturedImage: string;
}

const CATEGORIES = [
  { key: "fabrics", label: "Fabrics" },
  { key: "accessories", label: "Accessories" },
  { key: "home", label: "Homeware" },
  { key: "apparel", label: "Apparel" },
];

const FEATURED_PRODUCTS_DATA: Record<string, FeaturedProductItem[]> = {
  fabrics: [
    {
      id: "f1",
      subCategoryName: "Handloom Khadi Cotton",
      segmentCategoryName: "fabric-type",
      subCategoryFeaturedImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/swatch-bundle-min.jpg",
    },
    {
      id: "f2",
      subCategoryName: "Mulberry Silk",
      segmentCategoryName: "fabric-type",
      subCategoryFeaturedImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/custom-dyeing.png",
    },
    {
      id: "f3",
      subCategoryName: "Organic Linen",
      segmentCategoryName: "fabric-type",
      subCategoryFeaturedImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/bulk-order.png",
    },
    {
      id: "f4",
      subCategoryName: "Jamdani Craft",
      segmentCategoryName: "craft-type",
      subCategoryFeaturedImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-2.png",
    },
    {
      id: "f5",
      subCategoryName: "Hand Block Printed",
      segmentCategoryName: "craft-type",
      subCategoryFeaturedImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-3.png",
    },
  ],
  accessories: [
    {
      id: "a1",
      subCategoryName: "Artisanal Scarves & Stoles",
      segmentCategoryName: "finished-goods",
      subCategoryFeaturedImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/customisations.png",
    },
    {
      id: "a2",
      subCategoryName: "Handwoven Tote Bags",
      segmentCategoryName: "finished-goods",
      subCategoryFeaturedImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/swatch-bundle-min.jpg",
    },
    {
      id: "a3",
      subCategoryName: "Silk Bandanas",
      segmentCategoryName: "finished-goods",
      subCategoryFeaturedImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-4.png",
    },
  ],
  home: [
    {
      id: "h1",
      subCategoryName: "Cushion Covers",
      segmentCategoryName: "homeware",
      subCategoryFeaturedImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-3.png",
    },
    {
      id: "h2",
      subCategoryName: "Table Runners",
      segmentCategoryName: "homeware",
      subCategoryFeaturedImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/bulk-order.png",
    },
    {
      id: "h3",
      subCategoryName: "Throw Blankets",
      segmentCategoryName: "homeware",
      subCategoryFeaturedImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/custom-dyeing.png",
    },
  ],
  apparel: [
    {
      id: "ap1",
      subCategoryName: "Handcrafted Shirts",
      segmentCategoryName: "clothing",
      subCategoryFeaturedImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/customisations.png",
    },
    {
      id: "ap2",
      subCategoryName: "Ethnic Kimonos",
      segmentCategoryName: "clothing",
      subCategoryFeaturedImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-2.png",
    },
    {
      id: "ap3",
      subCategoryName: "Organic Tunics",
      segmentCategoryName: "clothing",
      subCategoryFeaturedImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/video-thumbnails.png",
    },
  ],
};

export function FeaturedProducts() {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const selectedCategory = CATEGORIES[selectedTabIndex].key;
  const currentProducts = FEATURED_PRODUCTS_DATA[selectedCategory] || [];

  const prepareUrl = (categoryKey: string, product: FeaturedProductItem) => {
    const slug = product.subCategoryName.toLowerCase().replace(/\s+/g, "-");
    return categoryKey === "fabrics"
      ? `/products/fabric?search=${slug}`
      : `/products/finished?search=${slug}`;
  };

  return (
    <section className="fb-home-fp-new w-full flex flex-col justify-center items-center min-h-[50vh] pt-10 pb-7 bg-white">
      <div className="container flex flex-col lg:flex-row justify-between items-center px-4 sm:px-6 lg:px-8">
        
        {/* Left Section Title */}
        <div className="my-5 lg:my-0 lg:flex-[30%] mx-2 lg:mx-0 px-4 lg:px-0 w-full">
          <h2 className="text-3xl sm:text-4xl text-gray-900 font-normal">Our</h2>
          <h2 className="text-3xl sm:text-4xl text-[#7D5B20] font-medium mb-3">
            Featured Products
          </h2>
          <Link
            href="/products/fabric"
            target="_blank"
            className="text-lg sm:text-3xl py-2 fb_animate_icon_button text-gray-900 font-medium"
          >
            <i className="fb_animate">
              <b></b>
              <span></span>
            </i>
            Discover More
          </Link>
        </div>

        {/* Right Category Tabs */}
        <div className="lg:flex-[70%] w-full">
          <div className="fb-fp-tabs flex justify-start lg:justify-end items-center gap-2 border-b border-[#9c8a6c] overflow-x-auto pb-1 whitespace-nowrap w-full">
            {CATEGORIES.map((cat, idx) => (
              <button
                key={cat.key}
                onClick={() => setSelectedTabIndex(idx)}
                className={`text-sm sm:text-lg lg:text-xl px-3 sm:px-4 py-2 text-black transition-all shrink-0 ${
                  selectedTabIndex === idx
                    ? "font-semibold text-[#7D5B20] border-b-2 border-[#6c5b48]"
                    : "hover:text-[#7D5B20]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Product Cards Grid */}
      <div className="container w-full px-4 py-6 my-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {currentProducts.map((product) => (
            <Link
              key={product.id}
              href={prepareUrl(selectedCategory, product)}
              className="fb-fp-card flex flex-col justify-center items-center relative group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="fb-fp-image w-full max-w-[330px] h-[380px] object-cover object-top rounded-2xl group-hover:scale-102 transition-transform duration-500"
                src={product.subCategoryFeaturedImage}
                alt={product.subCategoryName}
              />
              <div className="w-[90%] max-w-[300px] flex justify-between items-center fb-fp-view px-3 py-2 absolute bottom-5">
                <p className="text-white text-xs sm:text-sm font-semibold capitalize truncate max-w-[170px]">
                  {product.subCategoryName}
                </p>
                <button className="rounded-xl text-white bg-[#6c5b48] hover:bg-[#584938] px-3 py-1 text-xs font-semibold transition-colors">
                  View
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
