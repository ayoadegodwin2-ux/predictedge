/**
 * Shared Admin Authentication Helper
 * Validates admin credentials across:
 * 1. Raw ADMIN_PASSWORD in x-admin-token, x-admin-password, or Authorization header
 * 2. Base64 session token in x-admin-token or Authorization header
 * 3. Cookie predictedge_admin_token or admin_token
 * 4. Password or token provided in JSON body
 * 5. Query param (?token=... or ?password=...) for manual testing
 */

export function getConfiguredAdminPassword(): string {
  const raw = process.env.ADMIN_PASSWORD || "admin123";
  // Strip optional wrapping quotes from .env
  return raw.replace(/^["']|["']$/g, "").trim();
}

/**
 * Validates a single token candidate (raw password or Base64 admin token)
 */
export function verifyAdminToken(tokenCandidate?: string | null): boolean {
  if (!tokenCandidate) return false;
  const candidate = tokenCandidate.trim();
  const configuredPassword = getConfiguredAdminPassword();

  // 1. Direct match with configured ADMIN_PASSWORD
  if (candidate === configuredPassword) {
    return true;
  }

  // 2. Bearer prefix check
  if (candidate.startsWith("Bearer ") || candidate.startsWith("bearer ")) {
    return verifyAdminToken(candidate.slice(7).trim());
  }

  // 3. Base64 token check (e.g. admin:<timestamp>:<password>)
  try {
    const decoded = Buffer.from(candidate, "base64").toString("utf8");
    if (decoded.endsWith(`:${configuredPassword}`)) {
      return true;
    }
    if (decoded === configuredPassword) {
      return true;
    }
  } catch {
    // Not valid base64, ignore
  }

  return false;
}

/**
 * Comprehensive authorization check inspecting headers, cookies, body, and query params.
 */
export function isRequestAdminAuthorized(
  request: Request,
  bodyCandidate?: { password?: string; token?: string; adminPassword?: string } | null
): boolean {
  // 1. Check body candidate if provided
  if (bodyCandidate) {
    const bodyPass = bodyCandidate.password || bodyCandidate.token || bodyCandidate.adminPassword;
    if (bodyPass && verifyAdminToken(bodyPass)) {
      return true;
    }
  }

  // 2. Check x-admin-token or x-admin-password header
  const xAdminToken = request.headers.get("x-admin-token") || request.headers.get("x-admin-password");
  if (xAdminToken && verifyAdminToken(xAdminToken)) {
    return true;
  }

  // 3. Check standard Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader && verifyAdminToken(authHeader)) {
    return true;
  }

  // 4. Check cookies
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, v.join("=")];
      })
    );
    const cookieToken = cookies["predictedge_admin_token"] || cookies["admin_token"];
    if (cookieToken && verifyAdminToken(decodeURIComponent(cookieToken))) {
      return true;
    }
  }

  // 5. Query parameter fallback (for manual browser / PowerShell testing)
  try {
    const url = new URL(request.url);
    const qToken = url.searchParams.get("token") || url.searchParams.get("password") || url.searchParams.get("secret");
    if (qToken && verifyAdminToken(qToken)) {
      return true;
    }
  } catch {
    // Ignore invalid URL
  }

  return false;
}

/**
 * Generates a valid Base64 session token
 */
export function generateAdminSessionToken(): string {
  const configuredPassword = getConfiguredAdminPassword();
  return Buffer.from(`admin:${Date.now()}:${configuredPassword}`).toString("base64");
}

