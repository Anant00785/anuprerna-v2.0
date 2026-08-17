"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProductLightGallery, LightGalleryItem } from "./ProductLightGallery";

interface ProductGalleryPageProps {
  category: string;
  slug: string;
  selectedImageName?: string;
}

export function ProductGalleryPage({
  category,
  slug,
  selectedImageName = "",
}: ProductGalleryPageProps) {
  const [productData, setProductData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/product?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (isMounted && json.data) {
          setProductData(json.data);
        }
      } catch (err) {
        console.error("Failed to load product detail for gallery:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[600px] flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#8E7862] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium text-sm">Loading gallery...</p>
      </div>
    );
  }

  if (!productData || !productData.product) {
    return (
      <div className="w-full py-24 text-center flex flex-col items-center gap-4">
        <h2 className="text-2xl font-serif font-bold text-gray-800">Product Not Found</h2>
        <Link
          href="/products/fabric"
          className="bg-[#8E7862] text-white px-6 py-2.5 rounded-lg font-bold"
        >
          Browse All Products
        </Link>
      </div>
    );
  }

  const p = productData.product;
  const productGroup: "fabric" | "finished" =
    p.productGroup === "finished" || p.product_group === "finished" ? "finished" : "fabric";

  const productGallery: LightGalleryItem[] = [];

  if (p.heroImage) {
    productGallery.push({
      src: p.heroImage,
      thumb: p.heroImage,
      subHtml: `<h4>${p.heroImageAlt || p.name}</h4>`,
      type: "image",
      alt: p.heroImageAlt || p.name,
    });
  }

  if (p.productVideo) {
    productGallery.push({
      src: p.productVideo,
      poster: p.hoverImage || p.heroImage || "",
      type: "youtube",
      height: "80vh",
      autoplay: true,
      alt: p.name || "",
      subHtml: "",
    });
  }

  if (p.hoverImage && p.hoverImage !== p.heroImage) {
    productGallery.push({
      src: p.hoverImage,
      thumb: p.hoverImage,
      subHtml: `<h4>${p.hoverImageAlt || p.name}</h4>`,
      type: "image",
      alt: p.hoverImageAlt || p.name,
    });
  }

  if (p.imageGallerySEOList && Array.isArray(p.imageGallerySEOList)) {
    p.imageGallerySEOList
      .filter((item: any) => !item.deleted)
      .forEach((item: any) => {
        if (item.image && !productGallery.some((g) => g.src === item.image)) {
          productGallery.push({
            src: item.image,
            thumb: item.image,
            type: "image",
            alt: item.altText || p.name,
            subHtml: "",
          });
        }
      });
  }

  let selectedIndex = 0;
  if (selectedImageName) {
    const foundIdx = productGallery.findIndex((item) =>
      item.src?.endsWith(selectedImageName)
    );
    if (foundIdx !== -1) selectedIndex = foundIdx;
  }

  return (
    <section className="w-full max-w-[1320px] mx-auto p-4 md:p-6 flex flex-col md:flex-row justify-center items-start gap-6">
      <Link
        href={`/product/${category || `${productGroup}-product`}/${slug}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#8E7862] text-[#7D5B20] text-sm font-semibold hover:bg-[#fffcf7] transition-colors whitespace-nowrap"
      >
        <span>&larr;</span>
        <span>View Product Details</span>
      </Link>

      <div className="flex-1 flex flex-col gap-3 w-full">
        <h1 className="fb-font-dm text-2xl md:text-3xl font-light text-[#1f1f1f]">
          {p.name}
        </h1>

        <div className="text-xs text-[#6B7280]">
          <span>SKU: </span>
          <span className="font-mono font-medium text-gray-800">{p.sku}</span>
        </div>

        <ProductLightGallery
          galleryItems={productGallery}
          hasVideo={Boolean(p.productVideo)}
          productFinish={productGroup === "finished"}
          productName={p.name}
          urlCategory={category || `${productGroup}-product`}
          urlSlug={slug}
          galleryPage={true}
          initialSelectedIndex={selectedIndex}
        />
      </div>
    </section>
  );
}
