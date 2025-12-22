// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "session_token";

// Routes yang tidak memerlukan auth
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/register",
  "/api/auth/login",
  "/api/auth/register",
];

// Routes yang memerlukan auth
const PROTECTED_ROUTES = [
  "/dashboard",
  "/orders",
  "/inventory",
  "/waiting-list",
  "/monitoring",
  "/qr",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname.startsWith(route) && pathname === route
  );

  // Check if route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      // Validate user role (you'd need to decode token or call API)
      // For now, we'll rely on frontend checks
      // But ideally, verify role from session token here
      // Example: const userRole = await getUserRoleFromToken(sessionToken);
      // if (!allowedRoles.includes(userRole)) {
      //   return NextResponse.redirect(new URL("/unauthorized", request.url));
      // }
    }
  }

  // If public route, allow access
  if (isPublicRoute) {
    // If user is logged in and tries to access login/register, redirect to dashboard
    if (
      sessionToken &&
      (pathname === "/auth/login" || pathname === "/auth/register")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // If protected route, check authentication
  if (isProtectedRoute) {
    if (!sessionToken) {
      // Not authenticated, redirect to login
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/admin")) {
    }

    // Validate session token (optional: call API to validate)
    // For now, just check if token exists
    // You can add more validation by calling an API endpoint
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
