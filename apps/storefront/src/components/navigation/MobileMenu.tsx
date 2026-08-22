"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ForexDropdown } from "./ForexDropdown";
import {
  NavigationCraft,
  NavigationMaterialOption,
  NavigationPatternOption,
  NavigationColorOption,
  NavigationStory,
  INITIAL_NAVIGATION_CRAFT,
  INITIAL_NAVIGATION_MATERIALS,
  INITIAL_NAVIGATION_PATTERNS,
  INITIAL_NAVIGATION_COLORS,
  INITIAL_NAVIGATION_ACCESSORIES,
  INITIAL_NAVIGATION_HOME,
  INITIAL_NAVIGATION_APPAREL,
  INITIAL_NAVIGATION_STORY_CRAFTS,
  INITIAL_NAVIGATION_STORY_CLUSTERS,
  INITIAL_NAVIGATION_STORY_COLLABORATIONS,
  generateCategoryRedirectionLink,
  generateSegmentRedirectionLink,
  generateRedirectionLink,
  createCategoryUrl,
} from "../../lib/data/navigationData";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  tenantName?: string;
  navigationCraft?: NavigationCraft[];
  navigationMaterial?: NavigationMaterialOption[];
  navigationPattern?: NavigationPatternOption[];
  navigationColor?: NavigationColorOption[];
  navigationAccessories?: NavigationCraft[];
  navigationHome?: NavigationCraft[];
  navigationApparel?: NavigationCraft[];
  navigationStoryCrafts?: NavigationStory[];
  navigationStoryClusters?: NavigationStory[];
  navigationStoryCollaborations?: NavigationStory[];
}

