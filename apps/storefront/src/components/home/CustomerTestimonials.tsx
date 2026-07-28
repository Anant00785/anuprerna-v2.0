"use client";

import { useState } from "react";

interface ReviewProduct {
  sku: string;
  heroImage: string;
  slug: string;
  productGroup?: string;
}

interface CustomerReview {
  id: string;
  name: string;
  city?: string;
  country: string;
  rating: number;
  description: string;
  createdAt: string;
  link?: string;
  productImages?: string;
  product?: ReviewProduct;
}

const REVIEWS_DATA: CustomerReview[] = [
  {
    id: "r1",
    name: "Sarah Jenkins",
    city: "London",
    country: "United Kingdom",
    rating: 5,
    createdAt: "14 Jun 2024",
    description:
      "The Jamdani silk fabric quality exceeded all our expectations. Incredible craftsmanship, soft hand-feel, and vibrant natural dyes!",
    link: "https://www.etsy.com/in-en/shop/Anuprerna/reviews",
    productImages:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/swatch-bundle-min.jpg",
    product: {
      sku: "FAB-JAM-001",
      heroImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-2.png",
      slug: "jamdani-silk-fabric",
      productGroup: "fabric",
    },
  },
  {
    id: "r2",
    name: "Marie Dupont",
    city: "Paris",
    country: "France",
    rating: 5,
    createdAt: "22 May 2024",
    description:
      "Anuprerna's low MOQ custom manufacturing allowed our sustainable boutique to launch our organic Khadi collection seamlessly.",
    link: "https://www.etsy.com/in-en/shop/Anuprerna/reviews",
    productImages:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/custom-dyeing.png",
    product: {
      sku: "KHD-COT-042",
      heroImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/bulk-order.png",
      slug: "khadi-cotton-fabric",
      productGroup: "fabric",
    },
  },
  {
    id: "r3",
    name: "Elena Rostova",
    city: "Milan",
    country: "Italy",
    rating: 5,
    createdAt: "05 Apr 2024",
    description:
      "Unmatched transparency through ArtisanFlow. Being able to trace our custom linen fabric directly back to the weavers in Bengal is revolutionary.",
    link: "https://www.etsy.com/in-en/shop/Anuprerna/reviews",
    productImages:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/customisations.png",
    product: {
      sku: "LIN-ORG-108",
      heroImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-3.png",
      slug: "organic-linen-fabric",
      productGroup: "fabric",
    },
  },
  {
    id: "r4",
    name: "Hannah Schmidt",
    city: "Berlin",
    country: "Germany",
    rating: 5,
    createdAt: "18 Mar 2024",
    description:
      "Extremely happy with the custom indigo dyeing batch. Colors are rich and zero bleeding. High ethical standards!",
    link: "https://www.etsy.com/in-en/shop/Anuprerna/reviews",
    productImages: "",
    product: {
      sku: "DYE-IND-012",
      heroImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-4.png",
      slug: "indigo-custom-dyed-fabric",
      productGroup: "fabric",
    },
  },
  {
    id: "r5",
    name: "Chloe Bennett",
    city: "New York",
    country: "United States",
    rating: 5,
    createdAt: "28 Feb 2024",
    description:
      "Ordering fabric swatch bundles made our sourcing selection so easy. Prompt shipping and wonderful team support.",
    link: "https://www.etsy.com/in-en/shop/Anuprerna/reviews",
    productImages:
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/video-thumbnails.png",
    product: {
      sku: "SWT-BND-005",
      heroImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/swatch-bundle-min.jpg",
      slug: "fabric-swatch-bundle",
      productGroup: "swatch",
    },
  },
  {
    id: "r6",
    name: "Kenji Sato",
    city: "Tokyo",
    country: "Japan",
    rating: 5,
    createdAt: "10 Jan 2024",
    description:
      "Superb quality Matka silk and organic cotton. The handloom texture gives our garments a unique artisanal soul.",
    link: "https://www.etsy.com/in-en/shop/Anuprerna/reviews",
    productImages: "",
    product: {
      sku: "SLK-MTK-077",
      heroImage:
        "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/custom-dyeing.png",
      slug: "matka-silk-handloom",
      productGroup: "fabric",
    },
  },
];

