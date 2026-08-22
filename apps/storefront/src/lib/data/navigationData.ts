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

// 5. ACCESSORIES CATEGORIES & IMAGES (Exact from Loom API / Angular)
export const INITIAL_NAVIGATION_ACCESSORIES: NavigationCraft[] = [
  {
    id: 12946,
    segmentCategoryName: "SCARF",
    optionList: [
      {
        id: 29280027,
        subCategoryName: "Custom Stoles",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/O7L4ELP8YKCSPRNBYUH5KUD9I9SP00509.jpg",
      },
      {
        id: 12948,
        subCategoryName: "Neckerchief",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/HMD31252OFCZQ08GK3X0WHDXFONU04019.png",
      },
      {
        id: 29935,
        subCategoryName: "Stoles",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/6FPSW3EI1ZJ8V4K521TUTX5RUG6004222.jpg",
      },
    ],
  },
  {
    id: 31862,
    segmentCategoryName: "BAGS",
    optionList: [
      {
        id: 414130,
        subCategoryName: "Bucket Bags",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/O12DPVP05FQ18GO1Y9PLULJQA4LC03552.jpg",
      },
      {
        id: 414147,
        subCategoryName: "Fannypack",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/8W735KSTIGIRPWUNAZHRHKR2S14M09943.jpg",
      },
      {
        id: 411514,
        subCategoryName: "Lady Bags",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/AVRMBB7BAKFMML9OHD3WLEQ558XM08280.jpg",
      },
      {
        id: 31864,
        subCategoryName: "Tote Bags",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/JMA1172YLBJ145CR2F7DMHSXCDIY03262.png",
      },
    ],
  },
  {
    id: 589379,
    segmentCategoryName: "SCRUNCHIES",
    optionList: [
      {
        id: 589382,
        subCategoryName: "Scrunchies",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/ZBPBGCWMRLITXSJKHSMQXWEDY5YA03107.png",
      },
    ],
  },
  {
    id: 31631263,
    segmentCategoryName: "Unisex",
    optionList: [
      {
        id: 31631647,
        subCategoryName: "Hats",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/8T5WJJR6H919RB54W3DADUCN0BEB01606.jpg",
      },
      {
        id: 71711110,
        subCategoryName: "Sleeping Mask",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/5GXVVF03HYDSII33TOF95QPAIFKV02515.png",
      },
    ],
  },
  {
    id: 24350,
    segmentCategoryName: "FABRIC ENVELOPE",
    optionList: [
      {
        id: 33322,
        subCategoryName: "Drawstring Pouch",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/S58D4UOPR3UTPTKLR2CEDO6WJZOO02372.jpg",
      },
      {
        id: 24352,
        subCategoryName: "Rectangular Envelope",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/61XJHL0BDUKIPBPUU39N7X1YFUHU02220.jpg",
      },
    ],
  },
];

// 6. HOMEWARE CATEGORIES & IMAGES (Exact from Loom API / Angular)
export const INITIAL_NAVIGATION_HOME: NavigationCraft[] = [
  {
    id: 23797,
    segmentCategoryName: "KITCHENWARE",
    optionList: [
      {
        id: 33334,
        subCategoryName: "Apron",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/FPU5QM1S5EYUZUKJSGDCIYN9QFZ000082.png",
      },
      {
        id: 32888,
        subCategoryName: "Fabric Coasters",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/2B0PYQGE3DWQZMRGL8MWDNY6TJAR08161.jpg",
      },
      {
        id: 25051,
        subCategoryName: "Table Napkin",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/59XZP290CHDAWH1IPOXAUE380WPU02829.jpg",
      },
      {
        id: 31779,
        subCategoryName: "Table Placemat",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/78HBAH3D0ZUYH3NGSXBPRNML9LHB06404.jpg",
      },
      {
        id: 31757,
        subCategoryName: "Table Runner",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/VBMCHG7919BHDT3QO5KVOSUTUR4B09493.jpg",
      },
      {
        id: 34294,
        subCategoryName: "Tea Towel",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/0Z3HWGNEUC7LOZKUXP19G71KI53L00670.jpg",
      },
    ],
  },
  {
    id: 33382,
    segmentCategoryName: "HOME LINEN",
    optionList: [
      {
        id: 299126,
        subCategoryName: "Bed Quilt",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/3T252VIY5LHFPRXIV5Q46OZEH02008429.png",
      },
      {
        id: 33385,
        subCategoryName: "Cushion Cover",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/X8M8NY53636L0IE2VQG31O9NR98O07986.jpg",
      },
      {
        id: 33432,
        subCategoryName: "Lumbar Cushion Cover",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/27GKJDFKH793HBXR7JLQZH14Q6VV00195.jpg",
      },
      {
        id: 32839,
        subCategoryName: "Pillow Cover",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/9TQOWF8ZEAIJYKKVM48ZVL6QFIYI03312.png",
      },
    ],
  },
  {
    id: 23799,
    segmentCategoryName: "DECOR",
    optionList: [
      {
        id: 275487,
        subCategoryName: "Baby Quilts",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/OIJRFGS6729M1UGLH2RJDXRLJALP06411.png",
      },
      {
        id: 297776,
        subCategoryName: "Curtains",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/ZVUZFTOZJ6RI18M065HGQTCME1EI02952.png",
      },
      {
        id: 31810,
        subCategoryName: "Sofa Throw",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/Q7I3VZOZVTYOFTKPGTVD76PLGUX608290.png",
      },
      {
        id: 74922230,
        subCategoryName: "Wall Art",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/WMGFFDU2CCCZPF3IY6JXS1GIUCRK05515.png",
      },
    ],
  },
];

