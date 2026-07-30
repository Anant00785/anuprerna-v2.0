"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProductDetailPageProps {
  slug: string;
}

const BOTANICAL_INSETS: Record<string, string> = {
  madder: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/PENTN7FGNSWP4W6PW254LI6JXG8907796.jpg",
  indigo: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/ZWADZPMYSPI8Q00OID5TIASCOG3502523.jpg",
  maroon: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/KY57BIHN7AX260C568Y557C5NFF804241.jpg",
  yellow: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/B83N7C8CFCROO1L3N54IPN0KHV8I06138.jpg",
  green: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/N0DMJMIDQAO2SXK92WEN2FCJG1K806173.jpg",
};

function getBotanicalInset(label: string = ""): string {
  const l = label.toLowerCase();
  if (l.includes("madder")) return BOTANICAL_INSETS.madder;
  if (l.includes("indigo")) return BOTANICAL_INSETS.indigo;
  if (l.includes("green") || l.includes("myrobalan")) return BOTANICAL_INSETS.green;
  if (l.includes("yellow") || l.includes("pomegranate")) return BOTANICAL_INSETS.yellow;
  return BOTANICAL_INSETS.maroon;
}

const CUSTOMER_REVIEWS = [
  {
    name: "Jodie Parry",
    initials: "JP",
    date: "04 Jul 2026",
    rating: 5,
    comment: "Fantastic can wait to make trousers",
    itemSku: "DAN1200737",
    location: "Brisbane, Australia",
  },
  {
    name: "Himanshu Sharma",
    initials: "HS",
    date: "30 Aug 2025",
    rating: 5,
    comment: "Excellent fabric. Met my expectations.",
    itemSku: "HNB4000073",
    location: "Meerut, India",
  },
  {
    name: "Deepak Jena",
    initials: "DJ",
    date: "18 Aug 2025",
    rating: 5,
    comment:
      "It's a beautiful hand woven cotton fabric. The fabric is of 136 gsm, light weight and has a beautiful, soft, elegant texture. The fabric drapes really well.",
    itemSku: "DML4000033",
    location: "Cuttack(ODISHA), India",
  },
  {
    name: "Michael Muench",
    initials: "MM",
    date: "13 Jul 2025",
    rating: 5,
    comment: "Mesmerizing weave",
    itemSku: "DNB4000080",
    location: "Atlanta, United States",
  },
];