export function CustomerTestimonials() {
  const [startIndex, setStartIndex] = useState(0);
  const stars = [0, 1, 2, 3, 4];
  const itemsPerPage = 3;

  const nextSlide = () => {
    setStartIndex((prev) => (prev + 1) % REVIEWS_DATA.length);
  };

  const prevSlide = () => {
    setStartIndex((prev) => (prev - 1 + REVIEWS_DATA.length) % REVIEWS_DATA.length);
  };

  const visibleReviews = [];
  for (let i = 0; i < itemsPerPage; i++) {
    visibleReviews.push(REVIEWS_DATA[(startIndex + i) % REVIEWS_DATA.length]);
  }

  const prepareProductRedirectionUrl = (product: ReviewProduct) => {
    return product.productGroup === "fabric" || product.productGroup === "swatch"
      ? `https://anuprerna.com/product/fabric-product/${product.slug}`
      : `https://anuprerna.com/product/finished-product/${product.slug}`;
  };

  return (
    <section className="fb-home-review w-full flex flex-col justify-center items-center py-10 bg-[#fffcf7]">
      <h2 className="text-3xl sm:text-5xl text-[#7D5B20] font-medium mb-10 text-center px-4">
        Hear from our <span className="text-black">Customers</span>
      </h2>

      <div className="w-full container lg:px-12 relative px-4">
        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#9c8a6c] text-white hover:bg-[#7D5B20] flex items-center justify-center shadow-md transition-all"
        >
          &larr;
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[#9c8a6c] text-white hover:bg-[#7D5B20] flex items-center justify-center shadow-md transition-all"
        >
          &rarr;
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8">
          {visibleReviews.map((review, idx) => (
            <div
              key={`${review.id}-${idx}`}
              className="fb-home-review-card h-[320px] w-full flex flex-col p-3 rounded-md border-2 border-gray-200 relative hover:shadow-lg bg-white"
            >
              {/* Header: Thumbnail & Date */}
              <div className="flex justify-between items-start">
                <div className="img-wrap w-[80px] h-[80px] border border-[#6c5b48] rounded overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      review.productImages && review.productImages !== ""
                        ? review.productImages.split(",")[0]
                        : "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/logo-brown.svg"
                    }
                    alt={review.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <span className="text-xs text-end text-[#7D5B20] font-medium">
                  {review.createdAt}
                </span>
              </div>

              {/* Review Content Description */}
              <div className="fb-home-review-content max-h-[160px] overflow-y-auto my-3 pr-1">
                {review.link ? (
                  <a
                    target="_blank"
                    href={review.link}
                    rel="noreferrer"
                    className="text-sm text-[#7D5B20] block hover:text-[#8d7961] hover:underline"
                  >
                    <q className="italic">{review.description}</q>
                  </a>
                ) : (
                  <p className="text-sm text-[#7D5B20]">
                    <q className="italic">{review.description}</q>
                  </p>
                )}
              </div>

              {/* Rating & Author */}
              <div className="flex flex-col justify-center items-end">
                <div className="flex items-center gap-1">
                  {stars.map((i) => (
                    <span
                      key={i}
                      className={`star ${review.rating > i ? "filled" : ""}`}
                    >
                      &#9733;
                    </span>
                  ))}
                </div>
                <span className="text-[#6c5b48] font-semibold text-sm">
                  {review.name}
                </span>
              </div>
              <p className="text-xs text-end text-[#7D5B20]">
                {review.city ? <span>{review.city}, </span> : ""}
                {review.country}
              </p>

              {/* Product Badge */}
              {review.product && (
                <a
                  target="_blank"
                  href={prepareProductRedirectionUrl(review.product)}
                  rel="noreferrer"
                  className="w-full flex items-center gap-2 mt-auto pt-2 border-t border-gray-100"
                >
                  <div className="img-wrap w-[50px] h-[50px] border border-[#6c5b48] rounded overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={review.product.heroImage}
                      alt={review.product.sku}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-sm text-[#7D5B20] font-medium">
                    {review.product.sku}
                  </span>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
