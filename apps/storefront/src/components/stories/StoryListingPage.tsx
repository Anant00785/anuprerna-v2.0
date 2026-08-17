"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function StoryListingContent() {
  const searchParams = useSearchParams();
  const [stories, setStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Sync activeTab with URL category query param
  useEffect(() => {
    const cat = searchParams.get("category") || searchParams.get("storyCategoryName") || "all";
    const lower = cat.toLowerCase().trim();
    if (lower.includes("craft")) {
      setActiveTab("craft");
    } else if (lower.includes("collab") || lower.includes("designer")) {
      setActiveTab("collaboration");
    } else if (lower.includes("cluster") || lower.includes("print") || lower.includes("embroidery")) {
      setActiveTab("cluster");
    } else if (lower === "all") {
      setActiveTab("all");
    } else {
      setActiveTab(lower);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    async function loadStories() {
      try {
        const res = await fetch("/api/stories");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (isMounted) {
          setStories(json.stories || []);
        }
      } catch (err) {
        console.error("Failed to load stories:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadStories();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStories = stories.filter((story) => {
    if (activeTab === "all") return true;
    const cat = (story.storyCategoryName || story.category || "").toLowerCase();
    return cat.includes(activeTab);
  });

  return (
    <div className="w-full bg-white text-gray-900 pb-20">
      {/* Hero Header */}
      <section className="w-full bg-[#fdfbf7] py-16 px-4 border-b border-[#EFEEE9] text-center">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8E7862] bg-[#fcf4e8] px-3 py-1 rounded-full">
            Artisan Heritage & Crafts
          </span>
          <h1 className="text-4xl sm:text-6xl font-serif text-[#7D5B20] font-semibold mt-4 mb-3">
            Our Stories & Collaborations
          </h1>
          <p className="max-w-2xl mx-auto text-base md:text-lg text-gray-600 leading-relaxed">
            Explore the rich heritage of Bengal handloom weavers, sustainable dye houses, and bespoke brand collaborations.
          </p>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
            {[
              { id: "all", label: "All Stories" },
              { id: "craft", label: "Crafts" },
              { id: "collaboration", label: "Collaborations" },
              { id: "cluster", label: "Clusters" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs md:text-sm font-semibold px-5 py-2 rounded-full border transition-all ${
                  activeTab === tab.id
                    ? "bg-[#8E7862] text-white border-[#8E7862] shadow-sm"
                    : "bg-[#fffcf7] text-[#302e2e] border-gray-200 hover:border-[#8E7862]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stories Grid */}
      <div className="max-w-[1290px] mx-auto px-4 mt-12">
        {isLoading ? (
          <div className="w-full py-20 flex flex-col justify-center items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#8E7862] border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 font-medium text-sm">Loading craft stories...</p>
          </div>
        ) : filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStories.map((story, idx) => {
              const storyId = story.storyId || story.id;
              const imageUrl =
                story.heroImage || story.bannerImageMobile || story.bannerImage || "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80";

              return (
                <Link
                  key={storyId || idx}
                  href={`/stories/${story.slug}/${storyId}`}
                  className="bg-[#FAF7F2] border border-amber-100/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden relative bg-gray-100">
                    <img
                      src={imageUrl}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {story.storyCategoryName && (
                      <span className="absolute top-3 left-3 text-[10px] uppercase font-bold text-white bg-black/60 backdrop-blur px-2.5 py-1 rounded-full">
                        {story.storyCategoryName}
                      </span>
                    )}
                  </div>

                  <div className="p-6 flex flex-col justify-between flex-1 gap-3">
                    <div>
                      <h2 className="font-serif font-bold text-xl text-gray-900 leading-snug group-hover:text-[#8E7862] transition-colors">
                        {story.title}
                      </h2>
                      {story.subTitle && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                          {story.subTitle}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs font-semibold text-[#7D5B20] pt-4 border-t border-gray-200/60 mt-2">
                      <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Read Full Story &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="w-full py-16 text-center text-gray-500">
            No stories found under this category.
          </div>
        )}
      </div>
    </div>
  );
}

export function StoryListingPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[400px] flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-[#8E7862] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <StoryListingContent />
    </Suspense>
  );
}
