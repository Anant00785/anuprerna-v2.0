"use client";

import React, { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  PLPProduct,
  PLPMetadataInfo,
  FilterControls,
  FilterActiveChip,
  FilterSegment,
  FilterSEO,
} from "@/types/domain/plp";
import { plpRepository } from "@/lib/api/repositories/plp.repository";
import {
  FABRIC_FILTER_KEYS,
  FINISHED_FILTER_KEYS,
  calculateProductPrice,
  prepareFilterControls,
  filterProducts,
  sortProducts,
  getActiveFilterChips,
  clearAllFilters,
} from "@/lib/plp/filter-engine";
import { FilterBanner } from "./FilterBanner";
import { FilterContainer } from "./FilterContainer";
import { FilterActiveControls } from "./FilterActiveControls";
import { FilterSortDropdown } from "./FilterSortDropdown";
import { FilterProductGrid } from "./FilterProductGrid";
import { FilterPaginator } from "./FilterPaginator";

interface ProductListingPageProps {
  group?: "fabric" | "finished";
}

function ProductListingContent({ group = "fabric" }: ProductListingPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const categoryParam = searchParams.get("category") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const sortByParam = searchParams.get("sort-by") || "availability";

  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<PLPProduct[]>([]);
  const [metadata, setMetadata] = useState<{
    colors: PLPMetadataInfo[];
    materials: PLPMetadataInfo[];
    patterns: PLPMetadataInfo[];
  }>({ colors: [], materials: [], patterns: [] });

  const [controls, setControls] = useState<FilterControls>({ keys: [], cohorts: [] });
  const [selectedSortOption, setSelectedSortOption] = useState(sortByParam);
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [segments, setSegments] = useState<FilterSegment[]>([]);
  const [filterSEO, setFilterSEO] = useState<FilterSEO | null>(null);
  const [relatedProductsMap, setRelatedProductsMap] = useState<Map<number, PLPProduct[]>>(
    new Map()
  );

  const pageSize = 31;

  // 1. Load products & metadata
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    async function fetchData() {
      try {
        const { products: rawProducts, colors, materials, patterns } =
          await plpRepository.getPLPData(group, categoryParam);

        if (!isMounted) return;

        const processedProducts = rawProducts.map(calculateProductPrice);
        setProducts(processedProducts);
        setMetadata({ colors, materials, patterns });

        const keys = group === "finished" ? FINISHED_FILTER_KEYS : FABRIC_FILTER_KEYS;
        const initialControls = prepareFilterControls(keys, processedProducts, {
          colors,
          materials,
          patterns,
        });

        // Apply URL query params decoding into initialControls
        applyUrlParamsToControls(initialControls, searchParams);
        setControls(initialControls);

        if (categoryParam && ["accessories", "home", "apparel"].includes(categoryParam)) {
          const segs = await plpRepository.getFilterSegments(categoryParam);
          if (isMounted) setSegments(segs);
        }
      } catch (err) {
        console.error("Error loading PLP data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, [group, categoryParam]);

  // 1b. Re-sync controls, sort, and page when searchParams change (e.g. Header navigation)
  useEffect(() => {
    if (!products.length) return;

    const keys = group === "finished" ? FINISHED_FILTER_KEYS : FABRIC_FILTER_KEYS;
    const freshControls = prepareFilterControls(keys, products, metadata);
    applyUrlParamsToControls(freshControls, searchParams);

    setControls(freshControls);
    setSelectedSortOption(searchParams.get("sort-by") || "availability");
    setCurrentPage(parseInt(searchParams.get("page") || "1", 10));
  }, [searchParams, products, metadata, group]);

  // Decode searchParams into control state
  const applyUrlParamsToControls = (filterCtrl: FilterControls, params: ReturnType<typeof useSearchParams>) => {
    filterCtrl.cohorts.forEach((cohortGroup) => {
      const { key } = cohortGroup;

      if (key.type === "toggle" && key.key === "inStock") {
        const inStockVal = params.get("inStock");
        if (cohortGroup.cohort?.options[0]) {
          cohortGroup.cohort.options[0].active = Boolean(inStockVal);
        }
      } else if (key.type === "sub" && cohortGroup.cohort) {
        cohortGroup.cohort.options.forEach((parentOpt) => {
          const segKey = parentOpt.value.toLowerCase().replace(/[\s-]+/g, "-");
          const paramVal = params.get(segKey) || params.get(parentOpt.value.toLowerCase().replace(/\s+/g, "-"));
          if (paramVal) {
            const activeSubs = paramVal.split(",").map((s) => s.trim().toLowerCase());
            if (paramVal === "all" && parentOpt.subOptions) {
              parentOpt.subOptions.forEach((sub) => (sub.active = true));
              parentOpt.active = true;
            } else if (parentOpt.subOptions) {
              parentOpt.subOptions.forEach((sub) => {
                const normSub = sub.value.toLowerCase().replace(/[\s-]+/g, "");
                sub.active = activeSubs.some((a) => {
                  const normA = a.replace(/[\s-]+/g, "");
                  return normA === normSub;
                });
              });
              parentOpt.active = parentOpt.subOptions.length > 0 && parentOpt.subOptions.every((s) => s.active);
            }
          }
        });
      } else if (key.type === "csv" && cohortGroup.cohort) {
        const paramVal = params.get(key.key);
        if (paramVal) {
          const activeVals = paramVal.split(",").map((v) => v.trim().toLowerCase().replace(/[\s-]+/g, ""));
          cohortGroup.cohort.options.forEach((opt) => {
            const optName = (opt.displayName || opt.value).toLowerCase().replace(/[\s-]+/g, "");
            const optVal = String(opt.value).toLowerCase().replace(/[\s-]+/g, "");
            if (activeVals.includes(optName) || activeVals.includes(optVal)) {
              opt.active = true;
            }
          });
        }
      }
    });
  };

  // Sync state to URL query parameters
  const updateUrlQueryParams = useCallback(
    (newControls: FilterControls, newSort: string, newPage: number) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      // Reset page if filters change
      current.set("page", String(newPage));
      current.set("sort-by", newSort);

      newControls.cohorts.forEach((cohortGroup) => {
        const { key } = cohortGroup;

        if (key.type === "toggle" && key.key === "inStock") {
          if (cohortGroup.cohort?.options[0]?.active) {
            current.set("inStock", "true");
          } else {
            current.delete("inStock");
          }
        } else if (key.type === "sub" && cohortGroup.cohort) {
          cohortGroup.cohort.options.forEach((parentOpt) => {
            const segKey = parentOpt.value.toLowerCase().replace(/\s+/g, "-");
            if (parentOpt.subOptions) {
              const activeSubs = parentOpt.subOptions
                .filter((sub) => sub.active)
                .map((sub) => sub.value.toLowerCase().replace(/\s+/g, "-"));

              if (activeSubs.length > 0) {
                if (parentOpt.subOptions.every((s) => s.active)) {
                  current.set(segKey, "all");
                } else {
                  current.set(segKey, activeSubs.join(","));
                }
              } else {
                current.delete(segKey);
              }
            }
          });
        } else if (key.type === "csv" && cohortGroup.cohort) {
          const activeOpts = cohortGroup.cohort.options
            .filter((opt) => opt.active)
            .map((opt) => (opt.displayName || opt.value).toLowerCase().replace(/\s+/g, "-"));

          if (activeOpts.length > 0) {
            current.set(key.key, activeOpts.join(","));
          } else {
            current.delete(key.key);
          }
        }
      });

      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.push(`${pathname}${query}`, { scroll: false });
    },
    [searchParams, pathname, router]
  );

  // 2. Filter products
  const filteredProducts = useMemo(() => {
    if (!products.length || !controls.cohorts.length) return [];
    return filterProducts(products, controls);
  }, [products, controls]);

  // 3. Sort products
  const sortedProducts = useMemo(() => {
    return sortProducts(filteredProducts, selectedSortOption);
  }, [filteredProducts, selectedSortOption]);

  // 4. Paginate products
  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, currentPage, pageSize]);

  // 5. Active chips
  const activeChips = useMemo(() => {
    return getActiveFilterChips(controls);
  }, [controls]);

  // Load related swatch products for cards on current page
  useEffect(() => {
    if (!pagedProducts.length) return;
    const ids = pagedProducts.map((p) => p.product_id).filter(Boolean).join(",");

    let isMounted = true;
    plpRepository.getRelatedProducts(ids).then((relList) => {
      if (!isMounted) return;
      const map = new Map<number, PLPProduct[]>();
      relList.forEach((r) => {
        map.set(r.id, r.products.map(calculateProductPrice));
      });
      setRelatedProductsMap(map);
    });

    return () => {
      isMounted = false;
    };
  }, [pagedProducts]);

  // Handlers
  const handleControlsChange = () => {
    setControls({ ...controls });
    setCurrentPage(1);
    updateUrlQueryParams(controls, selectedSortOption, 1);
  };

  const handleSortChange = (newSort: string) => {
    setSelectedSortOption(newSort);
    setCurrentPage(1);
    updateUrlQueryParams(controls, newSort, 1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    updateUrlQueryParams(controls, selectedSortOption, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRemoveChip = (chip: FilterActiveChip) => {
    if (chip.option) {
      chip.option.active = false;
      if (chip.type === "sub") {
        // Also update parent
        controls.cohorts.forEach((g) => {
          g.cohort?.options.forEach((p) => {
            if (p.subOptions?.includes(chip.option!)) {
              p.active = false;
            }
          });
        });
      }
    } else if (chip.range) {
      chip.range.active = false;
      chip.range.value1 = chip.range.defaultMin;
      chip.range.value2 = chip.range.defaultMax;
    }
    handleControlsChange();
  };

  const handleClearAll = () => {
    const reset = clearAllFilters(controls);
    setControls(reset);
    setCurrentPage(1);
    updateUrlQueryParams(reset, selectedSortOption, 1);
  };

  // Resolve Banner Details
  let bannerHeading = "";
  let bannerDesc = "";
  let bannerImg = "";

  if (categoryParam === "swatchkit") {
    bannerHeading = "Swatchkits";
    bannerDesc =
      "Explore Anuprerna's fabric swatch kits featuring Jamdani, natural dye, silk, and other artisanal fabrics. Perfect for previewing sustainable, handwoven textiles.";
    bannerImg =
      "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/filter/swatchkit-banner.png";
  } else if (["accessories", "home", "apparel"].includes(categoryParam)) {
    bannerHeading = categoryParam === "home" ? "Homeware" : categoryParam;
    bannerDesc =
      "Discover the artistry at Anuprerna Artisans! Embrace sustainable handwoven products collaboratively crafted with skilled Bengal handloom weavers.";
    bannerImg = `https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/filter/${categoryParam}-banner.png`;
  }

  return (
    <section className="w-full relative px-4 md:px-8 max-w-[1400px] mx-auto pt-6 pb-16">
      {/* Category Banner if Active */}
      <FilterBanner
        heading={bannerHeading}
        description={bannerDesc}
        image={bannerImg}
        segments={segments}
        categoryPage={categoryParam}
      />

      {/* Main Filter Body */}
      <div className="fb-filter-body flex flex-col md:flex-row justify-center items-start mt-6 mb-5 gap-6">
        {/* Desktop Sidebar (25% width) */}
        <div className="w-full hidden md:flex md:w-1/4 flex-col sticky top-[80px] max-h-[calc(100vh-100px)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="w-full flex flex-col gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-full h-8 bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <FilterContainer
              controls={controls}
              totalResults={sortedProducts.length}
              chips={activeChips}
              onControlsChange={handleControlsChange}
              onRemoveChip={handleRemoveChip}
              onClearAll={handleClearAll}
            />
          )}
        </div>

        {/* Products Column (75% width) */}
        <div className="w-full md:w-3/4">
          {/* Top Bar: Count on Left, Sort by on Right */}
          <div className="w-full flex justify-between items-center pb-4 pt-1 gap-3">
            <div className="text-sm sm:text-base text-gray-900">
              <span className="font-bold">{sortedProducts.length}</span>{" "}
              <span className="font-normal text-gray-700">products</span>
            </div>

            <FilterSortDropdown
              selectedOption={selectedSortOption}
              onSortChange={handleSortChange}
            />
          </div>

          {/* Active Filter Chips */}
          <FilterActiveControls
            chips={activeChips}
            onRemoveChip={handleRemoveChip}
            onClearAll={handleClearAll}
          />

          {/* Product Grid */}
          <FilterProductGrid
            products={pagedProducts}
            isLoading={isLoading}
            relatedProductsMap={relatedProductsMap}
          />

          {/* Paginator */}
          {!isLoading && sortedProducts.length > 0 && (
            <FilterPaginator
              totalItems={sortedProducts.length}
              itemsPerPage={pageSize}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {/* Mobile Sticky Bottom Filter Bar */}
      <div
        onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        className="w-full fixed bottom-0 left-0 z-40 bg-[#8e7860] text-white py-3 text-center cursor-pointer md:hidden font-semibold shadow-lg flex items-center justify-center gap-2"
      >
        {!isMobileDrawerOpen ? (
          <span className="text-base">Filters ({sortedProducts.length})</span>
        ) : (
          <span className="text-base flex items-center gap-1.5">
            View Products ({sortedProducts.length})
            <span className="material-symbols-outlined text-lg">close</span>
          </span>
        )}
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden flex justify-end">
          <div className="w-[85%] max-w-[340px] h-full bg-white p-5 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-200">
                <h3 className="font-bold text-lg text-[#302e2e]">Filter Products</h3>
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <FilterContainer
                controls={controls}
                totalResults={sortedProducts.length}
                chips={activeChips}
                isMobile={true}
                onControlsChange={handleControlsChange}
                onRemoveChip={handleRemoveChip}
                onClearAll={handleClearAll}
              />
            </div>

            <button
              onClick={() => setIsMobileDrawerOpen(false)}
              className="w-full mt-6 bg-[#8e7860] text-white font-bold py-3 rounded-lg text-center"
            >
              Apply Filters ({sortedProducts.length})
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function ProductListingPage(props: ProductListingPageProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[600px] flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-[#8e7860] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProductListingContent {...props} />
    </Suspense>
  );
}
