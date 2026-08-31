import {
  getNavFabric,
  getNavFinished,
} from '@/lib/loom/endpoints';
import SiteHeader, {
  type HeaderNavData,
  type MegaColumn,
  type CraftGroup,
  type FinishedGroup,
} from './SiteHeader';
import type { NavSegment } from '@/lib/loom/endpoints';

// Server wrapper: fetches navigation from Loom (secrets stay server-side),
// shapes them into mega-menu data, and hands them to the client <SiteHeader>.
// NOTE: CurrencyProvider is intentionally NOT here — it lives in app/layout.tsx
// so it covers ALL page content, including product pages that call useCurrency().

const slug = (s: string | null | undefined) =>
  (s ?? '').toLowerCase().trim().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Finished menus (accessories/home/apparel): grouped subcategory columns + a
// promo image (first subcategory's featured image), mirroring the live site.
function finishedGroup(category: string, label: string, segments: NavSegment[]): FinishedGroup {
  const columns: MegaColumn[] = segments.map((seg) => ({
    title: seg.segmentCategoryName ?? '',
    items: (seg.optionList || []).map((o) => ({
      label: o.subCategoryName ?? '',
      href: '/products/finished?category=' + category + '&sub=' + slug(o.subCategoryName),
      image: o.subCategoryFeaturedImage,
    })),
  }));
  // Promo image = first available subcategory featured image.
  let promoImage = '';
  for (const seg of segments) {
    const hit = (seg.optionList || []).find((o) => o.subCategoryFeaturedImage);
    if (hit?.subCategoryFeaturedImage) { promoImage = hit.subCategoryFeaturedImage; break; }
  }
  return { category, label, columns, promoImage };
}

export default async function SiteHeaderServer() {
  // Fetch all nav in parallel; each call is independently fault-tolerant.
  const [craft, material, color, pattern, apparel, home, accessories] = await Promise.all([
    getNavFabric('craft').catch(() => ({ craft: [] as NavSegment[] })),
    getNavFabric('material').catch(() => ({ material: [] })),
    getNavFabric('color').catch(() => ({ color: [] })),
    getNavFabric('pattern').catch(() => ({ pattern: [] })),
    getNavFinished('apparel').catch(() => [] as NavSegment[]),
    getNavFinished('home').catch(() => [] as NavSegment[]),
    getNavFinished('accessories').catch(() => [] as NavSegment[]),
  ]);

  // Fabric mega-menu — Craft (grouped subcategories) + Material + Pattern + Color.
  const craftGroups: CraftGroup[] = (craft.craft || []).map((seg) => ({
    title: seg.segmentCategoryName ?? '',
    items: (seg.optionList || []).map((o) => ({
      label: o.subCategoryName ?? '',
      href: '/products/fabric?craft=' + slug(o.subCategoryName),
    })),
  }));

  const materialColumn: MegaColumn = {
    title: 'Material',
    items: (material.material || []).map((m) => ({
      label: m.materialName ?? '',
      href: '/products/fabric?material=' + slug(m.materialName),
    })),
  };

  const patternColumn: MegaColumn = {
    title: 'Pattern',
    items: (pattern.pattern || []).map((p) => ({
      label: p.patternName ?? '',
      href: '/products/fabric?pattern=' + slug(p.patternName),
    })),
  };

  const colorSwatches = (color.color || []).map((c) => ({
    label: c.colorLabel ?? '',
    hex: c.colorHexCode,
    href: '/products/fabric?color=' + slug(c.colorLabel),
  }));

  const finished: FinishedGroup[] = [
    finishedGroup('accessories', 'Accessories', accessories),
    finishedGroup('home', 'Homeware', home),
    finishedGroup('apparel', 'Apparel', apparel),
  ];

  const nav: HeaderNavData = {
    fabric: { craftGroups, materialColumn, patternColumn, colorSwatches },
    finished,
  };

  return <SiteHeader nav={nav} />;
}
