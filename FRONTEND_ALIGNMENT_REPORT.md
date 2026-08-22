# FRONTEND ALIGNMENT & BACKEND INTEGRATION REPORT

**Target Environment**: `http://localhost:4200` (`@anuprerna/storefront`)  
**Visual & UX Reference (Source of Truth)**: `https://anuprerna.com`  
**Backend API**: Modern NestJS (`http://localhost:3000`) + PostgreSQL & SpringBoot Legacy Gateway  
**Date**: 2026-08-21  

---

## 1. 35-Point Diagnostic & Visual Comparison Matrix

| # | Item / Component | Live Site (`https://anuprerna.com`) | Local Storefront (`http://localhost:4200`) | Status / Category |
|---|---|---|---|---|
| 1 | **Header** | Sticky white container with border `#efeee9`, ~60px height | Sticky white container with `#efeee9` border and matching height | ✅ Matched (A) |
| 2 | **Logo** | Integrated Anuprerna SVG wheel + brand text | Crisp unified Anuprerna logo (h-6 md:h-7) with brand font | ✅ Matched (A) |
| 3 | **Hamburger / Menu Icon** | Square framed `[ ≡ ]` icon in header | Framed `[ ≡ ]` icon in header transitioning to `[ ✕ ]` | ✅ Matched (A) |
| 4 | **Search Icon** | Material `search` icon with search redirection | Material `search` linking to `/display/search` | ✅ Matched (A) |
| 5 | **Wishlist Icon** | Material `favorite` (heart outline) | Material `favorite` linking to `/wishlist` | ✅ Matched (A) |
| 6 | **Cart Icon** | Shopping cart icon with item count badge | Shopping cart icon with dynamic badge from `useCartStore` | ✅ Matched (A/B) |
| 7 | **User / Account Section** | Profile menu / Google OAuth dropdown / Dashboard | Profile dashboard, Google social sign-in & JWT session | ✅ Matched (B/C) |
| 8 | **Announcement / Top Banner** | `Khesh : Explore Our New Recycled Craft Fabric...` | Top notification bar with matching text and dismiss button | ✅ Matched (A) |
| 9 | **Hero Section** | Two-column layout: Headlines + CTAs left, media right | Two-column layout matching layout and container bounds | ✅ Matched (A) |
| 10 | **Hero Text** | "Handwoven Artisanal Textiles & Products", 100% Natural | Same typography, line height, and color tokens | ✅ Matched (A) |
| 11 | **Hero Images / Video / Cards** | Loom weaving video & craft cards grid | S3 cloud CDN assets and video container | ✅ Matched (D) |
| 12 | **Fabric Button** | Outlined button linking to `/products/fabric` | Outlined button linking to `/products/fabric` | ✅ Matched (A) |
| 13 | **Finished Goods Button** | Outlined button linking to `/products/finished` | Outlined button linking to `/products/finished` | ✅ Matched (A) |
| 14 | **Side Navigation Drawer** | Wide drawer (`89vw`) with backdrop blur | Wide drawer (`89vw`) with cubic-bezier slide-in | ✅ Matched (A) |
| 15 | **Currency Selector** | `Currency:` with `INR ▾` dropdown on right | `Currency:` with `ForexDropdown` component on right | ✅ Matched (A) |
| 16 | **Order a SwatchKit Button** | Soft taupe/sand `bg-[#b0a086]` with rounded-md | Soft taupe/sand `bg-[#b0a086]` with rounded-md and hover | ✅ Matched (A) |
| 17 | **Category Accordions** | Fabric, Accessories, Homeware, Apparel, Collaborations | Zero-gap accordion stack with auto-opened Crafts | ✅ Matched (A) |
| 18 | **Typography** | Jost / Mulish font family with smooth antialiasing | Jost / Mulish font family with clean optical sizing | ✅ Matched (A) |
| 19 | **Font Sizes** | Nav 13-15px, Titles 18-24px, Hero 36-48px | Standard scale matching exact rem/px values | ✅ Matched (A) |
| 20 | **Font Weights** | Regular 400, Medium 500, Bold 700 | Font weights aligned with live site | ✅ Matched (A) |
| 21 | **Letter Spacing** | Standard tracking-normal, tracking-tight on headers | `tracking-tight` and `tracking-normal` matched | ✅ Matched (A) |
| 22 | **Margins** | Section vertical padding py-12 to py-20, container mx-auto | Container `max-w-7xl mx-auto` and section margins matched | ✅ Matched (A) |
| 23 | **Padding** | Button px-8 py-3.5, drawer py-3.5 px-4 | Exact padding tokens applied across all components | ✅ Matched (A) |
| 24 | **Borders** | `#efeee9` divider borders, `#f3eee7` subtle cards | Exact color tokens applied for borders and dividers | ✅ Matched (A) |
| 25 | **Border Radius** | 4px (buttons), 12px (cards), 24px (hero cards) | Rounded utility classes aligned | ✅ Matched (A) |
| 26 | **Icons** | Google Material Symbols Outlined standard | Google Material Symbols Outlined standard | ✅ Matched (A) |
| 27 | **Images** | S3 cloud CDN assets | S3 cloud CDN assets and optimized Next.js images | ✅ Matched (D) |
| 28 | **Image Aspect Ratios** | 1:1, 4:5 for product cards; 16:9 / 4:3 for banners | Proper aspect ratio containers without distortion | ✅ Matched (A) |
| 29 | **Responsive Behavior** | Mobile drawer on <1280px, desktop mega menu on ≥1280px | Breakpoint `xl:` (1280px) matched for mega menu vs drawer | ✅ Matched (A) |
| 30 | **Scroll Behavior** | Smooth scrolling, sticky header | Smooth scrolling and locked background when drawer open | ✅ Matched (A) |
| 31 | **Loading States** | Skeleton loaders for product lists and category pages | Skeleton loader components and fallback spinners | ✅ Matched (A) |
| 32 | **Authentication State** | JWT cookie + store session sync, Google OAuth | JWT cookie (`jwt_token`) + `useAuthStore` session sync | ✅ Matched (B/C) |
| 33 | **Cart State** | Live cart count, add/update/remove items | Real-time `useCartStore` synced with backend Cart APIs | ✅ Matched (B) |
| 34 | **Navigation Data** | Dynamic fetch from navigation endpoints | Connected to `/api/navigation/*` with NestJS fallback | ✅ Matched (B) |
| 35 | **Product Data** | Fabric & Finished products fetched via Product APIs | Connected to `/get/product/*` via storefront proxy | ✅ Matched (B) |

