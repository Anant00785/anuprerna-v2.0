// Build-time data fetch for the storefront demo.
// Pulls REAL data from Loom (loom-v2.anuprerna.com) via the jwt-api skill — no creds ship to Vercel.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const SKILL = '/home/clawd/.openclaw/workspace/skills/jwt-api';
function loom(path) {
  const out = execFileSync('node', ['index.js', 'get', 'anuprerna', path], { cwd: SKILL, encoding: 'utf8', maxBuffer: 1024*1024*64 });
  return JSON.parse(out);
}

// ---- Featured sub-categories per segment (real Loom) ----
function featured(category) {
  const r = loom('/get/featured/' + category + '/sub-category');
  return (r.featuredSubCategories || []).map(c => ({
    segmentId: c.segmentCategoryId,
    segment: c.segmentCategoryName,
    subId: c.subCategoryId,
    name: c.subCategoryName.trim(),
    image: c.subCategoryFeaturedImage,
  }));
}

const fabrics     = featured('fabrics');
const apparel     = featured('apparel');
const home        = featured('home');
const accessories = featured('accessories');

// ---- Reviews (real Loom, approved only, strip placeholders) ----
const rev = loom('/get/customer/review?pageNumber=0&pageSize=40');
const reviews = (rev.customerReviewList || rev.reviewList || [])
  .filter(r => r.status === 'APPROVED' && r.description && r.description.trim().length > 30
    && !/share your feedback|review with image|^updated$|test/i.test(r.description)
    && !/^amit singha$/i.test((r.name||'').trim()))
  .map(r => ({
    name: (r.name||'').replace(/\s+India$/,'').trim(),
    city: r.city || '',
    country: r.country || '',
    rating: r.rating || 5,
    text: r.description.replace(/\s+/g,' ').trim(),
    images: (r.productImages || '').split(',').filter(Boolean),
    createdAt: r.createdAt || null,
    link: r.link || '',
  }))
  .slice(0, 12);

const out = {
  fabrics, apparel, home, accessories, reviews,
  generatedAt: new Date().toISOString(),
  source: 'loom-v2.anuprerna.com (build-time snapshot via jwt-api)',
};
const json = JSON.stringify(out, null, 2);
const CACHE_LIMIT_BYTES = 2 * 1024 * 1024;
const jsonBytes = Buffer.byteLength(json, 'utf8');
if (jsonBytes > CACHE_LIMIT_BYTES) {
  console.error('home-data.json is ' + (jsonBytes/1024/1024).toFixed(2) + ' MB, exceeding the 2 MB cache limit');
  process.exit(1);
}
fs.writeFileSync(new URL('./home-data.json', import.meta.url), json);
console.log('fabrics:'+fabrics.length+' apparel:'+apparel.length+' home:'+home.length+' accessories:'+accessories.length+' reviews:'+reviews.length+' size:'+(jsonBytes/1024/1024).toFixed(2)+'MB');
