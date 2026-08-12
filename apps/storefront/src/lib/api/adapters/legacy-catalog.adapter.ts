import { env } from "@/env";
import { Product, ProductDetail, ProductSpecification } from "@/types/domain/product";
import { HeaderNavigation, NavigationItem } from "@/types/domain/navigation";
import {
  LegacyFabricProductDto,
  LegacyNavigationItemDto,
  LegacyNavigationResponseDto,
} from "../dto/legacy-springboot.dto";

const S3_BASE_URL = env.NEXT_PUBLIC_S3_BASE_URL.replace(/\/$/, "");

/**
 * Universal Image Resolver Helper
 * Resolves full S3 URLs, relative backend paths, and missing images.
 */
export function resolveImageUrl(imagePath?: string | null): string {
  if (!imagePath || imagePath.trim() === "") {
    return "/images/placeholder.jpg";
  }
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${S3_BASE_URL}${cleanPath}`;
}

export function formatImageUrl(path?: string): string {
  return resolveImageUrl(path);
}

/**
 * Maps legacy Spring Boot fabric product DTO into clean domain Product interface
 */
export function mapLegacyProductToDomain(dto: any): Product {
  const primaryImgRaw = dto?.primaryImage || dto?.imageUrl || dto?.images?.[0] || dto?.coverImage;
  const price =
    dto?.priceDetails?.discountedPrice ??
    dto?.priceDetails?.basePrice ??
    dto?.basePrice ??
    dto?.price ??
    0;

  const originalPrice =
    dto?.priceDetails?.mrp ??
    (dto?.priceDetails?.basePrice && dto?.priceDetails?.discountedPrice
      ? dto.priceDetails.basePrice
      : undefined);

  const gallery = Array.isArray(dto?.images)
    ? dto.images.map((img: string) => resolveImageUrl(img))
    : [resolveImageUrl(primaryImgRaw)];

  return {
    id: String(dto?.id || dto?.productId || ""),
    slug: dto?.slug || "",
    name: dto?.productName || dto?.title || dto?.name || "Untitled Fabric",
    price,
    originalPrice,
    currency: dto?.currencySymbol || dto?.priceDetails?.currencySymbol || "INR",
    thumbnail: resolveImageUrl(primaryImgRaw),
    gallery,
    inStock: dto?.availableQuantity != null ? dto.availableQuantity > 0 : true,
    availableQuantity: dto?.availableQuantity,
    material: dto?.materialName || dto?.material,
    craft: dto?.craftName || dto?.craft,
    weave: dto?.weaveName || dto?.weave,
    gsm: dto?.gsm,
    ecoFriendly: dto?.isEcoFriendly ?? false,
    minimumOrderQty: dto?.minOrderQuantity ?? 1,
    rating: dto?.ratingAverage ?? 4.8,
    reviewsCount: dto?.totalReviews ?? 0,
    badge: dto?.isEcoFriendly ? "Eco Handloom" : undefined,
  };
}

/**
 * Maps legacy Spring Boot fabric product DTO into detailed domain ProductDetail interface
 */
export function mapLegacyProductDetailToDomain(dto: LegacyFabricProductDto): ProductDetail {
  const baseProduct = mapLegacyProductToDomain(dto);

  const specifications: ProductSpecification[] = [];

  if (dto.materialName) specifications.push({ label: "Material", value: dto.materialName });
  if (dto.craftName) specifications.push({ label: "Craft", value: dto.craftName });
  if (dto.weaveName) specifications.push({ label: "Weave Type", value: dto.weaveName });
  if (dto.gsm) specifications.push({ label: "GSM / Weight", value: `${dto.gsm} g/m²` });
  if (dto.minOrderQuantity) specifications.push({ label: "Min Order", value: `${dto.minOrderQuantity} Meters` });
  if (dto.countryOfOrigin) specifications.push({ label: "Origin", value: dto.countryOfOrigin });

  if (dto.specifications) {
    Object.entries(dto.specifications).forEach(([label, value]) => {
      if (value) specifications.push({ label, value });
    });
  }

  return {
    ...baseProduct,
    description: dto.description || "Handcrafted sustainable artisan textile.",
    specifications,
    careInstructions: dto.careInstructions || "Dry clean or delicate cold hand wash with mild eco-friendly detergent.",
    origin: dto.countryOfOrigin || "West Bengal, India",
    certification: dto.certificationStatus || "Handloom Mark Certified",
    relatedProductSlugs: [],
  };
}

/**
 * Maps legacy navigation menu item
 */
function mapLegacyNavItem(dto: LegacyNavigationItemDto): NavigationItem {
  return {
    id: String(dto.id || dto.title || dto.name || ""),
    label: dto.title || dto.name || "",
    href: dto.url || `#`,
    icon: dto.iconName,
    badge: dto.badgeText,
    image: dto.thumbnailImage ? resolveImageUrl(dto.thumbnailImage) : undefined,
    description: dto.description,
    children: dto.subMenus?.map(mapLegacyNavItem) || dto.children?.map(mapLegacyNavItem),
  };
}

/**
 * Maps legacy navigation list into HeaderNavigation domain model
 */
export function mapLegacyNavigationToDomain(
  dto: LegacyNavigationResponseDto | LegacyNavigationItemDto[] | any
): HeaderNavigation {
  let list: LegacyNavigationItemDto[] = [];

  if (Array.isArray(dto)) {
    list = dto;
  } else if (dto?.navigationList) {
    list = dto.navigationList;
  } else if (dto?.categories) {
    list = dto.categories;
  } else if (dto?.payload?.navigationList) {
    list = dto.payload.navigationList;
  } else if (Array.isArray(dto?.payload)) {
    list = dto.payload;
  }

  const mainCategories = list.map(mapLegacyNavItem);

  return {
    mainCategories,
    featuredCollections: mainCategories.filter((item) => item.isFeatured),
    topBarBanner: dto?.promoBannerText
      ? {
        text: dto.promoBannerText,
        href: dto.promoBannerLink || "/collections",
      }
      : {
        text: "Worldwide B2B Shipping Available | Handcrafted Natural Fabrics",
        linkText: "Explore Collections",
        href: "/collections",
      },
  };
}
