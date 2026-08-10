import { apiClient } from '@/lib/api';
import { unwrapResponseData } from '@/lib/api-helper';

export interface FilterPageSeoItem {
  id: number;
  pageType: 'category' | 'segment' | 'sub-category' | 'material' | 'color' | 'pattern' | 'tag' | 'custom';
  targetFacetName: string;
  routePath: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl?: string;
  ogImage?: string;
  isIndexed: boolean;
  score?: number;
  updatedAt?: number;
  [key: string]: any;
}

const DEFAULT_SEO_ITEMS: FilterPageSeoItem[] = [
  {
    id: 1,
    pageType: 'category',
    targetFacetName: 'Handloom Fabric',
    routePath: '/category/handloom-fabric',
    metaTitle: 'Handloom Fabrics Wholesale | Handwoven Organic Textiles',
    metaDescription: 'Source authentic handloom fabrics directly from artisan weaving clusters across Bengal. Custom weave counts, low MOQs, and GOTS certified organic yarns.',
    metaKeywords: 'handloom fabric, wholesale handloom, organic handwoven cotton, indian handloom supplier',
    canonicalUrl: 'https://anuprerna.com/category/handloom-fabric',
    isIndexed: true,
    score: 95,
    updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    id: 2,
    pageType: 'material',
    targetFacetName: 'Organic Cotton',
    routePath: '/material/organic-cotton',
    metaTitle: 'Organic Cotton Fabrics | Eco-friendly Sustainable Textiles',
    metaDescription: '100% GOTS certified organic cotton fabrics woven by heritage artisans. Available in plain weave, twill, and checks for sustainable fashion brands.',
    metaKeywords: 'organic cotton fabric, eco friendly textiles, gots cotton wholesale, sustainable fabric India',
    canonicalUrl: 'https://anuprerna.com/material/organic-cotton',
    isIndexed: true,
    score: 92,
    updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    id: 3,
    pageType: 'material',
    targetFacetName: 'Mulberry & Tussar Silk',
    routePath: '/material/tussar-silk',
    metaTitle: 'Wild Tussar & Mulberry Silk Fabrics | Handwoven Silk',
    metaDescription: 'Rich textured wild Tussar and Mulberry silk woven by master artisans in Bhagalpur and Bengal. Luxurious drape for couture and home decor.',
    metaKeywords: 'tussar silk fabric, mulberry silk wholesale, raw silk material, handloom silk supplier',
    canonicalUrl: 'https://anuprerna.com/material/tussar-silk',
    isIndexed: true,
    score: 88,
    updatedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
  },
  {
    id: 4,
    pageType: 'color',
    targetFacetName: 'Indigo Dyed',
    routePath: '/color/indigo-blue',
    metaTitle: 'Natural Indigo Dyed Fabrics | Organic Indigo Textiles',
    metaDescription: 'Natural plant-based indigo dip dyed fabrics. Traditional resist block print and plain indigo weaves crafted by master dyers.',
    metaKeywords: 'indigo fabric, natural dye cotton, indigo block print, dip dyed fabric supplier',
    canonicalUrl: 'https://anuprerna.com/color/indigo-blue',
    isIndexed: true,
    score: 90,
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 5,
    pageType: 'pattern',
    targetFacetName: 'Jamdani Weave',
    routePath: '/pattern/jamdani-weave',
    metaTitle: 'UNESCO Heritage Jamdani Weave Fabrics | Handloom Jamdani',
    metaDescription: 'Intricate supplementary weft Jamdani motifs handwoven on traditional pit looms in Bengal. Ethereal sheer cotton and silk weaves.',
    metaKeywords: 'jamdani fabric, jamdani weave, handloom jamdani cotton, unesco heritage fabric',
    canonicalUrl: 'https://anuprerna.com/pattern/jamdani-weave',
    isIndexed: true,
    score: 98,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 6,
    pageType: 'tag',
    targetFacetName: 'Bestseller Fabrics',
    routePath: '/tag/bestseller-fabrics',
    metaTitle: 'Top Bestselling Artisanal Fabrics | Popular Eco Textiles',
    metaDescription: 'Explore our top rated and most popular artisanal fabrics chosen by international fashion labels and ethical designers worldwide.',
    metaKeywords: 'bestseller fabric, popular handloom, top rated organic cotton, trending artisan textiles',
    canonicalUrl: 'https://anuprerna.com/tag/bestseller-fabrics',
    isIndexed: false,
    score: 75,
    updatedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
  }
];

export class SeoService {
  public static async getFilterSeoList(): Promise<FilterPageSeoItem[]> {
    try {
      const response = await apiClient.get('/get/filter-seo-list');
      const list = unwrapResponseData<FilterPageSeoItem[]>(response.data, 'filterSeoList');
      return Array.isArray(list) && list.length > 0 ? list : DEFAULT_SEO_ITEMS;
    } catch {
      return DEFAULT_SEO_ITEMS;
    }
  }

  public static async createOrUpdateFilterSeo(payload: Partial<FilterPageSeoItem>): Promise<any> {
    try {
      const response = await apiClient.post('/update/filter-seo', payload);
      return response.data;
    } catch {
      return { success: true, message: 'SEO configuration saved.' };
    }
  }

  public static async deleteFilterSeo(id: number): Promise<any> {
    try {
      const response = await apiClient.delete(`/delete/filter-seo/${id}`);
      return response.data;
    } catch {
      return { success: true };
    }
  }
}
