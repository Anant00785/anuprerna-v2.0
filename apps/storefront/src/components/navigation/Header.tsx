"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { NotificationBar } from "./NotificationBar";
import { ForexDropdown } from "./ForexDropdown";
import { CustomerDropdown } from "./CustomerDropdown";
import { MobileMenu } from "./MobileMenu";
import {
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
  NavigationCraftOption,
  NavigationStoryOption,
  generateCategoryRedirectionLink,
  generateSegmentRedirectionLink,
  generateRedirectionLink,
  createCategoryUrl,
} from "../../lib/data/navigationData";

export function Header() {
  const [showNotification, setShowNotification] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tenantName, setTenantName] = useState("Guest");

  // Dynamic image previews on hover
  const [selectedAccessory, setSelectedAccessory] = useState<NavigationCraftOption>(
    INITIAL_NAVIGATION_ACCESSORIES[0]?.optionList[0] || { id: 0, subCategoryName: "" }
  );
  const [selectedHomeware, setSelectedHomeware] = useState<NavigationCraftOption>(
    INITIAL_NAVIGATION_HOME[0]?.optionList[0] || { id: 0, subCategoryName: "" }
  );
  const [selectedApparel, setSelectedApparel] = useState<NavigationCraftOption>(
    INITIAL_NAVIGATION_APPAREL[0]?.optionList[0] || { id: 0, subCategoryName: "" }
  );
  const [selectedCraftsStory, setSelectedCraftsStory] = useState<NavigationStoryOption>(
    INITIAL_NAVIGATION_STORY_CRAFTS[0]?.optionList[0] || { storyId: 0, storyTitle: "", slug: "", bannerImage: "" }
  );
  const [selectedClusterStory, setSelectedClusterStory] = useState<NavigationStoryOption>(
    INITIAL_NAVIGATION_STORY_CLUSTERS[0]?.optionList[0] || { storyId: 0, storyTitle: "", slug: "", bannerImage: "" }
  );
  const [selectedCollaborationStory, setSelectedCollaborationStory] = useState<NavigationStoryOption>(
    INITIAL_NAVIGATION_STORY_COLLABORATIONS[0]?.optionList[0] || { storyId: 0, storyTitle: "", slug: "", bannerImage: "" }
  );

  const navRef = useRef<HTMLDivElement>(null);

  const handleNavMouseEnter = (menuName: string) => {
    setActiveDropdown(menuName);
  };

  const handleNavMouseLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <header className="desk_nav w-full sticky top-0 z-50 bg-white border-b border-[#efeee9] shadow-xs">


      {/* Main Navigation Container */}
      <div className="fb-s-navigation-container w-full flex justify-center items-center relative">
        <nav ref={navRef} className="fb-s-navigation w-full max-w-[1536px] mx-auto flex justify-between items-center gap-2 px-4 py-3 xl:py-0 relative">

          {/* Logo Section */}
          <div className="xl:flex-[12%] flex justify-start items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="hamburger xl:hidden p-1 text-gray-800 hover:text-black"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-2xl leading-none">
                {isMobileMenuOpen ? "close" : "menu"}
              </span>
            </button>

            <Link href="/" className="flex justify-start items-center gap-1">
              <img
                className="fb-logo-svg h-5 lg:h-6 xl:h-8 object-contain"
                src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/logo_black.svg"
                alt="Anuprerna Logo"
              />
              <div className="font-bold text-base lg:text-xl text-gray-900 tracking-tight">
                <span className="opacity-0 hidden">A</span>nuprerna
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links & Single Mega Dropdowns */}
          <ul className="xl:flex-[63%] text-sm xl:text-base hidden xl:flex justify-start items-center font-medium">

            {/* 1. FABRIC */}
            <li
              className="fb-s-nav-link py-4 px-3 xl:px-5 relative group cursor-pointer"
              onMouseEnter={() => handleNavMouseEnter("fabric")}
              onMouseLeave={handleNavMouseLeave}
            >
              <Link href="/products/fabric" className={`fb-s-nav-main transition-colors ${activeDropdown === "fabric" ? "text-[#9c8a6c]" : "text-gray-800 hover:text-[#9c8a6c]"}`}>
                Fabric
              </Link>

              {activeDropdown === "fabric" && (
                <div className="fb-s-nav-dropdown absolute top-[calc(100%-4px)] left-0 bg-white text-gray-800 p-3 rounded-lg shadow-2xl z-50 text-xs min-w-[980px] border-3 border-[#EFEEE9] animate-in fade-in duration-150">
                  <span className="dropdown-arrow" style={{ left: "30px" }} />

                  <div className="flex justify-between items-stretch gap-1">
                    {/* Crafts (3 cols grid) */}
                    <div className="grid grid-cols-3 flex-[55%] color-tetradic-3 rounded-md pt-2 p-2">
                      {INITIAL_NAVIGATION_CRAFT.map((segment) => (
                        <div key={segment.id} className="fb-sn-section rounded px-3 py-2 mx-1">
                          <div className="fb-sn-category capitalize font-bold mb-2 text-gray-900 text-xs tracking-wider">
                            {segment.segmentCategoryName.toLowerCase() !== "swatchkit" ? (
                              <Link
                                href={generateCategoryRedirectionLink("/products/fabric", segment)}
                                className="cursor-pointer hover:underline"
                              >
                                {segment.segmentCategoryName}
                              </Link>
                            ) : (
                              <Link
                                href="/products/fabric?category=swatchkit"
                                className="bg-[#B78F9D] text-white rounded-md px-2.5 py-1 cursor-pointer text-xs font-semibold whitespace-nowrap inline-block shadow-sm hover:bg-[#a37987]"
                              >
                                Order A SwatchKit
                              </Link>
                            )}
                          </div>
                          {segment.segmentCategoryName.toLowerCase() !== "swatchkit" &&
                            segment.optionList.map((subCategory) => (
                              <div key={subCategory.id} className="fb-sn-sub-category my-[3px]">
                                {subCategory.subCategoryName !== "Custom Product" && (
                                  <Link
                                    href={generateSegmentRedirectionLink("/products/fabric", segment.segmentCategoryName, subCategory.subCategoryName)}
                                    className="capitalize hover:underline cursor-pointer text-gray-700 hover:text-[#9c8a6c] block text-xs"
                                  >
                                    {subCategory.subCategoryName.toLowerCase()}
                                  </Link>
                                )}
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>

                    {/* Material */}
                    <div className="flex flex-wrap flex-[15%] color-tetradic-1 rounded-md p-2">
                      <div className="w-full fb-sn-section rounded px-1.5 py-3 mx-1 my-1">
                        <div className="fb-sn-category capitalize font-bold mb-2 text-gray-900 text-xs">Material</div>
                        {INITIAL_NAVIGATION_MATERIALS.map((material) => (
                          <div key={material.materialId} className="fb-sn-sub-category my-[3px]">
                            <Link
                              href={generateRedirectionLink("/products/fabric", "material", material.materialName)}
                              className="capitalize hover:underline cursor-pointer text-gray-700 hover:text-[#9c8a6c] block text-xs"
                            >
                              {material.materialName.toLowerCase()}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pattern */}
                    <div className="flex flex-wrap flex-[15%] color-tetradic-2 rounded-md p-2">
                      <div className="w-full fb-sn-section rounded px-1.5 py-3 mx-1 my-1">
                        <div className="fb-sn-category capitalize font-bold mb-2 text-gray-900 text-xs">Pattern</div>
                        {INITIAL_NAVIGATION_PATTERNS.map((pattern) => (
                          <div key={pattern.patternId} className="fb-sn-sub-category my-[3px]">
                            <Link
                              href={generateRedirectionLink("/products/fabric", "pattern", pattern.patternName)}
                              className="capitalize hover:underline cursor-pointer text-gray-700 hover:text-[#9c8a6c] block text-xs"
                            >
                              {pattern.patternName.toLowerCase()}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Color */}
                    <div className="flex flex-wrap flex-[15%] rounded-md p-2 bg-white">
                      <div className="w-full fb-sn-section rounded px-1.5 py-3 mx-1 my-1">
                        <div className="fb-sn-category capitalize font-bold mb-2 text-gray-900 text-xs">Color</div>
                        {INITIAL_NAVIGATION_COLORS.map((color) => (
                          <div key={color.colorId} className="fb-sn-sub-category fb-sn-colors my-[2px]">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-4 h-4 border border-gray-300 inline-block rounded-xs shadow-2xs"
                                style={{ backgroundColor: color.colorHexCode }}
                              />
                              <Link
                                href={generateRedirectionLink("/products/fabric", "color", color.colorLabel)}
                                className="capitalize cursor-pointer hover:underline text-gray-700 text-xs"
                              >
                                {color.colorLabel}
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </li>

            {/* 2. ACCESSORIES */}
            <li
              className="fb-s-nav-link py-4 px-3 xl:px-5 relative group cursor-pointer"
              onMouseEnter={() => handleNavMouseEnter("accessories")}
              onMouseLeave={handleNavMouseLeave}
            >
              <Link href="/products/finished?category=accessories" className={`fb-s-nav-main transition-colors ${activeDropdown === "accessories" ? "text-[#9c8a6c]" : "text-gray-800 hover:text-[#9c8a6c]"}`}>
                Accessories
              </Link>

              {activeDropdown === "accessories" && (
                <div className="fb-s-nav-dropdown absolute top-[calc(100%-4px)] left-0 bg-white text-gray-800 p-3 rounded-lg shadow-2xl z-50 text-xs min-w-[760px] border-3 border-[#EFEEE9] animate-in fade-in duration-150">
                  <span className="dropdown-arrow" style={{ left: "45px" }} />
                  <div className="flex justify-between items-stretch gap-6">
                    <div className="fb-sn-segment grid grid-cols-3 flex-[55%] color-complementary rounded-md pt-2 p-2 max-h-[450px] overflow-y-auto">
                      {INITIAL_NAVIGATION_ACCESSORIES.map((segment) => (
                        <div key={segment.id} className="fb-sn-section rounded px-3 py-2 mx-1">
                          <div className="fb-sn-category capitalize font-bold mb-2 text-gray-900 text-xs">
                            <Link
                              href={generateCategoryRedirectionLink("/products/finished", segment, "accessories")}
                              className="cursor-pointer hover:underline"
                            >
                              {segment.segmentCategoryName}
                            </Link>
                          </div>
                          {segment.optionList.map((subCategory) => (
                            <div key={subCategory.id} className="fb-sn-sub-category my-[3px]">
                              {subCategory.subCategoryName !== "Custom Product" && (
                                <Link
                                  href={generateSegmentRedirectionLink("/products/finished", segment.segmentCategoryName, subCategory.subCategoryName, "accessories")}
                                  onMouseEnter={() => setSelectedAccessory(subCategory)}
                                  className="capitalize hover:underline cursor-pointer text-gray-700 hover:text-[#9c8a6c] block text-xs"
                                >
                                  {subCategory.subCategoryName.toLowerCase()}
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <img
                      className="flex-[45%] w-full max-w-[360px] max-h-[440px] object-cover rounded-md shadow-sm"
                      src={selectedAccessory.subCategoryFeaturedImage || "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80"}
                      alt={selectedAccessory.subCategoryName}
                    />
                  </div>
                </div>
              )}
            </li>

            {/* 3. HOMEWARE */}
            <li
              className="fb-s-nav-link py-4 px-3 xl:px-5 relative group cursor-pointer"
              onMouseEnter={() => handleNavMouseEnter("homeware")}
              onMouseLeave={handleNavMouseLeave}
            >
              <Link href="/products/finished?category=home" className={`fb-s-nav-main transition-colors ${activeDropdown === "homeware" ? "text-[#9c8a6c]" : "text-gray-800 hover:text-[#9c8a6c]"}`}>
                Homeware
              </Link>

              {activeDropdown === "homeware" && (
                <div className="fb-s-nav-dropdown absolute top-[calc(100%-4px)] -left-16 bg-white text-gray-800 p-3 rounded-lg shadow-2xl z-50 text-xs min-w-[760px] border-3 border-[#EFEEE9] animate-in fade-in duration-150">
                  <span className="dropdown-arrow" style={{ left: "105px" }} />
                  <div className="flex justify-between items-stretch gap-6">
                    <div className="fb-sn-segment grid grid-cols-3 flex-[55%] color-analogous-1 rounded-md pt-2 p-2 max-h-[450px] overflow-y-auto">
                      {INITIAL_NAVIGATION_HOME.map((segment) => (
                        <div key={segment.id} className="fb-sn-section rounded px-3 py-2 mx-1">
                          <div className="fb-sn-category capitalize font-bold mb-2 text-gray-900 text-xs">
                            <Link
                              href={generateCategoryRedirectionLink("/products/finished", segment, "home")}
                              className="cursor-pointer hover:underline"
                            >
                              {segment.segmentCategoryName}
                            </Link>
                          </div>
                          {segment.optionList.map((subCategory) => (
                            <div key={subCategory.id} className="fb-sn-sub-category my-[3px]">
                              {subCategory.subCategoryName !== "Custom Product" && (
                                <Link
                                  href={generateSegmentRedirectionLink("/products/finished", segment.segmentCategoryName, subCategory.subCategoryName, "home")}
                                  onMouseEnter={() => setSelectedHomeware(subCategory)}
                                  className="capitalize hover:underline cursor-pointer text-gray-700 hover:text-[#9c8a6c] block text-xs"
                                >
                                  {subCategory.subCategoryName.toLowerCase()}
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <img
                      className="flex-[45%] w-full max-w-[360px] max-h-[440px] object-cover rounded-md shadow-sm"
                      src={selectedHomeware.subCategoryFeaturedImage || "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80"}
                      alt={selectedHomeware.subCategoryName}
                    />
                  </div>
                </div>
              )}
            </li>

            {/* 4. APPAREL */}
            <li
              className="fb-s-nav-link py-4 px-3 xl:px-5 relative group cursor-pointer"
              onMouseEnter={() => handleNavMouseEnter("apparel")}
              onMouseLeave={handleNavMouseLeave}
            >
              <Link href="/products/finished?category=apparel" className={`fb-s-nav-main transition-colors ${activeDropdown === "apparel" ? "text-[#9c8a6c]" : "text-gray-800 hover:text-[#9c8a6c]"}`}>
                Apparel
              </Link>

              {activeDropdown === "apparel" && (
                <div className="fb-s-nav-dropdown absolute top-[calc(100%-4px)] -left-32 bg-white text-gray-800 p-3 rounded-lg shadow-2xl z-50 text-xs min-w-[760px] border-3 border-[#EFEEE9] animate-in fade-in duration-150">
                  <span className="dropdown-arrow" style={{ left: "165px" }} />
                  <div className="flex justify-between items-center gap-6">
                    <div className="fb-sn-segment grid grid-cols-3 flex-[55%] color-analogous-2 rounded-md pt-2 p-2 max-h-[450px] overflow-y-auto">
                      {INITIAL_NAVIGATION_APPAREL.map((segment) => (
                        <div key={segment.id} className="fb-sn-section rounded px-3 py-2 mx-1">
                          <div className="fb-sn-category capitalize font-bold mb-2 text-gray-900 text-xs">
                            <Link
                              href={generateCategoryRedirectionLink("/products/finished", segment, "apparel")}
                              className="cursor-pointer hover:underline"
                            >
                              {segment.segmentCategoryName}
                            </Link>
                          </div>
                          {segment.optionList.map((subCategory) => (
                            <div key={subCategory.id} className="fb-sn-sub-category my-[3px]">
                              {subCategory.subCategoryName !== "Custom Product" && (
                                <Link
                                  href={generateSegmentRedirectionLink("/products/finished", segment.segmentCategoryName, subCategory.subCategoryName, "apparel")}
                                  onMouseEnter={() => setSelectedApparel(subCategory)}
                                  className="capitalize hover:underline cursor-pointer text-gray-700 hover:text-[#9c8a6c] block text-xs"
                                >
                                  {subCategory.subCategoryName.toLowerCase()}
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <img
                      className="flex-[45%] w-full max-w-[360px] max-h-[440px] object-cover rounded-md shadow-sm"
                      src={selectedApparel.subCategoryFeaturedImage || "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80"}
                      alt={selectedApparel.subCategoryName}
                    />
                  </div>
                </div>
              )}
            </li>

            {/* 5. COLLABORATIONS */}
            <li
              className="fb-s-nav-link py-4 px-3 xl:px-5 relative group cursor-pointer"
              onMouseEnter={() => handleNavMouseEnter("collaborations")}
              onMouseLeave={handleNavMouseLeave}
            >
              <Link href="/stories" className={`fb-s-nav-main transition-colors ${activeDropdown === "collaborations" ? "text-[#9c8a6c]" : "text-gray-800 hover:text-[#9c8a6c]"}`}>
                Collaborations
              </Link>

              {activeDropdown === "collaborations" && (
                <div className="fb-s-nav-dropdown absolute top-[calc(100%-4px)] -left-[280px] bg-white text-gray-800 p-3 rounded-lg shadow-2xl z-50 text-xs min-w-[950px] border-3 border-[#EFEEE9] animate-in fade-in duration-150">
                  <span className="dropdown-arrow" style={{ left: "325px" }} />
                  <div className="container-d grid grid-cols-2 gap-3 p-1">

                    {/* Left Half: Crafts & Clusters Top + Collaborations Bottom */}
                    <div>
                      <div className="font-bold text-sm mb-1 text-gray-900">Crafts & Clusters</div>
                      <div className="flex flex-col justify-between items-stretch gap-1">

                        {/* Crafts Top Grid + Image */}
                        <div className="grid grid-cols-2 flex-[50%] pt-2 gap-x-3">
                          <div className="fb-sn-segment color-tetradic-3 rounded-md p-2">
                            <div className="font-bold text-xs px-2 py-1 text-[#b37487]">Crafts</div>
                            <div className="grid grid-cols-2">
                              {INITIAL_NAVIGATION_STORY_CRAFTS.map((story) => (
                                <div key={story.id} className="fb-sn-section rounded px-2 py-1 mx-0.5">
                                  <div className="fb-sn-category capitalize font-bold mb-1.5 text-gray-900 text-xs">
                                    <Link href={createCategoryUrl(story.storyCategoryName)}>
                                      {story.storyCategoryName.toLowerCase()}
                                    </Link>
                                  </div>
                                  {story.optionList.map((subCategory) => (
                                    <div key={subCategory.storyId} className="fb-sn-sub-category my-[2px]">
                                      {subCategory.storyTitle !== "Custom Product" && (
                                        <Link
                                          href={`/stories/${subCategory.slug}/${subCategory.storyId}`}
                                          onMouseEnter={() => setSelectedCraftsStory(subCategory)}
                                          className="capitalize hover:underline cursor-pointer text-gray-700 hover:text-[#9c8a6c] block text-xs"
                                        >
                                          {subCategory.storyTitle.toLowerCase()}
                                        </Link>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                          <img
                            className="h-full max-h-[190px] w-full object-cover rounded-md shadow-sm"
                            src={selectedCraftsStory.bannerImage || "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80"}
                            alt={selectedCraftsStory.storyTitle}
                          />
                        </div>

                        {/* Collaborations Bottom Grid + Image */}
                        <div>
                          <div className="font-bold text-sm my-1 text-gray-900">Collaborations</div>
                          <div className="flex-[50%] flex justify-start items-stretch gap-2">
                            <div className="fb-sn-segment designers grid grid-cols-1 w-full color-tetradic-2 rounded-md p-2">
                              {INITIAL_NAVIGATION_STORY_COLLABORATIONS.map((story) => (
                                <div key={story.id} className="fb-sn-section rounded px-2 py-1 mx-0.5">
                                  <div className="fb-sn-category capitalize font-bold mb-1.5 text-gray-900 text-xs">
                                    <Link href={createCategoryUrl(story.storyCategoryName)}>
                                      {story.storyCategoryName}
                                    </Link>
                                  </div>
                                  {story.optionList.map((subCategory) => (
                                    <div key={subCategory.storyId} className="fb-sn-sub-category my-[2px]">
                                      {subCategory.storyTitle !== "Custom Product" && (
                                        <Link
                                          href={`/stories/${subCategory.slug}/${subCategory.storyId}`}
                                          onMouseEnter={() => setSelectedCollaborationStory(subCategory)}
                                          className="capitalize hover:underline cursor-pointer text-gray-700 hover:text-[#9c8a6c] block text-xs"
                                        >
                                          {subCategory.storyTitle.toLowerCase()}
                                        </Link>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                            <img
                              className="designers max-w-[260px] h-[130px] object-cover rounded-md shadow-sm"
                              src={selectedCollaborationStory.bannerImage || "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80"}
                              alt={selectedCollaborationStory.storyTitle}
                            />
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Right Half: Clusters Grid + Image & Discover CTA */}
                    <div className="grid grid-cols-2 pt-2 gap-x-3 mt-5">
                      <div className="fb-cluster-segment overflow-y-auto color-tetradic-1 rounded-md p-2 max-h-[360px]">
                        <div className="font-bold text-xs px-2 py-1 text-[#4c6e5d]">Clusters</div>
                        <div className="grid grid-cols-2 gap-1">
                          {INITIAL_NAVIGATION_STORY_CLUSTERS.map((story) => (
                            <div key={story.id} className="fb-sn-section rounded px-2 py-1 mx-0.5">
                              <div className="fb-sn-category capitalize font-bold mb-1.5 text-gray-900 text-xs">
                                <Link href={createCategoryUrl(story.storyCategoryName)}>
                                  {story.storyCategoryName}
                                </Link>
                              </div>
                              {story.optionList.map((subCategory) => (
                                <div key={subCategory.storyId} className="fb-sn-sub-category my-[2px]">
                                  {subCategory.storyTitle !== "Custom Product" && (
                                    <Link
                                      href={`/stories/${subCategory.slug}/${subCategory.storyId}`}
                                      onMouseEnter={() => setSelectedClusterStory(subCategory)}
                                      className="capitalize hover:underline cursor-pointer text-gray-700 hover:text-[#9c8a6c] block text-xs"
                                    >
                                      {subCategory.storyTitle.toLowerCase()}
                                    </Link>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col justify-stretch items-stretch gap-2">
                        <img
                          className="object-cover rounded-md h-[70%] max-h-[220px] shadow-sm"
                          src={selectedClusterStory.bannerImage || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"}
                          alt={selectedClusterStory.storyTitle}
                        />
                        <div className="h-[30%] color-base rounded-md flex justify-center items-center p-2 text-center">
                          <Link href="/story" className="fb-arrow-btn flex items-center justify-center font-medium">
                            <span className="mr-1 text-xs">Discover More About Our Journey</span>
                            <svg className="HoverArrow w-2.5 h-2.5" viewBox="0 0 10 10" aria-hidden="true">
                              <g fillRule="evenodd">
                                <path className="HoverArrow__linePath" d="M0 5h7" />
                                <path className="HoverArrow__tipPath" d="M1 1l4 4-4 4" />
                              </g>
                            </svg>
                          </Link>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>
              )}
            </li>

            {/* 6. OUR STORY */}
            <li
              className="fb-s-nav-link py-4 px-3 xl:px-5 relative group cursor-pointer whitespace-nowrap"
              onMouseEnter={() => handleNavMouseEnter("ourstory")}
              onMouseLeave={handleNavMouseLeave}
            >
              <span className={`fb-s-nav-main transition-colors ${activeDropdown === "ourstory" ? "text-[#9c8a6c]" : "text-gray-800 hover:text-[#9c8a6c]"}`}>Our Story</span>

              {activeDropdown === "ourstory" && (
                <div className="fb-s-nav-dropdown absolute top-[calc(100%-4px)] -left-[140px] bg-white text-gray-800 p-3 rounded-lg shadow-2xl z-50 text-xs min-w-[520px] border-3 border-[#EFEEE9] animate-in fade-in duration-150">
                  <span className="dropdown-arrow" style={{ left: "175px" }} />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="fb-sn-section color-tetradic-1 rounded-md px-3 py-3">
                      <div className="fb-sn-category capitalize font-bold mb-2 text-gray-900 text-xs">About Us</div>
                      <div className="fb-sn-sub-category flex flex-col gap-1.5">
                        <Link href="/content/about-us/about-the-brand/56485" target="_blank" className="hover:underline text-gray-700 hover:text-[#9c8a6c]">
                          About The Brand
                        </Link>
                        <Link href="/content/about-us/about-our-impact/57938" target="_blank" className="hover:underline text-gray-700 hover:text-[#9c8a6c]">
                          About Our Impact
                        </Link>
                        <Link href="/content/about-us/about-the-founder/57073" target="_blank" className="hover:underline text-gray-700 hover:text-[#9c8a6c]">
                          About the Founder
                        </Link>
                        <Link href="/content/about-us/about-anuprerna-studio/53794" target="_blank" className="hover:underline text-gray-700 hover:text-[#9c8a6c]">
                          About the Studio
                        </Link>
                        <Link href="/contact" className="hover:underline text-gray-700 hover:text-[#9c8a6c]">
                          Contact Us
                        </Link>
                      </div>
                    </div>

                    <div className="fb-sn-section color-complementary-2 rounded-md px-3 py-3">
                      <div className="fb-sn-category capitalize font-bold mb-2 text-gray-900 text-xs">Care Guide</div>
                      <div className="fb-sn-sub-category flex flex-col gap-1.5">
                        <Link href="/content/care-guide/how-to-nurture-your-natural-dyed-clothing/126408" target="_blank" className="hover:underline text-gray-700 hover:text-[#9c8a6c]">
                          Natural Dyed Fabric CareGuide
                        </Link>
                        <Link href="/content/care-guide/handmade-textiles-care-guide/108968" target="_blank" className="hover:underline text-gray-700 hover:text-[#9c8a6c]">
                          Handmade Textiles CareGuide
                        </Link>
                        <Link href="/content/care-guide/say-goodbye-to-shrinkage-a-guide-for-fabric-care/2114526" target="_blank" className="hover:underline text-gray-700 hover:text-[#9c8a6c]">
                          Fabric Shrinkage CareGuide
                        </Link>
                      </div>
                    </div>

                    <div className="col-span-2 color-analogous-1 rounded-md flex justify-center items-center min-h-[60px] p-2">
                      <Link href="/blogs" target="_blank" className="fb-arrow-btn flex items-center justify-center font-medium">
                        <span className="mr-1 text-xs">Read More Of Our Stories</span>
                        <svg className="HoverArrow w-2.5 h-2.5" viewBox="0 0 10 10" aria-hidden="true">
                          <g fillRule="evenodd">
                            <path className="HoverArrow__linePath" d="M0 5h7" />
                            <path className="HoverArrow__tipPath" d="M1 1l4 4-4 4" />
                          </g>
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </li>

            {/* 7. B2B */}
            <li
              className="fb-s-nav-link py-4 px-3 xl:px-5 relative group cursor-pointer whitespace-nowrap"
              onMouseEnter={() => handleNavMouseEnter("b2b")}
              onMouseLeave={handleNavMouseLeave}
            >
              <span className={`fb-s-nav-main transition-colors ${activeDropdown === "b2b" ? "text-[#9c8a6c]" : "text-gray-800 hover:text-[#9c8a6c]"}`}>B2B</span>

              {activeDropdown === "b2b" && (
                <div className="fb-s-nav-dropdown absolute top-[calc(100%-4px)] -left-[140px] bg-white text-gray-800 p-3 rounded-lg shadow-2xl z-50 text-xs min-w-[340px] border-3 border-[#EFEEE9] animate-in fade-in duration-150">
                  <span className="dropdown-arrow" style={{ left: "155px" }} />
                  <div className="grid grid-cols-1 gap-1">
                    <div className="fb-sn-section color-tetradic-3 rounded-md px-3 py-3">
                      <div className="fb-sn-category capitalize font-bold mb-2 text-gray-900 text-xs">Wholesale for Brands</div>
                      <div className="fb-sn-sub-category flex flex-col gap-1.5 text-gray-700">
                        <Link href="/wholesale-partner-program" target="_blank" className="hover:underline hover:text-[#9c8a6c]">
                          Wholesale <span className="font-bold">Partner</span> Program
                        </Link>
                        <Link href="/artisanflow" target="_blank" className="hover:underline hover:text-[#9c8a6c]">
                          Traceability Platform: <span className="font-bold">ArtisanFlow</span>
                        </Link>
                        <Link href="/content/wholesale/order-fabric-swatches/59195" target="_blank" className="hover:underline hover:text-[#9c8a6c]">
                          Order Fabric Swatches
                        </Link>
                        <Link href="/content/wholesale/natural-sustainable-custom-dyeing/59105" target="_blank" className="hover:underline hover:text-[#9c8a6c]">
                          Sustainable Dyeing
                        </Link>
                        <Link href="/content/wholesale/eco-printing/24862107" target="_blank" className="hover:underline hover:text-[#9c8a6c]">
                          Sustainable Printing
                        </Link>
                        <Link href="/content/wholesale/wholesale-production-preorder/59335" target="_blank" className="hover:underline hover:text-[#9c8a6c]">
                          Custom Fabric Production
                        </Link>
                        <Link href="/content/wholesale/custom-clothing-accessories-homewares/703160" target="_blank" className="hover:underline hover:text-[#9c8a6c]">
                          Finished Product Development
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </li>

            {/* 8. SEARCH */}
            <li className="fb-s-nav-link py-4 px-3 xl:px-5 hover:text-[#9c8a6c]">
              <Link href="/display/search" className="fb-s-nav-main flex justify-between items-center gap-1.5">
                <span className="material-symbols-outlined text-lg leading-none">search</span>
                <span>Search</span>
              </Link>
            </li>

          </ul>

          {/* Right Action Utilities Bar */}
          <div className="xl:flex-[25%] flex justify-end items-center gap-3 text-gray-800 font-medium">

            {/* Forex / Currency Switcher (Hidden on mobile, desktop only) */}
            <ForexDropdown className="hidden xl:block" />

            {/* Mobile Search Icon (xl:hidden) */}
            <Link href="/display/search" className="xl:hidden flex items-center p-1 hover:text-[#9c8a6c]" aria-label="Search">
              <span className="material-symbols-outlined text-xl">search</span>
            </Link>

            {/* Wishlist Link & Count Badge */}
            <Link href="/wishlist" className="flex items-center justify-center relative p-1 hover:text-[#9c8a6c]" aria-label="Wishlist">
              {wishlistCount > 0 && (
                <strong className="absolute -top-2 -right-2 count font-bold">
                  {wishlistCount}
                </strong>
              )}
              <span className="material-symbols-outlined text-xl">favorite</span>
            </Link>

            {/* Cart Link & Count Badge */}
            <Link href="/cart" className="flex items-center justify-center relative p-1 hover:text-[#9c8a6c]" aria-label="Cart">
              {cartCount > 0 && (
                <strong className="absolute -top-2 -right-2 count font-bold">
                  {cartCount}
                </strong>
              )}
              <span className="material-symbols-outlined text-xl">shopping_cart</span>
            </Link>

            {/* Sign In / Customer Account Dropdown */}
            <CustomerDropdown
              tenantName={tenantName}
              isLoggedIn={isLoggedIn}
              onLogout={() => {
                setIsLoggedIn(false);
                setTenantName("Guest");
              }}
            />

          </div>

        </nav>
      </div>

      {/* Mobile Menu Drawer */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isLoggedIn={isLoggedIn}
        tenantName={tenantName}
        navigationCraft={INITIAL_NAVIGATION_CRAFT}
        navigationMaterial={INITIAL_NAVIGATION_MATERIALS}
        navigationPattern={INITIAL_NAVIGATION_PATTERNS}
        navigationColor={INITIAL_NAVIGATION_COLORS}
        navigationAccessories={INITIAL_NAVIGATION_ACCESSORIES}
        navigationHome={INITIAL_NAVIGATION_HOME}
        navigationApparel={INITIAL_NAVIGATION_APPAREL}
        navigationStoryCrafts={INITIAL_NAVIGATION_STORY_CRAFTS}
        navigationStoryClusters={INITIAL_NAVIGATION_STORY_CLUSTERS}
        navigationStoryCollaborations={INITIAL_NAVIGATION_STORY_COLLABORATIONS}
      />
    </header>
  );
}
