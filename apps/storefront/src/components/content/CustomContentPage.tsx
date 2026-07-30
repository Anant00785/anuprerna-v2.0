"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface SectionItem {
  id?: number;
  sortOrder?: number;
  heading?: string;
  title1?: string;
  title2?: string;
  sectionTitle?: string;
  subTitle?: string;
  paragraph1?: string;
  paragraph2?: string;
  description?: string;
  image1?: string;
  image2?: string;
  image?: string;
  caption1?: string;
  caption2?: string;
  imageCaption?: string;
  quote?: string;
  quoteAuthor?: string;
  callout?: string;
  topMotif?: string;
  bottomMotif?: string;
}

interface BlogDetails {
  id: number;
  title: string;
  subTitle?: string;
  description?: string;
  content?: string;
  bannerImageDesktop?: string;
  bannerImageMobile?: string;
  heroImage?: string;
  author?: string;
  timeOfCreation?: number;
  blogContentSectionList?: SectionItem[];
}

export function CustomContentPage({ blogId }: { blogId: string }) {
  const [data, setData] = useState<BlogDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadContent() {
      try {
        const res = await fetch(`/api/content/${encodeURIComponent(blogId)}`);
        if (!res.ok) throw new Error(`Content HTTP ${res.status}`);
        const json = await res.json();
        if (isMounted && json.data) {
          setData(json.data);
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

  if (isLoading) {
    return (
      <div className="w-full min-h-[600px] flex flex-col justify-center items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#8E7862] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium text-sm">Loading article...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full py-20 text-center flex flex-col items-center gap-4">
        <h2 className="text-2xl font-serif font-bold text-gray-800">Article Not Found</h2>
        <p className="text-gray-500">The content page you requested could not be found.</p>
        <Link href="/" className="bg-[#8E7862] text-white px-6 py-2.5 rounded-lg font-bold">
          Return to Home
        </Link>
      </div>
    );
  }

  const rawSections = data.blogContentSectionList || [];
  const sections = [...rawSections].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
  );

  const heroImage =
    data.bannerImageDesktop || data.bannerImageMobile || data.heroImage;

  return (
    <article className="w-full bg-white text-gray-900 pb-20">
      {/* Header Banner */}
      <section className="w-full bg-[#fdfbf7] py-14 px-4 border-b border-[#EFEEE9]">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8E7862] bg-[#fcf4e8] px-3.5 py-1 rounded-full">
            Care Guide & Sustainability
          </span>

          <h1 className="text-3xl sm:text-5xl font-serif text-[#302e2e] font-bold tracking-tight leading-tight">
            {data.title}
          </h1>

          {data.subTitle && (
            <p className="text-base md:text-lg text-gray-600 max-w-2xl font-sans">
              {data.subTitle}
            </p>
          )}

          {heroImage && (
            <div className="w-full max-w-3xl mt-6 rounded-2xl overflow-hidden shadow-lg border-4 border-white">
              <img
                src={heroImage}
                alt={data.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
        </div>
      </section>

      {/* Main Content Layout with Table of Contents */}
      <div className="max-w-5xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Table of Contents Sidebar (Desktop) */}
        {sections.length > 1 && (
          <aside className="hidden lg:block lg:col-span-1 sticky top-28 self-start bg-[#fffcf7] p-5 rounded-xl border border-[#EFEEE9] shadow-sm">
            <h3 className="text-xs font-bold uppercase text-[#8E7862] tracking-wider mb-3">
              Table of Contents
            </h3>
            <nav className="flex flex-col gap-2">
              {sections.map((sec, i) => {
                const titleText =
                  sec.heading || sec.sectionTitle || sec.title1 || `Section ${i + 1}`;
                return (
                  <a
                    key={i}
                    href={`#section-${i}`}
                    className="text-xs text-gray-700 hover:text-[#8E7862] hover:underline leading-snug font-medium line-clamp-2"
                  >
                    {i + 1}. {titleText}
                  </a>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Section List Body */}
        <main className={`w-full flex flex-col gap-10 ${sections.length > 1 ? "lg:col-span-3" : "lg:col-span-4"}`}>
          {/* Main Description / Lead Content if available */}
          {data.description && (
            <div
              className="prose prose-stone max-w-none text-gray-700 leading-relaxed text-base border-b border-gray-100 pb-6"
              dangerouslySetInnerHTML={{ __html: data.description }}
            />
          )}

          {/* Section Rendering */}
          {sections.map((sec, i) => {
            const heading = sec.heading || sec.sectionTitle || sec.title1;
            const subHeading = sec.title2 || sec.subTitle;
            const htmlContent1 = sec.paragraph1 || sec.description;
            const htmlContent2 = sec.paragraph2;
            const img1 = sec.image1 || sec.image;
            const img2 = sec.image2;
            const cap1 = sec.caption1 || sec.imageCaption;
            const cap2 = sec.caption2;

            return (
              <section key={i} id={`section-${i}`} className="flex flex-col gap-4 border-b border-gray-100 pb-8 last:border-0">
                {sec.topMotif && (
                  <div className="w-8 h-8 opacity-60 my-1">
                    <img src={sec.topMotif} alt="" className="w-full h-full object-contain" />
                  </div>
                )}

                {heading && (
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#302e2e] leading-snug">
                    {heading}
                  </h2>
                )}

                {subHeading && (
                  <h3 className="text-lg font-semibold text-[#8E7862]">
                    {subHeading}
                  </h3>
                )}

                {/* Primary Image */}
                {img1 && (
                  <div className="w-full my-3 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                    <img src={img1} alt={heading || "Article image"} className="w-full h-auto object-cover" />
                    {cap1 && (
                      <p className="text-xs text-gray-500 italic p-2 text-center bg-gray-50">
                        {cap1}
                      </p>
                    )}
                  </div>
                )}

                {/* Primary Paragraph HTML */}
                {htmlContent1 && (
                  <div
                    className="prose prose-stone max-w-none text-gray-800 leading-relaxed text-base sm:text-lg"
                    dangerouslySetInnerHTML={{ __html: htmlContent1 }}
                  />
                )}

                {/* Secondary Image */}
                {img2 && (
                  <div className="w-full my-3 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                    <img src={img2} alt={heading || "Article image 2"} className="w-full h-auto object-cover" />
                    {cap2 && (
                      <p className="text-xs text-gray-500 italic p-2 text-center bg-gray-50">
                        {cap2}
                      </p>
                    )}
                  </div>
                )}

                {/* Secondary Paragraph HTML */}
                {htmlContent2 && (
                  <div
                    className="prose prose-stone max-w-none text-gray-800 leading-relaxed text-base sm:text-lg"
                    dangerouslySetInnerHTML={{ __html: htmlContent2 }}
                  />
                )}

                {sec.quote && (
                  <blockquote className="my-4 p-5 bg-[#fcf4e8] border-l-4 border-[#8E7862] italic text-[#7D5B20] rounded-r-xl">
                    &ldquo;{sec.quote}&rdquo;
                    {sec.quoteAuthor && (
                      <cite className="block text-xs font-bold text-gray-700 mt-2 not-italic">
                        &mdash; {sec.quoteAuthor}
                      </cite>
                    )}
                  </blockquote>
                )}

                {sec.callout && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm font-medium">
                    {sec.callout}
                  </div>
                )}

                {sec.bottomMotif && (
                  <div className="w-8 h-8 opacity-60 my-1 self-end">
                    <img src={sec.bottomMotif} alt="" className="w-full h-full object-contain" />
                  </div>
                )}
              </section>
            );
          })}

          {/* Bottom Action Box */}
          <div className="mt-8 p-8 bg-[#8E7862] text-white rounded-2xl shadow-xl text-center flex flex-col items-center gap-4">
            <h3 className="text-2xl font-serif font-bold">Have Questions About Custom Orders?</h3>
            <p className="text-sm text-gray-100 max-w-md">
              Connect with our team to request custom samples, yarn-dyed developments, or production timelines.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <Link href="/contact" className="bg-white text-[#8E7862] hover:bg-[#fffcf7] font-bold px-6 py-2.5 rounded-lg text-sm transition-colors">
                Contact Our Studio
              </Link>
              <Link href="/wholesale-partner-program" className="bg-[#73604d] hover:bg-[#5e4e3e] text-white border border-white/30 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors">
                Wholesale Partner Program
              </Link>
            </div>
          </div>
        </main>
      </div>
    </article>
  );
}
