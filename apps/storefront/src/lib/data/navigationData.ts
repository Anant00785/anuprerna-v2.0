export interface NavigationCraftOption {
  id: number;
  subCategoryName: string;
  subCategoryFeaturedImage?: string;
}

export interface NavigationCraft {
  id: number;
  segmentCategoryName: string;
  optionList: NavigationCraftOption[];
}

export interface NavigationMaterialOption {
  materialId: number;
  materialName: string;
}

export interface NavigationPatternOption {
  patternId: number;
  patternName: string;
}

export interface NavigationColorOption {
  colorId: number;
  colorLabel: string;
  colorHexCode: string;
}

export interface NavigationStoryOption {
  storyId: number;
  storyTitle: string;
  slug: string;
  bannerImage: string;
}

export interface NavigationStory {
  id: number;
  storyCategoryName: string;
  optionList: NavigationStoryOption[];
}

// 1. FABRIC CATEGORIES (Exact from Screenshot 1)
export const INITIAL_NAVIGATION_CRAFT: NavigationCraft[] = [
  {
    id: 1,
    segmentCategoryName: "EMBROIDERY TECHNIQUE",
    optionList: [
      { id: 101, subCategoryName: "Handloom Jacquard" },
      { id: 102, subCategoryName: "Jamdani Loom Embroidery" },
      { id: 103, subCategoryName: "Kantha Embroidery" },
    ],
  },
  {
    id: 2,
    segmentCategoryName: "ORGANIC AND NATURAL",
    optionList: [
      { id: 201, subCategoryName: "Dyeable Khadi Cotton" },
      { id: 202, subCategoryName: "Hemp Banana Bamboo" },
      { id: 203, subCategoryName: "Natural Vegetable Dye" },
      { id: 204, subCategoryName: "Organic Khadi Cotton" },
    ],
  },
  {
    id: 3,
    segmentCategoryName: "DYED PLAIN WEAVES",
    optionList: [
      { id: 301, subCategoryName: "Handwoven Linen" },
      { id: 302, subCategoryName: "Handwoven Merino Wool" },
      { id: 303, subCategoryName: "Khesh Recycled Fabric" },
      { id: 304, subCategoryName: "Piece Dyed Cotton Fabric" },
      { id: 305, subCategoryName: "Yarn Dyed Khadi Cotton" },
    ],
  },
  {
    id: 4,
    segmentCategoryName: "RESIST DYED",
    optionList: [
      { id: 401, subCategoryName: "Ikkat" },
      { id: 402, subCategoryName: "Shibori" },
      { id: 403, subCategoryName: "Tie - Dye" },
    ],
  },
  {
    id: 5,
    segmentCategoryName: "INDIAN PREMIUM SILK",
    optionList: [
      { id: 501, subCategoryName: "Eri Peace Silk" },
      { id: 502, subCategoryName: "Ketya Peace Silk" },
      { id: 503, subCategoryName: "Matka Peace Silk" },
      { id: 504, subCategoryName: "Mulberry Silk" },
      { id: 505, subCategoryName: "Tussar Silk" },
    ],
  },
  {
    id: 6,
    segmentCategoryName: "PRINTED DESIGN",
    optionList: [
      { id: 601, subCategoryName: "Digital Print" },
      { id: 602, subCategoryName: "Hand Block Printing" },
      { id: 603, subCategoryName: "Handprinted Batik" },
      { id: 604, subCategoryName: "Natural Dyed Block Print" },
      { id: 605, subCategoryName: "Screen Printing" },
    ],
  },
  {
    id: 7,
    segmentCategoryName: "ECO ESSENTIALS",
    optionList: [
      { id: 701, subCategoryName: "Sustainable Knits" },
    ],
  },
  {
    id: 8,
    segmentCategoryName: "SwatchKit",
    optionList: [
      { id: 801, subCategoryName: "Order A SwatchKit" },
    ],
  },
];

