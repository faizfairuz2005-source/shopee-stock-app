import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Secure cookie options for session management
 * These settings help prevent XSS and CSRF attacks
 */
const SECURE_COOKIE_OPTIONS: CookieOptions = {
  // Prevent JavaScript access to cookies (mitigates XSS)
  httpOnly: true,
  // Only send cookies over HTTPS in production
  secure: process.env.NODE_ENV === "production",
  // Prevent CSRF by restricting cookie sending to same site
  sameSite: "strict",
  // Cookies are accessible across the entire domain
  path: "/",
};

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Merge secure defaults with provided options
            const secureOptions = {
              ...SECURE_COOKIE_OPTIONS,
              ...options,
              // Ensure httpOnly cannot be overridden for auth tokens
              httpOnly: name.includes("token") ? true : options?.httpOnly,
            };

            request.cookies.set(name, value);
            response.cookies.set(name, value, secureOptions);
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users to login
  if (error || !user) {
    // Allow access to login page and public routes
    const publicRoutes = ["/login", "/api/auth"];
    const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (!isPublicRoute && !pathname.startsWith("/_next")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      // Preserve the original URL for redirect after login
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from login page
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    // Clear any redirect params
    url.searchParams.delete("redirect");
    return NextResponse.redirect(url);
  }

  return response;
}
