import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Rate limiting store (in-memory, resets on server restart)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security configuration
const SECURITY_CONFIG = {
  rateLimit: {
    login: { max: 5, windowMs: 60 * 1000 },
    api: { max: 100, windowMs: 60 * 1000 },
  },
  sessionTimeoutMs: 24 * 60 * 60 * 1000,
  protectedRoutes: [
    "/dashboard",
    "/connect-shopee",
    "/inventory",
    "/orders",
  ],
  publicRoutes: ["/login", "/api/auth"],
  // Role-based route access
  roleRestrictedRoutes: {
    adminOnly: ["/settings/users"],
  },
};

function checkRateLimit(
  identifier: string,
  config: { max: number; windowMs: number }
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return true;
  }

  if (record.count >= config.max) {
    return false;
  }

  record.count++;
  rateLimitStore.set(identifier, record);
  return true;
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.shopee.com",
    "frame-ancestors 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  return response;
}

async function isSessionExpired(request: NextRequest): Promise<boolean> {
  const authCookie = request.cookies.get("sb-access-token")?.value;
  if (!authCookie) return true;

  try {
    const payload = JSON.parse(atob(authCookie.split(".")[1]));
    const exp = payload.exp * 1000;
    return Date.now() > exp;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip security checks for static assets and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get client IP for rate limiting
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Apply rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const rateLimitConfig = pathname.includes("/auth/")
      ? SECURITY_CONFIG.rateLimit.login
      : SECURITY_CONFIG.rateLimit.api;

    if (!checkRateLimit(`api:${clientIp}:${pathname}`, rateLimitConfig)) {
      return new NextResponse(
        JSON.stringify({
          error: "Too many requests. Please try again later.",
          code: "RATE_LIMITED",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitConfig.windowMs / 1000),
          },
        }
      );
    }
  }

  // Apply rate limiting for login page
  if (pathname === "/login") {
    if (!checkRateLimit(`login:${clientIp}`, SECURITY_CONFIG.rateLimit.login)) {
      return new NextResponse(
        "Too many login attempts. Please try again later.",
        {
          status: 429,
          headers: {
            "Retry-After": String(
              SECURITY_CONFIG.rateLimit.login.windowMs / 1000
            ),
          },
        }
      );
    }
  }

  // Update Supabase session
  const response = await updateSession(request);

  // Check if route requires authentication
  const isProtectedRoute = SECURITY_CONFIG.protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isPublicRoute = SECURITY_CONFIG.publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If accessing protected route without session, redirect to login
  if (isProtectedRoute) {
    const isExpired = await isSessionExpired(request);
    if (isExpired) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      redirectResponse.cookies.delete("sb-access-token");
      redirectResponse.cookies.delete("sb-refresh-token");
      return redirectResponse;
    }
  }

  // Add security headers to all responses
  const securedResponse = addSecurityHeaders(response);

  return securedResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
