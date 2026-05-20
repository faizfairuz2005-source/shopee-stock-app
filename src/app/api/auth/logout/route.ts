import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateEnv } from "@/lib/config/env";
import { auditLog } from "@/lib/audit";

/**
 * POST /api/auth/logout
 * Securely logs out the user by:
 * 1. Validating the session exists
 * 2. Signing out from Supabase (revokes refresh token)
 * 3. Clearing all auth cookies with proper security flags
 */
export async function POST() {
  try {
    // Validate environment variables are configured
    validateEnv();

    const supabase = await createClient();

    // Verify user has an active session before logout
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();

    // Even if getUser fails, we should still attempt to clear cookies
    // This handles cases where the token is expired but cookies still exist
    if (getUserError) {
      console.warn("Logout attempted with invalid session:", getUserError.message);
    }

    // Sign out from Supabase (revokes refresh token server-side)
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("Supabase signOut error:", signOutError.message);
      // Continue with cookie cleanup even if signOut fails
    }

    // Audit log for logout
    auditLog({
      action: "logout",
      entity_type: "auth",
      entity_id: user?.id || undefined,
      entity_name: user?.email || undefined,
    });

    // Create response that clears all Supabase-related cookies
    const response = NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );

    // Secure cookie clearing - use all security flags
    const cookiesToClear = [
      "sb-access-token",
      "sb-refresh-token",
      "supabase-auth-token",
      "sb-auth-token",
      // Also clear any auth-related cookies with dynamic names
      ...(user ? [`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]}-auth-token`] : []),
    ];

    cookiesToClear.forEach((cookieName) => {
      if (cookieName) {
        response.cookies.set(cookieName, "", {
          expires: new Date(0),
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });
      }
    });

    // Clear all cookies that start with "sb-" as a catch-all
    // This handles any dynamic Supabase cookie names
    const allCookies = response.cookies.getAll();
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith("sb-") || cookie.name.includes("supabase")) {
        response.cookies.set(cookie.name, "", {
          expires: new Date(0),
          path: "/",
        });
      }
    });

    return response;
  } catch (error) {
    // Log error without exposing sensitive details
    console.error("Logout API error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    // Return generic error message to client
    return NextResponse.json(
      { error: "An error occurred during logout" },
      { status: 500 }
    );
  }
}
