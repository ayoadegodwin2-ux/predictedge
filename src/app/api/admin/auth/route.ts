import { NextResponse } from "next/server";
import {
  getConfiguredAdminPassword,
  verifyAdminToken,
  generateAdminSessionToken,
  isRequestAdminAuthorized,
} from "@/lib/admin-auth";

/**
 * GET /api/admin/auth
 * Checks if current request has a valid admin session (via cookie, header, or query)
 */
export async function GET(request: Request) {
  const authorized = isRequestAdminAuthorized(request);
  return NextResponse.json({
    success: true,
    authenticated: authorized,
  });
}

/**
 * POST /api/admin/auth
 * Authenticates master password, generates session token, and sets persistent cookie
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = body.password?.trim?.() || body.password;
    const configuredPassword = getConfiguredAdminPassword();

    if (!password) {
      return NextResponse.json({ success: false, error: "Password required" }, { status: 400 });
    }

    if (password !== configuredPassword) {
      return NextResponse.json({ success: false, error: "Invalid admin password" }, { status: 401 });
    }

    // Return a session token for client storage
    const token = generateAdminSessionToken();

    const response = NextResponse.json({
      success: true,
      token,
      isDefaultPassword: !process.env.ADMIN_PASSWORD,
    });

    // Set cookie for browser persistence (SameSite=Lax, 30 days)
    response.cookies.set("predictedge_admin_token", token, {
      path: "/",
      httpOnly: false, // Accessible by frontend JS for request headers
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Auth check failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/auth
 * Logs out and clears the session cookie
 */
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Admin session cleared",
  });

  response.cookies.set("predictedge_admin_token", "", {
    path: "/",
    maxAge: 0,
  });

  return response;
}
