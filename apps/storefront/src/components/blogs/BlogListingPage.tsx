"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export function BlogListingPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadBlogs() {
      try {
        const res = await fetch("/api/blogs");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (isMounted) {
          setBlogs(json.blogs || []);
        }
      } catch (err) {
        console.error("Failed to load blogs:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadBlogs();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBlogs = blogs
    .filter((blog) => {
      const title = (blog.title || "").toLowerCase();
      if (title.includes("test story") || !blog.title?.trim()) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        title.includes(q) ||
        (blog.description || "").toLowerCase().includes(q) ||
        (blog.slug || "").toLowerCase().includes(q)
      );
    });

  return (
    <div className="w-full bg-white text-gray-900 pb-20">
      {/* Hero Header */}
      <section className="w-full bg-[#fdfbf7] py-16 px-4 border-b border-[#EFEEE9] text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8E7862] bg-[#fcf4e8] px-3.5 py-1 rounded-full">
            Journal &amp; Insights
          </span>
          <h1 className="text-4xl sm:text-6xl font-serif text-[#7D5B20] font-semibold mt-4 mb-3">
            Anuprerna Journal
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-600 leading-relaxed">
            Discover articles on natural dyeing techniques, sustainable fashion sourcing, organic textiles, and artisan stories.
          </p>

          {/* Search Filter Bar */}
          <div className="w-full max-w-md mt-6">
            <div className="relative flex items-center shadow-sm rounded-full overflow-hidden border-2 border-[#8E7862]">
              <span className="material-symbols-outlined absolute left-4 text-gray-400">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles by keyword..."
                className="w-full py-2.5 pl-11 pr-4 text-sm focus:outline-none bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 text-xs text-gray-400 hover:text-gray-900 font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Blogs Grid */}
      <div className="max-w-[1290px] mx-auto px-4 mt-12">
        {isLoading ? (
          <div className="w-full py-20 flex flex-col justify-center items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#8E7862] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-medium text-sm">Loading articles...</p>
          </div>
        ) : filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog, idx) => {
              const blogId = blog.id || blog.blogId;
              const imageUrl =
                blog.bannerImageDesktop ||
                blog.bannerImageMobile ||
                blog.bannerImageParallax ||
                blog.heroImage ||
                blog.bannerImage ||
                "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80";

              return (
                <Link
                  key={blogId || idx}
                  href={`/stories/${blog.slug || "story"}/${blogId}`}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden relative bg-gray-100">
                    <img
                      src={imageUrl}
                      alt={blog.title || "Article"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <span className="absolute top-3 left-3 text-[10px] uppercase font-bold text-white bg-emerald-800/80 backdrop-blur px-2.5 py-1 rounded-full">
                      Article
                    </span>
                    {blog.readingTime && (
                      <span className="absolute top-3 right-3 text-[10px] font-semibold text-gray-800 bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow-xs">
                        {blog.readingTime} min read
                      </span>
                    )}
                  </div>

                  <div className="p-6 flex flex-col justify-between flex-1 gap-3">
                    <div>
                      <h2 className="font-serif font-bold text-lg text-gray-900 leading-snug group-hover:text-[#8E7862] transition-colors line-clamp-2 uppercase">
                        {blog.title}
                      </h2>
                      {blog.description && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                          {blog.description.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ")}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs font-semibold text-[#8E7862] pt-4 border-t border-gray-100 mt-2">
                      <span>Read Article &rarr;</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="w-full py-16 text-center text-gray-500">
            No articles found matching &quot;{searchQuery}&quot;.
          </div>
        )}
      </div>
    </div>
  );
}
