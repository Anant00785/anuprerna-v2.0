"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

export interface LightGalleryItem {
  src: string;
  thumb?: string;
  subHtml?: string;
  type?: "image" | "video" | "youtube";
  alt?: string;
  poster?: string;
  height?: string;
  autoplay?: boolean;
}

export interface ProductLightGalleryProps {
  galleryItems: LightGalleryItem[];
  productFinish?: boolean;
  hasVideo?: boolean;
  selectedFabric?: any;
  productName?: string;
  urlCategory?: string;
  urlSlug?: string;
  galleryPage?: boolean;
  initialSelectedIndex?: number;
}

function getEmbedUrl(url: string, autoplay: boolean = true): string {
  if (!url) return "";
  const autoplayParam = autoplay ? "1" : "0";

  // YouTube Shorts: youtube.com/shorts/ID
  if (url.includes("youtube.com/shorts/")) {
    const id = url.split("shorts/")[1]?.split(/[?&]/)[0];
    if (id) return `https://www.youtube.com/embed/${id}?autoplay=${autoplayParam}&rel=0`;
  }

  // Standard YouTube: youtube.com/watch?v=ID or youtu.be/ID or youtube.com/embed/ID
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=${autoplayParam}&rel=0`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=${autoplayParam}`;
  }

  return url;
}

