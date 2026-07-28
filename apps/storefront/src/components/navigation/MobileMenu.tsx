"use client";

import { useState } from "react";
import Link from "next/link";
import { ForexDropdown } from "./ForexDropdown";
import {
  NavigationCraft,
  NavigationMaterialOption,
  NavigationPatternOption,
  NavigationColorOption,
  NavigationStory,
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
  navigationCraft: NavigationCraft[];
  navigationMaterial: NavigationMaterialOption[];
  navigationPattern: NavigationPatternOption[];
  navigationColor: NavigationColorOption[];
  navigationAccessories: NavigationCraft[];
  navigationHome: NavigationCraft[];
  navigationApparel: NavigationCraft[];
  navigationStoryCrafts: NavigationStory[];
  navigationStoryClusters: NavigationStory[];
  navigationStoryCollaborations: NavigationStory[];
}

export function MobileMenu({
  isOpen,
  onClose,
  isLoggedIn = false,
  tenantName = "Guest",
  navigationCraft,
  navigationMaterial,
  navigationPattern,
  navigationColor,
  navigationAccessories,
  navigationHome,
  navigationApparel,
  navigationStoryCrafts,
  navigationStoryClusters,
  navigationStoryCollaborations,
}: MobileMenuProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openSubSection, setOpenSubSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
    setOpenSubSection(null);
  };

  const toggleSubSection = (subSection: string) => {
    setOpenSubSection(openSubSection === subSection ? null : subSection);
  };

  return (
    <div className="fixed inset-0 z-50 xl:hidden flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <menu className="relative w-[85%] max-w-sm bg-white h-full shadow-2xl overflow-y-auto flex flex-col p-4 z-10 animate-in slide-in-from-left duration-200">
        {/* Top Header / Account */}
        <div className="flex items-center justify-between pb-4 border-b border-[#efeee9]">
          <Link href={isLoggedIn ? "/profile" : "/auth"} onClick={onClose} className="flex items-center gap-2 font-bold text-sm">
            <span className="material-symbols-outlined">{isLoggedIn ? "person" : "account_circle"}</span>
            <span>{isLoggedIn ? tenantName : "Sign In / Register"}</span>
          </Link>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Currency & Swatchkit */}
        <div className="py-3 border-b border-[#efeee9] flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
            <span>Currency:</span>
            <ForexDropdown />
          </div>
          <Link
            href="/products/fabric?category=swatchkit"
            onClick={onClose}
            className="block text-center bg-[#B7A98F] text-white font-semibold rounded-md py-2 text-xs shadow-sm hover:bg-[#a5967b] transition-colors"
          >
            Order a SwatchKit
          </Link>
        </div>

        {/* Menu Accordions */}
        <div className="py-2 flex-1 flex flex-col gap-1 text-sm font-medium">
          {/* FABRIC */}
          <div className="border-b border-[#efeee9] py-2">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("fabric")}>
              <Link href="/products/fabric" onClick={onClose} className="hover:text-[#9c8a6c]">
                Fabric
              </Link>
              <span className="material-symbols-outlined text-lg">
                {openSection === "fabric" ? "expand_less" : "expand_more"}
              </span>
            </div>
            {openSection === "fabric" && (
              <div className="mt-2 pl-3 flex flex-col gap-2 text-xs">
                {/* Crafts Accordion */}
                <div className="bg-[#B78F9D]/10 rounded-md p-2">
                  <div
                    className="flex justify-between items-center font-bold text-[#b37487] cursor-pointer"
                    onClick={() => toggleSubSection("craft")}
                  >
                    <span>Crafts</span>
                    <span className="material-symbols-outlined text-base">
                      {openSubSection === "craft" ? "expand_less" : "expand_more"}
                    </span>
                  </div>
                  {openSubSection === "craft" && (
                    <div className="mt-2 flex flex-col gap-2">
                      {navigationCraft.map((segment) => (
                        <div key={segment.id} className="flex flex-col">
                          <Link
                            href={generateCategoryRedirectionLink("/products/fabric", segment)}
                            onClick={onClose}
                            className="font-bold text-gray-900 capitalize py-1"
                          >
                            {segment.segmentCategoryName}
                          </Link>
                          {segment.optionList.map((sub) => (
                            <Link
                              key={sub.id}
                              href={generateSegmentRedirectionLink("/products/fabric", segment.segmentCategoryName, sub.subCategoryName)}
                              onClick={onClose}
                              className="pl-2 py-0.5 text-gray-700 hover:text-[#9c8a6c] capitalize"
                            >
                              {sub.subCategoryName.toLowerCase()}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Materials Accordion */}
                <div className="bg-[#8FB7A3]/20 rounded-md p-2">
                  <div
                    className="flex justify-between items-center font-bold text-[#4c6e5d] cursor-pointer"
                    onClick={() => toggleSubSection("material")}
                  >
                    <span>Material</span>
                    <span className="material-symbols-outlined text-base">
                      {openSubSection === "material" ? "expand_less" : "expand_more"}
                    </span>
                  </div>
                  {openSubSection === "material" && (
                    <div className="mt-2 flex flex-col gap-1">
                      {navigationMaterial.map((m) => (
                        <Link
                          key={m.materialId}
                          href={generateRedirectionLink("/products/fabric", "material", m.materialName)}
                          onClick={onClose}
                          className="py-0.5 text-gray-700 hover:text-[#9c8a6c] capitalize"
                        >
                          {m.materialName.toLowerCase()}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patterns Accordion */}
                <div className="bg-[#9D8FB7]/20 rounded-md p-2">
                  <div
                    className="flex justify-between items-center font-bold text-[#6a538c] cursor-pointer"
                    onClick={() => toggleSubSection("pattern")}
                  >
                    <span>Pattern</span>
                    <span className="material-symbols-outlined text-base">
                      {openSubSection === "pattern" ? "expand_less" : "expand_more"}
                    </span>
                  </div>
                  {openSubSection === "pattern" && (
                    <div className="mt-2 flex flex-col gap-1">
                      {navigationPattern.map((p) => (
                        <Link
                          key={p.patternId}
                          href={generateRedirectionLink("/products/fabric", "pattern", p.patternName)}
                          onClick={onClose}
                          className="py-0.5 text-gray-700 hover:text-[#9c8a6c] capitalize"
                        >
                          {p.patternName.toLowerCase()}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Colors Accordion */}
                <div className="bg-gray-100 rounded-md p-2">
                  <div
                    className="flex justify-between items-center font-bold text-gray-800 cursor-pointer"
                    onClick={() => toggleSubSection("color")}
                  >
                    <span>Color</span>
                    <span className="material-symbols-outlined text-base">
                      {openSubSection === "color" ? "expand_less" : "expand_more"}
                    </span>
                  </div>
                  {openSubSection === "color" && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {navigationColor.map((c) => (
                        <Link
                          key={c.colorId}
                          href={generateRedirectionLink("/products/fabric", "color", c.colorLabel)}
                          onClick={onClose}
                          className="flex items-center gap-2 py-0.5 text-gray-700 hover:text-[#9c8a6c] capitalize"
                        >
                          <span className="w-4 h-4 rounded border border-gray-300" style={{ backgroundColor: c.colorHexCode }} />
                          <span>{c.colorLabel.toLowerCase()}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ACCESSORIES */}
          <div className="border-b border-[#efeee9] py-2">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("accessories")}>
              <Link href="/products/finished?category=accessories" onClick={onClose} className="hover:text-[#9c8a6c]">
                Accessories
              </Link>
              <span className="material-symbols-outlined text-lg">
                {openSection === "accessories" ? "expand_less" : "expand_more"}
              </span>
            </div>
            {openSection === "accessories" && (
              <div className="mt-2 pl-3 flex flex-col gap-2 text-xs bg-[#8F9DB7]/20 p-2 rounded-md">
                {navigationAccessories.map((sec) => (
                  <div key={sec.id} className="flex flex-col gap-1">
                    <span className="font-bold text-gray-900">{sec.segmentCategoryName}</span>
                    {sec.optionList.map((sub) => (
                      <Link
                        key={sub.id}
                        href={generateSegmentRedirectionLink("/products/finished", sec.segmentCategoryName, sub.subCategoryName, "accessories")}
                        onClick={onClose}
                        className="pl-2 py-0.5 text-gray-700 hover:text-[#9c8a6c] capitalize"
                      >
                        {sub.subCategoryName.toLowerCase()}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HOMEWARE */}
          <div className="border-b border-[#efeee9] py-2">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("home")}>
              <Link href="/products/finished?category=home" onClick={onClose} className="hover:text-[#9c8a6c]">
                Homeware
              </Link>
              <span className="material-symbols-outlined text-lg">
                {openSection === "home" ? "expand_less" : "expand_more"}
              </span>
            </div>
            {openSection === "home" && (
              <div className="mt-2 pl-3 flex flex-col gap-2 text-xs bg-[#B79C8F]/20 p-2 rounded-md">
                {navigationHome.map((sec) => (
                  <div key={sec.id} className="flex flex-col gap-1">
                    <span className="font-bold text-gray-900">{sec.segmentCategoryName}</span>
                    {sec.optionList.map((sub) => (
                      <Link
                        key={sub.id}
                        href={generateSegmentRedirectionLink("/products/finished", sec.segmentCategoryName, sub.subCategoryName, "home")}
                        onClick={onClose}
                        className="pl-2 py-0.5 text-gray-700 hover:text-[#9c8a6c] capitalize"
                      >
                        {sub.subCategoryName.toLowerCase()}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* APPAREL */}
          <div className="border-b border-[#efeee9] py-2">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("apparel")}>
              <Link href="/products/finished?category=apparel" onClick={onClose} className="hover:text-[#9c8a6c]">
                Apparel
              </Link>
              <span className="material-symbols-outlined text-lg">
                {openSection === "apparel" ? "expand_less" : "expand_more"}
              </span>
            </div>
            {openSection === "apparel" && (
              <div className="mt-2 pl-3 flex flex-col gap-2 text-xs bg-[#B7B68F]/20 p-2 rounded-md">
                {navigationApparel.map((sec) => (
                  <div key={sec.id} className="flex flex-col gap-1">
                    <span className="font-bold text-gray-900">{sec.segmentCategoryName}</span>
                    {sec.optionList.map((sub) => (
                      <Link
                        key={sub.id}
                        href={generateSegmentRedirectionLink("/products/finished", sec.segmentCategoryName, sub.subCategoryName, "apparel")}
                        onClick={onClose}
                        className="pl-2 py-0.5 text-gray-700 hover:text-[#9c8a6c] capitalize"
                      >
                        {sub.subCategoryName.toLowerCase()}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLLABORATIONS */}
          <div className="border-b border-[#efeee9] py-2">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("collaborations")}>
              <Link href="/stories" onClick={onClose} className="hover:text-[#9c8a6c]">
                Collaborations
              </Link>
              <span className="material-symbols-outlined text-lg">
                {openSection === "collaborations" ? "expand_less" : "expand_more"}
              </span>
            </div>
            {openSection === "collaborations" && (
              <div className="mt-2 pl-3 flex flex-col gap-2 text-xs bg-[#B78F9D]/10 p-2 rounded-md">
                {navigationStoryCrafts.map((sec) => (
                  <div key={sec.id} className="flex flex-col gap-1">
                    <span className="font-bold text-gray-900">{sec.storyCategoryName}</span>
                    {sec.optionList.map((sub) => (
                      <Link
                        key={sub.storyId}
                        href={`/stories/${sub.slug}/${sub.storyId}`}
                        onClick={onClose}
                        className="pl-2 py-0.5 text-gray-700 hover:text-[#9c8a6c] capitalize"
                      >
                        {sub.storyTitle.toLowerCase()}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OUR STORY */}
          <div className="border-b border-[#efeee9] py-2">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("ourstory")}>
              <span className="hover:text-[#9c8a6c]">Our Story</span>
              <span className="material-symbols-outlined text-lg">
                {openSection === "ourstory" ? "expand_less" : "expand_more"}
              </span>
            </div>
            {openSection === "ourstory" && (
              <div className="mt-2 pl-3 flex flex-col gap-2 text-xs bg-gray-50 p-2 rounded-md">
                <Link href="/content/about-us/about-the-brand/56485" target="_blank" onClick={onClose} className="py-1 text-gray-700 hover:text-[#9c8a6c]">
                  About The Brand
                </Link>
                <Link href="/content/about-us/about-our-impact/57938" target="_blank" onClick={onClose} className="py-1 text-gray-700 hover:text-[#9c8a6c]">
                  About Our Impact
                </Link>
                <Link href="/content/about-us/about-the-founder/57073" target="_blank" onClick={onClose} className="py-1 text-gray-700 hover:text-[#9c8a6c]">
                  About the Founder
                </Link>
                <Link href="/content/about-us/about-anuprerna-studio/53794" target="_blank" onClick={onClose} className="py-1 text-gray-700 hover:text-[#9c8a6c]">
                  About the Studio
                </Link>
                <Link href="/contact" onClick={onClose} className="py-1 text-gray-700 hover:text-[#9c8a6c]">
                  Contact Us
                </Link>
              </div>
            )}
          </div>

          {/* B2B */}
          <div className="border-b border-[#efeee9] py-2">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection("b2b")}>
              <span className="hover:text-[#9c8a6c]">B2B</span>
              <span className="material-symbols-outlined text-lg">
                {openSection === "b2b" ? "expand_less" : "expand_more"}
              </span>
            </div>
            {openSection === "b2b" && (
              <div className="mt-2 pl-3 flex flex-col gap-2 text-xs bg-[#B78F9D]/10 p-2 rounded-md">
                <Link href="/wholesale-partner-program" target="_blank" onClick={onClose} className="py-1 text-gray-700 hover:text-[#9c8a6c]">
                  Wholesale Partner Program
                </Link>
                <Link href="/artisanflow" target="_blank" onClick={onClose} className="py-1 text-gray-700 hover:text-[#9c8a6c]">
                  Traceability Platform: ArtisanFlow
                </Link>
                <Link href="/content/wholesale/order-fabric-swatches/59195" target="_blank" onClick={onClose} className="py-1 text-gray-700 hover:text-[#9c8a6c]">
                  Order Fabric Swatches
                </Link>
                <Link href="/content/wholesale/natural-sustainable-custom-dyeing/59105" target="_blank" onClick={onClose} className="py-1 text-gray-700 hover:text-[#9c8a6c]">
                  Sustainable Dyeing
                </Link>
                <Link href="/content/wholesale/eco-printing/24862107" target="_blank" onClick={onClose} className="py-1 text-gray-700 hover:text-[#9c8a6c]">
                  Sustainable Printing
                </Link>
                <Link href="/content/wholesale/wholesale-production-preorder/59335" target="_blank" onClick={onClose} className="py-1 text-gray-700 hover:text-[#9c8a6c]">
                  Custom Fabric Production
                </Link>
                <Link href="/content/wholesale/custom-clothing-accessories-homewares/703160" target="_blank" onClick={onClose} className="py-1 text-gray-700 hover:text-[#9c8a6c]">
                  Finished Product Development
                </Link>
              </div>
            )}
          </div>
        </div>
      </menu>
    </div>
  );
}
