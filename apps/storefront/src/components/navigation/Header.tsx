"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ForexDropdown } from "./ForexDropdown";
import { CustomerDropdown } from "./CustomerDropdown";
import { useAuthStore } from "@/stores/auth.store";
import { useCartStore } from "@/stores/cart.store";
import { useWishlistStore } from "@/stores/wishlist.store";
import { CartDrawer } from "./CartDrawer";
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
  NavigationCraft,
  NavigationCraftOption,
  NavigationStory,
  NavigationStoryOption,
  generateCategoryRedirectionLink,
  generateSegmentRedirectionLink,
  generateRedirectionLink,
  createCategoryUrl,
} from "../../lib/data/navigationData";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const wishlistSkus = useWishlistStore((s) => s.skus);
  // Was `useState(false)` / `useState("Guest")` with no setter ever called, so the
  // header read "Sign In" even while the profile pages showed the signed-in user.
  // `hydrated` gates it: the auth store is `persist`-backed, so on the server and
  // the first client render it is still empty — reading it directly would trip a
  // hydration mismatch.
  const { isLoggedIn: storeLoggedIn, user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const isLoggedIn = hydrated && storeLoggedIn;
  const wishlistCount = hydrated ? wishlistSkus.length : 0;
  const tenantName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.userName ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "Guest";

  // `cartCount` was `useState(0)` with no `setCartCount` call site anywhere, so
  // the badge was hardcoded to hidden however many items Loom actually held.
  // The count now comes from the shared cart store, which the PDP's Add to Cart
  // also refreshes. The store starts empty (not persisted), so server and first
  // client render both produce 0 and there is nothing to gate on `hydrated`.
  const openCart = useCartStore((s) => s.open);
  const refreshCart = useCartStore((s) => s.refresh);
  const cartCount = useCartStore((s) => s.cart?.itemCount ?? 0);

  // Loom scopes the cart to the bearer token, so there is nothing to fetch until
  // the auth store has hydrated and reports a signed-in customer.
  useEffect(() => {
    if (isLoggedIn) refreshCart();
  }, [isLoggedIn, refreshCart]);

  const pathname = usePathname();
  const isContactPage = pathname === "/contact";

  // Dynamic finished product navigation states
  const [accessoriesList, setAccessoriesList] = useState<NavigationCraft[]>(INITIAL_NAVIGATION_ACCESSORIES);
  const [homeList, setHomeList] = useState<NavigationCraft[]>(INITIAL_NAVIGATION_HOME);
  const [apparelList, setApparelList] = useState<NavigationCraft[]>(INITIAL_NAVIGATION_APPAREL);

  // Dynamic story navigation states
  const [storyCraftsList, setStoryCraftsList] = useState<NavigationStory[]>(INITIAL_NAVIGATION_STORY_CRAFTS);
  const [storyCollabsList, setStoryCollabsList] = useState<NavigationStory[]>(INITIAL_NAVIGATION_STORY_COLLABORATIONS);
  const [storyClustersList, setStoryClustersList] = useState<NavigationStory[]>(INITIAL_NAVIGATION_STORY_CLUSTERS);

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

  const dropdownBgRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadStoryNav() {
      try {
        const [crRes, colRes, clRes] = await Promise.all([
          fetch("/api/navigation/story/crafts"),
          fetch("/api/navigation/story/collaborations"),
          fetch("/api/navigation/story/clusters"),
        ]);

        if (isMounted) {
          if (crRes.ok) {
            const crData = await crRes.json();
            if (crData.data && Array.isArray(crData.data) && crData.data.length > 0) {
              setStoryCraftsList(crData.data);
              if (crData.data[0]?.optionList?.[0]) setSelectedCraftsStory(crData.data[0].optionList[0]);
            }
          }
          if (colRes.ok) {
            const colData = await colRes.json();
            if (colData.data && Array.isArray(colData.data) && colData.data.length > 0) {
              setStoryCollabsList(colData.data);
              if (colData.data[0]?.optionList?.[0]) setSelectedCollaborationStory(colData.data[0].optionList[0]);
            }
          }
          if (clRes.ok) {
            const clData = await clRes.json();
            if (clData.data && Array.isArray(clData.data) && clData.data.length > 0) {
              setStoryClustersList(clData.data);
              if (clData.data[0]?.optionList?.[0]) setSelectedClusterStory(clData.data[0].optionList[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load story navigation:", err);
      }
    }

    async function loadFinishedNav() {
      try {
        const [accRes, homeRes, appRes] = await Promise.all([
          fetch("/api/navigation/finish/accessories"),
          fetch("/api/navigation/finish/home"),
          fetch("/api/navigation/finish/apparel"),
        ]);

        if (isMounted) {
          if (accRes.ok) {
            const accData = await accRes.json();
            if (accData.data && Array.isArray(accData.data) && accData.data.length > 0) {
              setAccessoriesList(accData.data);
              if (accData.data[0]?.optionList?.[0]) setSelectedAccessory(accData.data[0].optionList[0]);
            }
          }
          if (homeRes.ok) {
            const homeData = await homeRes.json();
            if (homeData.data && Array.isArray(homeData.data) && homeData.data.length > 0) {
              setHomeList(homeData.data);
              if (homeData.data[0]?.optionList?.[0]) setSelectedHomeware(homeData.data[0].optionList[0]);
            }
          }
          if (appRes.ok) {
            const appData = await appRes.json();
            if (appData.data && Array.isArray(appData.data) && appData.data.length > 0) {
              setApparelList(appData.data);
              if (appData.data[0]?.optionList?.[0]) setSelectedApparel(appData.data[0].optionList[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load finished navigation:", err);
      }
    }

    loadStoryNav();
    loadFinishedNav();

    return () => {
      isMounted = false;
    };
  }, []);

  const onEnter = (e: React.MouseEvent<HTMLLIElement>) => {
    const dropdownBg = dropdownBgRef.current;
    const trigger = e.currentTarget;
    const dropdown = trigger.querySelector<HTMLElement>(".fb-s-nav-dropdown");
    const navbar = navRef.current;

    if (!dropdown || !navbar || !dropdownBg) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    trigger.classList.add("trigger-enter");
    timerRef.current = setTimeout(() => {
      if (trigger.classList.contains("trigger-enter")) {
        trigger.classList.add("trigger-enter-active");
      }
    }, 150);

    dropdownBg.classList.add("open");

    const dropdownCoords = dropdown.getBoundingClientRect();
    const navCoords = navbar.getBoundingClientRect();
    const viewportWidth = window.innerWidth || 0;

    let leftPosition = dropdownCoords.left - navCoords.left;

    if (dropdownCoords.right > viewportWidth) {
      leftPosition -= dropdownCoords.right - (viewportWidth - 30);
      dropdown.style.setProperty("left", `-${dropdownCoords.right - (viewportWidth - 10)}px`);
    }

    const coords = {
      height: dropdownCoords.height,
      width: dropdownCoords.width,
      top: dropdownCoords.top - navCoords.top,
      left: leftPosition,
    };

    dropdownBg.style.setProperty("width", `${coords.width}px`);
    dropdownBg.style.setProperty("height", `${coords.height}px`);
    dropdownBg.style.setProperty("transform", `translate(${coords.left}px, ${coords.top}px)`);

    const arrow = dropdownBg.querySelector<HTMLElement>(".arrow");
    if (arrow) {
      const triggerCoords = trigger.getBoundingClientRect();
      let leftPositionArrow = dropdownCoords.left;
      if (dropdownCoords.right > viewportWidth) {
        leftPositionArrow -= dropdownCoords.right - viewportWidth;
      }
      const arrowLeft =
        triggerCoords.left - leftPositionArrow + triggerCoords.width / 2 - arrow.offsetWidth / 2;
      arrow.style.setProperty("left", `${arrowLeft}px`);
    }
  };

  const onLeave = (e: React.MouseEvent<HTMLLIElement>) => {
    const dropdownBg = dropdownBgRef.current;
    const trigger = e.currentTarget;

    if (timerRef.current) clearTimeout(timerRef.current);

    trigger.classList.remove("trigger-enter", "trigger-enter-active");
    if (dropdownBg) {
      dropdownBg.classList.remove("open");
    }
  };

  return (
    <header className="desk_nav w-full sticky top-0 z-50 bg-white border-b border-[#efeee9] shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <nav ref={navRef} className="fb-s-navigation w-full max-w-[1440px] mx-auto flex justify-between items-center px-3 sm:px-6 lg:px-8">

        {/* Logo Section */}
        <div className="shrink-0 flex justify-start items-center gap-2 mr-3 lg:mr-6">
          {isContactPage ? (
            <Link
              href="/"
              className="flex items-center justify-center p-1 text-gray-850 hover:text-black"
              aria-label="Close contact"
            >
              <span className="material-symbols-outlined text-2xl font-light">close</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-6 h-6 flex items-center justify-center text-black hover:opacity-75 transition-opacity cursor-pointer select-none focus:outline-none shrink-0"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-[16px] h-[16px]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 2L14 14M2 14L14 2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[12px]" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="0" y1="1" x2="18" y2="1" />
                  <line x1="0" y1="6" x2="18" y2="6" />
                  <line x1="0" y1="11" x2="18" y2="11" />
                </svg>
              )}
            </button>
          )}

          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-1 shrink-0 outline-none focus:outline-none ring-0 border-0 select-none cursor-pointer"
          >
            <img
              className="h-6 lg:h-7 w-auto select-none block"
              src="https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/logo_black.svg"
              alt="Anuprerna"
            />
            <span className="font-bold text-lg lg:text-xl text-black tracking-tight select-none">
              nuprerna
            </span>
          </Link>
        </div>

        {/* Morphing Floating Background Box & Arrow */}
        <div ref={dropdownBgRef} className="dropdownBackground">
          <span className="arrow"></span>
        </div>

        {/* Desktop Navigation Links */}
        <ul className="hidden lg:flex items-center flex-1 justify-start gap-0.5 xl:gap-2 fb-default-transition">

          {/* 1. FABRIC */}
          <li className="fb-s-nav-link" onMouseEnter={onEnter} onMouseLeave={onLeave}>
            <Link href="/products/fabric" className="fb-s-nav-main">
              Fabric
            </Link>

            <div className="fb-s-nav-dropdown fb-fabric-dropdown">
              <div className="flex justify-between items-stretch gap-1">
                {/* Segment Crafts (3 cols) */}
                <div className="grid grid-cols-3 flex-[55%] color-tetradic-3 rounded-md pt-2">
                  {INITIAL_NAVIGATION_CRAFT.map((segment) => (
                    <div key={segment.id} className="fb-sn-section rounded px-3 py-2 mx-1 fb-default-transition">
                      <div className="fb-sn-category capitalize font-bold mb-2">
                        {segment.segmentCategoryName.toLowerCase() !== "swatchkit" ? (
                          <div>
                            <Link
                              href={generateCategoryRedirectionLink("/products/fabric", segment)}
                              className="cursor-pointer"
                            >
                              {segment.segmentCategoryName}
                            </Link>
                          </div>
                        ) : (
                          <div>
                            <Link
                              href="/products/fabric?category=swatchkit"
                              className="bg-[#B78F9D] text-white rounded-md px-2 py-1 cursor-pointer text-base whitespace-nowrap"
                            >
                              Order a SwatchKit
                            </Link>
                          </div>
                        )}
                      </div>
                      {segment.segmentCategoryName.toLowerCase() !== "swatchkit" &&
                        segment.optionList.map((subCategory) => (
                          <div key={subCategory.id} className="fb-sn-sub-category">
                            {subCategory.subCategoryName !== "Custom Product" && (
                              <div className="my-[3px]">
                                <Link
                                  href={generateSegmentRedirectionLink("/products/fabric", segment.segmentCategoryName, subCategory.subCategoryName)}
                                  className="capitalize hover:underline cursor-pointer"
                                >
                                  {subCategory.subCategoryName.toLowerCase()}
                                </Link>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ))}
                </div>

                {/* Material */}
                <div className="flex flex-wrap flex-[15%] color-tetradic-1 rounded-md">
                  <div className="w-full fb-sn-section rounded px-1.5 py-3 mx-1 my-1">
                    <div className="fb-sn-category capitalize font-bold mb-2">
                      <div>Material</div>
                    </div>
                    {INITIAL_NAVIGATION_MATERIALS.map((material) => (
                      <div key={material.materialId} className="fb-sn-sub-category">
                        <div className="my-[3px]">
                          <Link
                            href={generateRedirectionLink("/products/fabric", "material", material.materialName)}
                            className="capitalize hover:underline cursor-pointer"
                          >
                            {material.materialName.toLowerCase()}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pattern */}
                <div className="flex flex-wrap flex-[15%] color-tetradic-2 rounded-md">
                  <div className="w-full fb-sn-section rounded px-1.5 py-3 mx-1 my-1">
                    <div className="fb-sn-category capitalize font-bold mb-2">
                      <div>Pattern</div>
                    </div>
                    {INITIAL_NAVIGATION_PATTERNS.map((pattern) => (
                      <div key={pattern.patternId} className="fb-sn-sub-category">
                        <div className="my-[3px]">
                          <Link
                            href={generateRedirectionLink("/products/fabric", "pattern", pattern.patternName)}
                            className="capitalize hover:underline cursor-pointer"
                          >
                            {pattern.patternName.toLowerCase()}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="flex flex-wrap flex-[15%] rounded-md">
                  <div className="w-full fb-sn-section rounded px-1.5 py-3 mx-1 my-1">
                    <div className="fb-sn-category capitalize font-bold mb-2">
                      <div>Color</div>
                    </div>
                    {INITIAL_NAVIGATION_COLORS.map((color, idx) => (
                      <div key={color.colorId} className="fb-sn-sub-category fb-sn-colors">
                        <div className="flex justify-center items-center gap-1.5">
                          <span
                            className={`w-7 h-7 ${idx === 0 ? "rounded-top" : ""} ${
                              idx === INITIAL_NAVIGATION_COLORS.length - 1 ? "rounded-bottom" : ""
                            }`}
                            style={{ backgroundColor: color.colorHexCode }}
                          />
                          <Link
                            href={generateRedirectionLink("/products/fabric", "color", color.colorLabel)}
                            className="capitalize cursor-pointer"
                          >
                            {color.colorLabel.toLowerCase()}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </li>

          {/* 2. ACCESSORIES */}
          <li className="fb-s-nav-link" onMouseEnter={onEnter} onMouseLeave={onLeave}>
            <Link href="/products/finished?category=accessories" className="fb-s-nav-main">
              Accessories
            </Link>

            <div className="fb-s-nav-dropdown fb-finish-dropdown">
              <div className="flex justify-between items-stretch gap-6">
                <div className="fb-sn-segment grid grid-cols-3 flex-[55%] color-complementary rounded-md pt-2">
                  {accessoriesList.map((segment, sIdx) => (
                    <div key={segment.id || sIdx} className="fb-sn-section rounded px-3 py-2 mx-1 fb-default-transition">
                      <div className="fb-sn-category capitalize font-bold mb-2">
                        <div>
                          <Link
                            href={generateCategoryRedirectionLink("/products/finished", segment, "accessories")}
                            className="cursor-pointer"
                          >
                            {segment.segmentCategoryName}
                          </Link>
                        </div>
                      </div>
                      {segment.optionList.map((subCategory, subIdx) => (
                        <div key={subCategory.id || subIdx} className="fb-sn-sub-category">
                          {subCategory.subCategoryName !== "Custom Product" && (
                            <div className="my-[3px]">
                              <Link
                                href={generateSegmentRedirectionLink("/products/finished", segment.segmentCategoryName, subCategory.subCategoryName, "accessories")}
                                onMouseEnter={() => {
                                  if (subCategory.subCategoryFeaturedImage) setSelectedAccessory(subCategory);
                                }}
                                className="capitalize hover:underline cursor-pointer"
                              >
                                {subCategory.subCategoryName.toLowerCase()}
                              </Link>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex-[45%] w-full min-w-[300px] max-w-[400px] h-[440px] shrink-0 overflow-hidden rounded-md flex justify-center items-center bg-[#F7F7F7]">
                  <img
                    className="w-full h-full object-cover rounded-md"
                    src={selectedAccessory.subCategoryFeaturedImage || "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/O7L4ELP8YKCSPRNBYUH5KUD9I9SP00509.jpg"}
                    alt={selectedAccessory.subCategoryName || "Accessories"}
                    onError={(e) => {
                      e.currentTarget.src = "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/O7L4ELP8YKCSPRNBYUH5KUD9I9SP00509.jpg";
                    }}
                  />
                </div>
              </div>
            </div>
          </li>

          {/* 3. HOMEWARE */}
          <li className="fb-s-nav-link" onMouseEnter={onEnter} onMouseLeave={onLeave}>
            <Link href="/products/finished?category=home" className="fb-s-nav-main">
              Homeware
            </Link>

            <div className="fb-s-nav-dropdown fb-finish-dropdown">
              <div className="flex justify-between items-stretch gap-6">
                <div className="fb-sn-segment grid grid-cols-3 flex-[55%] color-analogous-1 rounded-md pt-2">
                  {homeList.map((segment, sIdx) => (
                    <div key={segment.id || sIdx} className="fb-sn-section rounded px-3 py-2 mx-1 fb-default-transition">
                      <div className="fb-sn-category capitalize font-bold mb-2">
                        <div>
                          <Link
                            href={generateCategoryRedirectionLink("/products/finished", segment, "home")}
                            className="cursor-pointer"
                          >
                            {segment.segmentCategoryName}
                          </Link>
                        </div>
                      </div>
                      {segment.optionList.map((subCategory, subIdx) => (
                        <div key={subCategory.id || subIdx} className="fb-sn-sub-category">
                          {subCategory.subCategoryName !== "Custom Product" && (
                            <div className="my-[3px]">
                              <Link
                                href={generateSegmentRedirectionLink("/products/finished", segment.segmentCategoryName, subCategory.subCategoryName, "home")}
                                onMouseEnter={() => {
                                  if (subCategory.subCategoryFeaturedImage) setSelectedHomeware(subCategory);
                                }}
                                className="capitalize hover:underline cursor-pointer"
                              >
                                {subCategory.subCategoryName.toLowerCase()}
                              </Link>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex-[45%] w-full min-w-[300px] max-w-[400px] h-[440px] shrink-0 overflow-hidden rounded-md flex justify-center items-center bg-[#F7F2EC]">
                  <img
                    className="w-full h-full object-cover rounded-md"
                    src={selectedHomeware.subCategoryFeaturedImage || "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/VBMCHG7919BHDT3QO5KVOSUTUR4B09493.jpg"}
                    alt={selectedHomeware.subCategoryName || "Homeware"}
                    onError={(e) => {
                      e.currentTarget.src = "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/VBMCHG7919BHDT3QO5KVOSUTUR4B09493.jpg";
                    }}
                  />
                </div>
              </div>
            </div>
          </li>

          {/* 4. APPAREL */}
          <li className="fb-s-nav-link" onMouseEnter={onEnter} onMouseLeave={onLeave}>
            <Link href="/products/finished?category=apparel" className="fb-s-nav-main">
              Apparel
            </Link>

            <div className="fb-s-nav-dropdown fb-finish-dropdown">
              <div className="flex justify-between items-center gap-6">
                <div className="fb-sn-segment grid grid-cols-3 flex-[55%] color-analogous-2 rounded-md pt-2">
                  {apparelList.map((segment, sIdx) => (
                    <div key={segment.id || sIdx} className="fb-sn-section rounded px-3 py-2 mx-1 fb-default-transition">
                      <div className="fb-sn-category capitalize font-bold mb-2">
                        <div>
                          <Link
                            href={generateCategoryRedirectionLink("/products/finished", segment, "apparel")}
                            className="cursor-pointer"
                          >
                            {segment.segmentCategoryName}
                          </Link>
                        </div>
                      </div>
                      {segment.optionList.map((subCategory, subIdx) => (
                        <div key={subCategory.id || subIdx} className="fb-sn-sub-category">
                          {subCategory.subCategoryName !== "Custom Product" && (
                            <div className="my-[3px]">
                              <Link
                                href={generateSegmentRedirectionLink("/products/finished", segment.segmentCategoryName, subCategory.subCategoryName, "apparel")}
                                onMouseEnter={() => {
                                  if (subCategory.subCategoryFeaturedImage) setSelectedApparel(subCategory);
                                }}
                                className="capitalize hover:underline cursor-pointer"
                              >
                                {subCategory.subCategoryName.toLowerCase()}
                              </Link>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="flex-[45%] w-full min-w-[300px] max-w-[400px] h-[440px] shrink-0 overflow-hidden rounded-md flex justify-center items-center bg-[#ECF4EE]">
                  <img
                    className="w-full h-full object-cover rounded-md"
                    src={selectedApparel.subCategoryFeaturedImage || "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/OWC16EOEXJ8PKUFI09181FK7H1FK02986.png"}
                    alt={selectedApparel.subCategoryName || "Apparel"}
                    onError={(e) => {
                      e.currentTarget.src = "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/OWC16EOEXJ8PKUFI09181FK7H1FK02986.png";
                    }}
                  />
                </div>
              </div>
            </div>
          </li>

          {/* 5. COLLABORATIONS */}
          <li className="fb-s-nav-link" onMouseEnter={onEnter} onMouseLeave={onLeave}>
            <Link href="/stories" className="fb-s-nav-main">
              Collaborations
            </Link>

            <div className="fb-s-nav-dropdown fb-story-dropdown">
              <div className="container-d grid grid-cols-2 gap-2">
                <div>
                  <div className="font-bold text-base">Crafts &amp; Clusters</div>
                  <div className="flex flex-col justify-between items-stretch gap-1">

                    {/* Crafts Top Grid + Image */}
                    <div className="grid grid-cols-2 flex-[50%] pt-2 gap-x-3">
                      <div className="fb-sn-segment color-tetradic-3 rounded-md">
                        <div className="font-bold text-base px-3 py-2 text-[#b37487]">Crafts</div>
                        <div className="grid grid-cols-2">
                          {storyCraftsList.map((story, sIdx) => (
                            <div key={story.id || story.storyCategoryName || sIdx} className="fb-sn-section rounded px-3 py-2 mx-1 fb-default-transition">
                              <div className="fb-sn-category capitalize font-bold mb-2">
                                <div>
                                  <Link href={createCategoryUrl(story.storyCategoryName)}>
                                    {story.storyCategoryName.toLowerCase()}
                                  </Link>
                                </div>
                              </div>
                              {story.optionList.map((subCategory, subIdx) => (
                                <div key={subCategory.storyId || subIdx} className="fb-sn-sub-category">
                                  {subCategory.storyTitle !== "Custom Product" && (
                                    <div className="my-[3px]">
                                      <Link
                                        href={`/stories/${subCategory.slug}/${subCategory.storyId}`}
                                        onMouseEnter={() => {
                                          if (subCategory.bannerImage) setSelectedCraftsStory(subCategory);
                                        }}
                                        className="capitalize hover:underline cursor-pointer"
                                      >
                                        {subCategory.storyTitle.toLowerCase()}
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                      <img
                        className="h-full object-cover rounded-md"
                        src={selectedCraftsStory.bannerImage || "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80"}
                        alt={selectedCraftsStory.storyTitle || "Crafts"}
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                    </div>

                    {/* Collaborations Bottom Grid + Image */}
                    <div>
                      <div className="font-bold text-base my-1.5">Collaborations</div>
                      <div className="flex-[50%] flex justify-start items-stretch gap-2">
                        <div className="fb-sn-segment designers grid grid-cols-1 w-full color-tetradic-2 rounded-md pt-2">
                          {storyCollabsList.map((story, sIdx) => (
                            <div key={story.id || story.storyCategoryName || sIdx} className="fb-sn-section rounded px-3 py-2 mx-1 fb-default-transition">
                              <div className="fb-sn-category capitalize font-bold mb-2">
                                <div>
                                  <Link href={createCategoryUrl(story.storyCategoryName)}>
                                    {story.storyCategoryName}
                                  </Link>
                                </div>
                              </div>
                              {story.optionList.map((subCategory, subIdx) => (
                                <div key={subCategory.storyId || subIdx} className="fb-sn-sub-category">
                                  {subCategory.storyTitle !== "Custom Product" && (
                                    <div className="my-[3px]">
                                      <Link
                                        href={`/stories/${subCategory.slug}/${subCategory.storyId}`}
                                        onMouseEnter={() => {
                                          if (subCategory.bannerImage) setSelectedCollaborationStory(subCategory);
                                        }}
                                        className="capitalize hover:underline cursor-pointer"
                                      >
                                        {subCategory.storyTitle.toLowerCase()}
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                        <img
                          className="designers max-w-[280px] h-[200px] object-cover rounded-md"
                          src={selectedCollaborationStory.bannerImage || "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80"}
                          alt={selectedCollaborationStory.storyTitle || "Collaborations"}
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Right Side: Clusters Grid + Image & Discover CTA */}
                <div className="grid grid-cols-2 pt-2 gap-x-3 mt-6">
                  <div className="fb-cluster-segment overflow-y-auto color-tetradic-1 rounded-md">
                    <div className="font-bold text-base px-3 py-2 text-[#4c6e5d]">Clusters</div>
                    <div className="grid grid-cols-2 gap-1">
                      {storyClustersList.map((story, sIdx) => (
                        <div key={story.id || story.storyCategoryName || sIdx} className="fb-sn-section rounded px-3 py-2 mx-1 fb-default-transition">
                          <div className="fb-sn-category capitalize font-bold mb-2">
                            <div>
                              <Link href={createCategoryUrl(story.storyCategoryName)}>
                                {story.storyCategoryName}
                              </Link>
                            </div>
                          </div>
                          {story.optionList.map((subCategory, subIdx) => (
                            <div key={subCategory.storyId || subIdx} className="fb-sn-sub-category">
                              {subCategory.storyTitle !== "Custom Product" && (
                                <div className="my-[3px]">
                                  <Link
                                    href={`/stories/${subCategory.slug}/${subCategory.storyId}`}
                                    onMouseEnter={() => {
                                      if (subCategory.bannerImage) setSelectedClusterStory(subCategory);
                                    }}
                                    className="capitalize hover:underline cursor-pointer"
                                  >
                                    {subCategory.storyTitle.toLowerCase()}
                                  </Link>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-stretch items-stretch gap-2">
                    <img
                      className="object-cover rounded-md h-[70%]"
                      src={selectedClusterStory.bannerImage || "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80"}
                      alt={selectedClusterStory.storyTitle || "Clusters"}
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <div className="h-[30%] color-base rounded-md flex justify-center items-center">
                      <Link href="/story" className="fb-arrow-btn flex items-center justify-center fb-default-transition">
                        <span className="mr-1">Discover More About Our Journey</span>
                        <svg className="HoverArrow" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                          <g fillRule="evenodd">
                            <path className="HoverArrow__linePath" d="M0 5h7"></path>
                            <path className="HoverArrow__tipPath" d="M1 1l4 4-4 4"></path>
                          </g>
                        </svg>
                      </Link>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </li>

          {/* 6. OUR STORY */}
          <li className="fb-s-nav-link" onMouseEnter={onEnter} onMouseLeave={onLeave}>
            <span className="fb-s-nav-main whitespace-nowrap">Our Story</span>

            <div className="fb-s-nav-dropdown fb-resources-dropdown dropdown-align-right">
              <div className="w-[520px] p-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="fb-sn-section bg-[#F6F8F6] rounded-lg p-4 border border-[#E3EBE3]">
                    <div className="fb-sn-category capitalize font-bold text-sm text-[#1F1F1F] mb-3 pb-2 border-b border-[#D8E4D8]">
                      About Us
                    </div>
                    <div className="fb-sn-sub-category flex flex-col gap-2 text-xs text-gray-700">
                      <Link href="/content/about-us/about-the-brand/56485" target="_blank" className="hover:text-[#2E5E4E] hover:translate-x-0.5 transition-all py-0.5">
                        About The Brand
                      </Link>
                      <Link href="/content/about-us/about-our-impact/57938" target="_blank" className="hover:text-[#2E5E4E] hover:translate-x-0.5 transition-all py-0.5">
                        About Our Impact
                      </Link>
                      <Link href="/content/about-us/about-the-founder/57073" target="_blank" className="hover:text-[#2E5E4E] hover:translate-x-0.5 transition-all py-0.5">
                        About the Founder
                      </Link>
                      <Link href="/content/about-us/about-anuprerna-studio/53794" target="_blank" className="hover:text-[#2E5E4E] hover:translate-x-0.5 transition-all py-0.5">
                        About the studio
                      </Link>
                      <Link href="/contact" className="hover:text-[#2E5E4E] hover:translate-x-0.5 transition-all py-0.5">
                        Contact Us
                      </Link>
                    </div>
                  </div>

                  <div className="fb-sn-section bg-[#FDF8F3] rounded-lg p-4 border border-[#F3E7DC]">
                    <div className="fb-sn-category capitalize font-bold text-sm text-[#1F1F1F] mb-3 pb-2 border-b border-[#ECDCCD]">
                      Care guide
                    </div>
                    <div className="fb-sn-sub-category flex flex-col gap-2 text-xs text-gray-700">
                      <Link href="/content/care-guide/how-to-nurture-your-natural-dyed-clothing/126408" target="_blank" className="hover:text-[#7D5A20] hover:translate-x-0.5 transition-all py-0.5">
                        Natural Dyed Fabric CareGuide
                      </Link>
                      <Link href="/content/care-guide/handmade-textiles-care-guide/108968" target="_blank" className="hover:text-[#7D5A20] hover:translate-x-0.5 transition-all py-0.5">
                        Handmade Textiles CareGuide
                      </Link>
                      <Link href="/content/care-guide/say-goodbye-to-shrinkage-a-guide-for-fabric-care/2114526" target="_blank" className="hover:text-[#7D5A20] hover:translate-x-0.5 transition-all py-0.5">
                        Fabric Shrinkage CareGuide
                      </Link>
                    </div>
                  </div>

                  <div className="fb-sn-section bg-[#FAF7F2] rounded-lg p-3 border border-[#EAE3D9] flex justify-center items-center col-span-2">
                    <Link href="/blogs" target="_blank" className="fb-arrow-btn flex items-center justify-center text-xs font-semibold text-[#7D5A20] hover:text-[#5A3F12] transition-colors">
                      <span className="mr-1">Read More Of Our Stories</span>
                      <svg className="HoverArrow" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                        <g fillRule="evenodd">
                          <path className="HoverArrow__linePath" d="M0 5h7"></path>
                          <path className="HoverArrow__tipPath" d="M1 1l4 4-4 4"></path>
                        </g>
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </li>

          {/* 7. B2B */}
          <li className="fb-s-nav-link" onMouseEnter={onEnter} onMouseLeave={onLeave}>
            <span className="fb-s-nav-main whitespace-nowrap">B2B</span>

            <div className="fb-s-nav-dropdown fb-resources-dropdown dropdown-align-right">
              <div className="w-[300px] p-2">
                <div className="fb-sn-section bg-[#FAF8F5] rounded-lg p-4 border border-[#EFEEE9] shadow-xs">
                  <div className="fb-sn-category capitalize font-bold text-sm text-[#1F1F1F] mb-3 pb-2 border-b border-[#EAE6DF]">
                    Wholesale for Brands
                  </div>
                  <div className="fb-sn-sub-category flex flex-col gap-2 text-xs text-gray-700">
                    <Link href="/wholesale-partner-program" target="_blank" className="hover:text-[#7D5A20] hover:translate-x-0.5 transition-all py-0.5">
                      Wholesale <span className="font-semibold text-black">Partner</span> Program
                    </Link>
                    <Link href="/artisanflow" target="_blank" className="hover:text-[#7D5A20] hover:translate-x-0.5 transition-all py-0.5">
                      Traceability Platform: <span className="font-semibold text-black">ArtisanFlow</span>
                    </Link>
                    <Link href="/content/wholesale/order-fabric-swatches/59195" target="_blank" className="hover:text-[#7D5A20] hover:translate-x-0.5 transition-all py-0.5">
                      Order Fabric Swatches
                    </Link>
                    <Link href="/content/wholesale/natural-sustainable-custom-dyeing/59105" target="_blank" className="hover:text-[#7D5A20] hover:translate-x-0.5 transition-all py-0.5">
                      Sustainable Dyeing
                    </Link>
                    <Link href="/content/wholesale/eco-printing/24862107" target="_blank" className="hover:text-[#7D5A20] hover:translate-x-0.5 transition-all py-0.5">
                      Sustainable Printing
                    </Link>
                    <Link href="/content/wholesale/wholesale-production-preorder/59335" target="_blank" className="hover:text-[#7D5A20] hover:translate-x-0.5 transition-all py-0.5">
                      Custom Fabric Production
                    </Link>
                    <Link href="/content/wholesale/custom-clothing-accessories-homewares/703160" target="_blank" className="hover:text-[#7D5A20] hover:translate-x-0.5 transition-all py-0.5">
                      Finished Product Development
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </li>

          {/* 8. SEARCH */}
          <li className="fb-s-nav-link">
            <Link href="/display/search" className="fb-s-nav-main flex justify-between items-center gap-1.5">
              <span className="material-symbols-outlined">search</span>
              <span>Search</span>
            </Link>
          </li>

        </ul>

        {/* Right Action Utilities: Forex Dropdown, Wishlist, Cart, Sign In */}
        <div className="shrink-0 flex justify-end items-center gap-3 lg:gap-4">
          <ForexDropdown className="hidden lg:block" />

          <Link href="/display/search" onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden flex items-center text-gray-700 hover:text-black">
            <span className="material-symbols-outlined text-[22px]">search</span>
          </Link>

          <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center relative text-gray-700 hover:text-black transition-colors" title="Wishlist">
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#CA9B6D] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {wishlistCount}
              </span>
            )}
            <span className="material-symbols-outlined text-[22px]">favorite_border</span>
          </Link>

          <button
            type="button"
            aria-label={`Cart, ${cartCount} items`}
            onClick={() => {
              setIsMobileMenuOpen(false);
              openCart();
              if (isLoggedIn) refreshCart();
            }}
            className="flex items-center relative text-gray-700 hover:text-black transition-colors cursor-pointer"
          >
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#CA9B6D] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
            <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
          </button>

          {!isLoggedIn ? (
            <button className="hidden lg:block">
              <Link href="/auth" className="fb-arrow-btn flex items-center justify-center fb-default-transition">
                <span className="mr-1">Sign In</span>
                <svg className="HoverArrow" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <g fillRule="evenodd">
                    <path className="HoverArrow__linePath" d="M0 5h7"></path>
                    <path className="HoverArrow__tipPath" d="M1 1l4 4-4 4"></path>
                  </g>
                </svg>
              </Link>
            </button>
          ) : (
            <CustomerDropdown
              tenantName={tenantName}
              isLoggedIn={isLoggedIn}
              onLogout={() => useAuthStore.getState().logout()}
            />
          )}
        </div>

      </nav>

      {/* Cart Side Tab — opened by the cart button above and by Add to Cart */}
      <CartDrawer />

      {/* Mobile Drawer Menu with smooth slide animation */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isLoggedIn={isLoggedIn}
        tenantName={tenantName}
        navigationCraft={INITIAL_NAVIGATION_CRAFT}
        navigationMaterial={INITIAL_NAVIGATION_MATERIALS}
        navigationPattern={INITIAL_NAVIGATION_PATTERNS}
        navigationColor={INITIAL_NAVIGATION_COLORS}
        navigationAccessories={accessoriesList}
        navigationHome={homeList}
        navigationApparel={apparelList}
        navigationStoryCrafts={storyCraftsList}
        navigationStoryClusters={storyClustersList}
        navigationStoryCollaborations={storyCollabsList}
      />
    </header>
  );
}
