'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import * as guestCart from '@/lib/guest-cart';
import LoginModal from '@/components/auth/LoginModal';
import { useCurrency, type CurrencyCode } from '@/contexts/CurrencyContext';
import type { CartItem } from '@/components/checkout/types';
import CartDetailsDialog from '@/components/checkout/CartDetailsDialog';
import { cartUnitPrice, lineTotal, effectiveOrderType, lineMoq } from '@/components/checkout/types';
import { useBuyerMode } from '@/components/BuyerModeProvider';
import Link from 'next/link';

const LOGO = '/media/logo_black.svg';

// ---- Data shapes passed in from the server wrapper (SiteHeader.server.tsx) ----
export interface NavItem { label: string; href: string; image?: string }
export interface MegaColumn {
  title: string;
  items: NavItem[];
}
export interface CraftGroup {
  title: string;       // subcategory header e.g. EMBROIDERY TECHNIQUE
  items: NavItem[];
}
export interface ColorSwatch { label: string; hex: string; href: string }
export interface FabricNav {
  craftGroups: CraftGroup[];
  materialColumn: MegaColumn;
  patternColumn: MegaColumn;
  colorSwatches: ColorSwatch[];
}
export interface FinishedGroup {
  category: string;       // apparel | home | accessories
  label: string;
  columns: MegaColumn[];  // subcategory-grouped columns
  promoImage: string;     // S3 featured image shown on the right
}
export interface HeaderNavData {
  fabric: FabricNav;
  finished: FinishedGroup[];
}

const titleCase = (s: string) =>
  s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// ---- Shared label styling (matches live: 14px, bold, uppercase headers) ----
const HEADER_CLS = 'text-[13px] font-bold uppercase tracking-wide text-bark mb-2';
// Title-Case variant for the Material/Pattern/Color mega columns (live uses Title Case, not UPPERCASE).
const HEADER_TC = 'text-[13px] font-bold capitalize tracking-wide text-bark mb-2';
const LINK_CLS = 'text-sm text-black/70 hover:text-clay transition-colors capitalize block';

// Shared scroll class for tall columns — caps height and enables per-column scroll.
const COL_SCROLL = 'max-h-[52vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-clay/20 scrollbar-track-transparent';

// ---- Live tint backgrounds (verified from new-navigation.component.scss) ----
const TINT = {
  base:           'rgba(183,169,143,0.6)',  // color-base
  complementary2: 'rgba(255,245,229,0.2)',  // color-complementary-2
  analogous1:     'rgba(183,156,143,0.2)',  // color-analogous-1
  tetradic1:      'rgba(143,183,163,0.2)',  // color-tetradic-1
  tetradic2:      'rgba(157,143,183,0.2)',  // color-tetradic-2
  tetradic3:      'rgba(183,143,157,0.1)',  // color-tetradic-3
} as const;