export function ProductLightGallery({
  galleryItems,
  productFinish = false,
  hasVideo = false,
  selectedFabric,
  productName = "Product",
  galleryPage = false,
  initialSelectedIndex = 0,
}: ProductLightGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(initialSelectedIndex);
  const [items, setItems] = useState<LightGalleryItem[]>(galleryItems);
  const [showArrows, setShowArrows] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Sync and dynamically update gallery items if selectedFabric changes (matching Angular ngOnChanges 1:1)
  useEffect(() => {
    let list = [...galleryItems];
    if (selectedFabric) {
      const customSrc =
        selectedFabric.mockupImage ||
        selectedFabric.fabricPreview?.heroImage ||
        selectedFabric.heroImage ||
        selectedFabric.image;
      const customAlt =
        selectedFabric.mockupText ||
        selectedFabric.fabricPreview?.name ||
        selectedFabric.name ||
        "Selected Custom Fabric";

      if (customSrc) {
        const customItem: LightGalleryItem = {
          src: customSrc,
          thumb: customSrc,
          subHtml: `<h4>Selected Fabric: ${customAlt}</h4>`,
          type: "image",
          alt: customAlt,
        };
        list = [customItem, ...list.filter((item) => item.src !== customSrc)];
        setSelectedImageIndex(0);
      }
    }
    setItems(list);
  }, [galleryItems, selectedFabric]);

  // Check scrollability for thumbnail navigation arrows
  const checkScrollability = useCallback(() => {
    const container = thumbnailContainerRef.current;
    if (container) {
      setShowArrows(container.scrollWidth > container.clientWidth);
    }
  }, []);

  useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [items, checkScrollability]);

  // Scroll thumbnails horizontally
  const scrollThumbnails = (direction: "left" | "right") => {
    const container = thumbnailContainerRef.current;
    if (!container) return;
    const scrollAmount = 120;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleSelectImage = (idx: number) => {
    const item = items[idx];
    if (item && item.type === "youtube") {
      openLightbox(idx);
    } else {
      setSelectedImageIndex(idx);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsZoomed(false);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setIsZoomed(false);
  };

  const nextLightboxSlide = useCallback(() => {
    setIsZoomed(false);
    setLightboxIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }, [items.length]);

  const prevLightboxSlide = useCallback(() => {
    setIsZoomed(false);
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }, [items.length]);

  // Touch Swipe handlers for mobile viewport
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next Image
      setSelectedImageIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Previous Image
      setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextLightboxSlide();
      if (e.key === "ArrowLeft") prevLightboxSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, nextLightboxSlide, prevLightboxSlide]);

  if (!items || items.length === 0) return null;

  const currentItem = items[selectedImageIndex] || items[0];
  const activeLightboxItem = items[lightboxIndex] || items[0];
  const isCurrentVideo = currentItem?.type === "youtube" || currentItem?.type === "video";

  return (
    <div
      className={`product-gallery w-full ${
        galleryPage
          ? "flex flex-col-reverse md:flex-row justify-center items-start gap-4"
          : "flex flex-col"
      }`}
    >
      {/* GALLERY PAGE VERTICAL THUMBNAIL STRIP (when galleryPage is true) */}
      {galleryPage && (
        <div className="thumbnail-wrapper-gallery relative flex flex-row md:flex-col items-center justify-center shrink-0 w-full md:w-auto">
          {showArrows && (
            <button
              type="button"
              onClick={() => scrollThumbnails("left")}
              aria-label="Scroll up"
              className="arrow up absolute md:top-0 left-0 md:left-auto w-8 h-8 md:w-full bg-white/95 hover:bg-white text-base font-bold text-[#1f1f1f] flex items-center justify-center z-10 transition-colors cursor-pointer rounded"
            >
              &#8593;
            </button>
          )}

          <div
            ref={thumbnailContainerRef}
            className={`thumbnails flex flex-row md:flex-col items-center gap-3 overflow-auto scroll-smooth no-scrollbar max-h-[600px] ${
              showArrows ? "py-8 px-2" : "py-1 px-1"
            }`}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((image, idx) => {
              const isSelected = idx === selectedImageIndex;
              const isVideo = image.type === "youtube" || image.type === "video";
              const thumbnailSrc = isVideo
                ? image.poster || image.thumb || image.src
                : image.thumb || image.src;

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectImage(idx)}
                  className={`thumbnail-container relative shrink-0 rounded-[10px] border-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#7D5A20]"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={thumbnailSrc}
                    alt={image.alt || `Thumbnail ${idx + 1}`}
                    className="w-[72px] h-[72px] rounded-lg object-cover block m-[2px]"
                  />
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {showArrows && (
            <button
              type="button"
              onClick={() => scrollThumbnails("right")}
              aria-label="Scroll down"
              className="arrow down absolute md:bottom-0 right-0 md:right-auto w-8 h-8 md:w-full bg-white/95 hover:bg-white text-base font-bold text-[#1f1f1f] flex items-center justify-center z-10 transition-colors cursor-pointer rounded"
            >
              &#8595;
            </button>
          )}
        </div>
      )}

      {/* MAIN IMAGE VIEWPORT */}
      <div
        className={`main-image w-full ${
          galleryPage ? "max-h-[700px] flex-1" : "max-h-[600px] mb-4"
        } relative overflow-hidden select-none ${
          productFinish ? "product-finish" : "product-fabric"
        } rounded-lg md:rounded-lg max-md:rounded-none`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Centered Image / Media Container */}
        <div className="w-full h-full flex justify-center items-center relative">
          {isCurrentVideo ? (
            <div className="w-full h-[380px] md:h-[500px] bg-black flex justify-center items-center relative rounded-lg overflow-hidden">
              <iframe
                src={getEmbedUrl(currentItem.src, false)}
                title={currentItem.alt || productName}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <img
              src={currentItem.src}
              alt={currentItem.alt || productName}
              onClick={() => openLightbox(selectedImageIndex)}
              className={`cursor-pointer transition-all duration-300 ${
                productFinish
                  ? "w-auto h-full max-h-[600px] max-md:max-h-[500px] max-md:w-full object-contain max-md:object-cover rounded-lg max-md:rounded-none block"
                  : "w-full h-auto max-h-[600px] object-cover rounded-lg max-md:rounded-none block"
              }`}
            />
          )}

          {/* Center Shorts / Play Overlay Icon if thumbnail for video */}
          {currentItem.type === "youtube" && (
            <div
              onClick={() => openLightbox(selectedImageIndex)}
              className="absolute inset-0 flex items-center justify-center cursor-pointer pointer-events-auto bg-black/20"
            >
              <div className="w-14 h-14 rounded-full bg-white/90 shadow-lg flex items-center justify-center transition-transform hover:scale-110">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#7D5A20">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM LEFT: Floating Video Button (Matching Angular fb-product-light-gallery 1:1) */}
        {hasVideo && (
          <button
            type="button"
            onClick={() => {
              const videoIndex = items.findIndex((it) => it.type === "youtube" || it.type === "video");
              openLightbox(videoIndex !== -1 ? videoIndex : 1);
            }}
            title="Watch Product Video"
            className="absolute bottom-5 left-5 w-10 h-10 rounded-full bg-[#FFFBF8] shadow-md flex justify-center items-center cursor-pointer hover:scale-105 transition-all z-10 border border-[#EFEEE9]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.5625 15.5156V8.48438C3.5625 7.98709 3.76004 7.51018 4.11167 7.15855C4.46331 6.80692 4.94022 6.60938 5.4375 6.60938H13.4062C13.9035 6.60938 14.3804 6.80692 14.7321 7.15855C15.0837 7.51018 15.2812 7.98709 15.2812 8.48438V15.5156C15.2812 16.0129 15.0837 16.4898 14.7321 16.8415C14.3804 17.1931 13.9035 17.3906 13.4062 17.3906H5.4375C4.94022 17.3906 4.46331 17.1931 4.11167 16.8415C3.76004 16.4898 3.5625 16.0129 3.5625 15.5156ZM19.6575 7.30406L15.9075 10.6444C15.8581 10.6883 15.8185 10.7421 15.7914 10.8024C15.7642 10.8626 15.7501 10.928 15.75 10.9941V12.6609C15.7501 12.727 15.7642 12.7924 15.7914 12.8526C15.8185 12.9129 15.8581 12.9667 15.9075 13.0106L19.6575 16.3509C19.7251 16.4109 19.8085 16.4501 19.8978 16.4638C19.9872 16.4775 20.0785 16.465 20.1609 16.428C20.2434 16.3909 20.3133 16.3309 20.3624 16.255C20.4114 16.1791 20.4375 16.0907 20.4375 16.0003V7.65469C20.4375 7.56433 20.4114 7.47589 20.3624 7.40002C20.3133 7.32414 20.2434 7.26407 20.1609 7.22702C20.0785 7.18998 19.9872 7.17754 19.8978 7.19121C19.8085 7.20487 19.7251 7.24407 19.6575 7.30406Z"
                stroke="#7D5A20"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* BOTTOM RIGHT: Floating "View Gallery" Pill (Matching Angular fb-product-light-gallery 1:1) */}
        <button
          type="button"
          onClick={() => openLightbox(selectedImageIndex)}
          title="Open Fullscreen Gallery"
          className="absolute bottom-5 right-5 w-10 md:w-auto h-10 rounded-full bg-[#FFFBF8] shadow-md flex justify-center items-center gap-1.5 md:px-3.5 cursor-pointer hover:scale-105 transition-all z-10 border border-[#EFEEE9]"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2.8125 8.40278C2.8125 9.88541 3.40147 11.3073 4.44985 12.3557C5.49823 13.4041 6.92014 13.9931 8.40278 13.9931C9.88541 13.9931 11.3073 13.4041 12.3557 12.3557C13.4041 11.3073 13.9931 9.88541 13.9931 8.40278C13.9931 6.92014 13.4041 5.49823 12.3557 4.44985C11.3073 3.40147 9.88541 2.8125 8.40278 2.8125C6.92014 2.8125 5.49823 3.40147 4.44985 4.44985C3.40147 5.49823 2.8125 6.92014 2.8125 8.40278Z"
              stroke="#7D5A20"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17.1874 17.1875L12.3958 12.3959"
              stroke="#7D5A20"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="hidden md:block text-xs font-medium text-[#7D5A20] whitespace-nowrap">
            View Gallery
          </span>
        </button>
      </div>

      {/* DESKTOP THUMBNAIL CAROUSEL STRIP (PDP Mode only, >= md) */}
      {!galleryPage && (
        <div className="hidden md:flex thumbnail-wrapper relative items-center justify-center w-full min-h-[80px]">
          {showArrows && (
            <button
              type="button"
              onClick={() => scrollThumbnails("left")}
              aria-label="Scroll left"
              className="arrow left absolute left-0 top-0 bottom-0 w-8 h-full bg-white/95 hover:bg-white text-xl font-serif text-[#1f1f1f] flex items-center justify-center z-10 transition-colors cursor-pointer"
            >
              &#8249;
            </button>
          )}

          <div
            ref={thumbnailContainerRef}
            className={`thumbnails flex items-center gap-3 overflow-x-auto scroll-smooth no-scrollbar w-full ${
              showArrows ? "px-10" : "px-1"
            }`}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {items.map((image, idx) => {
              const isSelected = idx === selectedImageIndex;
              const isVideo = image.type === "youtube" || image.type === "video";
              const thumbnailSrc = isVideo
                ? image.poster || image.thumb || image.src
                : image.thumb || image.src;

              return (
                <div
                  key={idx}
                  onClick={() => handleSelectImage(idx)}
                  className={`thumbnail-container relative shrink-0 rounded-[10px] border-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-[#7D5A20]"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  <img
                    src={thumbnailSrc}
                    alt={image.alt || `Thumbnail ${idx + 1}`}
                    className="w-[72px] h-[72px] rounded-lg object-cover block m-[2px]"
                  />
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {showArrows && (
            <button
              type="button"
              onClick={() => scrollThumbnails("right")}
              aria-label="Scroll right"
              className="arrow right absolute right-0 top-0 bottom-0 w-8 h-full bg-white/95 hover:bg-white text-xl font-serif text-[#1f1f1f] flex items-center justify-center z-10 transition-colors cursor-pointer"
            >
              &#8250;
            </button>
          )}
        </div>
      )}

      {/* MOBILE CIRCULAR THUMBNAILS DOTS (PDP Mode only, < md) */}
      {!galleryPage && (
        <div className="flex md:hidden circular-thumbnails items-center justify-center gap-1.5 py-2 w-full">
          {items.map((image, idx) => {
            const isSelected = idx === selectedImageIndex;
            const isVideo = image.type === "youtube" || image.type === "video";

            return (
              <div
                key={idx}
                onClick={() => handleSelectImage(idx)}
                className={`circular-control flex items-center justify-center cursor-pointer transition-all ${
                  isSelected
                    ? "w-2.5 h-2.5 bg-[#7D5A20] rounded-full"
                    : "w-2 h-2 bg-[#D9D9D9] rounded-full"
                }`}
              >
                {isVideo && (
                  <div className="video-thumbnail w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[4px] border-l-[#7D5A20]" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL (LightGallery 1:1 Experience) */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 text-white flex flex-col justify-between backdrop-blur-sm select-none animate-fadeIn">
          {/* Top Bar: Counter, Title, Controls */}
          <div className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-10">
            <div className="text-sm font-medium tracking-wide text-[#D4A373]">
              {lightboxIndex + 1} / {items.length}
            </div>

            <div className="text-xs md:text-sm font-light text-gray-300 truncate max-w-[50%] text-center">
              {activeLightboxItem.alt || productName}
            </div>

            <div className="flex items-center gap-4">
              {activeLightboxItem.type !== "youtube" && activeLightboxItem.type !== "video" && (
                <button
                  type="button"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="text-gray-300 hover:text-white transition-colors"
                  title={isZoomed ? "Zoom Out" : "Zoom In"}
                >
                  <span className="material-symbols-outlined text-2xl">
                    {isZoomed ? "zoom_out" : "zoom_in"}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={closeLightbox}
                className="text-gray-300 hover:text-white transition-colors p-1"
                title="Close Gallery (Esc)"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
          </div>

          {/* Main Stage Viewport */}
          <div className="relative flex-1 flex items-center justify-center px-4 md:px-16 overflow-hidden">
            {/* Left Chevron Button */}
            <button
              type="button"
              onClick={prevLightboxSlide}
              aria-label="Previous Slide"
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-black/80 text-white flex items-center justify-center transition-all z-20"
            >
              <span className="material-symbols-outlined text-3xl">chevron_left</span>
            </button>

            {/* Central Media Content */}
            <div className="max-w-5xl max-h-[75vh] flex items-center justify-center overflow-auto">
              {activeLightboxItem.type === "youtube" || activeLightboxItem.type === "video" ? (
                <div className="w-[85vw] max-w-4xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                  <iframe
                    src={getEmbedUrl(activeLightboxItem.src, true)}
                    title={activeLightboxItem.alt || productName}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <img
                  src={activeLightboxItem.src}
                  alt={activeLightboxItem.alt || productName}
                  onClick={() => setIsZoomed(!isZoomed)}
                  className={`max-h-[72vh] max-w-[90vw] object-contain rounded-lg transition-transform duration-300 ${
                    isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
                  }`}
                />
              )}
            </div>

            {/* Right Chevron Button */}
            <button
              type="button"
              onClick={nextLightboxSlide}
              aria-label="Next Slide"
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 hover:bg-black/80 text-white flex items-center justify-center transition-all z-20"
            >
              <span className="material-symbols-outlined text-3xl">chevron_right</span>
            </button>
          </div>

          {/* Bottom Thumbnail Strip */}
          <div className="w-full px-6 py-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-3 overflow-x-auto no-scrollbar z-10">
            {items.map((thumbItem, tIdx) => {
              const isThumbSelected = tIdx === lightboxIndex;
              const isThumbVideo = thumbItem.type === "youtube" || thumbItem.type === "video";
              const src = isThumbVideo
                ? thumbItem.poster || thumbItem.thumb || thumbItem.src
                : thumbItem.thumb || thumbItem.src;

              return (
                <button
                  key={tIdx}
                  type="button"
                  onClick={() => {
                    setIsZoomed(false);
                    setLightboxIndex(tIdx);
                  }}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    isThumbSelected
                      ? "border-[#7D5A20] ring-2 ring-[#7D5A20] scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt={`Slide ${tIdx + 1}`} className="w-full h-full object-cover" />
                  {isThumbVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="material-symbols-outlined text-white text-sm">play_arrow</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
