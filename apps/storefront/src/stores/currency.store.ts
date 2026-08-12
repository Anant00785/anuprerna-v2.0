import { create } from "zustand";
import { apiRequest } from "@/lib/api/client";
import { profileRepository } from "@/lib/api/repositories/profile.repository";
import { useAuthStore } from "./auth.store";

export type SupportedCurrency = "inr" | "usd" | "gbp" | "eur";

export interface ForexRates {
  inr: number;
  usd: number;
  gbp: number;
  eur: number;
  [key: string]: number;
}

export interface ForexListItem {
  country: string;
  currency: string;
  rate: number;
}

const DEFAULT_RATES: ForexRates = {
  inr: 1.0,
  usd: 0.0105,
  gbp: 0.0078,
  eur: 0.0091,
};

const DEFAULT_FOREX_LIST: ForexListItem[] = [
  { country: "India", currency: "INR", rate: 1.0 },
  { country: "United Kingdom", currency: "GBP", rate: 1.25 },
  { country: "DEFAULT", currency: "USD", rate: 1.25 },
  { country: "France", currency: "EUR", rate: 1.25 },
];

interface CurrencyState {
  selectedCurrency: SupportedCurrency;
  forexRates: ForexRates;
  forexList: ForexListItem[];
  isLoading: boolean;

  setCurrency: (currency: SupportedCurrency) => void;
  fetchForexRates: () => Promise<void>;
  getExchangeRate: (targetCurrency?: SupportedCurrency) => number;
  convertPrice: (inrPrice: number, targetCurrency?: SupportedCurrency) => number;
  formatPrice: (inrPrice: number, targetCurrency?: SupportedCurrency) => string;
}

function getInitialCurrency(): SupportedCurrency {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("selectedCurrency");
    if (saved && ["inr", "usd", "gbp", "eur"].includes(saved.toLowerCase())) {
      return saved.toLowerCase() as SupportedCurrency;
    }
  }
  return "inr";
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  selectedCurrency: getInitialCurrency(),
  forexRates: DEFAULT_RATES,
  forexList: DEFAULT_FOREX_LIST,
  isLoading: false,

  setCurrency: (currency: SupportedCurrency) => {
    const cleanCurrency = currency.toLowerCase() as SupportedCurrency;
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCurrency", cleanCurrency);
    }
    set({ selectedCurrency: cleanCurrency });

    // Sync to user profile if authenticated
    const jwt = useAuthStore.getState().jwt;
    if (jwt) {
      profileRepository.updateSelectedForex(cleanCurrency, jwt).catch(() => {
        // Silent catch if backend sync fails
      });
    }
  },

  fetchForexRates: async () => {
    set({ isLoading: true });
    try {
      // 1. Fetch latest forex exchange rates
      const ratesRes = await apiRequest<{
        success?: boolean;
        forexExchangeRate?: ForexRates;
      }>("get/forex-exchange-rate/latest", { method: "GET" }).catch(() => null);

      // 2. Fetch forex list multipliers
      const listRes = await apiRequest<{
        success?: boolean;
        forexList?: ForexListItem[];
      }>("get/forex-list", { method: "GET" }).catch(() => null);

      const newRates = {
        ...DEFAULT_RATES,
        ...(ratesRes?.forexExchangeRate || {}),
        inr: 1.0,
      };

      const newList = listRes?.forexList && listRes.forexList.length > 0
        ? listRes.forexList
        : DEFAULT_FOREX_LIST;

      set({
        forexRates: newRates,
        forexList: newList,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  getExchangeRate: (targetCurrency?: SupportedCurrency) => {
    const state = get();
    const currency = (targetCurrency || state.selectedCurrency).toLowerCase() as SupportedCurrency;
    if (currency === "inr") return 1.0;

    const baseForexRate =
      state.forexRates[currency] ?? DEFAULT_RATES[currency] ?? 1.0;

    const listItem = state.forexList.find(
      (item) => item.currency.toLowerCase() === currency
    );
    const conversionRate = listItem ? listItem.rate : 1.25;

    return baseForexRate * conversionRate;
  },

  convertPrice: (inrPrice: number, targetCurrency?: SupportedCurrency) => {
    if (!inrPrice || isNaN(inrPrice)) return 0;
    const rate = get().getExchangeRate(targetCurrency);
    return Math.round(inrPrice * rate * 100) / 100;
  },

  formatPrice: (inrPrice: number, targetCurrency?: SupportedCurrency) => {
    const state = get();
    const currency = (targetCurrency || state.selectedCurrency).toLowerCase() as SupportedCurrency;
    const converted = state.convertPrice(inrPrice, currency);
    const code = currency.toUpperCase();

    const formattedNum = converted.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    return `${code} ${formattedNum}`;
  },
}));
