"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface SectionItem {
  id?: number;
  sortOrder?: number;
  templateType?: number;
  heading?: string;
  title1?: string;
  title2?: string;
  paragraph1?: string;
  paragraph2?: string;
  image1?: string;
  image2?: string;
  image1Alt?: string;
  image2Alt?: string;
  image1Link?: string;
  image2Link?: string;
  caption1?: string;
  caption2?: string;
  video1?: string;
  video2?: string;
  ctaButtonName1?: string;
  ctaButtonName2?: string;
  ctaLink1?: string;
  ctaLink2?: string;
}

interface FaqQuestion {
  id?: number;
  question: string;
  answer: string;
}

interface FaqData {
  heading: string;
  faqQuestionList: FaqQuestion[];
}

interface ContentPreviewItem {
  id: number;
  title: string;
  slug: string;
  bannerImageMobile?: string;
}

interface BlogDetails {
  id: number;
  title: string;
  description?: string;
  readingTime?: number;
  timeOfCreation?: number;
  lastUpdateTime?: number;
  bannerImageDesktop?: string;
  bannerImageMobile?: string;
  slug?: string;
  blogContentCategory?: {
    name: string;
    blogContentType?: {
      name: string;
    };
  };
  blogContentSectionList?: SectionItem[];
  faq?: FaqData;
  nextBlogDetails?: ContentPreviewItem;
  previousBlogDetails?: ContentPreviewItem;
}

