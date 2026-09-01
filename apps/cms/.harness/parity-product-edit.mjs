#!/usr/bin/env node
/**
 * Weave CMS — Phase C product-edit field-parity harness.
 *
 * Loads the edit form for a real product and asserts every field from the
 * Phase C spec is present in the DOM (queried by [data-field="…"]). Two fields
 * are conditional (Main Product when "Is Main Product" is off; Discount when
 * "Sale" is on) — the harness flips the controlling toggle to reveal them
 * before asserting. Emits a markdown checklist and exits non-zero on any miss.
 *
 * Usage: node .harness/parity-product-edit.mjs [productId]
 *        BASE_URL=http://localhost:3010 PRODUCT_ID=16154 node …
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);

const PUPPETEER_PATH =
  process.env.PUPPETEER_PATH ||
  "/home/clawd/.npm-global/lib/node_modules/puppeteer";

let puppeteer;
try {
  puppeteer = require(PUPPETEER_PATH);
} catch (e) {
  console.error(`[parity] Cannot load puppeteer from ${PUPPETEER_PATH}: ${e.message}`);
  process.exit(1);
}

const BASE = (process.env.BASE_URL || "http://localhost:3010").replace(/\/$/, "");
const PRODUCT_ID = process.argv[2] || process.env.PRODUCT_ID || "16154";
const URL = `${BASE}/listings/${PRODUCT_ID}?type=fabric`;

// field → human label, grouped by section. Order matches the spec.
const SECTIONS = {
  Content: [
    ["category", "Category"], ["segment", "Segment"], ["subCategory", "SubCategory"],
    ["name", "Product Name"], ["skuGroup", "SKU Group"], ["sku", "Product SKU"],
    ["price", "Price"], ["quantity", "Quantity"], ["metaTitle", "Meta Title"],
    ["metaDescription", "Meta Description"], ["unit", "Unit"],
    ["mainProductCheck", "Is Main Product"], ["mainProductId", "Select Main Product"],
    ["productVideo", "Video URL"], ["productVideoAlt", "Video Alt"],
    ["backwardCompatibleLink", "Backward Compatible Link"],
  ],
  Fabric: [
    ["gsm", "GSM"], ["width", "Width"], ["addToSwatch", "Add to Swatch"],
  ],
  Profiles: [
    ["profile-badge", "Badge toggle"], ["profile-volume-discount", "Volume Discount toggle"],
    ["profile-fabric", "Fabric Profile toggle"], ["profile-custom-size", "Custom Size toggle"],
    ["profile-finish", "Finish toggle"], ["profile-made-to-order", "Made-To-Order toggle"],
    ["profile-size", "Size toggle"],
  ],
  Groups: [
    ["specialStatus", "Special Status"], ["materials", "Materials"], ["colors", "Colors"],
    ["patterns", "Patterns"], ["tags", "Tags"], ["sale", "Sale"], ["discount", "Discount"],
    ["productOverview", "Product Overview"], ["productCare", "Product Care"],
  ],
  Images: [
    ["heroImage", "Hero image"], ["hoverImage", "Preview image"], ["gallery", "Gallery"],
  ],
  Zoho: [
    ["hsnCode", "HSN Code"], ["purchasePrice", "Purchase Price"], ["tax", "Tax"],
    ["zohoItemId", "Zoho Item Id"],
  ],
};

async function present(page, field) {
  return page.$(`[data-field="${field}"]`).then((el) => !!el);
}

async function clickSwitch(page, field) {
  const handle = await page.$(`[data-field="${field}"] button[role="switch"]`);
  if (handle) {
    await handle.click();
    await new Promise((r) => setTimeout(r, 250));
    return true;
  }
  return false;
}

async function main() {
  console.log(`[parity] Product-edit field parity — ${URL}\n`);
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser",
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  let missing = 0;
  const lines = [];

  try {
    await page.goto(URL, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 800));

    // Reveal conditional fields.
    // Main Product select shows only when "Is Main Product" is OFF.
    if (!(await present(page, "mainProductId"))) await clickSwitch(page, "mainProductCheck");
    // Discount shows only when "Sale" is ON.
    if (!(await present(page, "discount"))) await clickSwitch(page, "sale");

    for (const [section, fields] of Object.entries(SECTIONS)) {
      lines.push(`\n### ${section}`);
      for (const [field, label] of fields) {
        const ok = await present(page, field);
        if (!ok) missing++;
        lines.push(`- [${ok ? "x" : " "}] ${label}  \`data-field=${field}\`${ok ? "" : "  ← MISSING"}`);
      }
    }
  } catch (e) {
    console.error(`[parity] Navigation/eval failed: ${e.message}`);
    await browser.close();
    process.exit(1);
  }

  await browser.close();

  console.log("# Product-edit field parity checklist");
  console.log(lines.join("\n"));
  const total = Object.values(SECTIONS).reduce((n, f) => n + f.length, 0);
  console.log(`\n---\n${total - missing}/${total} fields present.`);
  if (missing === 0) {
    console.log("[parity] PASS — all spec fields present.");
    process.exit(0);
  } else {
    console.log(`[parity] FAIL — ${missing} field(s) missing.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[parity] Unexpected error:", e);
  process.exit(1);
});
