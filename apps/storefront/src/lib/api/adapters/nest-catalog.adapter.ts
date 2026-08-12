import { Product, ProductDetail, ProductSpecification } from "@/types/domain/product";
import { HeaderNavigation, NavigationItem } from "@/types/domain/navigation";
import { NestNavigationDto, NestProductDto } from "../dto/nestjs.dto";

/**
 * Maps NestJS Product DTO to Domain Product model
 */
export function mapNestProductToDomain(dto: NestProductDto): Product {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.title,
    price: dto.price.amount,
    originalPrice: dto.price.originalAmount,
    currency: dto.price.currency || "INR",
    thumbnail: dto.thumbnailUrl,
    gallery: dto.galleryUrls?.length ? dto.galleryUrls : [dto.thumbnailUrl],
    inStock: dto.isAvailable && dto.stockQuantity > 0,
    availableQuantity: dto.stockQuantity,
    material: dto.material,
    craft: dto.craft,
    weave: dto.weave,
    gsm: dto.weightGsm,
    ecoFriendly: dto.isSustainable ?? true,
    minimumOrderQty: dto.minOrderQty ?? 1,
    badge: dto.isSustainable ? "Sustainable Artisan" : undefined,
  };
}

/**
 * Maps NestJS Product DTO to Domain ProductDetail model
 */
export function mapNestProductDetailToDomain(dto: NestProductDto): ProductDetail {
  const base = mapNestProductToDomain(dto);
  const specifications: ProductSpecification[] = [];

  if (dto.material) specifications.push({ label: "Material", value: dto.material });
  if (dto.craft) specifications.push({ label: "Craft", value: dto.craft });
  if (dto.weave) specifications.push({ label: "Weave", value: dto.weave });
  if (dto.weightGsm) specifications.push({ label: "GSM", value: `${dto.weightGsm} g/m²` });
  if (dto.originCountry) specifications.push({ label: "Origin", value: dto.originCountry });

  if (dto.specs) {
    Object.entries(dto.specs).forEach(([label, value]) => {
      specifications.push({ label, value });
    });
  }

  return {
    ...base,
    description: dto.description || dto.summary || "Artisan handloom fabric.",
    specifications,
    careInstructions: dto.careInstructions || "Gentle cold wash or dry clean.",
    origin: dto.originCountry || "India",
    certification: dto.certifications?.join(", ") || "Ethical Artisan Certified",
    relatedProductSlugs: dto.relatedProductSlugs || [],
  };
}

/**
 * Maps NestJS Navigation DTO
 */
function mapNestNavItem(dto: NestNavigationDto): NavigationItem {
  return {
    id: dto.id,
    label: dto.label,
    href: dto.path,
    icon: dto.icon,
    badge: dto.badge,
    image: dto.imageUrl,
    description: dto.description,
    children: dto.children?.map(mapNestNavItem),
  };
}

export function mapNestNavigationToDomain(items: NestNavigationDto[]): HeaderNavigation {
  const mainCategories = (items || []).map(mapNestNavItem);
  return {
    mainCategories,
    featuredCollections: mainCategories.filter((item) => Boolean(item.badge)),
    topBarBanner: {
      text: "Directly Sourced Artisan Fabrics | Global Shipping Available",
      href: "/collections",
    },
  };
}
