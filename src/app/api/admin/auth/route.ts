import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const configuredPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (!password) {
      return NextResponse.json({ success: false, error: "Password required" }, { status: 400 });
    }

    if (password !== configuredPassword) {
      return NextResponse.json({ success: false, error: "Invalid admin password" }, { status: 401 });
    }

    // Return a session token for client storage
    const token = Buffer.from(`admin:${Date.now()}:${configuredPassword}`).toString("base64");

    return NextResponse.json({
      success: true,
      token,
      isDefaultPassword: !process.env.ADMIN_PASSWORD,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Auth check failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

