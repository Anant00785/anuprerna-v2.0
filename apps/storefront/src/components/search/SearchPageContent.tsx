"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PLPProduct } from "@/types/domain/plp";
import { FilterProductPreview } from "@/components/plp/FilterProductPreview";
import { FilterProductSkeleton } from "@/components/plp/FilterProductSkeleton";
import { calculateProductPrice } from "@/lib/plp/filter-engine";

const MOST_SEARCHED = ["Khadi", "Jamdani", "Denim", "Silk"];

const FEATURED_CATEGORIES = [
  {
    title: "Organic Khadi Cotton",
    img: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/ZWADZPMYSPI8Q00OID5TIASCOG3502523.jpg",
    link: "/products/fabric?segment_category=organic-and-natural",
  },
  {
    title: "Jamdani Loom Embroidery",
    img: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/PENTN7FGNSWP4W6PW254LI6JXG8907796.jpg",
    link: "/products/fabric?embroidery-technique=jamdani-loom-embroidery",
  },
  {
    title: "Indian Premium Silk",
    img: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/KY57BIHN7AX260C568Y557C5NFF804241.jpg",
    link: "/products/fabric?indian-premium-silk=mulberry-silk",
  },
];

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("search") || searchParams.get("q") || "";

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [products, setProducts] = useState<PLPProduct[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [displayCount, setDisplayCount] = useState(8);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recentSearched");
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      }
    } catch (e) {
      console.warn("Failed to load recent searches:", e);
    }
  }, []);

  // Save to recent searches
  const saveRecentSearch = (term: string) => {
    if (!term || term.trim().length < 2) return;
    try {
      const cleanTerm = term.trim();
      const updated = [cleanTerm, ...recentSearches.filter((s) => s !== cleanTerm)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("recentSearched", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save recent search:", e);
    }
  };

  // Perform search
  const executeSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      setStories([]);
      setBlogs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error(`Search HTTP ${res.status}`);
      const data = await res.json();
      const mappedProducts = (data.products || []).map(calculateProductPrice);
      setProducts(mappedProducts);
      setStories(data.stories || []);
      setBlogs(data.blogs || []);
    } catch (err) {
      console.error("Search failed:", err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-sync activeQuery with URL parameter when searchParams change
  useEffect(() => {
    const queryFromUrl = searchParams.get("search") || searchParams.get("q") || "";
    if (queryFromUrl && queryFromUrl !== activeQuery) {
      setSearchTerm(queryFromUrl);
      setActiveQuery(queryFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeQuery) {
      executeSearch(activeQuery);
      saveRecentSearch(activeQuery);
    }
  }, [activeQuery, executeSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setActiveQuery(searchTerm.trim());
      setDisplayCount(8);
      router.push(`/display/search?search=${encodeURIComponent(searchTerm.trim())}`, {
        scroll: false,
      });
    }
  };

  const handleSelectKeyword = (keyword: string) => {
    setSearchTerm(keyword);
    setActiveQuery(keyword);
    setDisplayCount(8);
    router.push(`/display/search?search=${encodeURIComponent(keyword)}`, { scroll: false });
  };

  const displayedProducts = products.slice(0, displayCount);

  return (
    <section className="w-full flex flex-col justify-start items-center min-h-[70vh] px-4 py-8 max-w-[1300px] mx-auto">
      {/* Search Input Bar */}
      <div className="w-full max-w-2xl flex flex-col items-center mt-4">
        <form onSubmit={handleSubmit} className="w-full flex items-center shadow-md rounded-lg overflow-hidden border-2 border-[#D4A373]">
          <div className="pl-4 pr-2 text-gray-500 flex items-center">
            <span className="material-symbols-outlined text-2xl text-[#8E7862]">search</span>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search keyword, color or fabric"
            className="w-full py-3 px-2 text-base text-gray-900 focus:outline-none placeholder-gray-400 font-sans"
            autoFocus
          />
          <button
            type="submit"
            className="bg-[#D4A373] hover:bg-[#c39262] text-white font-bold py-3 px-6 text-sm transition-colors uppercase tracking-wider shrink-0"
          >
            Search
          </button>
        </form>

        {/* Most Searched Keyword Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <span className="text-xs text-gray-400 mr-1">Trending:</span>
          {MOST_SEARCHED.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => handleSelectKeyword(kw)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                activeQuery.toLowerCase() === kw.toLowerCase()
                  ? "bg-[#8E7862] text-white border-[#8E7862] font-semibold"
                  : "bg-[#fffcf7] text-[#302e2e] border-gray-200 hover:border-[#8E7862]"
              }`}
            >
              {kw}
            </button>
          ))}
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="flex flex-col items-center mt-3">
            <span className="text-xs text-gray-400 mb-1.5">Recent Searches</span>
            <div className="flex flex-wrap justify-center items-center gap-2">
              {recentSearches.map((kw, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectKeyword(kw)}
                  className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-[#fcf4e8] transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3 Featured Category Circle Cards */}
        {!activeQuery && (
          <div className="grid grid-cols-3 gap-6 mt-8 text-center">
            {FEATURED_CATEGORIES.map((cat, idx) => (
              <Link key={idx} href={cat.link} className="flex flex-col items-center group">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-[#D4A373]/40 shadow-sm group-hover:scale-105 transition-transform">
                  <img src={cat.img} alt={cat.title} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-gray-700 font-medium mt-2 leading-tight group-hover:text-[#8E7862] transition-colors">
                  {cat.title}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Search Results Section */}
      {activeQuery && (
        <div className="w-full mt-10">
          <div className="mb-6 pb-2 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-serif text-xl md:text-2xl text-[#302e2e]">
              Search Results for <span className="text-[#8E7862] font-semibold">&quot;{activeQuery}&quot;</span>
            </h2>
            <span className="text-xs text-gray-500 font-medium">{products.length} items found</span>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <FilterProductSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Product Cards Grid */}
          {!isLoading && displayedProducts.length > 0 && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {displayedProducts.map((prod, idx) => (
                  <FilterProductPreview key={prod.id || idx} product={prod} />
                ))}
              </div>

              {/* View More Products Button */}
              {displayCount < products.length && (
                <div className="w-full flex justify-center items-center mt-8">
                  <button
                    type="button"
                    onClick={() => setDisplayCount((prev) => prev + 8)}
                    className="text-xs md:text-sm rounded text-[#7D5B20] font-semibold border-2 border-[#8E7862] py-2 px-6 hover:bg-[#fffcf7] transition-colors flex items-center gap-2"
                  >
                    <span>View More Products</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty Product Search Results */}
          {!isLoading && products.length === 0 && (
            <div className="w-full py-12 flex flex-col justify-center items-center gap-3">
              <img
                src="/assets/img/noproduct_placehlder.png"
                alt="No products found"
                className="w-48 h-48 object-contain"
              />
              <p className="text-gray-500 font-medium text-sm">
                No products found matching &quot;{activeQuery}&quot;
              </p>
            </div>
          )}

          {/* Matching Stories & Blogs Section */}
          {!isLoading && (stories.length > 0 || blogs.length > 0) && (
            <div className="w-full mt-12 pt-8 border-t border-gray-200">
              <h3 className="font-serif text-xl text-[#302e2e] mb-6">
                Craft Stories & Articles matching &quot;{activeQuery}&quot;
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stories.map((story, sIdx) => (
                  <Link
                    key={sIdx}
                    href={`/stories/${story.slug}/${story.storyId || story.id}`}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-gray-100">
                      <img
                        src={story.heroImage || story.bannerImageMobile}
                        alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-4">
                      <span className="text-[10px] uppercase font-bold text-[#8E7862] tracking-wider">
                        Story
                      </span>
                      <h4 className="font-bold text-sm text-gray-900 mt-1 line-clamp-2">
                        {story.title}
                      </h4>
                    </div>
                  </Link>
                ))}

                {blogs.map((blog, bIdx) => (
                  <Link
                    key={bIdx}
                    href={`/content/${blog.contentType || "wholesale"}/${blog.slug}/${blog.blogId || blog.id}`}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-gray-100">
                      <img
                        src={blog.heroImage || blog.bannerImageMobile}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-4">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                        Article
                      </span>
                      <h4 className="font-bold text-sm text-gray-900 mt-1 line-clamp-2">
                        {blog.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function SearchPageContent() {
  return (
    <Suspense fallback={<div className="w-full min-h-[600px] flex justify-center items-center">Loading...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}