// ---- Floating tinted CARD wrapper with arrow pointer (matches live dropdownBackground) ----
// Live: white bg, 8px radius, 3px solid #EFEEE9 border, a 15px arrow pointer rotated 45deg.
function MegaCard({
  children, arrowLeft, onMouseEnter, onMouseLeave,
}: {
  children: React.ReactNode; arrowLeft: number;
  onMouseEnter: () => void; onMouseLeave: () => void;
}) {
  return (
    <div
      className='absolute top-full z-50 mx-auto left-0 right-0 flex justify-center pointer-events-none'
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className='relative pointer-events-auto mt-2' style={{ maxWidth: 'calc(100vw - 2rem)' }}>
        {/* arrow pointer */}
        <span
          className='absolute -top-[7px] block w-[15px] h-[15px] rotate-45'
          style={{ background: '#EFEEE9', left: arrowLeft }}
        />
        <div
          className='relative bg-white rounded-lg overflow-hidden'
          style={{ border: '3px solid #EFEEE9', boxShadow: '0 12px 30px -12px rgba(0,0,0,.25)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FABRIC mega-panel — Craft (3-col grid, grouped) + Material + Pattern + Color
// ---------------------------------------------------------------------------
function FabricPanel({ fabric }: { fabric: FabricNav }) {
  return (
    <div className='flex items-stretch gap-1 p-3.5 w-[1280px] max-w-[calc(100vw-2rem)]'>
      {/* Left promo panel — matches live site */}
      <div className='basis-[200px] shrink-0 flex flex-col justify-center pr-6 border-r border-clay/10 mr-4'>
        <h3 className='text-3xl font-medium leading-tight mb-4' style={{ color: '#7D5B20' }}>
          Handwoven<br />Textiles
        </h3>
        <p className='text-sm my-1'>
          <span style={{ color: '#7D5B20' }}>100%</span> Natural Fibres
        </p>
        <p className='text-sm my-1'>
          Fully <span style={{ color: '#7D5B20' }}>customised</span> fabrics at low MOQ
        </p>
        <p className='text-sm my-1'>
          Seamless manufacturing{' '}
          <span style={{ color: '#7D5B20' }}>Apparel</span>,{' '}
          <span style={{ color: '#7D5B20' }}>Home</span> &amp;{' '}
          <span style={{ color: '#7D5B20' }}>Accessories</span>
        </p>
        <div className='flex flex-col gap-2 mt-4'>
          <Link href='/products/fabric' className='w-full text-center rounded-md py-1.5 px-3 text-sm font-medium text-white transition hover:opacity-90' style={{ background: '#8E7862' }}>
            Fabric
          </Link>
          <Link href='/products/fabric?category=swatchkit' className='w-full text-center rounded-md py-1.5 px-3 text-sm font-medium text-white transition hover:opacity-90' style={{ background: '#B78F9D' }}>
            Order a SwatchKit
          </Link>
        </div>
      </div>

      {/* Craft — grouped subcategories in a 3-col grid, tetradic-3 tint.
           SwatchKit renders as a pink badge (live: bg-[#B78F9D]) with no sub-items.
           'Custom Product' sub-items are hidden (live Angular: *ngIf !== 'Custom Product'). */}
      <div className='flex-[55%] min-w-0 pr-4 rounded-md pt-2' style={{ background: TINT.tetradic3 }}>
        <div className={`grid grid-cols-3 gap-x-6 gap-y-5 px-3 ${COL_SCROLL}`}>
          {fabric.craftGroups.map((g) => {
            const isSwatchKit = g.title.toLowerCase() === 'swatchkit';
            const visibleItems = isSwatchKit
              ? []
              : g.items.filter((it) => it.label.toLowerCase() !== 'custom product');
            return (
              <div key={g.title}>
                {isSwatchKit ? (
                  <Link
                    href='/products/fabric?category=swatchkit'
                    className='inline-block rounded-md px-2 py-1 text-sm font-medium text-white whitespace-nowrap'
                    style={{ background: '#B78F9D' }}
                  >
                    Order a SwatchKit
                  </Link>
                ) : (
                  <>
                    <h4 className={HEADER_CLS}>{g.title}</h4>
                    <ul className='space-y-1.5'>
                      {visibleItems.map((it) => (
                        <li key={it.href}>
                          <a href={it.href} className={LINK_CLS}>{titleCase(it.label)}</a>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Material — tetradic-1 tint */}
      <div className='flex-[15%] min-w-0 rounded-md px-3 py-3 ml-1' style={{ background: TINT.tetradic1 }}>
        <h4 className={HEADER_TC}>{titleCase(fabric.materialColumn.title)}</h4>
        <ul className={`space-y-1.5 ${COL_SCROLL}`}>
          {fabric.materialColumn.items.map((it) => (
            <li key={it.href}><a href={it.href} className={LINK_CLS}>{titleCase(it.label)}</a></li>
          ))}
        </ul>
      </div>

      {/* Pattern — tetradic-2 tint */}
      <div className='flex-[15%] min-w-0 rounded-md px-3 py-3 ml-1' style={{ background: TINT.tetradic2 }}>
        <h4 className={HEADER_TC}>{titleCase(fabric.patternColumn.title)}</h4>
        <ul className={`space-y-1.5 ${COL_SCROLL}`}>
          {fabric.patternColumn.items.map((it) => (
            <li key={it.href}><a href={it.href} className={LINK_CLS}>{titleCase(it.label)}</a></li>
          ))}
        </ul>
      </div>

      {/* Color — analogous-1 tint, square swatch + name */}
      <div className='flex-[15%] min-w-0 rounded-md px-3 py-3 ml-1' style={{ background: TINT.analogous1 }}>
        <h4 className={HEADER_TC}>Color</h4>
        <ul className={`space-y-1 ${COL_SCROLL}`}>
          {fabric.colorSwatches.map((c) => (
            <li key={c.href}>
              <a href={c.href} className='flex items-center gap-2 text-sm text-black/70 hover:text-clay transition-colors capitalize'>
                <span className='w-7 h-7 rounded-sm border border-black/10 shrink-0' style={{ backgroundColor: c.hex }} />
                <span>{titleCase(c.label)}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FINISHED mega-panel — grouped subcategory columns + promo image (swaps on hover)
// ---------------------------------------------------------------------------
function FinishedPanel({ group, tint }: { group: FinishedGroup; tint: string }) {
  // image swap on sub-category hover (live: setSelectedAccessory etc.)
  const [img, setImg] = useState(group.promoImage);
  useEffect(() => { setImg(group.promoImage); }, [group.promoImage]);
  return (
    <div className='flex items-stretch gap-6 p-3.5 max-w-[calc(100vw-2rem)]'>
      <div className={`grid grid-cols-4 gap-x-8 gap-y-5 rounded-md p-3 ${COL_SCROLL}`} style={{ background: tint }}>
        {group.columns.map((col) => (
          <div key={col.title}>
            <h4 className={HEADER_CLS}>{col.title}</h4>
            <ul className='space-y-1.5'>
              {col.items.map((it) => (
                <li key={it.href}>
                  <a
                    href={it.href}
                    className={LINK_CLS}
                    onMouseEnter={() => { if (it.image) setImg(it.image); }}
                  >{titleCase(it.label)}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {img && (
        <a href={'/products/finished?category=' + group.category} className='shrink-0 self-stretch'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt={group.label} className='h-full w-[300px] max-h-[450px] object-cover rounded-lg' />
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// COLLABORATIONS mega-panel (live: "Crafts & Clusters" + "Collaborations")
// Source: new-navigation.component.html L230-353. Trigger routes to /stories.
// ---------------------------------------------------------------------------
const ArrowBtn = ({ href, label }: { href: string; label: string }) => (
  <a href={href} className='fb-arrow-btn group inline-flex items-center text-black hover:text-clay transition-colors'>
    <span className='mr-1'>{label}</span>
    <svg width='10' height='10' viewBox='0 0 10 10' aria-hidden='true' className='stroke-current' style={{ fill: 'none', strokeWidth: 2 }}>
      <path d='M0 5h7' className='opacity-0 group-hover:opacity-100 transition-opacity' />
      <path d='M1 1l4 4-4 4' className='group-hover:translate-x-[3px] transition-transform' />
    </svg>
  </a>
);

function CollaborationsPanel() {
  return (
    <div className='grid grid-cols-2 gap-3 p-3.5 w-[860px] max-w-[calc(100vw-2rem)]'>
      {/* Left: Crafts & Clusters */}
      <div>
        <div className='font-bold text-base mb-1.5'>Crafts &amp; Clusters</div>
        <div className='grid grid-cols-2 gap-3'>
          <div className='rounded-md p-3' style={{ background: TINT.tetradic3 }}>
            <div className='font-bold text-base mb-2' style={{ color: '#b37487' }}>Crafts</div>
            <ul className='space-y-1.5 text-sm'>
              <li><Link className='capitalize hover:underline' href='/stories'>jamdani weaving</Link></li>
              <li><Link className='capitalize hover:underline' href='/stories'>kantha embroidery</Link></li>
              <li><Link className='capitalize hover:underline' href='/stories'>natural dyeing</Link></li>
              <li><Link className='capitalize hover:underline' href='/stories'>block printing</Link></li>
              <li><Link className='capitalize hover:underline' href='/stories'>handloom weaving</Link></li>
            </ul>
          </div>
          <Link href='/stories' className='rounded-md overflow-hidden flex items-end p-3 min-h-[120px]' style={{ background: TINT.base }}>
            <span className='text-sm font-semibold text-white'>Explore Our Crafts</span>
          </Link>
        </div>
        <div className='font-bold text-base mt-3 mb-1.5'>Collaborations</div>
        <div className='rounded-md p-3' style={{ background: TINT.tetradic2 }}>
          <ul className='space-y-1.5 text-sm columns-2'>
            <li><Link className='capitalize hover:underline' href='/stories'>designer collaborations</Link></li>
            <li><Link className='capitalize hover:underline' href='/stories'>brand partnerships</Link></li>
            <li><Link className='capitalize hover:underline' href='/stories'>artisan co-creations</Link></li>
            <li><Link className='capitalize hover:underline' href='/stories'>sustainability projects</Link></li>
          </ul>
        </div>
      </div>

      {/* Right: Clusters + Discover More CTA */}
      <div className='grid grid-cols-2 gap-3'>
        <div className='rounded-md p-3' style={{ background: TINT.tetradic1 }}>
          <div className='font-bold text-base mb-2' style={{ color: '#4c6e5d' }}>Clusters</div>
          <ul className='space-y-1.5 text-sm'>
            <li><Link className='capitalize hover:underline' href='/stories'>phulia cluster</Link></li>
            <li><Link className='capitalize hover:underline' href='/stories'>shantipur cluster</Link></li>
            <li><Link className='capitalize hover:underline' href='/stories'>nadia weavers</Link></li>
            <li><Link className='capitalize hover:underline' href='/stories'>bengal artisans</Link></li>
          </ul>
        </div>
        <div className='flex flex-col gap-2'>
          <Link href='/stories' className='rounded-md overflow-hidden flex items-end p-3 h-[70%] min-h-[100px]' style={{ background: TINT.tetradic2 }}>
            <span className='text-sm font-semibold text-black/70'>Discover Our Clusters</span>
          </Link>
          <div className='h-[30%] rounded-md flex justify-center items-center px-2 py-3' style={{ background: TINT.base }}>
            <ArrowBtn href='/stories' label='Discover More About Our Journey' />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// OUR STORY mega-panel — About Us + Care Guide + "Read More Of Our Stories"
// Source: new-navigation.component.html L356-439. Trigger is a span (no nav).
// ---------------------------------------------------------------------------
function OurStoryPanel() {
  return (
    <div className='grid grid-cols-2 gap-3 p-3.5 w-[640px] max-w-[calc(100vw-2rem)]'>
      <div className='rounded-md p-3.5 row-span-2' style={{ background: TINT.tetradic1 }}>
        <div className='font-bold mb-2'>About Us</div>
        <ul className='space-y-1.5 text-sm'>
          <li><a href={'/content/about-us/about-the-brand/56485'} className='hover:underline'>About The Brand</a></li>
          <li><a href={'/content/about-us/about-our-impact/57938'} className='hover:underline'>About Our Impact</a></li>
          <li><a href={'/content/about-us/about-the-founder/57073'} className='hover:underline'>About the Founder</a></li>
          <li><a href={'/content/about-us/about-anuprerna-studio/53794'} className='hover:underline'>About the Studio</a></li>
          <li><Link href='/contact' className='hover:underline'>Contact Us</Link></li>
        </ul>
      </div>
      <div className='rounded-md p-3.5' style={{ background: TINT.complementary2 }}>
        <div className='font-bold mb-2'>Care Guide</div>
        <ul className='space-y-1.5 text-sm'>
          <li><a href={'/content/care-guide/how-to-nurture-your-natural-dyed-clothing/126408'} className='hover:underline'>Natural Dyed Fabric CareGuide</a></li>
          <li><a href={'/content/care-guide/handmade-textiles-care-guide/108968'} className='hover:underline'>Handmade Textiles CareGuide</a></li>
          <li><a href={'/content/care-guide/say-goodbye-to-shrinkage-a-guide-for-fabric-care/2114526'} className='hover:underline'>Fabric Shrinkage CareGuide</a></li>
        </ul>
      </div>
      <div className='rounded-md flex justify-center items-center min-h-[80px] p-3' style={{ background: TINT.analogous1 }}>
        <ArrowBtn href='/blogs' label='Read More Of Our Stories' />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// B2B mega-panel — "Wholesale for Brands" list.
// Source: new-navigation.component.html L440-489. Trigger is a span (no nav).
// ---------------------------------------------------------------------------
function B2BPanel() {
  return (
    <div className='p-3.5 w-[340px] max-w-[calc(100vw-2rem)]'>
      <div className='rounded-md p-3.5' style={{ background: TINT.tetradic3 }}>
        <div className='font-bold mb-2'>Wholesale for Brands</div>
        <ul className='space-y-2 text-sm'>
          <li><Link href='/wholesale-partner-program' className='hover:underline'>Wholesale <span className='font-bold'>Partner</span> Program</Link></li>
          <li><Link href='/artisanflow' className='hover:underline'>Traceability Platform: <span className='font-bold'>ArtisanFlow</span></Link></li>
          <li><a href={'/content/wholesale/order-fabric-swatches/59195'} className='hover:underline'>Order Fabric Swatches</a></li>
          <li><a href={'/content/wholesale/natural-sustainable-custom-dyeing/59105'} className='hover:underline'>Sustainable Dyeing</a></li>
          <li><a href={'/content/wholesale/eco-printing/24862107'} className='hover:underline'>Sustainable Printing</a></li>
          <li><a href={'/content/wholesale/wholesale-production-preorder/59335'} className='hover:underline'>Custom Fabric Production</a></li>
          <li><a href={'/content/wholesale/custom-clothing-accessories-homewares/703160'} className='hover:underline'>Finished Product Development</a></li>
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Currency selector — custom branded dropdown (matches live .fb-product-currency)
// Order: INR / GBP / USD / EUR (live panel order). Re-prices via CurrencyContext.
// ---------------------------------------------------------------------------
function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const opts: CurrencyCode[] = ['INR', 'GBP', 'USD', 'EUR'];
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);
  return (
    <div className='relative' ref={ref}>
      <button
        type='button'
        aria-label='Currency'
        onClick={() => setOpen((v) => !v)}
        className='flex items-center justify-center gap-0.5 rounded font-semibold text-sm pl-2 pr-1 py-0.5'
        style={{ border: '1px solid #D1D4DB', color: '#7D5A20' }}
      >
        <span className='uppercase'>{currency}</span>
        <span className='material-symbols-outlined text-[18px] leading-none'>{open ? 'arrow_drop_up' : 'arrow_drop_down'}</span>
      </button>
      {open && (
        <div className='absolute right-0 top-full mt-1 min-w-[80px] rounded p-2 z-[60]' style={{ background: '#fefefe', border: '1px solid #D1D4DB' }}>
          {opts.map((c, i) => (
            <button
              key={c}
              type='button'
              onClick={() => { setCurrency(c); setOpen(false); }}
              className={'block w-full text-left uppercase font-medium text-[15px] px-2 py-1 transition-opacity ' + (c === currency ? 'opacity-100' : 'opacity-50 hover:opacity-100')}
              style={{ color: '#7D5A20', borderBottom: i < opts.length - 1 ? '1px solid #e1e0da' : 'none' }}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface CartLine { id?: number; productId?: number; quantity?: number; [k: string]: unknown }

export default function SiteHeader({ nav }: { nav: HeaderNavData }) {
  const { user, logout } = useAuth();
  const { mode: buyerMode, setMode: setBuyerMode, isBusinessAccount } = useBuyerMode();
  const { formatCode2 } = useCurrency();
  const [detailsItem, setDetailsItem] = useState<CartItem | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const router = useRouter();
  const [searchQ, setSearchQ] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartError, setCartError] = useState(false);
  const [cartReload, setCartReload] = useState(0);
  const [cartQty, setCartQty] = useState<Record<number, number>>({});
  // GUEST cart: line count for the header badge (localStorage-backed, live).
  const [guestCount, setGuestCount] = useState(0);
  const [acctOpen, setAcctOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [acc, setAcc] = useState<string | null>(null); // mobile accordion
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const acctCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHover(key);
  };
  const closeMenu = () => {
    closeTimer.current = setTimeout(() => setHover(null), 130);
  };

  // Account dropdown: the panel is absolutely-positioned below the trigger
  // (mt-1 gap), so an immediate onMouseLeave on the wrapper fires while the
  // cursor is still crossing that gap, closing the menu before it's reached.
  // Same close-delay pattern as the mega-menu above (openMenu/closeMenu).
  const openAcct = () => {
    if (acctCloseTimer.current) clearTimeout(acctCloseTimer.current);
    setAcctOpen(true);
  };
  const closeAcct = () => {
    acctCloseTimer.current = setTimeout(() => setAcctOpen(false), 200);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // GUEST cart sync: keep the header count live and re-pull the drawer whenever the
  // localStorage guest cart changes (add / remove / qty). No-op for logged-in users.
  useEffect(() => {
    if (user) { setGuestCount(0); return; }
    const sync = () => {
      setGuestCount(guestCart.list().length);
      setCartReload((k) => k + 1);
    };
    sync();
    return guestCart.subscribe(sync);
  }, [user]);

  // FIX 13: open the mini-cart when the PDP dispatches anuprerna:cart-updated.
  useEffect(() => {
    const onCartUpdated = () => setCartOpen(true);
    window.addEventListener('anuprerna:cart-updated', onCartUpdated);
    return () => window.removeEventListener('anuprerna:cart-updated', onCartUpdated);
  }, []);

  useEffect(() => {
    if (!cartOpen) return;
    setCartError(false);
    let alive = true;
    (async () => {
      // GUEST: the account /api/cart is empty for anon, so build the drawer from the
      // localStorage guest cart. Enrich the thin guest lines the SAME way as logged-in
      // lines (names / images / prices / customization / MOQ), then the qty stepper +
      // remove below operate directly on the guest cart.
      if (!user) {
        const gLines = guestCart.list();
        // Carry the guest line's OWN stored display fields (name/image/price) into
        // fabricProductPreview immediately so the drawer shows the real product the
        // instant it opens; the /api/cart/enrich pass below then upgrades it with
        // MOQ / made-to-order / customization labels.
        const toThin = (g: guestCart.GuestCartItem): CartLine =>
          ({
            ...g,
            id: undefined,
            guestKey: g.key,
            fabricProductPreview: { product: { name: g.name, heroImage: g.image, slug: g.slug, sku: g.sku, price: g.price, productGroup: g.productGroup } },
          } as unknown as CartLine);
        if (alive) setCart(gLines.map(toThin));
        let merged: CartLine[] = gLines.map(toThin);
        if (gLines.length > 0) {
          try {
            const enr = await fetch('/api/cart/enrich', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: gLines }),
              cache: 'no-store',
            }).then((x) => (x.ok ? x.json() : null));
            const enriched = enr?.enriched;
            if (Array.isArray(enriched)) {
              merged = gLines.map((g, i) => {
                const e = enriched[i];
                const thin = toThin(g);
                if (!e || !e.product) {
                  // Enrich missed -> fall back to the guest line's stored display fields.
                  return { ...thin, fabricProductPreview: { product: { name: g.name, heroImage: g.image, slug: g.slug, sku: g.sku, price: g.price, productGroup: g.productGroup } } } as unknown as CartLine;
                }
                return { ...thin, fabricProductPreview: { product: e.product }, customization: e.customization || undefined, fabricSku: e.fabricSku ?? undefined, priceBreakdown: e.priceBreakdown ?? undefined, customDetails: e.details ?? undefined } as unknown as CartLine;
              });
            }
          } catch {
            /* keep thin guest lines */
          }
        }
        if (!alive) return;
        setCart(merged);
        return;
      }
      try {
        const r = await fetch('/api/cart', { cache: 'no-store' });
        // 502 = Loom down (not logged-out): show a retry state, not a fake empty cart.
        if (!r.ok) throw new Error('upstream');
        const d = await r.json();
        const lines: CartLine[] = Array.isArray(d?.cartItemList)
          ? d.cartItemList
          : Array.isArray(d?.entity)
            ? d.entity
            : [];
        // Render the thin lines IMMEDIATELY (fast, no empty flash), then upgrade
        // to the enriched lines once the catalogue round-trip resolves.
        if (alive) {
          setCart(lines);
          setCartQty(Object.fromEntries(lines.map((it, i) => [(it.id as number) ?? i, (it.quantity as number) ?? 1])));
        }
        // Enrich the THIN account cart lines with product name / image / price /
        // MTO flag (same endpoint the cart page uses) so the drawer shows real
        // products, correct prices + swatch identity. Best-effort: keep thin on fail.
        let merged: CartLine[] = lines;
        if (lines.length > 0) {
          try {
            const enr = await fetch('/api/cart/enrich', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: lines }),
              cache: 'no-store',
            }).then((x) => (x.ok ? x.json() : null));
            const enriched = enr?.enriched;
            if (Array.isArray(enriched)) {
              merged = lines.map((it, i) => {
                const e = enriched[i];
                if (!e || !e.product) return it;
                return { ...it, fabricProductPreview: { product: e.product }, customization: e.customization || undefined, fabricSku: e.fabricSku ?? undefined, priceBreakdown: e.priceBreakdown ?? undefined, customDetails: e.details ?? undefined };
              });
            }
          } catch {
            /* keep thin lines */
          }
        }
        if (!alive) return;
        setCart(merged);
        setCartQty(Object.fromEntries(merged.map((it, i) => [(it.id as number) ?? i, (it.quantity as number) ?? 1])));
      } catch {
        if (alive) setCartError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [cartOpen, cartReload, user]);

  // FIX 8: logged-in label = customer FIRST NAME (live: tenant.name.split(" ")[0]).
  const fullName =
    (user?.name as string) ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    '';
  const firstName = fullName.split(' ')[0] || (user?.email as string) || 'Account';
  // Header badge count: account lines for logged-in, live guest-cart count for guests.
  const cartCount = user ? cart.length : guestCount;
  // Crown if wholesale-program-active (best-effort detection from the profile).
  const isWholesale = Boolean(
    user && (user.activeWholesaleProgram || user.wholesaleProgramActive || user.isWholesaleMember),
  );

  // resolve which panel to show (only one at a time)
  const activeFabric = hover === 'fabric';
  const activeFinishedIdx = nav.finished.findIndex((g) => hover === g.category);
  const activeFinished = activeFinishedIdx >= 0 ? nav.finished[activeFinishedIdx] : null;
  const FINISHED_TINTS = [TINT.complementary2, TINT.analogous1, TINT.tetradic2];

  return (
    <>
      <div className='sticky top-0 z-50 w-full' onMouseLeave={closeMenu}>
        <header
          className={
            'w-full bg-white transition-shadow ' +
            (scrolled ? 'shadow-sm border-b border-clay/10' : 'border-b border-transparent')
          }
          data-mega-menu
        >
          <nav className='mx-auto max-w-screen-xl px-4 h-16 flex items-center justify-between gap-2'>
            {/* Logo + hamburger */}
            <div className='flex items-center gap-2 shrink-0'>
              <button className='xl:hidden flex items-center justify-center' aria-label='Menu' style={{ minWidth: '44px', minHeight: '44px' }} onClick={() => setDrawer((v) => !v)}>
                <span className='material-symbols-outlined'>{drawer ? 'close' : 'menu'}</span>
              </button>
              {/* FIX 9: logo glyph tucked tight against wordmark (live: hidden "A" + "nuprerna") */}
              <Link href='/' className='flex items-center'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGO} alt='Anuprerna' className='h-7 lg:h-9 w-auto' />
                <div className='font-bold text-base lg:text-xl leading-none -ml-0.5'>
                  <span className='hidden'>A</span>nuprerna
                </div>
              </Link>
            </div>

            {/* Desktop mega-menu nav */}
            <ul className='hidden xl:flex items-center gap-4 2xl:gap-6 text-base text-black/80'>
              <li className='py-5' onMouseEnter={() => openMenu('fabric')}>
                <Link href='/products/fabric' className='hover:text-[#9c8a6c] transition-colors'>Fabric</Link>
              </li>
              {nav.finished.map((grp) => (
                <li key={grp.category} className='py-5' onMouseEnter={() => openMenu(grp.category)}>
                  <a href={'/products/finished?category=' + grp.category} className='hover:text-[#9c8a6c] transition-colors'>
                    {grp.label}
                  </a>
                </li>
              ))}
              {/* FIX 1: Collaborations — hover opens dropdown; label routes to /stories */}
              <li className='py-5' onMouseEnter={() => openMenu('collaborations')}>
                <Link href='/stories' className='hover:text-[#9c8a6c] transition-colors'>Collaborations</Link>
              </li>
              {/* FIX 2: Our Story — hover-trigger span (no navigation) */}
              <li className='py-5' onMouseEnter={() => openMenu('ourstory')}>
                <span className='cursor-pointer hover:text-[#9c8a6c] transition-colors whitespace-nowrap'>Our Story</span>
              </li>
              {/* FIX 3: B2B — hover-trigger span (no navigation) */}
              <li className='py-5' onMouseEnter={() => openMenu('b2b')}>
                <span className='cursor-pointer hover:text-[#9c8a6c] transition-colors'>B2B</span>
              </li>
            </ul>

            {/* Right actions */}
            <div className='flex items-center gap-2 xl:gap-3 shrink-0'>
              {/* Desktop: always-visible inline search input — max-w 190px, flex-shrink so it yields space first */}
              <form
                className='hidden xl:flex items-center gap-1 rounded-md px-2 py-1 min-w-0'
                style={{ border: '1px solid #D1D4DB', maxWidth: '190px', flexShrink: 1 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQ.trim()) {
                    router.push('/display/search?search=' + encodeURIComponent(searchQ.trim()));
                  }
                }}
              >
                <span className='material-symbols-outlined text-[18px] text-black/40 shrink-0'>search</span>
                <input
                  type='text'
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder='Search…'
                  aria-label='Search'
                  className='min-w-0 flex-1 bg-transparent text-sm text-black/80 placeholder:text-black/35 outline-none w-full'
                  style={{ minWidth: 0 }}
                />
              </form>
              {/* Mobile: icon-only search — ≥44px tap target */}
              <Link href='/display/search' aria-label='Search' className='xl:hidden flex items-center justify-center text-black/80 hover:text-clay' style={{ minWidth: '44px', minHeight: '44px' }}>
                <span className='material-symbols-outlined'>search</span>
              </Link>

              {/* Desktop: persistent Talk to us contact link */}
              <Link href='/contact' className='hidden xl:inline-flex items-center gap-1 text-sm text-black/70 hover:text-clay transition whitespace-nowrap'>
                <span className='material-symbols-outlined text-[18px]'>chat_bubble_outline</span>
                Talk to us
              </Link>

              <span className='hidden xl:block'><CurrencySelector /></span>

              {/* FIX 6: wishlist heart OUTLINE */}
              <Link href='/wishlist' aria-label='Wishlist' className='flex items-center justify-center text-black/80 hover:text-clay' style={{ minWidth: '44px', minHeight: '44px' }}>
                <span className='material-symbols-outlined'>favorite_border</span>
              </Link>

              <button aria-label='Cart' className='flex items-center justify-center text-black/80 hover:text-clay relative' style={{ minWidth: '44px', minHeight: '44px' }} onClick={() => setCartOpen(true)}>
                <span className='material-symbols-outlined'>shopping_cart</span>
                {cartCount > 0 && (
                  <span className='absolute -right-1.5 -top-1.5 bg-clay text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center'>
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Account. Render the deterministic logged-out default (Sign In) on
                 BOTH server and first client render; `user` only becomes truthy via the
                 async auth fetch (post-hydration), so no structural branch flips during
                 hydration — eliminating the intermittent React #418 the old mounted/loading
                 placeholder swap caused on this large streamed page. */}
              {user ? (
                <div className='relative hidden sm:block' onMouseEnter={openAcct} onMouseLeave={closeAcct}>
                  {/* FIX 8: person icon (or crown if wholesale) + FIRST NAME, no bordered pill */}
                  <button
                    onClick={() => setAcctOpen((v) => !v)}
                    className='inline-flex items-center gap-1 text-black/80 hover:text-[#9c8a6c] text-sm transition max-w-[180px]'
                  >
                    <span className={'material-symbols-outlined text-[20px] ' + (isWholesale ? 'text-amber-500' : '')}>
                      {isWholesale ? 'workspace_premium' : 'person'}
                    </span>
                    <span className='truncate'>{firstName}</span>
                  </button>
                  {/* FIX 4: wired account dropdown */}
                  {acctOpen && (
                    <div className='absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl py-2 text-sm z-50 overflow-hidden' style={{ border: '1px solid #EFEEE9' }}>
                      {/* Active Mode Badge & 1-Click Switch ONLY for Business accounts */}
                      {isBusinessAccount && (
                        <div className='px-4 py-2.5 bg-[#FAF9F7] border-b border-[#EFEEE9] mb-1'>
                          <div className='flex items-center justify-between'>
                            <span className='text-[11px] font-bold uppercase tracking-wider text-bark/80 flex items-center gap-1'>
                              <span className='material-symbols-outlined text-[15px] text-clay'>
                                {buyerMode === 'b2b' ? 'domain' : 'person'}
                              </span>
                              {buyerMode === 'b2b' ? 'Business Mode' : 'Retail Mode'}
                            </span>
                            <button
                              type='button'
                              onClick={() => setBuyerMode(buyerMode === 'b2b' ? 'b2c' : 'b2b')}
                              className='text-[11px] font-medium text-clay hover:underline cursor-pointer'
                            >
                              {buyerMode === 'b2b' ? 'Switch to Retail' : 'Switch to Business'}
                            </button>
                          </div>
                        </div>
                      )}

                      <Link href='/profile' className='block px-4 py-2 hover:bg-sand'>Dashboard</Link>
                      <Link href='/profile/order' className='block px-4 py-2 hover:bg-sand'>Orders</Link>
                      <Link href='/profile/address' className='block px-4 py-2 hover:bg-sand'>Address</Link>
                      <Link href='/profile/account' className='block px-4 py-2 hover:bg-sand'>Account</Link>
                      <Link href='/profile/wholesale-program' className='block px-4 py-2 hover:bg-sand'>Wholesale Program</Link>
                      <Link href='/contact' className='block px-4 py-2 hover:bg-sand'>Contact Us</Link>
                      <button onClick={() => logout()} className='w-full text-left px-4 py-2 hover:bg-sand flex items-center gap-2'>
                        Logout
                        <span className='material-symbols-outlined text-[16px]'>logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setLoginOpen(true)}
                  className='hidden sm:inline-flex items-center text-black/80 hover:text-clay text-sm transition'
                >
                  Sign In &rsaquo;
                </button>
              )}
            </div>
          </nav>

          {/* Desktop: inline search input in header — no overlay needed */}

                    {/* FIX 12: Mobile drawer — full overlay, SwatchKit CTA, expandable
              Collaborations/Our Story/B2B, contact + social at bottom */}
          {drawer && (
            <MobileDrawer
              nav={nav} acc={acc} setAcc={setAcc} user={user} logout={logout}
              firstName={firstName} isWholesale={isWholesale}
              onClose={() => setDrawer(false)}
              onSignIn={() => { setDrawer(false); setLoginOpen(true); }}
            />
          )}
        </header>

        {/* Mega-menu panels — floating tinted cards, one at a time */}
        {activeFabric && (
          <MegaCard arrowLeft={120} onMouseEnter={() => openMenu('fabric')} onMouseLeave={closeMenu}>
            <FabricPanel fabric={nav.fabric} />
          </MegaCard>
        )}
        {activeFinished && activeFinished.columns.length > 0 && (
          <MegaCard arrowLeft={300} onMouseEnter={() => openMenu(activeFinished.category)} onMouseLeave={closeMenu}>
            <FinishedPanel group={activeFinished} tint={FINISHED_TINTS[activeFinishedIdx] || TINT.complementary2} />
          </MegaCard>
        )}
        {hover === 'collaborations' && (
          <MegaCard arrowLeft={520} onMouseEnter={() => openMenu('collaborations')} onMouseLeave={closeMenu}>
            <CollaborationsPanel />
          </MegaCard>
        )}
        {hover === 'ourstory' && (
          <MegaCard arrowLeft={620} onMouseEnter={() => openMenu('ourstory')} onMouseLeave={closeMenu}>
            <OurStoryPanel />
          </MegaCard>
        )}
        {hover === 'b2b' && (
          <MegaCard arrowLeft={700} onMouseEnter={() => openMenu('b2b')} onMouseLeave={closeMenu}>
            <B2BPanel />
          </MegaCard>
        )}
      </div>

      {/* Mini-cart slide-in */}
      {cartOpen && (
        <div className='fixed inset-0 z-[95]'>
          <div className='absolute inset-0 bg-black/40' onClick={() => setCartOpen(false)} />
          <aside className='absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-xl flex flex-col'>
            <div className='flex items-center justify-between px-5 py-4 border-b border-clay/10'>
              <h3 className='flex items-center gap-2 font-medium text-clay'>
                <span>Cart</span>
                {cartCount > 0 && (
                  <span className='flex h-5 w-5 items-center justify-center rounded-full bg-clay text-[11px] font-normal text-white'>{cartCount}</span>
                )}
              </h3>
              <button aria-label='Close' onClick={() => setCartOpen(false)}>
                <span className='material-symbols-outlined text-black/50'>close</span>
              </button>
            </div>
            <div className='flex-1 overflow-y-auto p-5'>
              {cartError ? (
                <div className='text-center text-black/60 mt-16'>
                  <span className='material-symbols-outlined text-4xl text-red-500'>error</span>
                  <p className='mt-3 text-sm'>Couldn&apos;t load your cart.</p>
                  <button
                    type='button'
                    onClick={() => setCartReload((k) => k + 1)}
                    className='mt-4 inline-flex items-center gap-1.5 rounded-md border border-clay/30 px-4 py-2 text-sm font-medium text-clay hover:bg-clay/5 transition'
                  >
                    <span className='material-symbols-outlined text-base'>refresh</span>
                    Retry
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className='text-center text-black/50 mt-16'>
                  <span className='material-symbols-outlined text-4xl'>shopping_cart</span>
                  <p className='mt-3 text-sm'>Your cart is empty.</p>
                  {!user && <p className='mt-1 text-xs'>Sign in to see your saved cart.</p>}
                </div>
              ) : (
                <ul className='space-y-4'>
                  {cart.map((c, i) => {
                    const it = c as unknown as CartItem;
                    const cc = c as Record<string, any>;
                    const prod = it.fabricProductPreview?.product ?? {};
                    const isSwatch = (it.productGroup || prod.productGroup || '').toLowerCase() === 'swatch';
                    const baseName = prod.name ?? cc.productName ?? ('Item #' + (it.id ?? i));
                    const displayName = (isSwatch ? 'Swatch - ' : '') + baseName;
                    const img = prod.heroImage;
                    const isMTO = effectiveOrderType(it) === 'MADE_TO_ORDER';
                    const gKey = cc.guestKey as string | undefined;
                    const isGuest = !!gKey;
                    const q = isGuest ? (it.quantity ?? 1) : (cartQty[(it.id as number) ?? i] ?? (it.quantity ?? 1));
                    const unitPrice = cartUnitPrice(it);
                    const unit = isSwatch ? 'unit' : (it.unit || 'METER').toLowerCase();
                    const floorMoq = lineMoq(it);
                    const belowMin = q < floorMoq;
                    const setQ = (nq: number) => {
                      const v = Math.max(1, nq);
                      if (isGuest && gKey) guestCart.updateQty(gKey, v);
                      else setCartQty((prev) => ({ ...prev, [(it.id as number) ?? i]: v }));
                    };
                    return (
                      <li key={gKey ?? it.id ?? i} className='flex gap-3 border-b border-clay/5 pb-4'>
                        {isSwatch ? (
                          <div className='flex h-16 w-16 shrink-0 items-center justify-center'>
                            {img ? (
                              <div className='swatch-mask h-14 w-14' style={{ backgroundImage: 'url(' + img + ')' }} role='img' aria-label={displayName} />
                            ) : (
                              <div className='swatch-mask h-14 w-14 bg-clay/10' />
                            )}
                          </div>
                        ) : img ? (
                          <img src={img} alt={baseName} className='h-16 w-16 shrink-0 rounded object-cover' />
                        ) : (
                          <div className='flex h-16 w-16 shrink-0 items-center justify-center rounded bg-clay/5 text-clay/30'>
                            <span className='material-symbols-outlined'>image</span>
                          </div>
                        )}
                        <div className='min-w-0 flex-1'>
                          {isMTO && (
                            <span className='mb-1 inline-flex w-max items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold' style={{ color: '#8f780f', backgroundColor: '#FFF8D0' }}>
                              Made To Order
                            </span>
                          )}
                          <p className='truncate text-sm text-black/80'>{displayName}</p>
                          {it.customization && (
                            <p className='mt-0.5 text-xs text-black/50 leading-snug'>{it.customization}</p>
                          )}
                          {(() => {
                            const productSku = it.sku || (prod as Record<string, any>).sku;
                            const fabricSku = it.fabricSku || it.customDetails?.fabricSku;
                            if (!productSku && !fabricSku) return null;
                            return (
                              <p className='mt-0.5 text-[11px] text-black/40 leading-snug'>
                                {productSku && <span>SKU: {productSku}</span>}
                                {productSku && fabricSku && <span>{'  ·  '}</span>}
                                {fabricSku && <span>Fabric SKU: {fabricSku}</span>}
                              </p>
                            );
                          })()}
                          <p className='mt-0.5 text-xs text-black/60'>
                            <span className='font-medium text-black/80'>{formatCode2(unitPrice)}</span>
                            <span className='text-black/40'> / {unit}</span>
                          </p>
                          <div className='mt-1.5 flex items-center overflow-hidden rounded border border-clay/25 w-max'>
                            <button type='button' aria-label='decrease quantity' onClick={() => setQ(Math.max(floorMoq, q - 1))} disabled={q <= floorMoq} className='px-2 py-0.5 text-clay hover:bg-clay/10 disabled:opacity-40 disabled:hover:bg-transparent'>&minus;</button>
                            <span className='min-w-[2rem] border-x border-clay/15 px-1 py-0.5 text-center text-xs font-medium text-clay'>{q}</span>
                            <button type='button' aria-label='increase quantity' onClick={() => setQ(q + 1)} className='px-2 py-0.5 text-clay hover:bg-clay/10'>+</button>
                          </div>
                          {belowMin && (
                            <p className='mt-1 text-[11px] font-medium text-red-600'>Below minimum ({floorMoq} {unit})</p>
                          )}
                          <button
                            type='button'
                            onClick={() => setDetailsItem(it)}
                            className='mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-clay hover:underline'
                          >
                            <span className='material-symbols-outlined text-[14px]'>info</span>
                            View details
                          </button>
                        </div>
                        <button type='button' title={isGuest ? 'Remove' : 'Disabled in TEST MODE'} aria-label={isGuest ? 'remove' : 'remove (display only)'} onClick={isGuest && gKey ? () => guestCart.removeItem(gKey) : undefined} className='shrink-0 self-start text-black/40 hover:text-black/60'>
                          <span className='material-symbols-outlined text-[18px]'>delete</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className='p-5 border-t border-clay/10'>
              {cart.length > 0 && (
                <div className='mb-3 flex items-start justify-between'>
                  <div className='flex flex-col'>
                    <span className='text-base font-bold text-clay'>Sub Total</span>
                    <span className='text-[11px] text-black/50'>including discounts (if any)</span>
                  </div>
                  <span className='text-base font-bold text-clay'>
                    {formatCode2(
                      cart.reduce((sum, c, i) => {
                        const it = c as unknown as CartItem;
                        const gk = (c as Record<string, unknown>).guestKey as string | undefined;
                        const q = gk ? (it.quantity ?? 1) : (cartQty[(it.id as number) ?? i] ?? (it.quantity ?? 1));
                        return sum + lineTotal(it, q);
                      }, 0),
                    )}
                  </span>
                </div>
              )}
              <Link href='/checkout' className='block text-center rounded-lg bg-clay text-white py-2.5 font-medium hover:bg-clayd transition'>
                Checkout
              </Link>
            </div>
          </aside>
        </div>
      )}

      {detailsItem && (
        <CartDetailsDialog open onClose={() => setDetailsItem(null)} item={detailsItem} />
      )}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

// ===========================================================================
// MOBILE DRAWER — full-height overlay
// ===========================================================================
const SOCIAL = [
  { alt: 'Twitter',   href: 'https://twitter.com/Anuprerna6',               img: 'https://anuprerna.com/assets/img/twitter.svg' },
  { alt: 'Facebook',  href: 'https://www.facebook.com/anuprernatelier/',    img: '/media/facebook.svg' },
  { alt: 'Pinterest', href: 'https://in.pinterest.com/anuprernas/',         img: '/media/pininterest.svg' },
  { alt: 'Instagram', href: 'https://www.instagram.com/anuprerna_atelier/', img: '/media/instagram.svg' },
  { alt: 'LinkedIn',  href: 'https://www.linkedin.com/company/anuprerna/',  img: '/media/linkedin-anuprerna.svg' },
];

function MobileDrawer({
  nav, acc, setAcc, user, logout, firstName, isWholesale, onClose, onSignIn,
}: {
  nav: HeaderNavData; acc: string | null; setAcc: (v: string | null) => void;
  user: ReturnType<typeof useAuth>['user']; logout: () => void;
  firstName: string; isWholesale: boolean; onClose: () => void; onSignIn: () => void;
}) {
  return (
    <div className='xl:hidden fixed inset-0 top-16 z-[90] bg-white overflow-y-auto'>
      <div className='px-4 py-4'>
        {/* Sign In row / account */}
        <div className='flex items-center justify-between pb-3 mb-2 border-b border-clay/10'>
          {user ? (
            <span className='flex items-center gap-1 text-sm font-medium'>
              <span className={'material-symbols-outlined text-[20px] ' + (isWholesale ? 'text-amber-500' : '')}>
                {isWholesale ? 'workspace_premium' : 'person'}
              </span>
              {firstName}
            </span>
          ) : (
            <button onClick={onSignIn} className='inline-flex items-center text-black/80 text-sm'>Sign In &rsaquo;</button>
          )}
          <div className='flex items-center gap-3'>
            <span className='text-xs text-black/60'>Currency</span><CurrencySelector />
          </div>
        </div>

        {/* FIX 12: Order a SwatchKit CTA */}
        <Link href='/products/fabric?category=swatchkit' onClick={onClose}
          className='block w-full text-center rounded-md py-2.5 px-3 text-sm font-semibold text-white mb-3'
          style={{ background: '#B78F9D' }}>
          Order a SwatchKit
        </Link>

        <MobileFabricAccordion fabric={nav.fabric} acc={acc} setAcc={setAcc} onNav={onClose} />
        {nav.finished.map((g) => (
          <MobileAccordion key={g.category} title={g.label} k={g.category} acc={acc} setAcc={setAcc}
            columns={g.columns} href={'/products/finished?category=' + g.category} onNav={onClose} />
        ))}

        {/* Collaborations — expandable */}
        <MobileLinkAccordion title='Collaborations' k='collaborations' href='/stories' acc={acc} setAcc={setAcc} onNav={onClose}>
          <ul className='space-y-1 text-sm text-black/60'>
            <li><Link href='/stories' onClick={onNav(onClose)} className='hover:text-clay'>Crafts</Link></li>
            <li><Link href='/stories' onClick={onNav(onClose)} className='hover:text-clay'>Clusters</Link></li>
            <li><Link href='/stories' onClick={onNav(onClose)} className='hover:text-clay'>Collaborations</Link></li>
          </ul>
        </MobileLinkAccordion>

        {/* Our Story — expandable (About Us) */}
        <MobileLinkAccordion title='Our Story' k='ourstory' acc={acc} setAcc={setAcc} onNav={onClose}>
          <ul className='space-y-1 text-sm text-black/60'>
            <li><a href={'/content/about-us/about-the-brand/56485'} className='hover:text-clay'>About The Brand</a></li>
            <li><a href={'/content/about-us/about-our-impact/57938'} className='hover:text-clay'>About Our Impact</a></li>
            <li><a href={'/content/about-us/about-the-founder/57073'} className='hover:text-clay'>About the Founder</a></li>
            <li><Link href='/blogs' onClick={onNav(onClose)} className='hover:text-clay'>Read Our Stories</Link></li>
            <li><Link href='/contact' onClick={onNav(onClose)} className='hover:text-clay'>Contact Us</Link></li>
          </ul>
        </MobileLinkAccordion>

        {/* B2B — expandable */}
        <MobileLinkAccordion title='B2B' k='b2b' acc={acc} setAcc={setAcc} onNav={onClose}>
          <ul className='space-y-1 text-sm text-black/60'>
            <li><Link href='/wholesale-partner-program' onClick={onNav(onClose)} className='hover:text-clay'>Wholesale Partner Program</Link></li>
            <li><Link href='/artisanflow' onClick={onNav(onClose)} className='hover:text-clay'>ArtisanFlow</Link></li>
            <li><a href={'/content/wholesale/order-fabric-swatches/59195'} className='hover:text-clay'>Order Fabric Swatches</a></li>
            <li><a href={'/content/wholesale/wholesale-production-preorder/59335'} className='hover:text-clay'>Custom Fabric Production</a></li>
          </ul>
        </MobileLinkAccordion>

        {user && (
          <div className='mt-3 flex flex-col gap-1 text-sm border-t border-clay/10 pt-3'>
            <Link href='/profile' onClick={onClose} className='py-1.5'>Dashboard</Link>
            <Link href='/profile/order' onClick={onClose} className='py-1.5'>Orders</Link>
            <button onClick={() => logout()} className='py-1.5 text-left text-red-600'>Logout</button>
          </div>
        )}

        {/* FIX 12: Contact + social icons at the bottom */}
        <div className='mt-4 border-t border-clay/10 pt-4'>
          <Link href='/contact' onClick={onClose} className='inline-flex items-center gap-2 text-sm text-clay font-medium mb-3'>
            <span className='material-symbols-outlined text-[20px]'>contact_support</span>
            Contact us
          </Link>
          <div className='flex items-center gap-4'>
            {SOCIAL.map((s) => (
              <a key={s.alt} href={s.href} target='_blank' rel='noopener' aria-label={s.alt} className='opacity-80 hover:opacity-100'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt={s.alt} width={22} height={22} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// helper to combine nav-close on click inside mobile sub-lists
const onNav = (cb: () => void) => () => cb();

// ---- Mobile: link accordion (Collaborations / Our Story / B2B) ----
function MobileLinkAccordion({
  title, k, href, acc, setAcc, onNav: onNavClose, children,
}: {
  title: string; k: string; href?: string; acc: string | null; setAcc: (v: string | null) => void;
  onNav: () => void; children: React.ReactNode;
}) {
  const open = acc === k;
  return (
    <div className='border-b border-clay/5'>
      <div className='flex items-center justify-between py-3'>
        {href ? (
          <a href={href} className='hover:text-clay' onClick={onNavClose}>{title}</a>
        ) : (
          <span className='text-black/80'>{title}</span>
        )}
        <button aria-label='Toggle' onClick={() => setAcc(open ? null : k)}>
          <span className='material-symbols-outlined'>{open ? 'expand_less' : 'expand_more'}</span>
        </button>
      </div>
      {open && <div className='pb-3 pl-3'>{children}</div>}
    </div>
  );
}

// ---- Mobile: generic grouped accordion (finished menus) ----
function MobileAccordion({
  title, k, acc, setAcc, columns, href, onNav: onNavClose,
}: {
  title: string; k: string; acc: string | null; setAcc: (v: string | null) => void;
  columns: MegaColumn[]; href: string; onNav: () => void;
}) {
  const open = acc === k;
  return (
    <div className='border-b border-clay/5'>
      <div className='flex items-center justify-between py-3'>
        <a href={href} className='hover:text-clay' onClick={onNavClose}>{title}</a>
        {columns.length > 0 && (
          <button aria-label='Toggle' onClick={() => setAcc(open ? null : k)}>
            <span className='material-symbols-outlined'>{open ? 'expand_less' : 'expand_more'}</span>
          </button>
        )}
      </div>
      {open && (
        <div className='pb-3 pl-3 space-y-3'>
          {columns.map((col) => (
            <div key={col.title}>
              <p className='text-xs font-bold uppercase tracking-wide text-bark mb-1'>{col.title}</p>
              <ul className='space-y-1'>
                {col.items.map((it) => (
                  <li key={it.href}><a href={it.href} className='text-sm text-black/60 hover:text-clay capitalize' onClick={onNavClose}>{titleCase(it.label)}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Mobile: Fabric accordion (craft groups + material/pattern/color) ----
function MobileFabricAccordion({
  fabric, acc, setAcc, onNav: onNavClose,
}: {
  fabric: FabricNav; acc: string | null; setAcc: (v: string | null) => void; onNav: () => void;
}) {
  const open = acc === 'fabric';
  return (
    <div className='border-b border-clay/5'>
      <div className='flex items-center justify-between py-3'>
        <Link href='/products/fabric' className='hover:text-clay' onClick={onNavClose}>Fabric</Link>
        <button aria-label='Toggle' onClick={() => setAcc(open ? null : 'fabric')}>
          <span className='material-symbols-outlined'>{open ? 'expand_less' : 'expand_more'}</span>
        </button>
      </div>
      {open && (
        <div className='pb-3 pl-3 space-y-3'>
          {fabric.craftGroups.map((g) => (
            <div key={g.title}>
              <p className='text-xs font-bold uppercase tracking-wide text-bark mb-1'>{g.title}</p>
              <ul className='space-y-1'>
                {g.items.map((it) => (
                  <li key={it.href}><a href={it.href} className='text-sm text-black/60 hover:text-clay capitalize' onClick={onNavClose}>{titleCase(it.label)}</a></li>
                ))}
              </ul>
            </div>
          ))}
          {[fabric.materialColumn, fabric.patternColumn].map((c) => (
            <div key={c.title}>
              <p className='text-xs font-bold uppercase tracking-wide text-bark mb-1'>{c.title}</p>
              <ul className='space-y-1'>
                {c.items.map((it) => (
                  <li key={it.href}><a href={it.href} className='text-sm text-black/60 hover:text-clay capitalize' onClick={onNavClose}>{titleCase(it.label)}</a></li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <p className='text-xs font-bold uppercase tracking-wide text-bark mb-1'>Color</p>
            <ul className='space-y-1'>
              {fabric.colorSwatches.map((c) => (
                <li key={c.href}>
                  <a href={c.href} className='flex items-center gap-2 text-sm text-black/60 hover:text-clay capitalize' onClick={onNavClose}>
                    <span className='w-4 h-4 rounded-sm border border-black/10' style={{ backgroundColor: c.hex }} />
                    {titleCase(c.label)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