export function MobileMenu({
  isOpen,
  onClose,
  isLoggedIn = false,
  tenantName = "Guest",
  navigationCraft = INITIAL_NAVIGATION_CRAFT,
  navigationMaterial = INITIAL_NAVIGATION_MATERIALS,
  navigationPattern = INITIAL_NAVIGATION_PATTERNS,
  navigationColor = INITIAL_NAVIGATION_COLORS,
  navigationAccessories = INITIAL_NAVIGATION_ACCESSORIES,
  navigationHome = INITIAL_NAVIGATION_HOME,
  navigationApparel = INITIAL_NAVIGATION_APPAREL,
  navigationStoryCrafts = INITIAL_NAVIGATION_STORY_CRAFTS,
  navigationStoryClusters = INITIAL_NAVIGATION_STORY_CLUSTERS,
  navigationStoryCollaborations = INITIAL_NAVIGATION_STORY_COLLABORATIONS,
}: MobileMenuProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openSubSection, setOpenSubSection] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    let animFrame: number;
    let animFrame2: number;
    let timer: NodeJS.Timeout;

    if (isOpen) {
      setMounted(true);
      // Double RAF ensures smooth 60fps initialization before transition
      animFrame = requestAnimationFrame(() => {
        animFrame2 = requestAnimationFrame(() => {
          setAnimating(true);
        });
      });
    } else {
      setAnimating(false);
      timer = setTimeout(() => {
        setMounted(false);
      }, 350);
    }

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
      if (animFrame2) cancelAnimationFrame(animFrame2);
      if (timer) clearTimeout(timer);
    };
  }, [isOpen]);

  if (!mounted && !isOpen) return null;

  const toggleSection = (section: string) => {
    if (openSection === section) {
      setOpenSection(null);
      setOpenSubSection(null);
    } else {
      setOpenSection(section);
      // Automatically open the Crafts sub-accordion when Fabric is clicked so user doesn't need an extra tap
      if (section === "fabric") {
        setOpenSubSection("craft");
      } else {
        setOpenSubSection(null);
      }
    }
  };

  const toggleSubSection = (subSection: string) => {
    setOpenSubSection(openSubSection === subSection ? null : subSection);
  };

  return (
    <div className="absolute top-full left-0 right-0 h-[calc(100dvh-100%)] min-h-[calc(100vh-60px)] z-40 flex pointer-events-none overflow-hidden">
      {/* Backdrop overlay covering the page below header with smooth fade in & fade out */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-xs pointer-events-auto cursor-pointer transition-opacity duration-350 ease-out will-change-[opacity] ${
          animating ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Wide White Side Drawer Menu that smoothly slides in and out from the left */}
      <menu
        className={`relative w-[88vw] sm:w-[89vw] md:w-[89vw] max-w-[89vw] bg-white h-full shadow-2xl overflow-y-auto flex flex-col px-4 sm:px-8 py-4 z-10 pointer-events-auto transform transition-transform duration-350 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] will-change-transform ${
          animating ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Back / Breadcrumb Chevron */}
        <div className="pt-1 pb-1">
          <span className="text-gray-900 font-normal text-base md:text-lg select-none">&gt;</span>
        </div>

        {/* Currency & Swatchkit */}
        <div className="pb-3 pt-1 border-b border-[#efeee9] flex flex-col gap-3">
          <div className="flex justify-between items-center text-sm text-gray-800 font-normal">
            <span>Currency:</span>
            <ForexDropdown />
          </div>
          <Link
            href="/products/fabric?category=swatchkit&inStock=true&sort-by=availability"
            onClick={onClose}
            className="block text-center bg-[#a29177] hover:bg-[#8f7e65] text-white font-normal rounded-md py-2.5 px-4 text-sm md:text-base shadow-xs transition-colors"
          >
            Order a SwatchKit
          </Link>
        </div>

        {/* Menu Accordions */}
        <div className="py-1 flex-1 flex flex-col gap-0 text-[15px] md:text-base font-normal">
          {/* FABRIC */}
          <div className="border-b border-[#efeee9] py-3">
            <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => toggleSection("fabric")}>
              <Link href="/products/fabric?inStock=true&sort-by=availability" onClick={onClose} className="hover:text-[#7D5B20] font-medium text-gray-900">
                Fabric
              </Link>
              <span className={`material-symbols-outlined text-xl text-gray-600 transition-transform duration-300 ${openSection === "fabric" ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </div>
            {openSection === "fabric" && (
              <div className="mt-2.5 flex flex-col gap-1.5 text-xs animate-in fade-in duration-200">
                {/* Crafts Accordion - Auto Open By Default */}
                <div className="bg-[#FAF7F2] rounded-lg overflow-hidden transition-all border border-[#f0eae0]">
                  <div
                    className="flex justify-between items-center font-medium text-[14px] md:text-[15px] text-gray-900 px-4 py-3 cursor-pointer select-none hover:bg-[#F2ECE4] transition-colors"
                    onClick={() => toggleSubSection("craft")}
                  >
                    <span>Crafts</span>
                    <span className={`material-symbols-outlined text-xl text-gray-600 transition-transform duration-300 ${openSubSection === "craft" ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </div>
                  {openSubSection === "craft" && (
                    <div className="px-5 pt-3 pb-6 border-t border-[#eee7dc]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-h-[600px] overflow-y-auto pr-1">
                        {navigationCraft.map((segment) => (
                          <div key={segment.id} className="flex flex-col">
                            <Link
                              href={generateCategoryRedirectionLink("/products/fabric", segment)}
                              onClick={onClose}
                              className="font-bold text-[13px] md:text-[14px] text-black uppercase tracking-wider py-1 hover:text-[#7D5B20] block"
                            >
                              {segment.segmentCategoryName}
                            </Link>
                            <div className="flex flex-col gap-1 mt-1">
                              {segment.optionList.map((sub) => (
                                <Link
                                  key={sub.id}
                                  href={generateSegmentRedirectionLink("/products/fabric", segment.segmentCategoryName, sub.subCategoryName)}
                                  onClick={onClose}
                                  className="py-0.5 text-[13px] md:text-[14px] text-gray-800 hover:text-[#7D5B20] capitalize leading-normal transition-colors"
                                >
                                  {sub.subCategoryName.toLowerCase()}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Materials Accordion */}
                <div className="bg-[#FAF7F2] rounded-lg overflow-hidden transition-all border border-[#f0eae0]">
                  <div
                    className="flex justify-between items-center font-medium text-[14px] md:text-[15px] text-gray-900 px-4 py-3 cursor-pointer select-none hover:bg-[#F2ECE4] transition-colors"
                    onClick={() => toggleSubSection("material")}
                  >
                    <span>Material</span>
                    <span className={`material-symbols-outlined text-xl text-gray-600 transition-transform duration-300 ${openSubSection === "material" ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </div>
                  {openSubSection === "material" && (
                    <div className="px-5 pt-3 pb-5 border-t border-[#eee7dc]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {navigationMaterial.map((m) => (
                          <Link
                            key={m.materialId}
                            href={generateRedirectionLink("/products/fabric", "material", m.materialName)}
                            onClick={onClose}
                            className="py-1 text-[13px] md:text-[14px] text-gray-800 hover:text-[#7D5B20] capitalize transition-colors"
                          >
                            {m.materialName.toLowerCase()}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Patterns Accordion */}
                <div className="bg-[#FAF7F2] rounded-lg overflow-hidden transition-all border border-[#f0eae0]">
                  <div
                    className="flex justify-between items-center font-medium text-[14px] md:text-[15px] text-gray-900 px-4 py-3 cursor-pointer select-none hover:bg-[#F2ECE4] transition-colors"
                    onClick={() => toggleSubSection("pattern")}
                  >
                    <span>Pattern</span>
                    <span className={`material-symbols-outlined text-xl text-gray-600 transition-transform duration-300 ${openSubSection === "pattern" ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </div>
                  {openSubSection === "pattern" && (
                    <div className="px-5 pt-3 pb-5 border-t border-[#eee7dc]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {navigationPattern.map((p) => (
                          <Link
                            key={p.patternId}
                            href={generateRedirectionLink("/products/fabric", "pattern", p.patternName)}
                            onClick={onClose}
                            className="py-1 text-[13px] md:text-[14px] text-gray-800 hover:text-[#7D5B20] capitalize transition-colors"
                          >
                            {p.patternName.toLowerCase()}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Colors Accordion */}
                <div className="bg-[#FAF7F2] rounded-lg overflow-hidden transition-all border border-[#f0eae0]">
                  <div
                    className="flex justify-between items-center font-medium text-[14px] md:text-[15px] text-gray-900 px-4 py-3 cursor-pointer select-none hover:bg-[#F2ECE4] transition-colors"
                    onClick={() => toggleSubSection("color")}
                  >
                    <span>Color</span>
                    <span className={`material-symbols-outlined text-xl text-gray-600 transition-transform duration-300 ${openSubSection === "color" ? "rotate-180" : ""}`}>
                      expand_more
                    </span>
                  </div>
                  {openSubSection === "color" && (
                    <div className="px-5 pt-3 pb-4 border-t border-gray-200/60">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {navigationColor.map((c) => (
                          <Link
                            key={c.colorId}
                            href={generateRedirectionLink("/products/fabric", "color", c.colorLabel)}
                            onClick={onClose}
                            className="flex items-center gap-2.5 py-1 text-[13px] text-[#333] hover:text-[#7D5B20] capitalize transition-colors"
                          >
                            <span className="w-4 h-4 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: c.colorHexCode }} />
                            <span className="truncate">{c.colorLabel.toLowerCase()}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ACCESSORIES */}
          <div className="border-b border-[#efeee9] py-3">
            <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => toggleSection("accessories")}>
              <Link href="/products/finished?category=accessories&inStock=true&sort-by=availability" onClick={onClose} className="hover:text-[#7D5B20] font-medium text-gray-900 text-[15px] md:text-base">
                Accessories
              </Link>
              <span className={`material-symbols-outlined text-xl text-gray-600 transition-transform duration-300 ${openSection === "accessories" ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </div>
            {openSection === "accessories" && (
              <div className="mt-3 p-6 sm:p-7 bg-[#EAF0F6] rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 text-xs sm:text-sm animate-in fade-in duration-200">
                {navigationAccessories.map((sec) => (
                  <div key={sec.id} className="flex flex-col">
                    <span className="font-bold text-[13px] md:text-[14px] text-black tracking-wide uppercase mb-1.5">{sec.segmentCategoryName}</span>
                    <div className="flex flex-col gap-0.5">
                      {sec.optionList.map((sub) => (
                        <Link
                          key={sub.id}
                          href={generateSegmentRedirectionLink("/products/finished", sec.segmentCategoryName, sub.subCategoryName, "accessories")}
                          onClick={onClose}
                          className="py-0.5 text-[13px] md:text-[14px] text-[#222] hover:text-[#7D5B20] capitalize leading-relaxed transition-colors"
                        >
                          {sub.subCategoryName.toLowerCase()}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HOMEWARE */}
          <div className="border-b border-[#efeee9] py-3">
            <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => toggleSection("home")}>
              <Link href="/products/finished?category=home&inStock=true&sort-by=availability" onClick={onClose} className="hover:text-[#7D5B20] font-medium text-gray-900 text-[15px] md:text-base">
                Homeware
              </Link>
              <span className={`material-symbols-outlined text-xl text-gray-600 transition-transform duration-300 ${openSection === "home" ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </div>
            {openSection === "home" && (
              <div className="mt-3 p-6 sm:p-7 bg-[#F7F2EC] rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 text-xs sm:text-sm animate-in fade-in duration-200">
                {navigationHome.map((sec) => (
                  <div key={sec.id} className="flex flex-col">
                    <span className="font-bold text-[13px] md:text-[14px] text-black tracking-wide uppercase mb-1.5">{sec.segmentCategoryName}</span>
                    <div className="flex flex-col gap-0.5">
                      {sec.optionList.map((sub) => (
                        <Link
                          key={sub.id}
                          href={generateSegmentRedirectionLink("/products/finished", sec.segmentCategoryName, sub.subCategoryName, "home")}
                          onClick={onClose}
                          className="py-0.5 text-[13px] md:text-[14px] text-[#222] hover:text-[#7D5B20] capitalize leading-relaxed transition-colors"
                        >
                          {sub.subCategoryName.toLowerCase()}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* APPAREL */}
          <div className="border-b border-[#efeee9] py-3">
            <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => toggleSection("apparel")}>
              <Link href="/products/finished?category=apparel&inStock=true&sort-by=availability" onClick={onClose} className="hover:text-[#7D5B20] font-medium text-gray-900 text-[15px] md:text-base">
                Apparel
              </Link>
              <span className={`material-symbols-outlined text-xl text-gray-600 transition-transform duration-300 ${openSection === "apparel" ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </div>
            {openSection === "apparel" && (
              <div className="mt-3 p-6 sm:p-7 bg-[#ECF4EE] rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 text-xs sm:text-sm animate-in fade-in duration-200">
                {navigationApparel.map((sec) => (
                  <div key={sec.id} className="flex flex-col">
                    <span className="font-bold text-[13px] md:text-[14px] text-black tracking-wide uppercase mb-1.5">{sec.segmentCategoryName}</span>
                    <div className="flex flex-col gap-0.5">
                      {sec.optionList.map((sub) => (
                        <Link
                          key={sub.id}
                          href={generateSegmentRedirectionLink("/products/finished", sec.segmentCategoryName, sub.subCategoryName, "apparel")}
                          onClick={onClose}
                          className="py-0.5 text-[13px] md:text-[14px] text-[#222] hover:text-[#7D5B20] capitalize leading-relaxed transition-colors"
                        >
                          {sub.subCategoryName.toLowerCase()}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLLABORATIONS */}
          <div className="border-b border-[#efeee9] py-3">
            <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => toggleSection("collaborations")}>
              <Link href="/stories" onClick={onClose} className="hover:text-[#7D5B20] font-medium text-gray-900 text-[15px] md:text-base">
                Collaborations
              </Link>
              <span className={`material-symbols-outlined text-xl text-gray-600 transition-transform duration-300 ${openSection === "collaborations" ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </div>
            {openSection === "collaborations" && (
              <div className="mt-3 p-6 sm:p-7 bg-[#F5EDF4] rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6 text-xs sm:text-sm animate-in fade-in duration-200">
                {/* 1. Crafts */}
                <div className="flex flex-col">
                  <span className="font-bold text-[13px] md:text-[14px] text-black tracking-wide uppercase mb-1.5">Crafts</span>
                  <div className="flex flex-col gap-0.5">
                    {navigationStoryCrafts.flatMap((s) => s.optionList).map((sub) => (
                      <Link
                        key={sub.storyId}
                        href={`/stories/${sub.slug}/${sub.storyId}`}
                        onClick={onClose}
                        className="py-0.5 text-[13px] md:text-[14px] text-[#222] hover:text-[#7D5B20] capitalize leading-relaxed transition-colors"
                      >
                        {sub.storyTitle.toLowerCase()}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* 2. Collaborations / Designers */}
                <div className="flex flex-col">
                  <span className="font-bold text-[13px] md:text-[14px] text-black tracking-wide uppercase mb-1.5">Collaborations</span>
                  <div className="flex flex-col gap-0.5">
                    {navigationStoryCollaborations.flatMap((s) => s.optionList).map((sub) => (
                      <Link
                        key={sub.storyId}
                        href={`/stories/${sub.slug}/${sub.storyId}`}
                        onClick={onClose}
                        className="py-0.5 text-[13px] md:text-[14px] text-[#222] hover:text-[#7D5B20] capitalize leading-relaxed transition-colors"
                      >
                        {sub.storyTitle.toLowerCase()}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* 3. Clusters */}
                <div className="flex flex-col">
                  <span className="font-bold text-[13px] md:text-[14px] text-black tracking-wide uppercase mb-1.5">Clusters</span>
                  <div className="flex flex-col gap-0.5">
                    {navigationStoryClusters.flatMap((s) => s.optionList).map((sub) => (
                      <Link
                        key={sub.storyId}
                        href={`/stories/${sub.slug}/${sub.storyId}`}
                        onClick={onClose}
                        className="py-0.5 text-[13px] md:text-[14px] text-[#222] hover:text-[#7D5B20] capitalize leading-relaxed transition-colors"
                      >
                        {sub.storyTitle.toLowerCase()}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STORIES (BLOGS) */}
          <div className="border-b border-[#efeee9] py-3">
            <div className="flex justify-between items-center cursor-pointer select-none">
              <Link href="/blogs" onClick={onClose} className="hover:text-[#7D5B20] font-medium text-gray-900 block w-full">
                Stories
              </Link>
            </div>
          </div>

          {/* OUR STORY */}
          <div className="border-b border-[#efeee9] py-3">
            <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => toggleSection("ourstory")}>
              <span className="hover:text-[#7D5B20] font-medium text-gray-900">Our Story</span>
              <span className={`material-symbols-outlined text-xl text-gray-600 transition-transform duration-300 ${openSection === "ourstory" ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </div>
            {openSection === "ourstory" && (
              <div className="mt-3 p-3 bg-[#F7F7F7] rounded-lg flex flex-col gap-1.5 text-xs animate-in fade-in duration-200">
                <Link href="/about-the-brand" onClick={onClose} className="py-1 text-[12px] md:text-[13px] text-[#333] hover:text-[#7D5B20]">
                  About The Brand
                </Link>
                <Link href="/impact" onClick={onClose} className="py-1 text-[12px] md:text-[13px] text-[#333] hover:text-[#7D5B20]">
                  About Our Impact
                </Link>
                <Link href="/content/about-us/about-the-founder/57073" target="_blank" onClick={onClose} className="py-1 text-[12px] md:text-[13px] text-[#333] hover:text-[#7D5B20]">
                  About the Founder
                </Link>
                <Link href="/production-studio" onClick={onClose} className="py-1 text-[12px] md:text-[13px] text-[#333] hover:text-[#7D5B20]">
                  About the Studio
                </Link>
                <Link href="/contact" onClick={onClose} className="py-1 text-[12px] md:text-[13px] text-[#333] hover:text-[#7D5B20]">
                  Contact Us
                </Link>
              </div>
            )}
          </div>

          {/* B2B */}
          <div className="border-b border-[#efeee9] py-3">
            <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => toggleSection("b2b")}>
              <span className="hover:text-[#7D5B20] font-medium text-gray-900">B2B</span>
              <span className={`material-symbols-outlined text-xl text-gray-600 transition-transform duration-300 ${openSection === "b2b" ? "rotate-180" : ""}`}>
                expand_more
              </span>
            </div>
            {openSection === "b2b" && (
              <div className="mt-3 p-3 bg-[#F7F7F7] rounded-lg flex flex-col gap-1.5 text-xs animate-in fade-in duration-200">
                <Link href="/wholesale-partner-program" onClick={onClose} className="py-1 text-[12px] md:text-[13px] text-[#333] hover:text-[#7D5B20]">
                  Wholesale Partner Program
                </Link>
                <Link href="/artisanflow" onClick={onClose} className="py-1 text-[12px] md:text-[13px] text-[#333] hover:text-[#7D5B20]">
                  Traceability Platform: ArtisanFlow
                </Link>
                <Link href="/services/fabric-swatches" onClick={onClose} className="py-1 text-[12px] md:text-[13px] text-[#333] hover:text-[#7D5B20]">
                  Order Fabric Swatches
                </Link>
                <Link href="/services/custom-dyeing" onClick={onClose} className="py-1 text-[12px] md:text-[13px] text-[#333] hover:text-[#7D5B20]">
                  Sustainable Dyeing
                </Link>
                <Link href="/services/eco-printing" onClick={onClose} className="py-1 text-[12px] md:text-[13px] text-[#333] hover:text-[#7D5B20]">
                  Sustainable Printing
                </Link>
                <Link href="/wholesale-production" onClick={onClose} className="py-1 text-[12px] md:text-[13px] text-[#333] hover:text-[#7D5B20]">
                  Custom Fabric Production
                </Link>
                <Link href="/custom-manufacturing" onClick={onClose} className="py-1 text-[12px] md:text-[13px] text-[#333] hover:text-[#7D5B20]">
                  Finished Product Development
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer Contact & Socials */}
        <div className="pt-4 pb-2 mt-auto border-t border-[#efeee9] flex flex-col gap-3">
          <Link
            href="/contact"
            onClick={onClose}
            className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-[#7D5B20] transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/contact-color.png"
              alt="contact"
              className="w-5 h-5"
            />
            <span>Contact Us</span>
          </Link>

          <div className="flex items-center gap-3 pt-2">
            <a href="https://twitter.com/Anuprerna6" target="_blank" rel="noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
              <img src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/twitter.svg" alt="Twitter" className="w-5 h-5" />
            </a>
            <a href="https://www.facebook.com/anuprernatelier/" target="_blank" rel="noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
              <img src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/facebook.svg" alt="Facebook" className="w-5 h-5" />
            </a>
            <a href="https://in.pinterest.com/anuprernas/" target="_blank" rel="noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
              <img src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/pininterest.svg" alt="Pinterest" className="w-5 h-5" />
            </a>
            <a href="https://www.instagram.com/anuprerna_atelier/" target="_blank" rel="noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
              <img src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/instagram.svg" alt="Instagram" className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/company/anuprerna/" target="_blank" rel="noreferrer" className="opacity-70 hover:opacity-100 transition-opacity">
              <img src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/linkedin-anuprerna.svg" alt="LinkedIn" className="w-5 h-5" />
            </a>
          </div>
        </div>
      </menu>
    </div>
  );
}
