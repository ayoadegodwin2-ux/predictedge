import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";

/**
 * Next.js Middleware
 * Strictly guards against infinite redirect loops and never intercepts API routes.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. NEVER intercept API routes - let them handle their own auth & status codes
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // 2. Protect /admin routes
  if (pathname.startsWith("/admin")) {
    // CRITICAL: NEVER redirect /admin to /admin!
    // The main admin page handles its own authentication state and displays the password gate when unauthenticated.
    if (pathname === "/admin" || pathname === "/admin/") {
      return NextResponse.next();
    }

    // For any nested subroutes under /admin (e.g. /admin/settings), verify session cookie or header
    const cookieToken = request.cookies.get("predictedge_admin_token")?.value;
    const headerToken = request.headers.get("x-admin-token");
    const token = cookieToken || headerToken;

    if (!token || !verifyAdminToken(token)) {
      const adminUrl = new URL("/admin", request.url);
      return NextResponse.redirect(adminUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