export function ProductDetailPage({ slug }: ProductDetailPageProps) {
  const router = useRouter();
  const [productData, setProductData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isWishlist, setIsWishlist] = useState(false);

  // Custom Dyeing State
  const [selectedDyeType, setSelectedDyeType] = useState<"original" | "custom" | "natural">("original");
  const [pantoneShade, setPantoneShade] = useState("");
  const [selectedDyeItem, setSelectedDyeItem] = useState<any>(null);

  // Modals State
  const [showDyeModal, setShowDyeModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showPreOrderModal, setShowPreOrderModal] = useState(false);
  const [swatchAdded, setSwatchAdded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/product?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (isMounted && json.data) {
          const raw = json.data;
          setProductData(raw);
        }
      } catch (err) {
        console.error("Failed to load product detail:", err);
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
      <div className="w-full min-h-[700px] flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#8E7862] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium text-sm">Loading product details...</p>
      </div>
    );
  }

  if (!productData || !productData.product) {
    return (
      <div className="w-full py-24 text-center flex flex-col items-center gap-4">
        <h2 className="text-2xl font-serif font-bold text-gray-800">Product Not Found</h2>
        <p className="text-gray-500">The product you are looking for does not exist or has been removed.</p>
        <Link href="/products/fabric" className="bg-[#8E7862] text-white px-6 py-2.5 rounded-lg font-bold">
          Browse All Fabrics
        </Link>
      </div>
    );
  }

  const p = productData.product;
  const gsm = productData.gsm || p.gsm || 165;
  const width = productData.width || '45" (115 cms)';
  const unit = p.unit || "Meter";
  const inStockQty = p.quantity ?? p.totalQuantity ?? 4.5;
  const price = selectedDyeItem ? p.price + selectedDyeItem.price : p.price || 741;
  const bulkPrice = Math.round(price * 0.825 * 100) / 100;

  // Finish Profile / Natural Vegetable Dye List
  const finishProfile = p.finishProfile;
  const naturalDyeList = finishProfile?.finishProfileItemList || [];

  // Build Media Gallery List
  const mediaGallery: Array<{ type: "image" | "video"; url: string; poster?: string }> = [];

  if (p.heroImage) mediaGallery.push({ type: "image", url: p.heroImage });
  if (p.productVideo) {
    mediaGallery.push({
      type: "video",
      url: p.productVideo,
      poster: p.hoverImage || p.heroImage,
    });
  }
  if (p.hoverImage && p.hoverImage !== p.heroImage) {
    mediaGallery.push({ type: "image", url: p.hoverImage });
  }

  if (p.imageGallerySEOList && Array.isArray(p.imageGallerySEOList)) {
    p.imageGallerySEOList.forEach((item: any) => {
      if (item.image && !mediaGallery.some((m) => m.url === item.image)) {
        mediaGallery.push({ type: "image", url: item.image });
      }
    });
  }

  const activeMedia = mediaGallery[selectedImageIndex] || mediaGallery[0] || { type: "image", url: p.heroImage };

  const craftName = p.subCategory?.name || p.segment?.name || "Handloom Jacquard";
  const materialName = p.materials?.[0]?.name || "Cotton";
  const patternName = p.patterns?.[0]?.name || "Wavy";

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn("Copy failed:", e);
    }
  };

  const handleVariantClick = (variantSlug: string) => {
    router.push(`/product/fabric-product/${variantSlug}`);
  };

  return (
    <div className="w-full bg-white text-gray-900 font-sans pb-20">
      {/* Top Main Container */}
      <div className="max-w-[1290px] mx-auto px-4 pt-6 pb-12">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-gray-500 mb-6 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/products/fabric" className="hover:text-gray-900 transition-colors capitalize">
            {craftName.toLowerCase()}
          </Link>
        </nav>

        {/* Main Grid: Left Gallery + Right Product Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Media Gallery */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Large Viewport */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/60 shadow-sm group">
              {activeMedia.type === "video" || isVideoActive ? (
                <div className="w-full h-full bg-black flex justify-center items-center relative">
                  <iframe
                    src={`https://www.youtube.com/embed/${
                      activeMedia.url.includes("shorts/")
                        ? activeMedia.url.split("shorts/")[1]?.split("?")[0]
                        : activeMedia.url.split("v=")[1]?.split("&")[0] || ""
                    }?autoplay=1`}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              ) : (
                <img
                  src={activeMedia.url}
                  alt={p.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              )}

              {/* Bottom Video Badge Button */}
              {p.productVideo && !isVideoActive && (
                <button
                  type="button"
                  onClick={() => setIsVideoActive(true)}
                  className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-white/90 shadow-md backdrop-blur flex justify-center items-center hover:bg-white transition-transform hover:scale-110"
                >
                  <span className="material-symbols-outlined text-gray-900 text-xl">
                    videocam
                  </span>
                </button>
              )}

              {/* Bottom Right "View Gallery" Pill */}
              <button
                type="button"
                onClick={() => setIsVideoActive(false)}
                className="absolute bottom-4 right-4 bg-white/95 text-gray-800 text-xs font-semibold px-4 py-2 rounded-full shadow-md backdrop-blur flex items-center gap-1.5 hover:bg-white transition-colors"
              >
                <span className="material-symbols-outlined text-sm">search</span>
                <span>View Gallery</span>
              </button>
            </div>

            {/* Thumbnail Strip */}
            {mediaGallery.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {mediaGallery.map((med, idx) => {
                  const isSelected = selectedImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedImageIndex(idx);
                        setIsVideoActive(med.type === "video");
                      }}
                      className={`relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                        isSelected ? "border-[#8E7862] ring-2 ring-[#8E7862]/30 scale-105" : "border-gray-200 opacity-80 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={med.poster || med.url}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {med.type === "video" && (
                        <div className="absolute inset-0 bg-black/30 flex justify-center items-center">
                          <span className="material-symbols-outlined text-white text-2xl drop-shadow">
                            play_circle
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Desktop Description & Key Features */}
            <div className="hidden lg:flex flex-col gap-8 mt-6">
              {/* Key Features Badges */}
              <div className="flex flex-col gap-3">
                <h3 className="font-serif font-bold text-xl text-gray-900">Key Features</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-[#FAF7F2] p-4 rounded-2xl border border-amber-100/60 text-center">
                  {[
                    { icon: "eco", label: "GOTS for Chemicals" },
                    { icon: "palette", label: "GOTS for Colourants" },
                    { icon: "dry_cleaning", label: "Handwoven" },
                    { icon: "public", label: "Made in India" },
                    { icon: "verified", label: "Ethically Made" },
                    { icon: "handshake", label: "Fair Trade" },
                  ].map((feat, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 p-1">
                      <span className="material-symbols-outlined text-2xl text-[#8E7862]">
                        {feat.icon}
                      </span>
                      <span className="text-[10px] text-gray-700 font-medium leading-tight">
                        {feat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Narrative Overview */}
              {p.productOverview && (
                <div className="prose prose-stone max-w-none text-gray-700 text-sm md:text-base leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: p.productOverview }} />
                </div>
              )}

              {/* Material Composition */}
              <div className="flex flex-col gap-3">
                <h3 className="font-serif font-bold text-xl text-gray-900">Material Composition</h3>
                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-amber-100/60 flex flex-col gap-2.5 text-sm">
                  <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Craft</span>
                    <Link
                      href={`/products/fabric?segment_category=${encodeURIComponent(craftName.toLowerCase().replace(/\s+/g, "-"))}`}
                      className="font-bold text-gray-900 hover:text-[#8E7862] flex items-center gap-1"
                    >
                      <span>{craftName}</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </Link>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Material</span>
                    <Link
                      href={`/products/fabric?material=${encodeURIComponent(materialName.toLowerCase())}`}
                      className="font-bold text-gray-900 hover:text-[#8E7862] flex items-center gap-1"
                    >
                      <span>{materialName}</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </Link>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500 font-medium">Pattern</span>
                    <Link
                      href={`/products/fabric?pattern=${encodeURIComponent(patternName.toLowerCase())}`}
                      className="font-bold text-gray-900 hover:text-[#8E7862] flex items-center gap-1"
                    >
                      <span>{patternName}</span>
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Care Instructions */}
              {p.productCare && (
                <div className="flex flex-col gap-3">
                  <h3 className="font-serif font-bold text-xl text-gray-900">Care Instructions</h3>
                  <div
                    className="text-sm text-gray-700 leading-relaxed bg-[#FAF7F2] p-5 rounded-2xl border border-amber-100/60"
                    dangerouslySetInnerHTML={{ __html: p.productCare }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Product Controls */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Header Category Pill + Share/Wishlist Icons */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#8E7862] bg-[#fffcf7] border border-[#8E7862]/30 px-3 py-1 rounded-full capitalize">
                {craftName.toLowerCase()}
              </span>

              <div className="flex items-center gap-2 text-gray-600">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                  title="Copy link"
                >
                  <span className="material-symbols-outlined text-xl">content_copy</span>
                  {copied && (
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded shadow">
                      Copied!
                    </span>
                  )}
                </button>

                <button type="button" className="p-2 rounded-full hover:bg-gray-100 transition-colors" title="Share">
                  <span className="material-symbols-outlined text-xl">share</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsWishlist(!isWishlist)}
                  className={`p-2 rounded-full transition-colors ${
                    isWishlist ? "text-red-500 bg-red-50" : "hover:bg-gray-100"
                  }`}
                  title="Wishlist"
                >
                  <span className="material-symbols-outlined text-xl">
                    {isWishlist ? "favorite" : "favorite_border"}
                  </span>
                </button>
              </div>
            </div>

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 leading-tight">
              {p.name}
            </h1>

            {/* SKU & Ratings */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1 font-mono">
                <span>SKU: {p.sku}</span>
                <button type="button" onClick={handleCopyLink} className="hover:text-gray-900">
                  <span className="material-symbols-outlined text-xs">content_copy</span>
                </button>
              </div>

              <span>|</span>

              <a href="#reviews-section" className="flex items-center gap-1 text-gray-800 font-semibold hover:underline">
                <span className="text-amber-500">★</span>
                <span>4.8</span>
                <span className="text-gray-500 font-normal">(293 reviews)</span>
              </a>
            </div>

            {/* Price & Bulk Discount Badge */}
            <div className="flex flex-col gap-2 bg-[#FAF7F2] p-5 rounded-2xl border border-amber-100/60">
              <div className="flex justify-between items-baseline">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-gray-600">INR</span>
                  <span className="text-3xl font-serif font-bold text-gray-900">{price}</span>
                  <span className="text-xs text-gray-500">/ {unit}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="text-xs text-[#8E7862] underline font-semibold hover:text-gray-900"
                >
                  View Price Details
                </button>
              </div>

              {/* Bulk Pricing Pill */}
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="w-full mt-1 bg-[#fcf4e8] border border-[#8E7862]/40 rounded-xl p-2.5 flex justify-between items-center text-xs font-semibold text-[#7D5B20] hover:bg-[#f6ebd9] transition-colors"
              >
                <span>Bulk Price @ INR {bulkPrice} / {unit}</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHowItWorksModal(true)}
                className="text-[11px] text-gray-500 flex items-center gap-1 mt-1 hover:text-gray-800 self-start"
              >
                <span className="material-symbols-outlined text-xs">help_outline</span>
                <span>See How It Works</span>
              </button>
            </div>

            {/* Specs Grid (Weight & Width) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-amber-100/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <span className="material-symbols-outlined text-base text-[#8E7862]">fitness_center</span>
                  <span>Weight</span>
                </div>
                <span className="text-xs font-bold text-gray-900">{gsm} GSM</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-amber-100/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <span className="material-symbols-outlined text-base text-[#8E7862]">straighten</span>
                  <span>Width</span>
                </div>
                <span className="text-xs font-bold text-gray-900">{width}</span>
              </div>
            </div>

            {/* Choose Variant Section with Active Switching */}
            {p.relatedProductList && p.relatedProductList.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-800">Choose Variant</span>
                <div className="flex items-center gap-3 flex-wrap">
                  {p.relatedProductList.map((variant: any) => {
                    const isCurrent = variant.sku === p.sku || variant.id === p.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => handleVariantClick(variant.slug)}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          isCurrent ? "border-[#8E7862] ring-2 ring-[#8E7862]/30 scale-105" : "border-gray-200 opacity-80 hover:opacity-100"
                        }`}
                        title={variant.name || variant.sku}
                      >
                        <img
                          src={variant.heroImage || p.heroImage}
                          alt={variant.name || variant.sku}
                          className="w-full h-full object-cover"
                        />
                        {isCurrent && (
                          <div className="absolute -top-1 -right-1 bg-[#8E7862] text-white rounded-full w-5 h-5 flex justify-center items-center text-[10px] shadow">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector & Stock Alert */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-xs font-bold text-gray-800">Quantity ({unit})</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-2 text-gray-600 hover:bg-gray-100 font-bold transition-colors"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 text-center text-sm font-bold focus:outline-none"
                    min={1}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3.5 py-2 text-gray-600 hover:bg-gray-100 font-bold transition-colors"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-red-500 font-bold">
                  <span className="material-symbols-outlined text-base">shopping_cart</span>
                  <span>Only {inStockQty} {unit} In Stock!</span>
                </div>
              </div>
            </div>

            {/* Customization Available Box */}
            <div className="p-4 bg-[#EBF5F0] border border-[#C3E2D4] rounded-2xl flex flex-col gap-2 mt-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold font-serif text-base">
                <span className="material-symbols-outlined text-[#275E49]">tune</span>
                <span>Customization Available</span>
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed">
                This product is available with customized fabrics, natural custom dyeing at low MOQ
              </p>
              <button
                type="button"
                onClick={() => setShowDyeModal(true)}
                className="self-start text-xs font-bold text-[#275E49] bg-white border border-[#C3E2D4] px-4 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors mt-1"
              >
                Show Customization Options &gt;
              </button>
            </div>

            {/* Customization Options Panel */}
            <div id="customization-options-panel" className="flex flex-col gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#275E49] text-xl">tune</span>
                <h3 className="font-serif font-bold text-lg text-gray-900">Customization Options</h3>
              </div>

              {/* Custom Organic Dye */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-gray-800">Custom Organic Dye</span>
                <span className="text-[11px] text-gray-500">Original Fabric Color As Displayed</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDyeType("original");
                      setSelectedDyeItem(null);
                    }}
                    className={`text-xs px-4 py-2 rounded-lg border font-semibold transition-colors ${
                      selectedDyeType === "original"
                        ? "border-[#8E7862] bg-[#fcf4e8] text-[#7D5B20]"
                        : "border-gray-300 text-gray-700 bg-white"
                    }`}
                  >
                    As Per Original
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDyeType("custom")}
                    className={`text-xs px-4 py-2 rounded-lg border font-semibold transition-colors ${
                      selectedDyeType === "custom"
                        ? "border-[#8E7862] bg-[#fcf4e8] text-[#7D5B20]"
                        : "border-gray-300 text-gray-700 bg-white"
                    }`}
                  >
                    Custom Dye
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHowItWorksModal(true)}
                    className="text-xs px-3 py-2 rounded-lg border border-gray-300 text-gray-600 bg-gray-50 flex items-center gap-1"
                  >
                    <span>Guide</span>
                    <span className="material-symbols-outlined text-xs">info</span>
                  </button>
                </div>

                {/* Custom Organic Dye Pantone Shade Notes Input */}
                {selectedDyeType === "custom" && (
                  <div className="mt-2 flex flex-col gap-1.5 p-3 rounded-xl bg-[#fffcf7] border border-[#8E7862]/30">
                    <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                      <span>Pantone Shade / Color Notes</span>
                      <span className="text-[10px] text-gray-500 font-normal">e.g. Pantone 19-4052 TCX</span>
                    </label>
                    <input
                      type="text"
                      value={pantoneShade}
                      onChange={(e) => setPantoneShade(e.target.value)}
                      placeholder="Specify Pantone TCX/TPX code or custom color description..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8E7862] bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Custom Natural Vegetable Dye Options */}
              {naturalDyeList.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-xs font-bold text-gray-800">
                    {finishProfile?.displayName || "Custom Natural Vegetable Dye"}
                  </span>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {naturalDyeList.slice(0, 6).map((dye: any, dIdx: number) => {
                      const isSelected = selectedDyeItem?.id === dye.id;
                      return (
                        <button
                          key={dIdx}
                          type="button"
                          onClick={() => {
                            setSelectedDyeType("natural");
                            setSelectedDyeItem(dye);
                          }}
                          className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                            isSelected ? "border-[#8E7862] ring-2 ring-[#8E7862]/30 scale-105" : "border-gray-300 opacity-90 hover:opacity-100"
                          }`}
                          title={`${dye.label} (INR ${dye.price})`}
                        >
                          <img src={dye.image} alt={dye.label} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full overflow-hidden border border-white">
                            <img src={getBotanicalInset(dye.label)} alt="" className="w-full h-full object-cover" />
                          </div>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setShowDyeModal(true)}
                      className="h-12 px-3 rounded-xl border border-gray-300 bg-gray-50 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      + {Math.max(0, naturalDyeList.length - 6)} More
                    </button>
                  </div>

                  {selectedDyeItem && (
                    <div className="p-3 bg-[#fcf4e8] border border-[#8E7862]/40 rounded-xl text-xs flex justify-between items-center text-[#7D5B20]">
                      <div>
                        <span className="font-bold block">{selectedDyeItem.label}</span>
                        <span className="text-[11px] opacity-80">{selectedDyeItem.description}</span>
                      </div>
                      <span className="font-bold shrink-0 ml-2">+ INR {selectedDyeItem.price}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons: Bulk Pre-Order & Add to Cart */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                type="button"
                onClick={() => setShowPreOrderModal(true)}
                className="bg-white border-2 border-[#8E7862] text-[#7D5B20] font-bold py-3.5 px-4 rounded-xl hover:bg-[#fffcf7] transition-colors text-sm text-center"
              >
                Bulk Pre-Order
              </button>

              <button
                type="button"
                className="bg-[#D4A373] hover:bg-[#c39262] text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-colors text-sm text-center"
              >
                Add to Cart
              </button>
            </div>

            {/* Order Swatch Card */}
            <div className="p-3 border border-gray-200 rounded-xl bg-white flex items-center justify-between shadow-sm mt-1">
              <div className="flex items-center gap-3">
                <img
                  src={p.heroImage}
                  alt="Swatch preview"
                  className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                />
                <div>
                  <span className="block font-bold text-xs text-gray-900">Order a Swatch</span>
                  <span className="text-xs text-gray-500 font-semibold">INR 22.23</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSwatchAdded(true);
                  setTimeout(() => setSwatchAdded(false), 2500);
                }}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors ${
                  swatchAdded
                    ? "bg-emerald-600 text-white"
                    : "text-[#8E7862] bg-[#fcf4e8] border border-[#8E7862]/30 hover:bg-[#f6ebd9]"
                }`}
              >
                {swatchAdded ? "✓ Added Swatch" : "+ Add Swatch"}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Description & Specs */}
        <div className="lg:hidden flex flex-col gap-8 mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col gap-3">
            <h3 className="font-serif font-bold text-xl text-gray-900">Key Features</h3>
            <div className="grid grid-cols-3 gap-2 bg-[#FAF7F2] p-4 rounded-2xl border border-amber-100/60 text-center">
              {[
                { icon: "eco", label: "GOTS for Chemicals" },
                { icon: "palette", label: "GOTS for Colourants" },
                { icon: "dry_cleaning", label: "Handwoven" },
                { icon: "public", label: "Made in India" },
                { icon: "verified", label: "Ethically Made" },
                { icon: "handshake", label: "Fair Trade" },
              ].map((feat, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 p-1">
                  <span className="material-symbols-outlined text-2xl text-[#8E7862]">{feat.icon}</span>
                  <span className="text-[10px] text-gray-700 font-medium leading-tight">{feat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {p.productOverview && (
            <div
              className="text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: p.productOverview }}
            />
          )}

          {p.productCare && (
            <div className="flex flex-col gap-3">
              <h3 className="font-serif font-bold text-xl text-gray-900">Care Instructions</h3>
              <div
                className="text-sm text-gray-700 leading-relaxed bg-[#FAF7F2] p-5 rounded-2xl border border-amber-100/60"
                dangerouslySetInnerHTML={{ __html: p.productCare }}
              />
            </div>
          )}
        </div>

        {/* Section: Discover The Craft */}
        <div className="mt-16 pt-12 border-t border-gray-200 text-center">
          <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900 mb-8">
            Discover The Craft
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/stories"
              className="bg-[#FAF7F2] rounded-2xl overflow-hidden border border-amber-100/60 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
            >
              <div className="aspect-[16/9] w-full overflow-hidden">
                <img
                  src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/ZWADZPMYSPI8Q00OID5TIASCOG3502523.jpg"
                  alt="Handloom Cluster"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-5 text-center">
                <h3 className="font-serif font-bold text-lg text-gray-900">Handloom Cluster</h3>
                <p className="text-xs text-gray-500 mt-1">Organic & Natural | Published On 31st Jul, 2023</p>
              </div>
            </Link>

            <Link
              href="/stories"
              className="bg-[#FAF7F2] rounded-2xl overflow-hidden border border-amber-100/60 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
            >
              <div className="aspect-[16/9] w-full overflow-hidden">
                <img
                  src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/PENTN7FGNSWP4W6PW254LI6JXG8907796.jpg"
                  alt="Handloom Jacquard"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-5 text-center">
                <h3 className="font-serif font-bold text-lg text-gray-900">Handloom Jacquard</h3>
                <p className="text-xs text-gray-500 mt-1">Embroidery Technique | Published On 25th Jul, 2023</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Section: Hear from our Customers */}
        <div id="reviews-section" className="mt-16 pt-12 border-t border-gray-200">
          <div className="text-center mb-10">
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-gray-900">
              Hear from our Customers
            </h2>
            <div className="flex justify-center items-center gap-1.5 mt-2">
              <div className="text-amber-500 text-lg">★★★★★</div>
              <span className="text-sm font-bold text-gray-800">4.8 out of 5</span>
            </div>
          </div>

          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            {CUSTOMER_REVIEWS.map((rev, rIdx) => (
              <div key={rIdx} className="p-5 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C5B39C] text-white font-bold flex justify-center items-center text-xs">
                      {rev.initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{rev.name}</h4>
                      <div className="text-amber-500 text-xs">★★★★★</div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{rev.date}</span>
                </div>

                <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>

                <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-3 mt-1">
                  <div className="flex items-center gap-2">
                    <img src={p.heroImage} alt="Purchased item" className="w-6 h-6 rounded object-cover border border-gray-200" />
                    <span>Purchased Item: <span className="font-mono text-[#8E7862] underline">{rev.itemSku}</span></span>
                  </div>
                  <span>{rev.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL 1: Custom Natural Vegetable Dye Modal (Matches Screenshot Pixel-to-Pixel) */}
      {showDyeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col relative animate-in fade-in zoom-in duration-150 overflow-hidden">
            {/* Top Bar with Orange-Brown Close Button on Left */}
            <div className="relative w-full p-4 border-b border-gray-200 flex justify-center items-center bg-white">
              <button
                type="button"
                onClick={() => setShowDyeModal(false)}
                className="absolute top-2 left-2 bg-[#D4A373] text-white p-2 rounded-lg hover:bg-[#c39262] transition-colors"
                title="Close"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
              <h2 className="font-serif font-bold text-xl md:text-2xl text-gray-900 text-center">
                {finishProfile?.displayName || "Custom Natural Vegetable Dye"}
              </h2>
            </div>

            {/* Grid of Natural Dye Options */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {naturalDyeList.map((dye: any, idx: number) => {
                const isSelected = selectedDyeItem?.id === dye.id;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDyeItem(dye);
                      setSelectedDyeType("natural");
                    }}
                    className={`flex flex-col rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#8E7862] ring-2 ring-[#8E7862]/40 shadow-md bg-[#fffcf7]"
                        : "border-gray-200 hover:border-gray-400 bg-white"
                    }`}
                  >
                    {/* Image Box with Circular Botanical Raw Material Inset */}
                    <div className="relative aspect-square w-full bg-gray-100">
                      <img src={dye.image} alt={dye.label} className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 right-2 w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md">
                        <img src={getBotanicalInset(dye.label)} alt="" className="w-full h-full object-cover" />
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 left-2 bg-[#8E7862] text-white rounded-full w-6 h-6 flex justify-center items-center text-xs shadow font-bold">
                          ✓
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-3.5 flex flex-col gap-1.5 flex-1 justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 capitalize leading-snug">
                          {dye.label.toLowerCase()}
                        </h4>
                        <span className="block text-xs font-bold text-[#8E7862] mt-1">
                          INR {dye.price}
                        </span>
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                          {dye.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Bar with Selected Chips & Cancel/Continue Buttons */}
            <div className="p-4 border-t border-gray-200 bg-white flex flex-col gap-3">
              {selectedDyeItem && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Selected:</span>
                  <span className="text-xs font-bold bg-[#fcf4e8] text-[#7D5B20] border border-[#8E7862]/30 px-3 py-1 rounded-full flex items-center gap-1">
                    <span>{selectedDyeItem.label} (+ INR {selectedDyeItem.price})</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDyeItem(null)}
                      className="hover:text-red-600 font-bold text-sm ml-1"
                    >
                      ×
                    </button>
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setShowDyeModal(false)}
                  className="w-full py-3 rounded-xl border-2 border-[#8E7862] text-[#7D5B20] font-bold text-sm hover:bg-[#fffcf7] transition-colors text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowDyeModal(false)}
                  className="w-full py-3 rounded-xl bg-[#D4A373] text-white font-bold text-sm hover:bg-[#c39262] transition-colors text-center"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk Pricing Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 relative animate-in fade-in zoom-in duration-150">
            <button
              type="button"
              onClick={() => setShowBulkModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-xl font-bold"
            >
              ✕
            </button>

            <h3 className="font-serif font-bold text-xl text-gray-900">Volume Bulk Pricing</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              With higher volume, the price reduces proportionately. Pre-order with precise color and design accuracy.
            </p>

            <div className="flex flex-col gap-2 my-2 max-h-[300px] overflow-y-auto pr-1">
              {[
                { qty: "25+ Meters", discount: "3% OFF", price: Math.round(price * 0.97) },
                { qty: "50+ Meters", discount: "5% OFF", price: Math.round(price * 0.95) },
                { qty: "75+ Meters", discount: "7.5% OFF", price: Math.round(price * 0.925) },
                { qty: "100+ Meters", discount: "10% OFF", price: Math.round(price * 0.9) },
                { qty: "300+ Meters", discount: "12% OFF", price: Math.round(price * 0.88) },
                { qty: "500+ Meters", discount: "15% OFF", price: Math.round(price * 0.85) },
                { qty: "1000+ Meters", discount: "17.5% OFF", price: Math.round(price * 0.825) },
              ].map((tier, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-[#FAF7F2] border border-amber-100/60 text-xs font-semibold">
                  <span className="text-gray-800">{tier.qty}</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{tier.discount}</span>
                  <span className="text-[#8E7862] font-bold text-sm">INR {tier.price} / {unit}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowBulkModal(false)}
              className="w-full bg-[#8E7862] text-white font-bold py-3 rounded-xl hover:bg-[#73604d] transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: How It Works Modal */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 relative animate-in fade-in zoom-in duration-150">
            <button
              type="button"
              onClick={() => setShowHowItWorksModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-xl font-bold"
            >
              ✕
            </button>

            <h3 className="font-serif font-bold text-xl text-gray-900">How Sustainable Sourcing Works</h3>
            <div className="flex flex-col gap-3 text-xs text-gray-700 leading-relaxed my-2">
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-amber-100/60 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#8E7862] text-xl">inventory</span>
                <div>
                  <strong className="block text-gray-900">1. In-Stock Ordering</strong>
                  Small quantities up to current loom capacity ship within 3-5 business days directly from our Bengal studio.
                </div>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-amber-100/60 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#8E7862] text-xl">precision_manufacturing</span>
                <div>
                  <strong className="block text-gray-900">2. Pre-Order & Bulk Custom Production</strong>
                  For quantities above 25+ meters, pre-order allows master weavers to dedicate looms, ensuring batch-to-batch color and weave uniformity.
                </div>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-amber-100/60 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#8E7862] text-xl">spa</span>
                <div>
                  <strong className="block text-gray-900">3. Custom Natural & Organic Dyeing</strong>
                  Choose custom Pantone shade matching or GOTS-certified natural plant dyes (Madder, Indigo, Myrobalan).
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHowItWorksModal(false)}
              className="w-full bg-[#8E7862] text-white font-bold py-3 rounded-xl hover:bg-[#73604d] transition-colors text-sm"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: Pre-Order Modal */}
      {showPreOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 relative animate-in fade-in zoom-in duration-150">
            <button
              type="button"
              onClick={() => setShowPreOrderModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-xl font-bold"
            >
              ✕
            </button>

            <h3 className="font-serif font-bold text-xl text-gray-900">Pre-Order Bulk Production</h3>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-700">info</span>
              <span>An advance payment of 50% is required at checkout for pre-orders.</span>
            </div>

            <div className="flex flex-col gap-3 my-2 text-xs text-gray-700">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">Product Name</span>
                <span className="font-bold text-gray-900 text-right max-w-[200px] truncate">{p.name}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">SKU</span>
                <span className="font-mono font-bold text-[#8E7862]">{p.sku}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="font-medium text-gray-600">Estimated Delivery</span>
                <span className="font-bold text-gray-900">45 to 60 Days</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-gray-600">Pre-Order Quantity ({unit})</span>
                <input
                  type="number"
                  defaultValue={25}
                  min={15}
                  className="w-20 px-2 py-1 text-center font-bold border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPreOrderModal(false)}
              className="w-full bg-[#D4A373] text-white font-bold py-3.5 rounded-xl hover:bg-[#c39262] transition-colors text-sm uppercase tracking-wider"
            >
              Confirm Pre-Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
