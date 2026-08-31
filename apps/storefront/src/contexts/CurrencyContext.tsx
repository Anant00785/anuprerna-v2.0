'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Currency selector context — REPLICATES THE LIVE PLATFORM'S FX RULE.
//
// Live composes TWO stored numbers, never one:
//   1. rates    the DAY'S MARKET RATE, per 1 INR (Loom forex_exchange_rate,
//               GET /get/forex-exchange-rate/latest) e.g. usd 0.0104
//   2. uplifts  the STUDIO'S PER-MARKET COMMERCIAL UPLIFT (Loom forex,
//               GET /get/forex-list) — 1.25 for USD/GBP/EUR, 1 for INR
//   effective rate = rates x uplifts
// See fabric/src/app/pipe/currency-converter.pipe.ts and
// fabric/src/app/checkoutv2/service/checkout-currency.service.ts. Applying only
// (1) — which this context used to do — under-prices every foreign display by
// the uplift, and disagreed with what the server charges.
//
// Both are fetched server-side and passed in via
// <CurrencyProvider rates={...} uplifts={...}>. The active currency is persisted
// in localStorage; default INR.
//
// DISPLAY vs CHARGE. `convert`/`format` are for prices shown around the site and
// keep their fractions. `convertCharge`/`formatCharge` are for a total the buyer
// is actually asked to PAY: they round UP to a whole unit of the currency,
// because that is what the server does when it prices the order
// (ForexConversionService.convert with roundUp, mirroring live's Math.ceil). The
// pay button MUST use the charge variant or the button and the card disagree.

export type CurrencyCode = 'INR' | 'USD' | 'GBP' | 'EUR';

export interface ForexRates {
  // per-1-INR multipliers; INR is implicitly 1.
  usd: number;
  gbp: number;
  eur: number;
}

/** Per-market uplift by currency code. Absent code => 1 (live's default). */
export type ForexUplifts = Partial<Record<CurrencyCode, number>>;

const SYMBOLS: Record<CurrencyCode, string> = { INR: '₹', USD: '$', GBP: '£', EUR: '€' };

interface CurrencyState {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  symbol: string;
  rates: ForexRates | null;
  /** Convert an INR amount to the active currency (display; keeps fractions). */
  convert: (inr: number) => number;
  /** Convert an INR amount the buyer will be CHARGED — rounded UP, as the server does. */
  convertCharge: (inr: number) => number;
  /** Format an INR amount the buyer will be CHARGED (symbol + rounded-up whole unit). */
  formatCharge: (inr: number) => string;
  /** Format an amount that is ALREADY in `code` — never re-converted. */
  formatAmount: (amount: number, code: string) => string;
  /** The effective rate (market rate x uplift) for the active currency. */
  rate: number;
  /** Format an INR amount in the active currency (symbol + number). */
  format: (inr: number) => string;
  /** Format an INR amount as CODE + number (e.g. 'USD 5.20', 'INR 432'). */
  formatCode: (inr: number) => string;
  /** CODE + number with paise (always 2 decimals, e.g. 'INR 11,258.92'). */
  formatCode2: (inr: number) => string;
}

const Ctx = createContext<CurrencyState | null>(null);
const STORAGE_KEY = 'ap_currency';

export function CurrencyProvider({
  rates,
  uplifts,
  children,
}: {
  rates: ForexRates | null;
  uplifts?: ForexUplifts | null;
  children: React.ReactNode;
}) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('INR');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) as CurrencyCode | null;
    if (saved && ['INR', 'USD', 'GBP', 'EUR'].includes(saved)) setCurrencyState(saved);
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, c);
  };

  const value = useMemo<CurrencyState>(() => {
    // Component 1 — the day's market rate. Rupees are 1 by definition.
    const marketRateFor = (c: CurrencyCode): number => {
      if (c === 'INR' || !rates) return 1;
      if (c === 'USD') return rates.usd;
      if (c === 'GBP') return rates.gbp;
      if (c === 'EUR') return rates.eur;
      return 1;
    };
    // Component 2 — the studio's per-market uplift; 1 when not configured,
    // matching live's _conversionRate default.
    const upliftFor = (c: CurrencyCode): number => {
      const v = uplifts?.[c];
      return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 1;
    };
    const rateFor = (c: CurrencyCode): number => marketRateFor(c) * upliftFor(c);
    const rate = rateFor(currency);
    const convert = (inr: number) => inr * rate;
    // What the buyer is CHARGED. Same rule as the server: round UP to a whole
    // unit of the order currency.
    const convertCharge = (inr: number) => Math.ceil(inr * rate);
    const format = (inr: number) => {
      const v = convert(inr);
      return SYMBOLS[currency] + (currency === 'INR' ? Math.round(v).toLocaleString('en-IN') : v.toFixed(2));
    };
    // CODE-style: currency CODE + number, NO symbol (e.g. 'USD 5.20', 'INR 432').
    const formatCode = (inr: number) => {
      const v = convert(inr);
      return currency + ' ' + (currency === 'INR' ? Math.round(v).toLocaleString('en-IN') : v.toFixed(2));
    };
    // 2-decimal variant (paise) for line prices + subtotals, matching live's number:'1.2-2'.
    const formatCode2 = (inr: number) => {
      const v = convert(inr);
      return currency + ' ' + v.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    // A charged total is a whole unit by construction, so it is printed as one.
    const formatCharge = (inr: number) =>
      SYMBOLS[currency] + convertCharge(inr).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US');
    // For an amount the SERVER has already converted (e.g. the stored order
    // total): print it in its own currency, never convert it again.
    const formatAmount = (amount: number, code: string) => {
      const c = (['INR', 'USD', 'GBP', 'EUR'] as string[]).includes(code) ? (code as CurrencyCode) : currency;
      return SYMBOLS[c] + amount.toLocaleString(c === 'INR' ? 'en-IN' : 'en-US', {
        maximumFractionDigits: 2,
      });
    };
    return {
      currency, setCurrency, symbol: SYMBOLS[currency], rates, rate,
      convert, convertCharge, format, formatCharge, formatAmount, formatCode, formatCode2,
    };
  }, [currency, rates, uplifts]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrency(): CurrencyState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCurrency must be used within <CurrencyProvider>');
  return ctx;
}