function formatDate(timestamp?: number): string {
  if (!timestamp) return "11th Oct, 2023";
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CustomContentPage({ blogId }: { blogId: string }) {
  const [blogDetails, setBlogDetails] = useState<BlogDetails | null>(null);
  const [recommendedList, setRecommendedList] = useState<ContentPreviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active TOC Section
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  // FAQ Accordion Open State (index of open question)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadContent() {
      try {
        const res = await fetch(`/api/content/${encodeURIComponent(blogId)}`);
        if (!res.ok) throw new Error(`Content HTTP ${res.status}`);
        const json = await res.json();
        if (isMounted && json.data) {
          setBlogDetails(json.data);
        }
      } catch (err) {
        console.error("Failed to load custom content:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadContent();
    return () => {
      isMounted = false;
    };
  }, [blogId]);

  // ScrollSpy to highlight active section in TOC
  useEffect(() => {
    if (!blogDetails) return;

    const handleScroll = () => {
      const sections = document.querySelectorAll("[id^='section-'], #faq-header");
      let currentId = "";

      sections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= 160) {
          currentId = sec.id;
        }
      });

      if (currentId) {
        setActiveSectionId(currentId);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [blogDetails]);

  if (isLoading) {
    return (
      <div className="w-full min-h-[700px] flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#8E7862] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium text-sm">Loading content details...</p>
      </div>
    );
  }

  if (!blogDetails) {
    return (
      <div className="w-full py-24 text-center flex flex-col items-center gap-4">
        <h2 className="text-2xl font-serif font-bold text-gray-800">Content Page Not Found</h2>
        <p className="text-gray-500">The content page you requested could not be found.</p>
        <Link href="/" className="bg-[#8E7862] text-white px-6 py-2.5 rounded-lg font-bold">
          Return to Home
        </Link>
      </div>
    );
  }

  const rawSections = blogDetails.blogContentSectionList || [];
  const sections = [...rawSections].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const bannerImg = blogDetails.bannerImageMobile || blogDetails.bannerImageDesktop;
  const categoryName = blogDetails.blogContentCategory?.name || "ANUPRERNA - IN A NUTSHELL";

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const topOffset = el.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({ top: topOffset, behavior: "smooth" });
    }
  };

  return (
    <section className="w-full flex justify-center items-center bg-white text-[#1f1f1f] fb-font-inter">
      <div className="max-w-[1290px] w-full px-4 md:px-6 my-6 md:my-16 flex flex-col md:flex-row justify-between items-start gap-8 relative min-h-screen">

        {/* LEFT COLUMN: Table of Contents (ON THIS PAGE) */}
        <aside className="hidden lg:flex lg:w-[220px] shrink-0 sticky top-[100px] self-start flex-col items-start text-xs">
          <div className="uppercase text-slate-400 font-bold tracking-wider pl-5 mb-3">
            ON THIS PAGE
          </div>
          <div className="border-l border-slate-200 flex flex-col items-start w-full text-[13px] leading-snug font-medium">
            {sections.map((sec, i) => {
              const secId = `section-${i}`;
              const label = sec.heading || sec.title1 || `Section ${i + 1}`;
              const isSelected = activeSectionId === secId;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => scrollToSection(secId)}
                  className={`w-full text-left py-1.5 pl-5 pr-2 transition-colors duration-100 capitalize line-clamp-2 ${isSelected
                    ? "text-[#7d5b1f] font-semibold relative before:absolute before:-left-[1px] before:top-1.5 before:bottom-1.5 before:w-[2px] before:bg-[#7d5b1f]"
                    : "text-slate-600 hover:text-[#7d5b1f]"
                    }`}
                >
                  {label.toLowerCase()}
                </button>
              );
            })}

            {blogDetails.faq && (
              <button
                type="button"
                onClick={() => scrollToSection("faq-header")}
                className={`w-full text-left py-1.5 pl-5 pr-2 transition-colors duration-100 capitalize line-clamp-2 ${activeSectionId === "faq-header"
                  ? "text-[#7d5b1f] font-semibold relative before:absolute before:-left-[1px] before:top-1.5 before:bottom-1.5 before:w-[2px] before:bg-[#7d5b1f]"
                  : "text-slate-600 hover:text-[#7d5b1f]"
                  }`}
              >
                {(blogDetails.faq.heading || "Continuous Impact Improvement Areas").toLowerCase()}
              </button>
            )}
          </div>
        </aside>

        {/* CENTER COLUMN: Main Content Article */}
        <main className="flex-1 w-full max-w-[839px] px-2 md:px-4 flex flex-col text-[#1f1f1f]">
          {/* Banner Hero Image */}
          {bannerImg && (
            <img
              src={bannerImg}
              alt={blogDetails.title}
              className="rounded-lg mb-4 max-h-[250px] object-cover aspect-video w-full shadow-xs border border-gray-100"
            />
          )}

          {/* Main Title */}
          <h1 className="fb-font-dm font-medium text-2xl md:text-3xl text-[#1f1f1f] leading-tight mb-4">
            {blogDetails.title}
          </h1>

          {/* Author & Publication Meta Block */}
          <div className="w-full flex justify-start items-center gap-3 mb-6 border-b border-gray-100 pb-4">
            <div className="bg-[#dfd0bb] p-2 rounded-md w-10 h-10 flex justify-center items-center shrink-0">
              <span className="font-serif font-bold text-lg text-[#1f1f1f]">A</span>
            </div>
            <div className="text-xs text-[#6B7280] leading-tight flex flex-col gap-0.5">
              <div className="text-sm font-bold text-[#1f1f1f] capitalize">{categoryName.toLowerCase()}</div>
              <div>Published on {formatDate(blogDetails.timeOfCreation)}</div>
              <div>Last Edited on {formatDate(blogDetails.lastUpdateTime || blogDetails.timeOfCreation)}</div>
              <div className="font-semibold text-[#7d5b1f]">
                Reading Time: {blogDetails.readingTime || 3} Minute Read
              </div>
            </div>
          </div>

          {/* Article Description / Lead Paragraph */}
          {blogDetails.description && (
            <div
              className="text-sm md:text-base text-[#3c3c3c] leading-relaxed my-4 prose prose-stone max-w-none border-b border-gray-100 pb-6"
              dangerouslySetInnerHTML={{ __html: blogDetails.description }}
            />
          )}

          {/* Section Templates Loop */}
          {sections.map((template, i) => {
            const secId = `section-${i}`;
            const tType = template.templateType || 1;

            return (
              <div key={i} className="my-8 border-b border-gray-100 pb-8 last:border-0">
                {/* Section Heading */}
                {template.heading && (
                  <h3 id={secId} className="fb-font-dm text-xl md:text-2xl font-medium text-[#1f1f1f] mb-4">
                    {template.heading}
                  </h3>
                )}

                {/* Template Type 1: Image Left, Text Right */}
                {tType === 1 && (
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mt-4">
                    {template.image1 && (
                      <div className="flex flex-col justify-center items-center lg:w-[48%] shrink-0">
                        <img
                          src={template.image1}
                          alt={template.image1Alt || template.heading || ""}
                          className="object-cover w-full h-auto rounded-md max-h-[450px]"
                        />
                        {template.caption1 && (
                          <div className="text-[#948467] mt-1.5 text-xs font-medium text-center">
                            {template.caption1}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1">
                      {template.title1 && <h4 className="font-bold text-base text-[#1f1f1f] mb-2">{template.title1}</h4>}
                      {template.paragraph1 && (
                        <div
                          className="text-sm text-[#3c3c3c] leading-relaxed prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: template.paragraph1 }}
                        />
                      )}
                      {template.ctaLink1 && (
                        <a
                          href={template.ctaLink1}
                          target="_blank"
                          rel="noreferrer"
                          className="w-max capitalize bg-[#fffcf7] hover:bg-white hover:shadow-md rounded md:rounded-md border-2 border-[#8E7862] text-[#8E7862] py-1.5 px-4 text-xs font-bold transition-all flex items-center gap-2 mt-4"
                        >
                          {template.ctaButtonName1 || "Discover More"}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Template Type 2: Text Left, Image Right */}
                {tType === 2 && (
                  <div className="flex flex-col-reverse lg:flex-row justify-between items-start gap-6 mt-4">
                    <div className="flex-1">
                      {template.title1 && <h4 className="font-bold text-base text-[#1f1f1f] mb-2">{template.title1}</h4>}
                      {template.paragraph1 && (
                        <div
                          className="text-sm text-[#3c3c3c] leading-relaxed prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: template.paragraph1 }}
                        />
                      )}
                      {template.ctaLink1 && (
                        <a
                          href={template.ctaLink1}
                          target="_blank"
                          rel="noreferrer"
                          className="w-max capitalize bg-[#fffcf7] hover:bg-white hover:shadow-md rounded md:rounded-md border-2 border-[#8E7862] text-[#8E7862] py-1.5 px-4 text-xs font-bold transition-all flex items-center gap-2 mt-4"
                        >
                          {template.ctaButtonName1 || "Discover More"}
                        </a>
                      )}
                    </div>
                    {template.image1 && (
                      <div className="flex flex-col justify-center items-center lg:w-[48%] shrink-0">
                        <img
                          src={template.image1}
                          alt={template.image1Alt || template.heading || ""}
                          className="object-cover w-full h-auto rounded-md max-h-[450px]"
                        />
                        {template.caption1 && (
                          <div className="text-[#948467] mt-1.5 text-xs font-medium text-center">
                            {template.caption1}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Fallback / Other Template Types (3 to 10) */}
                {tType >= 3 && (
                  <div className="flex flex-col gap-4 mt-4">
                    {template.title1 && <h4 className="font-bold text-base text-[#1f1f1f]">{template.title1}</h4>}
                    {template.image1 && (
                      <div className="w-full rounded-lg overflow-hidden my-2">
                        <img
                          src={template.image1}
                          alt={template.image1Alt || ""}
                          className="w-full h-auto object-cover max-h-[450px] rounded-md"
                        />
                        {template.caption1 && (
                          <div className="text-[#948467] mt-1 text-xs text-center">{template.caption1}</div>
                        )}
                      </div>
                    )}
                    {template.paragraph1 && (
                      <div
                        className="text-sm text-[#3c3c3c] leading-relaxed prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: template.paragraph1 }}
                      />
                    )}
                    {template.ctaLink1 && (
                      <a
                        href={template.ctaLink1}
                        target="_blank"
                        rel="noreferrer"
                        className="w-max capitalize bg-[#fffcf7] hover:bg-white hover:shadow-md rounded md:rounded-md border-2 border-[#8E7862] text-[#8E7862] py-1.5 px-4 text-xs font-bold transition-all flex items-center gap-2 mt-2"
                      >
                        {template.ctaButtonName1 || "Discover More"}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* FAQ Accordion Section (Continuous Impact Improvement Areas) */}
          {blogDetails.faq && (
            <div className="mt-12 pt-6 border-t border-gray-100">
              <h3 id="faq-header" className="fb-font-dm text-xl md:text-2xl font-medium text-[#1f1f1f] mb-6 capitalize">
                {(blogDetails.faq.heading || "Continuous Impact Improvement Areas").toLowerCase()}
              </h3>

              <div className="flex flex-col gap-3 w-full">
                {blogDetails.faq.faqQuestionList?.map((qItem, qIdx) => {
                  const isOpen = openFaqIndex === qIdx;
                  return (
                    <div
                      key={qItem.id || qIdx}
                      className="w-full bg-[#FAF9F6] border border-[#EFEEE9] rounded-lg p-3 md:p-4 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : qIdx)}
                        className="w-full flex justify-between items-center gap-3 text-left font-bold text-sm md:text-base text-[#1f1f1f] hover:text-[#7d5b1f] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-200/80 p-2 rounded-md text-gray-700 flex justify-center items-center shrink-0">
                            <span className="material-symbols-outlined text-lg">live_help</span>
                          </div>
                          <span>{qItem.question}</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-500 shrink-0">
                          {isOpen ? "arrow_drop_up" : "arrow_drop_down"}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="mt-3 pt-3 border-t border-gray-200/60 text-xs md:text-sm text-[#3c3c3c] leading-relaxed pl-12 animate-in fade-in duration-150">
                          <p>{qItem.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* More Blogs Section */}
          <div className="mt-14 pt-8 border-t border-gray-100">
            <h3 className="fb-font-dm text-xl font-medium text-[#1f1f1f] mb-6">More Blogs</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/content/about-us/about-the-brand/56485"
                className="p-4 rounded-lg bg-[#F9F8F6] border border-[#EFEEE9] hover:shadow-md transition-shadow flex flex-col gap-2 group"
              >
                <h4 className="font-bold text-sm text-[#1f1f1f] group-hover:text-[#7d5b1f]">About The Brand</h4>
                <p className="text-xs text-[#6B7280] line-clamp-2">Discover the origins and story behind Anuprerna handwoven textiles.</p>
              </Link>
              <Link
                href="/content/about-us/about-the-founder/57073"
                className="p-4 rounded-lg bg-[#F9F8F6] border border-[#EFEEE9] hover:shadow-md transition-shadow flex flex-col gap-2 group"
              >
                <h4 className="font-bold text-sm text-[#1f1f1f] group-hover:text-[#7d5b1f]">About The Founder</h4>
                <p className="text-xs text-[#6B7280] line-clamp-2">Learn about our vision for empowering rural handloom weaving clusters.</p>
              </Link>
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN: About Us Card & Related Blogs */}
        <aside className="w-full lg:w-[260px] shrink-0 sticky top-[100px] self-start flex flex-col gap-8">
          {/* About Us Card */}
          <div className="flex flex-col items-start bg-[#FAF9F6] p-4 rounded-xl border border-[#EFEEE9]">
            <img
              src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/home/hero/home-hero-1.png"
              alt="About Us"
              className="rounded-lg object-cover w-full max-h-[200px] aspect-square mb-3"
            />
            <h2 className="text-[#7d5b1f] text-lg font-bold mb-1">About Us</h2>
            <p className="text-xs text-[#3c3c3c] leading-relaxed">
              Discover Anuprerna&apos;s sustainable handloom fabrics crafted by 300+ skilled artisans in East India. We also offer low MOQ custom manufacturing of apparel, stoles, scarves, handbags, and home furnishings in organic khadi, cotton, linen, wool, bamboo, mulberry, ahimsa silk and more.
            </p>
            <Link
              href="/content/about-us/about-our-impact/57938"
              className="w-max bg-[#fffcf7] hover:bg-white hover:shadow-md rounded md:rounded-md border-2 border-[#8E7862] text-[#8E7862] py-1.5 px-4 text-xs font-bold transition-all mt-4"
            >
              Discover Our Impact
            </Link>
          </div>

          {/* Related Blogs Section */}
          <div className="flex flex-col items-start w-full">
            <h2 className="text-[#7d5b1f] text-lg font-bold mb-3">Related Blogs</h2>
            <div className="flex flex-col gap-2 w-full">
              {[
                { title: "A Production Update On Sustainable Weaving", href: "/content/about-us/about-the-brand/56485" },
                { title: "Artisanal Impact Report 2025 Highlights", href: "/content/about-us/about-our-impact/57938" },
                { title: "How To Nurture Natural Dyed Fabrics", href: "/content/care-guide/how-to-nurture-your-natural-dyed-clothing/126408" },
                { title: "Wholesale Custom Manufacturing & Production", href: "/content/wholesale/wholesale-production-preorder/59335" },
              ].map((rel, rIdx) => (
                <Link
                  key={rIdx}
                  href={rel.href}
                  className="flex items-start gap-1 text-xs text-[#3c3c3c] hover:text-[#7d5b1f] hover:underline font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-sm text-[#7d5b1f] shrink-0 mt-0.5">
                    arrow_right
                  </span>
                  <span>{rel.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

      </div>

      {/* Floating Mobile TOC Dropdown Button */}
      <div className="lg:hidden fixed top-[85px] right-3 z-30">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMobileTocOpen(!mobileTocOpen)}
            className="bg-[#FFFBF7] border border-[#8E7862] text-[#7d5b1f] text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1"
          >
            <span>On this Page</span>
            <span className="material-symbols-outlined text-sm">
              {mobileTocOpen ? "arrow_drop_up" : "arrow_drop_down"}
            </span>
          </button>

          {mobileTocOpen && (
            <div className="absolute right-0 top-10 bg-white border border-gray-200 shadow-xl rounded-xl p-3 w-[240px] flex flex-col gap-2 max-h-[60vh] overflow-y-auto animate-in fade-in duration-150">
              <div className="text-[11px] font-bold text-gray-400 uppercase border-b pb-1">On this page</div>
              {sections.map((sec, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    scrollToSection(`section-${i}`);
                    setMobileTocOpen(false);
                  }}
                  className="text-left text-xs text-gray-700 hover:text-[#7d5b1f] py-1 truncate"
                >
                  {sec.heading || sec.title1 || `Section ${i + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