// 7. APPAREL CATEGORIES & IMAGES (Exact from Loom API / Angular)
export const INITIAL_NAVIGATION_APPAREL: NavigationCraft[] = [
  {
    id: 167890,
    segmentCategoryName: "UNISEX",
    optionList: [
      {
        id: 297751,
        subCategoryName: "Coat",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/OWC16EOEXJ8PKUFI09181FK7H1FK02986.png",
      },
      {
        id: 168096,
        subCategoryName: "Hoodie",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/VUXS3S1BA75OUMQPDA0YP4JT9M7F05256.png",
      },
      {
        id: 322591,
        subCategoryName: "Jackets",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/2KK954UK6F72ZGJT4DS390BXQ21303236.png",
      },
      {
        id: 168070,
        subCategoryName: "Kimono Coats",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/HP5Z8M2JRU0JVC6C7F58JFYJ7NTD03207.png",
      },
      {
        id: 322696,
        subCategoryName: "Pant",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/R8B7XIOL11D1HCG12U96BAO0POC206790.png",
      },
      {
        id: 12289420,
        subCategoryName: "Unisex Shirts",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/7J6KGAYSDLOAINWDWU7U8XXF5HED08950.png",
      },
      {
        id: 167894,
        subCategoryName: "Vests",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/IT7QAFEYXQEU3ACVFZ3NEYW8TOBF01665.png",
      },
    ],
  },
  {
    id: 5505,
    segmentCategoryName: "MEN",
    optionList: [
      {
        id: 25009,
        subCategoryName: "Kurta",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/EDU8AWFXG5W8K3MCLDNF574KFPID09511.png",
      },
      {
        id: 5507,
        subCategoryName: "Shirt",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/4KOYJZY8REB3WLOFZP60R0A8T88P03940.png",
      },
      {
        id: 91621,
        subCategoryName: "Trouser",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/3L7T9GWG3VX8CI3XVRHED48U403T08282.png",
      },
      {
        id: 25007,
        subCategoryName: "T Shirts",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/DM8TJYLATEIPNS74BFQAYZOC23OD04737.png",
      },
    ],
  },
  {
    id: 3512,
    segmentCategoryName: "WOMEN",
    optionList: [
      {
        id: 3527,
        subCategoryName: "Bottoms",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/T155FWRRARQPO4LQT96MIIR7U61G08576.png",
      },
      {
        id: 11445760,
        subCategoryName: "Co-Ord Set",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/FVF8CQ54274KGFFQ8ZS2LWCNZH9A04423.png",
      },
      {
        id: 3531,
        subCategoryName: "Dresses",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/CWX9IV584U03TL6YOP12DWDCZQN600152.png",
      },
      {
        id: 322566,
        subCategoryName: "Jacket",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/8DS07RCLNP0656YIY6KJA3S6O75R06952.png",
      },
      {
        id: 1144509,
        subCategoryName: "Jumpsuit",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/NOID04CNELJETJ6OF4GJKR4ZMKJM05503.png",
      },
      {
        id: 489124,
        subCategoryName: "Loungewear",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/JZYT103EOMTX09XJXLXKFWIC3EF107582.png",
      },
      {
        id: 1330005,
        subCategoryName: "Rompers",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/SBUUM0Y8MKB2D95GQINC0JOW18LY09963.png",
      },
      {
        id: 53082,
        subCategoryName: "Saree",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/P0ADRHOZWL1STGE7VMXIIRZZPIIR05264.png",
      },
      {
        id: 437745,
        subCategoryName: "Shirts",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/V4FO3I8DKILKYNF2BHVLD1JY8VRX03286.png",
      },
      {
        id: 322618,
        subCategoryName: "Skirts",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/URU6OYCCYZZYF46WRHPXD0WTX8VW05782.png",
      },
      {
        id: 3529,
        subCategoryName: "Tops",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/5EO5DKFRAL6DOL2C3KLTYN0SZ91102267.png",
      },
    ],
  },
  {
    id: 297770,
    segmentCategoryName: "KIDS",
    optionList: [
      {
        id: 58550249,
        subCategoryName: "Co-Ord Set",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/DO6BFY6CHN7JQ7BGW2T554OMRMO300543.png",
      },
      {
        id: 322637,
        subCategoryName: "Dress",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/FELFGX4NBPGNNUXZM1LRPGOR06TX09270.png",
      },
      {
        id: 299156,
        subCategoryName: "Pants",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/H4PVH2WZF4QEFQVYIIPYXGJX3HXM07784.png",
      },
      {
        id: 58547849,
        subCategoryName: "Romper",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/KGNIA5CIOU8EUZK0AUV0T2I4L7A507328.png",
      },
      {
        id: 299186,
        subCategoryName: "Top",
        subCategoryFeaturedImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/UW5EIXO4L0VRD7NYM39AK2MA3T0Q00793.png",
      },
    ],
  },
];


