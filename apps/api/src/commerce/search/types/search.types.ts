export interface ProductSearchResult {
  id: bigint;
  sku: string;
  name: string;
  heroImage: string;
  hoverImage: string;
  heroImageAltText: string;
  hoverImageAltText: string;
  slug: string;
  productGroup: string;
  price: number;
  specialStatus: string | null;
  unit: string;
}

export interface BlogSearchResult {
  id: bigint;
}

export interface StorySearchResult {
  id: bigint;
}

export interface ContentSearchResult {
  blogs: BlogSearchResult[];
  stories: StorySearchResult[];
}

export interface ProductSearchResultPayload {
  resultSet: ProductSearchResult[];
  relatedResultSet: ProductSearchResult[];
}

export interface ContentSearchResultPayload {
  resultSet: ContentSearchResult[];
  relatedResultSet: ContentSearchResult[];
}

export interface LoomSearchResult {
  product: ProductSearchResultPayload;
  // content is commented out in Java POJO
}
// @ts-nocheck
// @ts-nocheck
