"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export function StoryDetailPage({ storyId }: { storyId: string }) {
  const [story, setStory] = useState<any>(null);
  const [recommendedStories, setRecommendedStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [storyRes, recRes] = await Promise.all([
          fetch(`/api/stories/${encodeURIComponent(storyId)}`),
          fetch("/api/stories"),
        ]);

        if (isMounted) {
          if (storyRes.ok) {
            const sJson = await storyRes.json();
            if (sJson.story) setStory(sJson.story);
          }
          if (recRes.ok) {
            const rJson = await recRes.json();
            if (rJson.stories) setRecommendedStories(rJson.stories);
          }
        }
      } catch (err) {
        console.error("Failed to load story details:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [storyId]);

  // Handle active section scrolling for TOC
  useEffect(() => {
    const handleScroll = () => {
      const sections = story?.sections || story?.storyContentSectionList;
      if (!sections) return;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(`section-${i}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 180) {
            setActiveSectionId(`section-${i}`);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [story]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[600px] flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#8E7862] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium text-sm">Loading story...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="w-full py-20 text-center flex flex-col items-center gap-4">
        <h2 className="text-2xl font-serif font-bold text-gray-800">Story Not Found</h2>
        <p className="text-gray-500">The craft story you requested could not be found.</p>
        <Link href="/stories" className="bg-[#8E7862] text-white px-6 py-2.5 rounded-lg font-bold">
          Return to Stories
        </Link>
      </div>
    );
  }

  const sections = (story.sections || story.storyContentSectionList || []).sort(
    (a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)
  );

  const relatedStories = recommendedStories
    .filter((s) => (s.storyId || s.id) !== story.id)
    .slice(0, 6);

  const faqList = story.faq?.faqQuestionList || [];

  return (
    <div className="w-full bg-white text-gray-900 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* 3-Column Layout: Left TOC | Center Main Story | Right About Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: TOC (Desktop) */}
          <aside className="hidden lg:block lg:col-span-2 sticky top-24 self-start flex flex-col gap-4 text-xs pr-2">
            <span className="font-bold text-gray-400 uppercase tracking-widest text-[11px] block mb-1">
              ON THIS PAGE
            </span>

            <nav className="flex flex-col gap-2">
              {sections.map((sec: any, i: number) => {
                const heading = sec.heading || sec.title1 || sec.sectionTitle;
                if (!heading) return null;
                const secId = `section-${i}`;
                const isActive = activeSectionId === secId;

                return (
                  <a
                    key={i}
                    href={`#${secId}`}
                    onClick={() => setActiveSectionId(secId)}
                    className={`pl-2 py-1 border-l-2 text-xs transition-colors capitalize line-clamp-2 ${
                      isActive
                        ? "border-[#8E7862] font-bold text-[#7D5B20]"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {heading.toLowerCase()}
                  </a>
                );
              })}

              {faqList.length > 0 && (
                <a
                  href="#faq-section"
                  className={`pl-2 py-1 border-l-2 text-xs transition-colors capitalize ${
                    activeSectionId === "faq-section"
                      ? "border-[#8E7862] font-bold text-[#7D5B20]"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {story.faq?.heading?.toLowerCase() || "related questions"}
                </a>
              )}
            </nav>

            <Link
              href="/products/fabric"
              className="mt-4 border-2 border-[#8E7862] text-[#8E7862] font-bold px-3 py-2 rounded-lg text-[11px] text-center hover:bg-[#fcf4e8] transition-colors capitalize block"
            >
              {story.title} Products
            </Link>
          </aside>

          {/* Center Column: Main Story Content */}
          <main className="lg:col-span-7 flex flex-col gap-8">
            {/* Top Large Banner */}
            {(story.bannerImageDesktop || story.heroImage) && (
              <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/60 shadow-sm">
                <img
                  src={story.bannerImageDesktop || story.heroImage}
                  alt={story.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Story Title & Author/Metadata Box */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 leading-tight">
                {story.title}
              </h1>

              {/* Published Metadata Box */}
              <div className="flex items-center gap-3 bg-[#fdfbf7] border border-[#8E7862]/30 p-3 rounded-xl shrink-0 self-start">
                <div className="w-10 h-10 rounded-lg bg-[#dfd0bb] flex justify-center items-center font-serif font-bold text-[#7D5B20] text-lg">
                  A
                </div>
                <div className="text-[11px] text-gray-600 flex flex-col gap-0.5">
                  <span className="font-bold text-gray-900 capitalize">
                    {story.storyContentCategory?.name || story.category || "Craft Story"}
                  </span>
                  <span>Published on {story.timeOfCreation ? new Date(story.timeOfCreation).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Recent"}</span>
                  <span className="font-bold text-[#7D5B20]">Reading Time: {story.readingTime || 2} Minute Read</span>
                </div>
              </div>
            </div>

            {/* Story Lead Overview */}
            {story.description && (
              <div
                className="text-base text-gray-700 leading-relaxed font-serif"
                dangerouslySetInnerHTML={{ __html: story.description }}
              />
            )}

            {/* Story Sections Grid */}
            <div className="flex flex-col gap-12 mt-4">
              {sections.map((template: any, i: number) => {
                const heading = template.heading || template.title1;
                const templateType = template.templateType || 8;

                return (
                  <section key={i} id={`section-${i}`} className="flex flex-col gap-4 scroll-mt-28">
                    {heading && (
                      <h2 className="text-2xl font-serif font-bold text-gray-900 text-center mb-2">
                        {heading}
                      </h2>
                    )}

                    {/* Template Type 1: Image Left, Text Right */}
                    {templateType === 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        {template.image1 && (
                          <div className="rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                            <img src={template.image1} alt="" className="w-full h-auto object-cover" />
                            {template.caption1 && (
                              <p className="text-xs text-gray-500 italic p-2 text-center bg-gray-50">
                                {template.caption1}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex flex-col gap-2 text-sm text-gray-700 leading-relaxed">
                          {template.title1 && <h4 className="font-bold text-gray-900">{template.title1}</h4>}
                          <div dangerouslySetInnerHTML={{ __html: template.paragraph1 || "" }} />
                        </div>
                      </div>
                    )}

                    {/* Template Type 2: Text Left, Image Right */}
                    {templateType === 2 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="flex flex-col gap-2 text-sm text-gray-700 leading-relaxed">
                          {template.title1 && <h4 className="font-bold text-gray-900">{template.title1}</h4>}
                          <div dangerouslySetInnerHTML={{ __html: template.paragraph1 || "" }} />
                        </div>
                        {template.image1 && (
                          <div className="rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                            <img src={template.image1} alt="" className="w-full h-auto object-cover" />
                            {template.caption1 && (
                              <p className="text-xs text-gray-500 italic p-2 text-center bg-gray-50">
                                {template.caption1}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Template Type 5: 2 Text Columns */}
                    {templateType === 5 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700 leading-relaxed">
                        <div>
                          {template.title1 && <h4 className="font-bold text-gray-900 mb-1">{template.title1}</h4>}
                          <div dangerouslySetInnerHTML={{ __html: template.paragraph1 || "" }} />
                        </div>
                        <div>
                          {template.title2 && <h4 className="font-bold text-gray-900 mb-1">{template.title2}</h4>}
                          <div dangerouslySetInnerHTML={{ __html: template.paragraph2 || "" }} />
                        </div>
                      </div>
                    )}

                    {/* Template Type 6: 2 Image Columns */}
                    {templateType === 6 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {template.image1 && (
                          <div className="rounded-xl overflow-hidden border border-gray-200">
                            <img src={template.image1} alt="" className="w-full h-auto object-cover" />
                          </div>
                        )}
                        {template.image2 && (
                          <div className="rounded-xl overflow-hidden border border-gray-200">
                            <img src={template.image2} alt="" className="w-full h-auto object-cover" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Template Type 8 or Default: Full Width Text */}
                    {(templateType === 8 || (templateType !== 1 && templateType !== 2 && templateType !== 5 && templateType !== 6)) && (
                      <div className="flex flex-col gap-3 text-sm text-gray-700 leading-relaxed">
                        {template.image1 && (
                          <div className="w-full rounded-xl overflow-hidden border border-gray-200 my-2">
                            <img src={template.image1} alt="" className="w-full h-auto object-cover" />
                          </div>
                        )}
                        {template.title1 && <h4 className="font-bold text-gray-900 text-base">{template.title1}</h4>}
                        {template.paragraph1 && <div dangerouslySetInnerHTML={{ __html: template.paragraph1 }} />}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            {/* FAQs Accordion Section */}
            {faqList.length > 0 && (
              <div id="faq-section" className="mt-12 pt-8 border-t border-gray-200 scroll-mt-28">
                <h3 className="font-serif font-bold text-2xl text-gray-900 text-center mb-8">
                  {story.faq?.heading || "Related Questions"}
                </h3>

                <div className="flex flex-col gap-3">
                  {faqList.map((faq: any, fIdx: number) => {
                    const isOpen = openFaqIndex === fIdx;
                    return (
                      <div
                        key={fIdx}
                        className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : fIdx)}
                          className="w-full p-4 text-left flex justify-between items-center gap-3 font-bold text-sm text-gray-900 hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex justify-center items-center shrink-0">
                              ?
                            </div>
                            <span>{faq.question}</span>
                          </div>
                          <span className="material-symbols-outlined text-gray-500 transition-transform">
                            {isOpen ? "expand_less" : "expand_more"}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-5 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-100 bg-[#FAF7F2]">
                            <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* More Stories Grid */}
            {relatedStories.length > 0 && (
              <div className="mt-16 pt-10 border-t border-gray-200">
                <h3 className="font-serif font-bold text-2xl text-gray-900 text-center mb-8">
                  More Stories
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {relatedStories.slice(0, 6).map((rel: any, rIdx: number) => (
                    <Link
                      key={rIdx}
                      href={`/stories/${rel.slug}/${rel.storyId || rel.id}`}
                      className="bg-[#FAF7F2] border border-amber-100/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
                        <img
                          src={rel.heroImage || rel.bannerImageMobile || "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80"}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4 flex flex-col gap-1.5">
                        <h4 className="font-serif font-bold text-base text-gray-900 leading-snug group-hover:text-[#8E7862] transition-colors">
                          {rel.title}
                        </h4>
                        <span className="text-[11px] text-gray-400 font-medium">
                          Published on {rel.timeOfCreation ? new Date(rel.timeOfCreation).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Recent"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Right Column: About Us & Related Stories Sidebar (Desktop) */}
          <aside className="hidden lg:flex lg:col-span-3 flex-col gap-8 sticky top-24 self-start">
            {/* About Us Card */}
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-amber-100/60 shadow-sm flex flex-col gap-3">
              <img
                src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-1.png"
                alt="About Anuprerna"
                className="w-full aspect-[4/3] object-cover rounded-xl border border-gray-200"
              />
              <h3 className="font-serif font-bold text-lg text-[#7D5B20]">About Us</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Discover Anuprerna&apos;s sustainable handloom fabrics crafted by 300+ skilled artisans in East India. We also offer low MOQ custom manufacturing of apparel, stoles, scarves, handbags, and home furnishings in organic khadi, cotton, linen, wool, bamboo, mulberry, ahimsa silk and more.
              </p>
              <Link
                href="/content/about-us/about-our-impact/57938"
                className="bg-white border-2 border-[#8E7862] text-[#8E7862] font-bold py-2 px-4 rounded-lg text-xs hover:bg-[#fcf4e8] transition-colors text-center self-start mt-1"
              >
                Discover Our Impact
              </Link>
            </div>

            {/* Related Stories List */}
            {relatedStories.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="font-serif font-bold text-lg text-[#7D5B20]">Related Stories</h3>
                <div className="flex flex-col gap-2">
                  {relatedStories.map((rel: any, idx: number) => (
                    <Link
                      key={idx}
                      href={`/stories/${rel.slug}/${rel.storyId || rel.id}`}
                      className="flex items-start gap-1.5 text-xs text-gray-700 hover:text-[#8E7862] hover:underline font-medium group"
                    >
                      <span className="text-[#7D5B20] font-bold">&gt;</span>
                      <span className="capitalize">{rel.title.toLowerCase()}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
