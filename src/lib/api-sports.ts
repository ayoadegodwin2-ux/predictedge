/**
 * API-Sports Client (Step 15)
 * Communicates with football.api-sports.io REST API
 * Securely uses the x-apisports-key header with SPORTS_API_KEY from .env.local
 */

const API_BASE_URL = "https://v3.football.api-sports.io";

export interface ApiSportsResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: Record<string, string> | string[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T;
}

export interface ApiSportsFetchResult<T> {
  success: boolean;
  data?: T;
  resultsCount?: number;
  error?: string;
  isMockFallback?: boolean;
}

interface FetchOptions {
  params?: Record<string, string | number>;
  revalidateSeconds?: number;
}

/**
 * Base fetch function against API-Sports endpoints using the x-apisports-key header
 */
export async function apiSportsFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiSportsFetchResult<T>> {
  const apiKey = process.env.SPORTS_API_KEY || process.env.SPORTS_DATA_API_KEY || "";

  // If no API key is provided, return a descriptive error and fallback flag
  if (!apiKey || apiKey === "your_sports_api_key_here") {
    return {
      success: false,
      error: "SPORTS_API_KEY is missing from .env.local. Please add your API-Sports key.",
      isMockFallback: true,
    };
  }

  // Construct URL with query parameters
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  const url = new URL(`${API_BASE_URL}/${cleanEndpoint}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      url.searchParams.append(key, String(val));
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12-second abort timeout

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-apisports-key": apiKey,
        "Accept": "application/json",
      },
      signal: controller.signal,
      cache: "no-store", // Strictly bypass external cache so fresh live data is always fetched
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        success: false,
        error: `API-Sports HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const json = (await response.json()) as ApiSportsResponse<T>;

    // Check for API-level errors (rate limit reached, invalid key, etc.)
    if (json.errors && (Array.isArray(json.errors) ? json.errors.length > 0 : Object.keys(json.errors).length > 0)) {
      const errorMsg =
        typeof json.errors === "object"
          ? Object.values(json.errors).join("; ")
          : String(json.errors);
      return {
        success: false,
        error: `API-Sports error: ${errorMsg}`,
      };
    }

    return {
      success: true,
      data: json.response,
      resultsCount: json.results,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown request error";
    return {
      success: false,
      error: `Network request to API-Sports failed: ${message}`,
      isMockFallback: true,
    };
  }
}