// 2. FABRIC MATERIALS (Exact from Screenshot 1)
export const INITIAL_NAVIGATION_MATERIALS: NavigationMaterialOption[] = [
  { materialId: 1, materialName: "Bamboo" },
  { materialId: 2, materialName: "Banana" },
  { materialId: 3, materialName: "Corn" },
  { materialId: 4, materialName: "Cotton" },
  { materialId: 5, materialName: "Eri Silk" },
  { materialId: 6, materialName: "Handspun Khadi" },
  { materialId: 7, materialName: "Hemp" },
  { materialId: 8, materialName: "Ketia Peace Silk" },
  { materialId: 9, materialName: "Linen" },
  { materialId: 10, materialName: "Lycra" },
  { materialId: 11, materialName: "Lyocell" },
  { materialId: 12, materialName: "Matka Peace Silk" },
  { materialId: 13, materialName: "Merino Wool" },
  { materialId: 14, materialName: "Muga Silk" },
  { materialId: 15, materialName: "Mulberry Silk" },
];

// 3. FABRIC PATTERNS (Exact from Screenshot 1)
export const INITIAL_NAVIGATION_PATTERNS: NavigationPatternOption[] = [
  { patternId: 1, patternName: "Abstract" },
  { patternId: 2, patternName: "Chambray" },
  { patternId: 3, patternName: "Check" },
  { patternId: 4, patternName: "Denim" },
  { patternId: 5, patternName: "Embroidered" },
  { patternId: 6, patternName: "Floral" },
  { patternId: 7, patternName: "Geometric" },
  { patternId: 8, patternName: "Handwoven" },
  { patternId: 9, patternName: "Herringbone" },
  { patternId: 10, patternName: "Honeycomb" },
  { patternId: 11, patternName: "Ikat Patch" },
  { patternId: 12, patternName: "Motifs" },
  { patternId: 13, patternName: "Object Motifs" },
  { patternId: 14, patternName: "Oxford" },
  { patternId: 15, patternName: "Paisley" },
];

// 4. FABRIC COLORS & HEX SWATCHES (Exact from Screenshot 1)
export const INITIAL_NAVIGATION_COLORS: NavigationColorOption[] = [
  { colorId: 1, colorLabel: "White", colorHexCode: "#FFFFFF" },
  { colorId: 2, colorLabel: "Ivory", colorHexCode: "#FFFFF0" },
  { colorId: 3, colorLabel: "Yellow", colorHexCode: "#FFFF00" },
  { colorId: 4, colorLabel: "Cream", colorHexCode: "#FFFDD0" },
  { colorId: 5, colorLabel: "Peach", colorHexCode: "#FFDAB9" },
  { colorId: 6, colorLabel: "Pink", colorHexCode: "#FFC0CB" },
  { colorId: 7, colorLabel: "Orange", colorHexCode: "#FFA500" },
  { colorId: 8, colorLabel: "Magenta", colorHexCode: "#FF00FF" },
  { colorId: 9, colorLabel: "Red", colorHexCode: "#FF0000" },
  { colorId: 10, colorLabel: "Off-White", colorHexCode: "#FAF0E6" },
  { colorId: 11, colorLabel: "Beige", colorHexCode: "#F5F5DC" },
  { colorId: 12, colorLabel: "Khaki", colorHexCode: "#F0E68C" },
  { colorId: 13, colorLabel: "Lavender", colorHexCode: "#E6E6FA" },
  { colorId: 14, colorLabel: "Mustard", colorHexCode: "#FFDB58" },
];

