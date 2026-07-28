/**
 * Canonical Domain Navigation & Category Interface
 * UI Navigation, Header, & Mega-Menu consume only these types.
 */

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  children?: NavigationItem[];
  isFeatured?: boolean;
  image?: string;
  description?: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  image?: string;
  productCount?: number;
  subcategories?: Category[];
  parentSlug?: string;
}

export interface HeaderNavigation {
  mainCategories: NavigationItem[];
  featuredCollections: NavigationItem[];
  topBarBanner?: {
    text: string;
    linkText?: string;
    href?: string;
  };
}
