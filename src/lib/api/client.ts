/**
 * Sports Data API Client (Step 15)
 * Communicates with API-Football / Sportsmonks REST API.
 * Safely handles environment variables, timeouts, rate-limits, and offline mock fallbacks.
 */

const API_BASE_URL =
  process.env.SPORTS_DATA_API_BASE_URL || "https://v3.football.api-sports.io";
const API_KEY = process.env.SPORTS_DATA_API_KEY || "";

interface FetchOptions {
  params?: Record<string, string | number>;
  revalidateSeconds?: number;
}

export async function sportsApiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; isMock?: boolean }> {
  // If API key is not configured, warn and return fallback
  if (!API_KEY || API_KEY === "your_sports_data_api_key_here") {
    return {
      success: false,
      error: "SPORTS_DATA_API_KEY is not configured in .env.local",
      isMock: true,
    };
  }

  // Construct URL with query parameters
  const url = new URL(`${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`);
  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      url.searchParams.append(key, String(val));
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

    const headers: Record<string, string> = {
      "x-apisports-key": API_KEY,
      "Content-Type": "application/json",
    };

    // If using RapidAPI host
    if (API_BASE_URL.includes("rapidapi.com")) {
      headers["x-rapidapi-key"] = API_KEY;
      headers["x-rapidapi-host"] = "api-football-v1.p.rapidapi.com";
      delete headers["x-apisports-key"];
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `Sports API responded with status ${response.status} (${response.statusText})`,
      };
    }

    const json = await response.json();

    // API-Football specific error envelope check
    if (json.errors && Object.keys(json.errors).length > 0) {
      const errorMsg =
        typeof json.errors === "object"
          ? Object.values(json.errors).join("; ")
          : String(json.errors);
      return {
        success: false,
        error: `Sports API Error: ${errorMsg}`,
      };
    }

    return {
      success: true,
      data: json.response as T,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    return {
      success: false,
      error: `Network request failed: ${message}`,
    };
  }
}