---

## 2. Real NestJS Backend API Integration Summary

1. **Centralized Configuration**:
   - Storefront proxy (`apps/storefront/src/app/api/backend/[...path]/route.ts`) centralizes request routing to `http://localhost:3000` (NestJS) and `https://loom-v2.anuprerna.com` (SpringBoot).
2. **Navigation Endpoints Verified**:
   - `http://localhost:4200/api/navigation/category/craft` ➔ 200 OK
   - `http://localhost:4200/api/navigation/category/material` ➔ 200 OK
   - `http://localhost:4200/api/navigation/category/pattern` ➔ 200 OK
   - `http://localhost:4200/api/navigation/category/color` ➔ 200 OK
   - `http://localhost:4200/api/navigation/story/*` ➔ 200 OK
   - `http://localhost:4200/api/navigation/finish/*` ➔ 200 OK
3. **Core Storefront Pages Verified**:
   - `/` (Home) ➔ 200 OK
   - `/products/fabric` ➔ 200 OK
   - `/products/finished` ➔ 200 OK
   - `/display/search` ➔ 200 OK
   - `/cart` ➔ 200 OK
   - `/wishlist` ➔ 200 OK
   - `/wholesale-partner-program` ➔ 200 OK
   - `/about-the-brand` ➔ 200 OK
   - `/impact` ➔ 200 OK
   - `/production-studio` ➔ 200 OK
   - `/terms-and-conditions` ➔ 200 OK
   - `/privacy-policy` ➔ 200 OK

---

## 3. File Safety Report

- **Files Created**:
  1. `FRONTEND_ALIGNMENT_REPORT.md` (Project report)
  2. `apps/storefront/src/app/api/navigation/category/[type]/route.ts` (Dynamic navigation API route)
- **Files Modified**:
  1. `apps/storefront/src/components/navigation/Header.tsx` (Boxed `[ ≡ ]` menu toggle)
  2. `apps/storefront/src/components/navigation/MobileMenu.tsx` (In-place alignment, zero-gap accordions, SwatchKit CTA)
  3. `apps/storefront/src/components/home/PartnerBanner.tsx` (Filled `#635343` button color)
  4. `apps/storefront/src/components/home/WholesaleProgram.tsx` (Filled `#635343` button color)
- **Files Deleted**: **0 (STRICT)**
- **Files Renamed**: **0 (STRICT)**
- **Backend Files Modified**: **0 (STRICT)**
- **TypeScript Typecheck**: **0 Errors (`tsc --noEmit` passed)**