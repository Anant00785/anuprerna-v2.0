"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrencyStore, SupportedCurrency } from "@/stores/currency.store";

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
  if (l.includes("madder") || l.includes("pink") || l.includes("rose")) return BOTANICAL_INSETS.madder;
  if (l.includes("indigo") || l.includes("blue") || l.includes("navy")) return BOTANICAL_INSETS.indigo;
  if (l.includes("green") || l.includes("myrobalan") || l.includes("sage") || l.includes("olive")) return BOTANICAL_INSETS.green;
  if (l.includes("yellow") || l.includes("pomegranate") || l.includes("turmeric") || l.includes("ochre")) return BOTANICAL_INSETS.yellow;
  return BOTANICAL_INSETS.maroon;
}

const FULL_NATURAL_DYE_LIST = [
  { id: 1, label: "Light Dusty Pink Natural Madder Dye", price: 357, description: "Hue of light dusty pink dyed using madder or Manjistha dye.", image: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/PENTN7FGNSWP4W6PW254LI6JXG8907796.jpg" },
  { id: 2, label: "Dark Dusty Pink Natural Madder Dye", price: 397, description: "Dark dusty pink hue dyed using madder or Manjistha dye.", image: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/KY57BIHN7AX260C568Y557C5NFF804241.jpg" },
  { id: 3, label: "Blue Natural Indigo Dye", price: 303, description: "Hue of blue that has been dyed using indigo plant dye.", image: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/ZWADZPMYSPI8Q00OID5TIASCOG3502523.jpg" },
  { id: 4, label: "Royal Indigo Navy Dye", price: 380, description: "Deep rich royal indigo hue from organic indigo ferments.", image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80" },
  { id: 5, label: "Sky Blue Indigo Dye", price: 320, description: "Soft airy sky blue shade extracted from natural indigo leaves.", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80" },
  { id: 6, label: "Myrobalan Green Dye", price: 340, description: "Sustainable herbal dye with olive green tones.", image: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/N0DMJMIDQAO2SXK92WEN2FCJG1K806173.jpg" },
  { id: 7, label: "Forest Herbal Green Dye", price: 360, description: "Earthy deep forest green achieved via Myrobalan and Indigo blends.", image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80" },
  { id: 8, label: "Sage Leaf Green Dye", price: 335, description: "Subtle muted sage green tone derived from natural pomegranate and indigo.", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80" },
  { id: 9, label: "Pomegranate Yellow Dye", price: 325, description: "Warm mustard yellow from natural pomegranate rind.", image: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/B83N7C8CFCROO1L3N54IPN0KHV8I06138.jpg" },
  { id: 10, label: "Golden Turmeric Yellow Dye", price: 310, description: "Vibrant golden sunshine yellow dyed using raw turmeric root.", image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80" },
  { id: 11, label: "Raw Ochre Earth Yellow Dye", price: 345, description: "Warm ochre clay tone extracted from natural mineral pigments.", image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80" },
  { id: 12, label: "Iron Black Natural Dye", price: 355, description: "Deep charcoal tone from natural iron rust solution.", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80" },
  { id: 13, label: "Slate Grey Herbal Dye", price: 330, description: "Cool slate charcoal hue from iron acetate and tannin.", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80" },
  { id: 14, label: "Terracotta Rust Madder Dye", price: 375, description: "Earthy warm terracotta rust shade from concentrated Madder root.", image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=800&q=80" },
  { id: 15, label: "Walnut Bark Brown Dye", price: 365, description: "Deep rich chocolate brown extracted from Himalayan walnut hulls.", image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80" },
  { id: 16, label: "Chestnut Tan Herbal Dye", price: 350, description: "Warm chestnut brown shade dyed using natural tannins.", image: "https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80" },
  { id: 17, label: "Mulberry Berry Purple Dye", price: 390, description: "Subtle berry plum violet from wild mulberry and sappanwood.", image: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80" },
  { id: 18, label: "Crimson Sappanwood Red Dye", price: 410, description: "Rich crimson red extracted from natural Indian sappanwood heartwood.", image: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80" },
  { id: 19, label: "Coral Rose Herbal Dye", price: 360, description: "Soft warm coral pink derived from light sappanwood and alum.", image: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80" },
  { id: 20, label: "Raw Khadi Sand Beige Dye", price: 295, description: "Unbleached natural ecru sand tone with zero added synthetic chemicals.", image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80" },
  { id: 21, label: "Warm Linen Beige Dye", price: 310, description: "Soft warm oatmeal beige dyed using natural tea leaves and Myrobalan.", image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80" },
  { id: 22, label: "Olive Drab Earth Dye", price: 345, description: "Classic muted olive drab tone from pomegranate rind and iron liquor.", image: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=800&q=80" },
];

const PANTONE_GUIDE_SWATCHES = [
  // Yellows
  { code: "Pantone 100", hex: "#F3ED7C" },
  { code: "Pantone 101", hex: "#F5EE40" },
  { code: "Pantone 102", hex: "#FBEB00" },
  { code: "Pantone 103", hex: "#C3B100" },
  { code: "Pantone 108", hex: "#FEE100" },
  { code: "Pantone 109", hex: "#FED100" },
  { code: "Pantone 110", hex: "#D9AC00" },
  { code: "Pantone 111", hex: "#A48600" },
  { code: "Pantone 116", hex: "#FFCD00" },
  { code: "Pantone 117", hex: "#C89600" },
  { code: "Pantone 118", hex: "#9E7500" },
  { code: "Pantone 119", hex: "#7B5C00" },

  // Ambers & Warm Gold
  { code: "Pantone 124", hex: "#EAAA00" },
  { code: "Pantone 125", hex: "#B88300" },
  { code: "Pantone 126", hex: "#8A6200" },
  { code: "Pantone 127", hex: "#F3DD8B" },
  { code: "Pantone 132", hex: "#956A00" },
  { code: "Pantone 133", hex: "#624600" },
  { code: "Pantone 134", hex: "#F9CE81" },
  { code: "Pantone 135", hex: "#F7BE67" },

  // Bronzes & Earthy Oranges
  { code: "Pantone 140", hex: "#784B00" },
  { code: "Pantone 141", hex: "#F4C46D" },
  { code: "Pantone 142", hex: "#F3B251" },
  { code: "Pantone 143", hex: "#F29D38" },
  { code: "Pantone 150", hex: "#F5A352" },
  { code: "Pantone 151", hex: "#FF8200" },
  { code: "Pantone 152", hex: "#E15C00" },
  { code: "Pantone 153", hex: "#B84300" },

  // Terracotta & Reds
  { code: "Pantone 160", hex: "#A54000" },
  { code: "Pantone 161", hex: "#632700" },
  { code: "Pantone 162", hex: "#FFAA8A" },
  { code: "Pantone 163", hex: "#FF8559" },
  { code: "19-1537 TCX Winery", hex: "#64243B" },
  { code: "Pantone 180", hex: "#B93A32" },
  { code: "Pantone 181", hex: "#772421" },
  { code: "Pantone 185", hex: "#E4002B" },

  // Magenta, Plum & Blues
  { code: "Pantone 210", hex: "#FF7CB0" },
  { code: "Pantone 220", hex: "#A0005D" },
  { code: "Pantone 280", hex: "#012169" },
  { code: "Pantone 285", hex: "#0072CE" },
  { code: "Pantone 300", hex: "#005BBB" },
  { code: "Pantone 303", hex: "#002A3A" },

  // Greens & Neutrals
  { code: "Pantone 340", hex: "#00965E" },
  { code: "Pantone 361", hex: "#1EB980" },
  { code: "Pantone 375", hex: "#97D700" },
  { code: "Pantone 450", hex: "#5C5638" },
  { code: "Pantone 453", hex: "#C7C4A5" },
  { code: "Pantone 468", hex: "#D8C7A5" },
];

const CUSTOMER_REVIEWS = [
  {
    name: "Nicole Frederick",
    initials: "NF",
    date: "26 Jul 2026",
    rating: 5,
    comment:
      "“The quality of this material is beyond amazing! Words cannot express how beautiful this fabric is. The color is bright, the pattern is consistent and the feel is very soft to touch. I will be a repeat customer for years to come.”",
    itemSku: "DKD1210382",
    location: "Souderton, United States",
  },
  {
    name: "Himanshu Sharma",
    initials: "HS",
    date: "30 Aug 2025",
    rating: 5,
    comment: "“Excellent fabric. Met my expectations.”",
    itemSku: "HNB4000073",
    location: "Meerut, India",
  },
  {
    name: "Deepak Jena",
    initials: "DJ",
    date: "18 Aug 2025",
    rating: 5,
    comment:
      "“It's a beautiful hand woven cotton fabric. The fabric is of 136 gsm, light weight and has a beautiful, soft, elegant texture. The fabric drapes really well.”",
    itemSku: "DML4000033",
    location: "Cuttack(ODISHA), India",
  },
  {
    name: "Michael Muench",
    initials: "MM",
    date: "13 Jul 2025",
    rating: 5,
    comment: "“Mesmerizing weave”",
    itemSku: "DNB4000080",
    location: "Atlanta, United States",
  },
];

export function ProductDetailPage({ slug }: ProductDetailPageProps) {
  const router = useRouter();
  const { selectedCurrency, setCurrency, convertPrice } = useCurrencyStore();
  const [productData, setProductData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [copied, setCopied] = useState(false);
  const [isWishlist, setIsWishlist] = useState(false);

  // Price Details Popover State
  const [showPriceSummary, setShowPriceSummary] = useState(false);

  // Custom Organic Dyeing State
  const [selectedDyeType, setSelectedDyeType] = useState<"original" | "custom" | "natural">("original");
  const [pantoneShade, setPantoneShade] = useState("");
  const [pantoneNotes, setPantoneNotes] = useState("");
  const [pantoneSubmitted, setPantoneSubmitted] = useState(false);
  const [selectedDyeItem, setSelectedDyeItem] = useState<any>(null);

  // Modals & Sidebar State
  const [showDyeModal, setShowDyeModal] = useState(false);
  const [showPantoneGuide, setShowPantoneGuide] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showPreOrderModal, setShowPreOrderModal] = useState(false);
  const [swatchAdded, setSwatchAdded] = useState(false);
  const [showCustomizationOptions, setShowCustomizationOptions] = useState(true);

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

  const currentCurrencyCode = selectedCurrency.toUpperCase();

  const p = productData.product;
  const gsm = productData.gsm || p.gsm || 130;
  const width = productData.width || '45" (115 cms)';
  const unit = p.unit || "Meter";
  const inStockQty = p.quantity ?? p.totalQuantity ?? 9;
  const basePrice = p.price || 727;
  const price = selectedDyeItem ? basePrice + selectedDyeItem.price : basePrice;
  const bulkPrice = Math.round((price * 0.825) * 100) / 100;

  const convertedBasePrice = convertPrice(basePrice);
  const convertedPrice = convertPrice(price);
  const convertedBulkPrice = convertPrice(bulkPrice);

  // Dynamically uses API finishProfile items if available, with full spectrum fallback
  const finishProfile = p.finishProfile || p.subCategory?.finishProfile || p.category?.finishProfile || productData.finishProfile;
  const apiDyeList = finishProfile?.finishProfileItemList;
  const naturalDyeList = (apiDyeList && Array.isArray(apiDyeList) && apiDyeList.length > 0)
    ? apiDyeList
    : FULL_NATURAL_DYE_LIST;

  const dynamicGuideImage = p.sizeProfile?.image || p.customSizeProfile?.image || finishProfile?.guideImage || finishProfile?.image;

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

  // Check if Customization is enabled for this product (matching Angular product.madeToOrderProfileEnabled / finishProfileEnabled 1:1)
  const isCustomizationAvailable = Boolean(
    p.madeToOrderProfileEnabled ||
    p.finishProfileEnabled ||
    p.fabricProfileEnabled ||
    p.sizeProfileEnabled ||
    p.customizationEnabled ||
    (p.finishProfile && p.finishProfileEnabled !== false)
  );

  return (
    <section className="fb-product w-full flex flex-col justify-center items-center mb-6 md:my-6 bg-white text-[#1f1f1f]">
      {/* Top Main Container */}
      <div className="w-full max-w-[1290px] flex flex-col md:flex-row gap-6 relative px-4 md:px-6">


        {/* LEFT COLUMN: Media Gallery & Product Description */}
        <div className="w-full md:flex-[50%] fb-font-inter flex flex-col gap-4">

          {/* Breadcrumb Navigation */}
          <div className="text-xs text-[#6B7280] capitalize mb-1 flex items-center gap-1 flex-wrap">
            <Link href="/" className="hover:text-black">Home</Link>
            <span>/</span>
            <Link href="/products/fabric" className="hover:text-black">{craftName.toLowerCase()}</Link>
          </div>

          {/* Large Main Viewport */}
          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#f7f5f0] border border-[#efeee9] group">
            {activeMedia.type === "video" || isVideoActive ? (
              <div className="w-full h-full bg-black flex justify-center items-center relative">
                <iframe
                  src={`https://www.youtube.com/embed/${activeMedia.url.includes("shorts/")
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

            {/* Bottom Video Icon Overlay (Left) */}
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
              className="absolute bottom-4 right-4 bg-white/90 text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md backdrop-blur flex items-center gap-1 hover:bg-white transition-colors"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              <span>View Gallery</span>
            </button>
          </div>

          {/* Thumbnail Horizontal Strip */}
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
                    className={`relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${isSelected ? "border-[#C79D6D] ring-1 ring-[#C79D6D]" : "border-gray-200 opacity-80 hover:opacity-100"
                      }`}
                  >
                    <img
                      src={med.poster || med.url}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {med.type === "video" && (
                      <div className="absolute inset-0 bg-black/30 flex justify-center items-center">
                        <span className="material-symbols-outlined text-white text-xl">
                          play_circle
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Desktop Product Information (Key Features, Overview, Material Table) */}
          <div className="hidden md:flex flex-col gap-6 mt-4">
            {/* Key Features Badges */}
            <div className="flex flex-col gap-3">
              <h2 className="fb-font-dm text-xl font-medium text-[#1f1f1f]">Key Features</h2>
              <div className="grid grid-cols-6 gap-2 bg-[#F9F8F6] p-4 rounded-lg border border-[#EFEEE9] text-center">
                {[
                  { icon: "eco", label: "GOTS for Chemicals" },
                  { icon: "palette", label: "GOTS for Colourants" },
                  { icon: "dry_cleaning", label: "Handwoven" },
                  { icon: "public", label: "Made in India" },
                  { icon: "verified", label: "Ethically Made" },
                  { icon: "handshake", label: "Fair Trade" },
                ].map((feat, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="material-symbols-outlined text-2xl text-[#7D5A20]">{feat.icon}</span>
                    <span className="text-[11px] text-[#3c3c3c] font-medium leading-tight">{feat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Narrative */}
            <div className="text-[#3c3c3c] text-sm md:text-base leading-relaxed flex flex-col gap-4">
              <p>
                This ecru jacquard self-design fabric is handwoven in pure cotton with a subtle tonal pattern that shows up as texture, not print. At 130 GSM it is lightweight with a steady drape, so it feels breathable on skin while still holding seams, panels, and collars neatly. The self-design adds depth to the ecru base, making it perfect for minimalist silhouettes that still look premium. Ideal for shirts, kurtas, dresses, co-ords, blouses, skirts, and light layering pieces. It takes topstitching well and pairs easily with whites, blacks, and earthy neutrals.
              </p>
              <p>
                Pre-wash before cutting; cold wash with mild detergent and dry in shade. Warm iron to bring out the jacquard texture. Minor slubs and slight shade variation are natural signs of artisan handweaving.
              </p>
            </div>

            {/* Material Composition Table */}
            <div className="flex flex-col gap-3">
              <h2 className="fb-font-dm text-xl font-medium text-[#1f1f1f]">Material Composition</h2>
              <div className="bg-[#F9F8F6] p-4 rounded-lg border border-[#EFEEE9] flex flex-col gap-3 text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-[#EFEEE9]">
                  <span className="text-[#6B7280]">Craft</span>
                  <Link href={`/products/fabric?segment=${encodeURIComponent(craftName)}`} className="font-bold text-[#1f1f1f] hover:underline flex items-center gap-1">
                    <span>{craftName}</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </Link>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#EFEEE9]">
                  <span className="text-[#6B7280]">Material</span>
                  <Link href={`/products/fabric?material=${encodeURIComponent(materialName)}`} className="font-bold text-[#1f1f1f] hover:underline flex items-center gap-1">
                    <span>{materialName}</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </Link>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-[#6B7280]">Pattern</span>
                  <Link href={`/products/fabric?pattern=${encodeURIComponent(patternName)}`} className="font-bold text-[#1f1f1f] hover:underline flex items-center gap-1">
                    <span>{patternName}</span>
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Care Instructions */}
            <div className="flex flex-col gap-3">
              <h2 className="fb-font-dm text-xl font-medium text-[#1f1f1f]">Care Instructions</h2>
              <div className="text-sm text-[#3c3c3c] leading-relaxed flex flex-col gap-3">
                <div>
                  <strong className="block text-black font-bold">Washing:</strong>
                  <span>-Hand wash in cold water with mild detergent.</span><br />
                  <span>-Avoid long soaking; wash colors separately at first.</span>
                </div>
                <div>
                  <strong className="block text-black font-bold">Drying:</strong>
                  <span>-Dry in shade, never wring.</span><br />
                  <span>-Lay flat or hang in a ventilated space.</span>
                </div>
                <div>
                  <strong className="block text-black font-bold">Ironing:</strong>
                  <span>-Iron while damp for best results.</span><br />
                  <span>-Use medium heat (cotton Khadi) or low heat (silk Khadi).</span>
                </div>
                <div>
                  <strong className="block text-black font-bold">Storage:</strong>
                  <span>-Store in muslin cloth, never plastic.</span><br />
                  <span>-Refold occasionally to avoid creases.</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Product Controls & Purchase Box */}
        <div className="w-full md:flex-[50%] flex flex-col gap-3 box-border fb-font-inter">

          {/* Badge & Action Icons Row */}
          <div className="flex justify-between items-center">
            <div className="flex gap-1.5 items-center">
              <div className="f-g-badge">
                {craftName}
              </div>
            </div>
            <div className="flex gap-2 items-center text-[#6B7280]">
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors relative"
                title="Copy link"
              >
                <span className="material-symbols-outlined text-lg">content_copy</span>
                {copied && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">
                    Copied!
                  </span>
                )}
              </button>
              <button type="button" className="p-1.5 rounded-full hover:bg-gray-100 transition-colors" title="Share">
                <span className="material-symbols-outlined text-lg">share</span>
              </button>
              <button
                type="button"
                onClick={() => setIsWishlist(!isWishlist)}
                className={`p-1.5 rounded-full transition-colors ${isWishlist ? "text-red-500 bg-red-50" : "hover:bg-gray-100"
                  }`}
                title="Wishlist"
              >
                <span className="material-symbols-outlined text-lg">
                  {isWishlist ? "favorite" : "favorite_border"}
                </span>
              </button>
            </div>
          </div>

          {/* Product Header Title */}
          <h1 className="fb-font-dm font-light fb-product-header">
            {p.name || "Ecru Jacquard Self Design 130 GSM Pure Cotton Handwoven Fabric"}
          </h1>

          {/* SKU Line */}
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
            <span>SKU: {p.sku || "JML4000089"}</span>
            <button type="button" onClick={handleCopyLink} className="hover:text-black">
              <span className="material-symbols-outlined text-xs">content_copy</span>
            </button>
          </div>

          {/* Review Summary */}
          <div className="flex gap-1.5 items-center fb-light-text text-sm cursor-pointer" onClick={() => {
            const el = document.getElementById("reviews-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}>
            <div className="star">&#9733;</div>
            <div className="fb-medium-text">4.8</div>
            <span>|</span>
            <div>(296 reviews)</div>
          </div>

          {/* Price Block & View Price Details Popover */}
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between items-center relative">
              <div className="flex items-center gap-2">
                <select
                  value={currentCurrencyCode}
                  onChange={(e) => setCurrency(e.target.value.toLowerCase() as SupportedCurrency)}
                  className="text-xs border border-[#D1D4DB] rounded px-2 py-1 bg-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="INR">INR</option>
                  <option value="GBP">GBP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
                <span className="font-bold text-2xl text-[#1f1f1f]">
                  {convertedPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm text-[#6B7280]">/ {unit}</span>
              </div>

              {/* View Price Details Popover Link */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPriceSummary(!showPriceSummary)}
                  onMouseEnter={() => setShowPriceSummary(true)}
                  onMouseLeave={() => setShowPriceSummary(false)}
                  className="text-xs text-[#6B7280] underline font-semibold hover:text-black cursor-pointer"
                >
                  View Price Details
                </button>

                {/* Price Breakdown Popover Tooltip Box (Matching Angular 1:1) */}
                {showPriceSummary && (
                  <div className="absolute top-6 right-0 z-30 bg-white border border-[#D1D4DB] shadow-lg rounded-lg p-3 w-[260px] text-xs text-[#3c3c3c] flex flex-col gap-1.5 animate-in fade-in duration-150">
                    <div className="font-bold text-sm text-black border-b border-gray-100 pb-1">
                      Price Summary
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Base Fabric Cost:</span>
                      <span className="font-medium">
                        {currentCurrencyCode} {convertedBasePrice.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {selectedDyeItem && (
                      <div className="flex justify-between items-center text-emerald-700 font-medium">
                        <span>Custom Dye Cost:</span>
                        <span>
                          + {currentCurrencyCode} {convertPrice(selectedDyeItem.price).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-gray-200 pt-1 font-bold text-black text-sm">
                      <span>Total:</span>
                      <span>
                        {currentCurrencyCode} {convertedPrice.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bulk Price Pill Badge */}
            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className="border border-[#C79D6D] text-[#C79D6D] bg-[#FFFBF7] rounded px-3 py-1.5 text-xs font-semibold flex items-center justify-between hover:bg-[#F9F3EA] transition-colors w-max"
            >
              <span>
                Bulk Price @ {currentCurrencyCode} {convertedBulkPrice.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} / {unit} &gt;
              </span>
            </button>

            {/* See How It Works Button */}
            <button
              type="button"
              onClick={() => setShowHowItWorksModal(true)}
              className="text-xs text-[#3c3c3c] bg-[#F3F4F6] border border-[#E5E7EB] rounded-full px-3 py-1 flex items-center gap-1 w-max mt-1 hover:bg-gray-200 transition-colors"
            >
              <span className="material-symbols-outlined text-xs">help_outline</span>
              <span>See How It Works</span>
            </button>
          </div>

          {/* Specifications Cards Row (Weight & Width) */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="p-3 rounded bg-[#F9F8F6] border border-[#EFEEE9] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#3c3c3c]">
                <span className="material-symbols-outlined text-base text-[#7D5A20]">work</span>
                <span>Weight</span>
              </div>
              <span className="text-xs font-bold text-[#1f1f1f]">{gsm} GSM</span>
            </div>

            <div className="p-3 rounded bg-[#F9F8F6] border border-[#EFEEE9] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#3c3c3c]">
                <span className="material-symbols-outlined text-base text-[#7D5A20]">straighten</span>
                <span>Width</span>
              </div>
              <span className="text-xs font-bold text-[#1f1f1f]">{width}</span>
            </div>
          </div>

          {/* Choose Variant Swatches */}
          {p.relatedProductList && p.relatedProductList.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-xs font-bold text-[#3c3c3c]">Choose Variant</span>
              <div className="flex items-center gap-3 flex-wrap">
                {p.relatedProductList.map((variant: any) => {
                  const isCurrent = variant.sku === p.sku || variant.id === p.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => handleVariantClick(variant.slug)}
                      className={`relative w-14 h-14 rounded overflow-hidden border-2 transition-all ${isCurrent ? "border-[#C79D6D] ring-1 ring-[#C79D6D]" : "border-gray-200 opacity-80 hover:opacity-100"
                        }`}
                      title={variant.name || variant.sku}
                    >
                      <img
                        src={variant.heroImage || p.heroImage}
                        alt={variant.name || variant.sku}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && (
                        <div className="absolute top-0 right-0 bg-[#C79D6D] text-white rounded-bl w-4 h-4 flex justify-center items-center text-[10px] font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Counter & Stock Message */}
          <div className="flex flex-col gap-1.5 mt-2">
            <span className="text-xs font-bold text-[#3c3c3c]">Quantity ({unit})</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-[#D1D4DB] rounded bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 font-bold transition-colors"
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
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 font-bold transition-colors"
                >
                  +
                </button>
              </div>

              <div className="flex items-center gap-1 text-xs text-red-600 font-bold">
                <span className="material-symbols-outlined text-base">shopping_cart</span>
                <span>Only {inStockQty} {unit} In Stock!</span>
              </div>
            </div>
          </div>

          {/* Customization Available Box (Only displayed when customization is enabled for this product) */}
          {isCustomizationAvailable && (
            <div className="fb-customization-card flex flex-col gap-2 mt-2 mb-2">
              <div className="flex gap-2 items-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.49704 14.044L10.519 7.023C10.9863 6.56242 11.3573 6.01347 11.6104 5.40812C11.8634 4.80277 11.9935 4.15312 11.993 3.497C11.9931 2.18896 11.4796 0.933188 10.563 0L3.54004 7.024C3.07302 7.48451 2.70227 8.03333 2.44938 8.63851C2.1965 9.24368 2.06653 9.89311 2.06704 10.549C2.06704 11.922 2.61704 13.149 3.49704 14.045V14.044ZM20.504 9.941L13.481 16.963C13.0141 17.4235 12.6433 17.9724 12.3905 18.5775C12.1376 19.1827 12.0076 19.8321 12.008 20.488C12.008 21.848 12.558 23.089 13.438 23.985L20.46 16.963C20.9275 16.5025 21.2985 15.9536 21.5516 15.3482C21.8047 14.7428 21.9347 14.0931 21.934 13.437C21.934 12.064 21.384 10.837 20.504 9.941ZM20.46 7.037C20.9273 6.5766 21.2983 6.02783 21.5513 5.42264C21.8044 4.81746 21.9345 4.16796 21.934 3.512C21.934 2.152 21.384 0.912 20.504 0.015L3.54004 16.965C2.60422 17.8937 2.07431 19.1552 2.06626 20.4736C2.0582 21.792 2.57264 23.0599 3.49704 24L20.46 7.037Z" fill="#275E49" />
                </svg>
                <h2 className="fb-font-dm text-lg md:text-xl font-medium text-[#275E49]">Customization Available</h2>
              </div>
              <div className="flex flex-col gap-2 justify-center items-start">
                <p className="text-[#3c3c3c] text-sm">
                  This product is available with customized fabrics, natural custom dyeing at low MOQ
                </p>
                <button
                  type="button"
                  onClick={() => setShowCustomizationOptions(!showCustomizationOptions)}
                  className="text-[#275E49] bg-white rounded border border-[#D1D4DB] px-4 py-1 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {showCustomizationOptions ? "Hide Customization Options ^" : "Show Customization Options >"}
                </button>
              </div>
            </div>
          )}

          {/* Primary CTA Buttons Row (Bulk Pre-Order & Add to Cart) */}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => setShowPreOrderModal(true)}
              className="flex-[50%] bg-white border border-[#C79D6D] text-[#C79D6D] font-bold py-3 rounded text-sm hover:bg-[#FFFBF7] transition-colors text-center"
            >
              Bulk Pre-Order
            </button>

            <button
              type="button"
              className="flex-[50%] bg-[#C79D6D] hover:bg-[#b0885a] text-white font-bold py-3 rounded text-sm transition-colors text-center"
            >
              Add to Cart
            </button>
          </div>

          {/* Swatch Kit Card */}
          <div className="p-3 border border-[#D1D4DB] rounded bg-white flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <img
                src={p.heroImage}
                alt="Swatch"
                className="w-12 h-12 rounded object-cover border border-gray-200"
              />
              <div>
                <span className="block font-bold text-xs text-[#1f1f1f]">Order a Swatch</span>
                <span className="text-xs text-[#6B7280] font-semibold">
                  {currentCurrencyCode} {convertPrice(21.81).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSwatchAdded(true);
                setTimeout(() => setSwatchAdded(false), 2500);
              }}
              className={`text-xs font-bold px-3.5 py-1.5 rounded transition-colors ${swatchAdded
                ? "bg-emerald-600 text-white"
                : "text-[#7D5A20] bg-[#FFF8D0] border border-[#C79D6D]/40 hover:bg-[#F9EFA4]"
                }`}
            >
              {swatchAdded ? "✓ Added Swatch" : "+ Add Swatch"}
            </button>
          </div>

          {/* Expanded Customization Options Section (Only when isCustomizationAvailable is true) */}
          {isCustomizationAvailable && showCustomizationOptions && (
            <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-[#EFEEE9]">
              <div className="flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.49704 14.044L10.519 7.023C10.9863 6.56242 11.3573 6.01347 11.6104 5.40812C11.8634 4.80277 11.9935 4.15312 11.993 3.497C11.9931 2.18896 11.4796 0.933188 10.563 0L3.54004 7.024C3.07302 7.48451 2.70227 8.03333 2.44938 8.63851C2.1965 9.24368 2.06653 9.89311 2.06704 10.549C2.06704 11.922 2.61704 13.149 3.49704 14.045V14.044ZM20.504 9.941L13.481 16.963C13.0141 17.4235 12.6433 17.9724 12.3905 18.5775C12.1376 19.1827 12.0076 19.8321 12.008 20.488C12.008 21.848 12.558 23.089 13.438 23.985L20.46 16.963C20.9275 16.5025 21.2985 15.9536 21.5516 15.3482C21.8047 14.7428 21.9347 14.0931 21.934 13.437C21.934 12.064 21.384 10.837 20.504 9.941ZM20.46 7.037C20.9273 6.5766 21.2983 6.02783 21.5513 5.42264C21.8044 4.81746 21.9345 4.16796 21.934 3.512C21.934 2.152 21.384 0.912 20.504 0.015L3.54004 16.965C2.60422 17.8937 2.07431 19.1552 2.06626 20.4736C2.0582 21.792 2.57264 23.0599 3.49704 24L20.46 7.037Z" fill="#275E49" />
                </svg>
                <h3 className="fb-font-dm text-lg font-medium text-[#1f1f1f]">Customization Options</h3>
              </div>

              {/* 1. Custom Organic Dye */}
              <div className="flex flex-col gap-2">
                <div className="font-bold text-[#3c3c3c] text-sm">Custom Organic Dye</div>
                <span className="text-[11px] text-[#6B7280]">Original Fabric Color As Displayed</span>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDyeType("original");
                      setSelectedDyeItem(null);
                      setPantoneSubmitted(false);
                    }}
                    className={`text-xs px-3.5 py-1.5 rounded border font-medium transition-colors ${selectedDyeType === "original"
                      ? "border-[#C79D6D] bg-[#FFFBF7] text-[#7D5A20]"
                      : "border-[#D1D4DB] text-[#3c3c3c] bg-white hover:bg-gray-50"
                      }`}
                  >
                    As per Original
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDyeType("custom");
                      setSelectedDyeItem(null);
                    }}
                    className={`text-xs px-3.5 py-1.5 rounded border font-medium transition-colors ${selectedDyeType === "custom"
                      ? "border-[#C79D6D] bg-[#FFFBF7] text-[#7D5A20]"
                      : "border-[#D1D4DB] text-[#3c3c3c] bg-white hover:bg-gray-50"
                      }`}
                  >
                    Custom Dye
                  </button>

                  {/* Guide Button Opens Pantone Guide Sidebar Drawer */}
                  <button
                    type="button"
                    onClick={() => setShowPantoneGuide(true)}
                    className="text-xs px-3 py-1.5 rounded border border-[#D1D4DB] text-[#3c3c3c] bg-white hover:bg-gray-50 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <span>Guide</span>
                    <span className="material-symbols-outlined text-xs text-gray-500">info</span>
                  </button>
                </div>

                {/* When Custom Dye is Selected: Yellow Pantone Alert Box + Form Inputs */}
                {selectedDyeType === "custom" && (
                  <div className="flex flex-col gap-3 mt-2 animate-in fade-in duration-200">
                    <div className="p-3 bg-[#FFF8D0] border border-[#FFEBAA] rounded-lg text-xs text-[#6B5A10] leading-relaxed flex items-start gap-2">
                      <span className="material-symbols-outlined text-base text-[#7D5A20] shrink-0 mt-0.5">info</span>
                      <div>
                        Please enter the exact Pantone code (19-1537 TCX Winery) or share as per the Guide (Pantone 100 or refer -{" "}
                        <a href="http://www.pantone-colours.com/" target="_blank" rel="noreferrer" className="underline font-medium hover:text-black">
                          http://www.pantone-colours.com/
                        </a>
                        ). Provide color code along with names as per Pantone reference for better understanding to avoid confusion.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-5 flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#3c3c3c]">
                          Pantone Shade <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={pantoneShade}
                          onChange={(e) => setPantoneShade(e.target.value)}
                          placeholder="19-1537 TCX Winery or Pan"
                          className="w-full border border-[#D1D4DB] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#C79D6D]"
                        />
                      </div>

                      <div className="sm:col-span-4 flex flex-col gap-1">
                        <label className="text-xs font-bold text-[#3c3c3c]">Notes</label>
                        <input
                          type="text"
                          value={pantoneNotes}
                          onChange={(e) => setPantoneNotes(e.target.value)}
                          placeholder="Additional Comments"
                          className="w-full border border-[#D1D4DB] rounded px-3 py-2 text-xs focus:outline-none focus:border-[#C79D6D]"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (pantoneShade.trim()) {
                              setPantoneSubmitted(true);
                            }
                          }}
                          className="w-full bg-[#C79D6D] hover:bg-[#b0885a] text-white font-semibold py-2.5 px-3 rounded text-xs transition-colors whitespace-nowrap"
                        >
                          {pantoneSubmitted ? "✓ Submitted" : "Submit Custom Dye"}
                        </button>
                      </div>
                    </div>

                    {pantoneSubmitted && (
                      <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>Custom Dye Pantone &quot;{pantoneShade}&quot; submitted!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Custom Natural Vegetable Dye */}
              <div className="flex flex-col gap-3 mt-3">
                <div className="font-bold text-[#3c3c3c] text-sm">
                  {finishProfile?.displayName || "Custom Natural Vegetable Dye"}
                </div>

                {/* Selected Finish Chip Tags Above Swatches */}
                {selectedDyeItem && (
                  <div className="fb-selected-finishes flex flex-wrap items-center gap-1.5">
                    <div
                      onClick={() => {
                        setSelectedDyeItem(null);
                        setSelectedDyeType("original");
                      }}
                      className="fb-finish-chip text-[11px] font-semibold border border-[#C79D6D] text-[#3c3c3c] bg-[#FFFBF7] rounded px-2.5 py-1 flex items-center gap-1.5 cursor-pointer capitalize"
                    >
                      <span>{selectedDyeItem.label?.toLowerCase()}</span>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.99999 8.00002L4.66666 4.66669M7.99999 8.00002L11.3333 11.3334M7.99999 8.00002L11.3333 4.66669M7.99999 8.00002L4.66666 11.3334" stroke="black" strokeWidth="1.3333" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Inline Swatches Strip */}
                <div className="flex flex-wrap items-center gap-2">
                  {naturalDyeList.slice(0, 6).map((finish: any, i: number) => {
                    const isSelected = selectedDyeItem?.id === finish.id;
                    return (
                      <div
                        key={finish.id || i}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDyeItem(null);
                            setSelectedDyeType("original");
                          } else {
                            setSelectedDyeItem(finish);
                            setSelectedDyeType("natural");
                          }
                        }}
                        className={`fb-finish-icon rounded cursor-pointer relative ${isSelected ? "ring-2 ring-[#C79D6D]" : ""
                          }`}
                      >
                        <img
                          src={finish.image}
                          alt={finish.label}
                          className="w-16 h-16 object-cover object-bottom rounded m-[1px]"
                        />

                        {/* Circular Botanical Inset on Bottom Right */}
                        <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full overflow-hidden border border-white shadow">
                          <img src={getBotanicalInset(finish.label)} alt="" className="w-full h-full object-cover" />
                        </div>

                        {/* Top-Left SVG Checkmark Badge when active */}
                        {isSelected && (
                          <svg
                            className="absolute -top-2 -left-2"
                            width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle cx="10.5" cy="10.5" r="9.19" fill="white" />
                            <path d="M10.5 1.3125C8.68289 1.3125 6.90658 1.85134 5.3957 2.86087C3.88483 3.87041 2.70724 5.3053 2.01186 6.9841C1.31648 8.66289 1.13454 10.5102 1.48904 12.2924C1.84354 14.0746 2.71857 15.7116 4.00346 16.9965C5.28836 18.2814 6.92541 19.1565 8.70761 19.511C10.4898 19.8655 12.3371 19.6835 14.0159 18.9881C15.6947 18.2928 17.1296 17.1152 18.1391 15.6043C19.1487 14.0934 19.6875 12.3171 19.6875 10.5C19.6875 8.06332 18.7195 5.72645 16.9965 4.00346C15.2736 2.28047 12.9367 1.3125 10.5 1.3125ZM9.1875 14.169L5.90625 10.8877L6.95009 9.84375L9.1875 12.081L14.0503 7.21875L15.0975 8.2595L9.1875 14.169Z" fill="#C79D6D" />
                          </svg>
                        )}
                      </div>
                    );
                  })}

                  {naturalDyeList.length > 6 && (
                    <div
                      onClick={() => setShowDyeModal(true)}
                      className="cursor-pointer w-16 h-16 rounded border border-gray-300 text-gray-700 font-semibold flex justify-center items-center text-center text-xs"
                    >
                      <span>+ {naturalDyeList.length - 6} More</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* SECTION: Discover The Craft */}
      <div className="w-full max-w-[1290px] px-4 md:px-6 mt-16 pt-8 border-t border-[#EFEEE9] text-center">
        <h2 className="fb-font-dm text-2xl md:text-3xl font-medium text-[#1f1f1f] mb-8">
          Discover The Craft
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/stories/handloom-jacquard/12134"
            className="bg-[#F9F8F6] rounded-lg overflow-hidden border border-[#EFEEE9] shadow-xs hover:shadow-md transition-shadow group flex flex-col"
          >
            <div className="aspect-[16/9] w-full overflow-hidden">
              <img
                src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/PENTN7FGNSWP4W6PW254LI6JXG8907796.jpg"
                alt="Handloom Jacquard"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="p-5 text-center">
              <h3 className="fb-font-dm font-medium text-lg text-[#1f1f1f]">Handloom Jacquard</h3>
              <p className="text-xs text-[#6B7280] mt-1">Embroidery Technique | Published On 25th Jul, 2023</p>
            </div>
          </Link>

          <Link
            href="/stories/handloom-cluster/12134"
            className="bg-[#F9F8F6] rounded-lg overflow-hidden border border-[#EFEEE9] shadow-xs hover:shadow-md transition-shadow group flex flex-col"
          >
            <div className="aspect-[16/9] w-full overflow-hidden">
              <img
                src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/ZWADZPMYSPI8Q00OID5TIASCOG3502523.jpg"
                alt="Handloom Cluster"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="p-5 text-center">
              <h3 className="fb-font-dm font-medium text-lg text-[#1f1f1f]">Handloom Cluster</h3>
              <p className="text-xs text-[#6B7280] mt-1">Organic &amp; Natural | Published On 31st Jul, 2023</p>
            </div>
          </Link>
        </div>
      </div>

      {/* SECTION: Hear from our Customers */}
      <div id="reviews-section" className="w-full max-w-[1290px] px-4 md:px-6 mt-16 pt-8 border-t border-[#EFEEE9]">
        <div className="text-center mb-8">
          <h2 className="fb-font-dm text-2xl md:text-3xl font-medium text-[#1f1f1f]">
            Hear from our Customers
          </h2>
          <div className="flex justify-center items-center gap-1.5 mt-2">
            <div className="star">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <span className="text-sm font-bold text-[#3c3c3c]">4.8 out of 5</span>
          </div>
        </div>

        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {CUSTOMER_REVIEWS.map((rev, rIdx) => (
            <div key={rIdx} className="p-4 rounded border-b border-[#EFEEE9] bg-white flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#B7A98F] text-white font-bold flex justify-center items-center text-xs">
                    {rev.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1f1f1f]">{rev.name}</h4>
                    <div className="star text-xs">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                  </div>
                </div>
                <span className="text-xs text-[#6B7280]">{rev.date}</span>
              </div>

              <p className="text-sm text-[#3c3c3c] leading-relaxed">{rev.comment}</p>

              <div className="flex justify-between items-center text-xs text-[#6B7280] pt-2">
                <div className="flex items-center gap-2">
                  <img src={p.heroImage} alt="Purchased item" className="w-8 h-8 rounded object-cover border border-[#EFEEE9]" />
                  <div>
                    <span>Purchased Item</span><br />
                    <span className="font-bold text-[#7D5A20] underline">{rev.itemSku}</span>
                  </div>
                </div>
                <span>{rev.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODALS & DRAWERS */}
      {/* 1. Custom Natural Vegetable Dye RIGHT SIDEBAR DRAWER */}
      {showDyeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end transition-opacity duration-300">
          {/* Backdrop Click Close */}
          <div className="absolute inset-0" onClick={() => setShowDyeModal(false)} />

          {/* Right-Side Drawer Panel */}
          <div className="relative w-full max-w-[650px] bg-white h-full shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-right duration-300">

            {/* Top Bar with Orange-Tan Close Box on Top Left */}
            <div className="relative w-full p-4 border-b border-gray-200 flex justify-center items-center bg-white">
              <div
                onClick={() => setShowDyeModal(false)}
                className="absolute top-2 left-2 px-2.5 py-1.5 bg-[#D4A373] rounded z-10 cursor-pointer flex justify-center items-center hover:bg-[#c39262] transition-colors"
                title="Close"
              >
                <span className="material-symbols-outlined text-white text-lg">close</span>
              </div>
              <h2 className="fb-font-dm font-medium text-xl md:text-2xl text-[#1f1f1f] text-center">
                {finishProfile?.displayName || "Custom Natural Vegetable Dye"}
              </h2>
            </div>

            {/* Scrollable Dye Grid */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pb-36">
              {naturalDyeList.map((finish: any, idx: number) => {
                const isSelected = selectedDyeItem?.id === finish.id;
                return (
                  <div
                    key={finish.id || idx}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDyeItem(null);
                        setSelectedDyeType("original");
                      } else {
                        setSelectedDyeItem(finish);
                        setSelectedDyeType("natural");
                      }
                    }}
                    className={`fb-finish-icon relative rounded-md flex flex-col justify-between cursor-pointer transition-all ${isSelected ? "active border-[#C79D6D] ring-2 ring-[#C79D6D]" : "hover:border-gray-300"
                      }`}
                  >
                    <div className="relative w-full aspect-square bg-gray-100 rounded">
                      <img
                        src={finish.image}
                        alt={finish.label}
                        className="w-full h-full object-cover rounded"
                      />

                      {/* Circular Botanical Raw Material Inset on Bottom Right */}
                      <div className="absolute bottom-1 right-1 w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-md">
                        <img src={getBotanicalInset(finish.label)} alt="" className="w-full h-full object-cover" />
                      </div>

                      {/* Selected Badge Checkmark Icon (Top Left) */}
                      {isSelected && (
                        <svg
                          className="absolute -top-2 -left-2"
                          width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle cx="10.5" cy="10.5" r="9.19" fill="white" />
                          <path d="M10.5 1.3125C8.68289 1.3125 6.90658 1.85134 5.3957 2.86087C3.88483 3.87041 2.70724 5.3053 2.01186 6.9841C1.31648 8.66289 1.13454 10.5102 1.48904 12.2924C1.84354 14.0746 2.71857 15.7116 4.00346 16.9965C5.28836 18.2814 6.92541 19.1565 8.70761 19.511C10.4898 19.8655 12.3371 19.6835 14.0159 18.9881C15.6947 18.2928 17.1296 17.1152 18.1391 15.6043C19.1487 14.0934 19.6875 12.3171 19.6875 10.5C19.6875 8.06332 18.7195 5.72645 16.9965 4.00346C15.2736 2.28047 12.9367 1.3125 10.5 1.3125ZM9.1875 14.169L5.90625 10.8877L6.95009 9.84375L9.1875 12.081L14.0503 7.21875L15.0975 8.2595L9.1875 14.169Z" fill="#C79D6D" />
                        </svg>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 px-2 pb-2 mt-2">
                      <h3 className="black-text capitalize text-sm font-medium leading-snug">{finish.label?.toLowerCase()}</h3>
                      {finish.price != null && (
                        <div className="text-xs text-[#6B7280] font-bold">
                          {currentCurrencyCode} {convertPrice(finish.price).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </div>
                      )}
                      {finish.description && (
                        <p className="text-xs text-[#6B7280] leading-normal">{finish.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 flex flex-col gap-2 shadow-lg">
              {selectedDyeItem && (
                <div className="font-bold text-sm text-[#3c3c3c]">
                  Total: {currentCurrencyCode} {convertedPrice.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </div>
              )}

              {selectedDyeItem && (
                <div className="fb-selected-finishes flex flex-wrap items-center gap-1.5">
                  <div
                    onClick={() => {
                      setSelectedDyeItem(null);
                      setSelectedDyeType("original");
                    }}
                    className="fb-finish-chip border border-[#C79D6D] text-[#3c3c3c] bg-[#FFFBF7] text-xs px-2.5 py-1 rounded font-semibold flex items-center gap-1.5 cursor-pointer capitalize"
                  >
                    <span>{selectedDyeItem.label?.toLowerCase()}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7.99999 8.00002L4.66666 4.66669M7.99999 8.00002L11.3333 11.3334M7.99999 8.00002L11.3333 4.66669M7.99999 8.00002L4.66666 11.3334" stroke="black" strokeWidth="1.3333" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mt-1">
                <div
                  onClick={() => setShowDyeModal(false)}
                  className="w-full rounded-md text-center py-3 font-medium cursor-pointer border border-[#D1D4DB] text-[#3c3c3c] hover:bg-gray-50 text-sm"
                >
                  Cancel
                </div>
                <div
                  onClick={() => setShowDyeModal(false)}
                  className="w-full rounded-md text-center py-3 font-medium cursor-pointer bg-[#D4A373] text-white hover:bg-[#c39262] text-sm"
                >
                  Continue
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. PANTONE GUIDE RIGHT SIDEBAR DRAWER (Full Color Swatches Palette Grid) */}
      {showPantoneGuide && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end transition-opacity duration-300">
          {/* Backdrop Click Close */}
          <div className="absolute inset-0" onClick={() => setShowPantoneGuide(false)} />

          {/* Right-Side Drawer Panel */}
          <div className="relative w-full max-w-[650px] bg-white h-full shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-right duration-300">

            {/* Top Bar with Orange-Tan Close Box on Top Left */}
            <div className="relative w-full p-4 border-b border-gray-200 flex justify-center items-center bg-white">
              <div
                onClick={() => setShowPantoneGuide(false)}
                className="absolute top-2 left-2 px-2.5 py-1.5 bg-[#D4A373] rounded z-10 cursor-pointer flex justify-center items-center hover:bg-[#c39262] transition-colors"
                title="Close"
              >
                <span className="material-symbols-outlined text-white text-lg">close</span>
              </div>
              <h2 className="fb-font-dm font-medium text-xl md:text-2xl text-[#1f1f1f] text-center">
                Pantone Guide
              </h2>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4">
              {/* Yellow Information Alert Box */}
              <div className="p-3 bg-[#FFF8D0] border border-[#FFEBAA] rounded-lg text-xs text-[#6B5A10] leading-relaxed flex items-start gap-2">
                <span className="material-symbols-outlined text-base text-[#7D5A20] shrink-0 mt-0.5">info</span>
                <div>
                  Please enter the exact Pantone code (19-1537 TCX Winery) or share as per the Guide (Pantone 100 or refer{" "}
                  <a href="http://www.pantone-colours.com/" target="_blank" rel="noreferrer" className="underline font-medium hover:text-black">
                    http://www.pantone-colours.com/
                  </a>
                  ). Provide color code along with names as per Pantone reference for better understanding to avoid confusion.
                </div>
              </div>

              {/* Dynamic Guide Image if available from Endpoint */}
              {dynamicGuideImage && (
                <div className="w-full flex justify-center items-center p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <img
                    src={dynamicGuideImage}
                    alt="Pantone Guide"
                    className="w-full h-auto max-h-[40vh] object-contain rounded"
                  />
                </div>
              )}

              {/* Pantone Color Chart Grid (4 Columns) */}
              <div className="grid grid-cols-4 gap-2">
                {PANTONE_GUIDE_SWATCHES.map((swatch, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPantoneShade(swatch.code);
                      setSelectedDyeType("custom");
                      setShowPantoneGuide(false);
                    }}
                    className="flex flex-col rounded overflow-hidden border border-gray-200 hover:border-[#C79D6D] hover:shadow-md transition-all text-left bg-white group cursor-pointer"
                  >
                    <div
                      className="w-full h-16 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <div className="p-1.5 bg-white text-[11px] font-bold text-[#3c3c3c] truncate">
                      {swatch.code}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. Bulk Pricing Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 relative">
            <button
              type="button"
              onClick={() => setShowBulkModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-xl font-bold"
            >
              ✕
            </button>

            <h3 className="fb-font-dm font-medium text-xl text-[#1f1f1f]">Volume Bulk Pricing</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              With higher volume, the price reduces proportionately. Pre-order with precise color and design accuracy.
            </p>

            <div className="flex flex-col gap-2 my-2 max-h-[300px] overflow-y-auto">
              {[
                { qty: "25+ Meters", discount: "3% OFF", price: Math.round(price * 0.97) },
                { qty: "50+ Meters", discount: "5% OFF", price: Math.round(price * 0.95) },
                { qty: "75+ Meters", discount: "7.5% OFF", price: Math.round(price * 0.925) },
                { qty: "100+ Meters", discount: "10% OFF", price: Math.round(price * 0.9) },
                { qty: "300+ Meters", discount: "12% OFF", price: Math.round(price * 0.88) },
                { qty: "500+ Meters", discount: "15% OFF", price: Math.round(price * 0.85) },
                { qty: "1000+ Meters", discount: "17.5% OFF", price: Math.round(price * 0.825) },
              ].map((tier, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded bg-[#F9F8F6] border border-[#EFEEE9] text-xs font-semibold">
                  <span className="text-[#3c3c3c]">{tier.qty}</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{tier.discount}</span>
                  <span className="text-[#7D5A20] font-bold text-sm">
                    {currentCurrencyCode} {convertPrice(tier.price).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} / {unit}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowBulkModal(false)}
              className="w-full bg-[#C79D6D] text-white font-bold py-2.5 rounded hover:bg-[#b0885a] transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 4. How It Works Modal */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 relative">
            <button
              type="button"
              onClick={() => setShowHowItWorksModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-xl font-bold"
            >
              ✕
            </button>

            <h3 className="fb-font-dm font-medium text-xl text-[#1f1f1f]">How Sustainable Sourcing Works</h3>
            <div className="flex flex-col gap-3 text-xs text-[#3c3c3c] leading-relaxed my-2">
              <div className="p-3 bg-[#F9F8F6] rounded border border-[#EFEEE9] flex items-start gap-3">
                <span className="material-symbols-outlined text-[#7D5A20] text-xl">inventory</span>
                <div>
                  <strong className="block text-black">1. In-Stock Ordering</strong>
                  Small quantities up to current loom capacity ship within 3-5 business days directly from our Bengal studio.
                </div>
              </div>

              <div className="p-3 bg-[#F9F8F6] rounded border border-[#EFEEE9] flex items-start gap-3">
                <span className="material-symbols-outlined text-[#7D5A20] text-xl">precision_manufacturing</span>
                <div>
                  <strong className="block text-black">2. Pre-Order &amp; Bulk Custom Production</strong>
                  For quantities above 25+ meters, pre-order allows master weavers to dedicate looms, ensuring batch-to-batch color and weave uniformity.
                </div>
              </div>

              <div className="p-3 bg-[#F9F8F6] rounded border border-[#EFEEE9] flex items-start gap-3">
                <span className="material-symbols-outlined text-[#7D5A20] text-xl">spa</span>
                <div>
                  <strong className="block text-black">3. Custom Natural &amp; Organic Dyeing</strong>
                  Choose custom Pantone shade matching or GOTS-certified natural plant dyes (Madder, Indigo, Myrobalan).
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHowItWorksModal(false)}
              className="w-full bg-[#C79D6D] text-white font-bold py-2.5 rounded hover:bg-[#b0885a] transition-colors text-sm"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* 5. Pre-Order Modal */}
      {showPreOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 relative">
            <button
              type="button"
              onClick={() => setShowPreOrderModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-xl font-bold"
            >
              ✕
            </button>

            <h3 className="fb-font-dm font-medium text-xl text-[#1f1f1f]">Pre-Order Bulk Production</h3>

            <div className="p-3 bg-[#FFF8D0] border border-[#8f780f]/30 rounded text-xs text-[#8f780f] flex items-center gap-2">
              <span className="material-symbols-outlined text-base">info</span>
              <span>An advance payment of 50% is required at checkout for pre-orders.</span>
            </div>

            <div className="flex flex-col gap-2 my-2 text-xs text-[#3c3c3c]">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-[#6B7280]">Product Name</span>
                <span className="font-bold text-black text-right max-w-[200px] truncate">{p.name}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-[#6B7280]">SKU</span>
                <span className="font-mono font-bold text-[#7D5A20]">{p.sku}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-[#6B7280]">Estimated Delivery</span>
                <span className="font-bold text-black">45 to 60 Days</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-[#6B7280]">Pre-Order Quantity ({unit})</span>
                <input
                  type="number"
                  defaultValue={25}
                  min={15}
                  className="w-20 px-2 py-1 text-center font-bold border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPreOrderModal(false)}
              className="w-full bg-[#C79D6D] text-white font-bold py-3 rounded hover:bg-[#b0885a] transition-colors text-sm uppercase"
            >
              Confirm Pre-Order
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
