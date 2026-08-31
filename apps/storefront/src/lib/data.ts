import raw from '../data/home-data.json';
import { rewriteBloomscorpUrlsDeep } from './loom/media';

export type Featured = { segmentId:number; segment:string; subId:number; name:string; image:string };
export type Review   = { name:string; city:string; country:string; rating:number; text:string; images:string[]; createdAt:number|null; link:string };

// data/home-data.json is a BUILD-TIME SNAPSHOT (data/build-home-data.mjs hits
// live Loom directly via jwt-api and dumps the result here) — it never flows
// through lib/loom/client.ts's parse(), so its embedded bloomscorp S3 URLs are
// NOT rewritten by that chokepoint. Rewrite once, here, at the module's only
// read of the raw snapshot, so every export below (fabrics/apparel/home/
// accessories/reviews) already carries sandbox /media/ paths.
const sanitized = rewriteBloomscorpUrlsDeep(raw);

export const fabrics     = sanitized.fabrics as Featured[];
export const apparel     = sanitized.apparel as Featured[];
export const home        = sanitized.home as Featured[];
export const accessories = sanitized.accessories as Featured[];
export const reviews     = (sanitized.reviews as Review[]).filter(r => r.text);
export const dataSource  = sanitized.source as string;
export const generatedAt = sanitized.generatedAt as string;

// Mirrors the Angular onRedirection(): /products/finished?{segment}={subCategory}
const slug = (s:string) => s.includes('-')
  ? s.toLowerCase().replace(/\s+/g,'')
  : s.toLowerCase().replace(/\s+/g,'-');

export function finishedHref(f: Featured): string {
  return '/products/finished?' + slug(f.segment) + '=' + slug(f.name);
}
export function fabricHref(f: Featured): string {
  return '/products/fabric?' + slug(f.segment) + '=' + slug(f.name);
}
export const titleCase = (s:string) =>
  s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