// 5. ACCESSORIES CATEGORIES & IMAGES (Exact from Screenshot 2)
export const INITIAL_NAVIGATION_ACCESSORIES: NavigationCraft[] = [
  {
    id: 10,
    segmentCategoryName: "SCARF",
    optionList: [
      {
        id: 1001,
        subCategoryName: "Custom Stoles",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 1002,
        subCategoryName: "Neckerchief",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 1003,
        subCategoryName: "Stoles",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: 11,
    segmentCategoryName: "BAGS",
    optionList: [
      {
        id: 1101,
        subCategoryName: "Bucket Bags",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 1102,
        subCategoryName: "Fannypack",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 1103,
        subCategoryName: "Lady Bags",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 1104,
        subCategoryName: "Tote Bags",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: 12,
    segmentCategoryName: "SCRUNCHIES",
    optionList: [
      {
        id: 1201,
        subCategoryName: "Scrunchies",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: 13,
    segmentCategoryName: "Unisex",
    optionList: [
      {
        id: 1301,
        subCategoryName: "Hats",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1521369984125-a4de59b6574f?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 1302,
        subCategoryName: "Sleeping Mask",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: 14,
    segmentCategoryName: "FABRIC ENVELOPE",
    optionList: [
      {
        id: 1401,
        subCategoryName: "Drawstring Pouch",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 1402,
        subCategoryName: "Rectangular Envelope",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];

// 6. HOMEWARE CATEGORIES & IMAGES (Exact from Screenshot 3)
export const INITIAL_NAVIGATION_HOME: NavigationCraft[] = [
  {
    id: 20,
    segmentCategoryName: "KITCHENWARE",
    optionList: [
      {
        id: 2001,
        subCategoryName: "Apron",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 2002,
        subCategoryName: "Fabric Coasters",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 2003,
        subCategoryName: "Table Napkin",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 2004,
        subCategoryName: "Table Placemat",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 2005,
        subCategoryName: "Table Runner",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 2006,
        subCategoryName: "Tea Towel",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: 21,
    segmentCategoryName: "HOME LINEN",
    optionList: [
      {
        id: 2101,
        subCategoryName: "Bed Quilt",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 2102,
        subCategoryName: "Cushion Cover",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 2103,
        subCategoryName: "Lumbar Cushion Cover",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 2104,
        subCategoryName: "Pillow Cover",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: 22,
    segmentCategoryName: "DECOR",
    optionList: [
      {
        id: 2201,
        subCategoryName: "Baby Quilts",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 2202,
        subCategoryName: "Curtains",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 2203,
        subCategoryName: "Sofa Throw",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 2204,
        subCategoryName: "Wall Art",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];

// 7. APPAREL CATEGORIES & IMAGES
export const INITIAL_NAVIGATION_APPAREL: NavigationCraft[] = [
  {
    id: 30,
    segmentCategoryName: "WOMENSWEAR",
    optionList: [
      {
        id: 3001,
        subCategoryName: "Dresses & Tunics",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 3002,
        subCategoryName: "Shirts & Tops",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 3003,
        subCategoryName: "Overlay Jackets",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: 31,
    segmentCategoryName: "MENSWEAR",
    optionList: [
      {
        id: 3101,
        subCategoryName: "Handloom Shirts",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: 3102,
        subCategoryName: "Kurtas & Short Kurtas",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: 32,
    segmentCategoryName: "LOUNGEWEAR",
    optionList: [
      {
        id: 3201,
        subCategoryName: "Robes & Kaftans",
        subCategoryFeaturedImage: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];

// 8. COLLABORATIONS, CRAFTS & CLUSTERS (Exact from Screenshot 4)
export const INITIAL_NAVIGATION_STORY_CRAFTS: NavigationStory[] = [
  {
    id: 40,
    storyCategoryName: "CRAFTS",
    optionList: [
      {
        storyId: 4001,
        storyTitle: "Ikkat - A Distinctive Style",
        slug: "ikkat-distinctive-style",
        bannerImage: "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 4002,
        storyTitle: "Shibori Dyeing",
        slug: "shibori-dyeing",
        bannerImage: "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 4003,
        storyTitle: "Tie-Dye Technique",
        slug: "tie-dye-technique",
        bannerImage: "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 4004,
        storyTitle: "Digital Printing",
        slug: "digital-printing",
        bannerImage: "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 4005,
        storyTitle: "Hand Block Printing",
        slug: "hand-block-printing",
        bannerImage: "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 4006,
        storyTitle: "Handprinted Batik",
        slug: "handprinted-batik",
        bannerImage: "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 4007,
        storyTitle: "Naturally Dyed Block Printing",
        slug: "naturally-dyed-block-printing",
        bannerImage: "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 4008,
        storyTitle: "Screen Printing",
        slug: "screen-printing",
        bannerImage: "https://images.unsplash.com/photo-1606744888344-493238951221?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];

export const INITIAL_NAVIGATION_STORY_CLUSTERS: NavigationStory[] = [
  {
    id: 50,
    storyCategoryName: "Clusters",
    optionList: [
      {
        storyId: 5001,
        storyTitle: "Design Cluster",
        slug: "design-cluster",
        bannerImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 5002,
        storyTitle: "Handloom Cluster",
        slug: "handloom-cluster",
        bannerImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 5003,
        storyTitle: "Mulberry Silk Cluster",
        slug: "mulberry-silk-cluster",
        bannerImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 5004,
        storyTitle: "Peace Silk Cluster",
        slug: "peace-silk-cluster",
        bannerImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 5005,
        storyTitle: "Tussar Silk Cluster",
        slug: "tussar-silk-cluster",
        bannerImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 5006,
        storyTitle: "Dyeing Cluster",
        slug: "dyeing-cluster",
        bannerImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 5007,
        storyTitle: "Ikat Cluster",
        slug: "ikat-cluster",
        bannerImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 5008,
        storyTitle: "Shibori Cluster",
        slug: "shibori-cluster",
        bannerImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 5009,
        storyTitle: "Jamdani Cluster",
        slug: "jamdani-cluster",
        bannerImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 5010,
        storyTitle: "Kantha Embroidery",
        slug: "kantha-embroidery-cluster",
        bannerImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];

export const INITIAL_NAVIGATION_STORY_COLLABORATIONS: NavigationStory[] = [
  {
    id: 60,
    storyCategoryName: "Collaborations",
    optionList: [
      {
        storyId: 6001,
        storyTitle: "Cynthia Director",
        slug: "cynthia-director",
        bannerImage: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
      },
      {
        storyId: 6002,
        storyTitle: "Maria Tolvanen",
        slug: "maria-tolvanen",
        bannerImage: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];

// Helper to format URLs like generate-navigation-url.service.ts in old Angular app
export function prepareUrl(param: string): string {
  if (!param) return "";
  if (param.includes("-")) return param.toLowerCase().replace(/\s+/g, "");
  return param.toLowerCase().replace(/\s+/g, "-");
}

export function generateCategoryRedirectionLink(url: string, segment: NavigationCraft, category?: string): string {
  const segments: string[] = segment.optionList
    .filter((sub) => sub.subCategoryName !== "Custom Product")
    .map((sub) => prepareUrl(sub.subCategoryName));
  if (category) {
    return `${url}?category=${category}&${prepareUrl(segment.segmentCategoryName)}=${segments.join(",")}`;
  }
  return `${url}?${prepareUrl(segment.segmentCategoryName)}=${segments.join(",")}`;
}

export function generateSegmentRedirectionLink(url: string, segment: string, subCategory: string, category?: string): string {
  if (category) {
    return `${url}?category=${category}&${prepareUrl(segment)}=${prepareUrl(subCategory)}`;
  }
  return `${url}?${prepareUrl(segment)}=${prepareUrl(subCategory)}`;
}

export function generateRedirectionLink(url: string, name: string, value: string): string {
  return `${url}?${name}=${prepareUrl(value)}`;
}

export function createCategoryUrl(categoryName: string): string {
  let formattedCategory = categoryName.toLowerCase().trim();
  if (formattedCategory === "designer collaboration") {
    formattedCategory = "collaborations";
  } else if (formattedCategory === "printing cluster" || formattedCategory === "printed design") {
    formattedCategory = "printing";
  } else if (formattedCategory === "embroidery technique") {
    formattedCategory = "embroidery";
  } else {
    formattedCategory = formattedCategory.replace(/\s+/g, "-");
  }
  return `/stories?category=${encodeURIComponent(formattedCategory)}`;
}
