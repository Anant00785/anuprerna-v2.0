import { env } from "@/env";

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export function getBaseUrl(mode?: "legacy" | "nest"): string {
  const currentMode = mode ?? env.NEXT_PUBLIC_API_MODE;
  
  // When running client-side in the browser, route calls through Next.js proxy (/api/backend)
  // to avoid CORS errors and to automatically inject required backend headers.
  if (typeof window !== "undefined") {
    return "/api/backend";
  }

  return currentMode === "nest"
    ? env.NEXT_PUBLIC_NEST_API_URL
    : env.NEXT_PUBLIC_SPRINGBOOT_API_URL;
}

export function buildUrl(endpoint: string, mode?: "legacy" | "nest"): string {
  const baseUrl = getBaseUrl(mode).replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
}

export async function apiRequest<T>(
  endpoint: string,
  options: FetchOptions = {},
  mode?: "legacy" | "nest"
): Promise<T> {
  const { params, headers, ...customConfig } = options;
  let url = buildUrl(endpoint, mode);

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const config: RequestInit = {
    method: customConfig.method || "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
    next: { revalidate: 60 },
    ...customConfig,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `API Error [${response.status}] ${response.statusText} at ${url}: ${errorText}`
    );
  }

  return response.json() as Promise<T>;
}