// 8. COLLABORATIONS, CRAFTS & CLUSTERS (Exact database IDs and Slugs)
export const INITIAL_NAVIGATION_STORY_CRAFTS: NavigationStory[] = [
  {
    id: 40,
    storyCategoryName: "CRAFTS",
    optionList: [
      {
        storyId: 207160,
        storyTitle: "Ikat - A Distinctive Style",
        slug: "ikat-a-distinctive-style",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/4IEN7SA407673GK8LVF7QTZ19E6808899.jpg",
      },
      {
        storyId: 17539,
        storyTitle: "Shibori Dyeing",
        slug: "shibori-dyeing",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/WPGRLLY7ET0ZNJXCFL9TGNAP2CCY04377.jpg",
      },
      {
        storyId: 17835,
        storyTitle: "Tie-Dye Technique",
        slug: "tie-dye-technique",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/XEM3KWQS7IHU2P15M9C0U95GZPS501654.jpg",
      },
      {
        storyId: 241276,
        storyTitle: "Digital Printing",
        slug: "digital-printing",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/T2116YQTLW8D3JRGE5JLFQ892H4T09126.jpg",
      },
      {
        storyId: 13538,
        storyTitle: "Hand Block Printing",
        slug: "hand-block-printing",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/MPXDOJME2JLMOUMFEUCILJV1K4ZT01215.jpg",
      },
      {
        storyId: 10943,
        storyTitle: "Handprinted Batik",
        slug: "handprinted-batik",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/KZ57IIAD0629DOLDR8QDN7JD1UIG08230.jpg",
      },
      {
        storyId: 35676460,
        storyTitle: "Naturally Dyed Block Printing",
        slug: "naturally-dyed-block-printing",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/LYOLECA3QAYUDCKCKMZMZGHCASJ204390.jpg",
      },
      {
        storyId: 876,
        storyTitle: "Screen Printing",
        slug: "screen-printing",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/YFNZQQVU62ZSGVAI1BITY7KBBRCQ03986.jpg",
      },
      {
        storyId: 551,
        storyTitle: "Kantha Embroidery",
        slug: "kantha-embroidery",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/CV9YSTIDM95R4P9AHO420WAAE10A08384.jpg",
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
        storyId: 13455,
        storyTitle: "Design Cluster",
        slug: "design-cluster",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/YL56QKLUWOIMXYNZ2ZVTWIHC3TK302594.png",
      },
      {
        storyId: 12134,
        storyTitle: "Handloom Cluster",
        slug: "handloom-cluster",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/FTL3SG6QERXJXZU04MIPHMAA6A8W05558.jpg",
      },
      {
        storyId: 8700,
        storyTitle: "Mulberry Silk Cluster",
        slug: "mulberry-silk-cluster",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/76FL3JYVLQZOMGPO0N5QSJQUWDYA03019.png",
      },
      {
        storyId: 8798,
        storyTitle: "Peace Silk Cluster",
        slug: "peace-silk-cluster",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/F0FVLMSQ5OSQPG13FWWV2TGSW7E706718.jpg",
      },
      {
        storyId: 9038,
        storyTitle: "Tussar Silk Cluster",
        slug: "tussar-silk-cluster",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/KKH4QHWOLSHUPVKRFF8NEEKY97OU04031.jpg",
      },
      {
        storyId: 12281,
        storyTitle: "Dyeing Cluster",
        slug: "dyeing-cluster",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/1DG6WXPJ30AU7CVEZH8AD6G0YTA408483.png",
      },
      {
        storyId: 2041070,
        storyTitle: "Ikat Cluster",
        slug: "ikat-cluster",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/4IEN7SA407673GK8LVF7QTZ19E6808899.jpg",
      },
      {
        storyId: 12079,
        storyTitle: "Shibori Cluster",
        slug: "shibori-cluster",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/WPGRLLY7ET0ZNJXCFL9TGNAP2CCY04377.jpg",
      },
      {
        storyId: 8392,
        storyTitle: "Jamdani Cluster",
        slug: "jamdani-cluster",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/YL56QKLUWOIMXYNZ2ZVTWIHC3TK302594.png",
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
        storyId: 273394,
        storyTitle: "Cynthia Director",
        slug: "cynthia-director",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/1N924ZHLSCWYPKFRQ4AUCDCOI8FQ09658.png",
      },
      {
        storyId: 54087,
        storyTitle: "Maria Tolvanen",
        slug: "maria-tolvanen",
        bannerImage: "https://anuprerna-bloomscorp.s3.ap-south-1.amazonaws.com/YNHNENVOW8GOJMV5P9UCMLIK47CB05603.png",
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
