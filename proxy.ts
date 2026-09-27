import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define the private routes that require authentication
const protectedRoutes = [
  "/chats",
  "/groups",
  "/contacts",
  "/media",
  "/calls",
  "/channels",
  "/communities",
  "/profile",
  "/business",
  "/home",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public group invite links must remain accessible without requiring prior login
  const isPublicInvite = pathname.startsWith("/groups/invite");

  // Check if the requested route is one of the protected routes
  const isProtectedRoute =
    !isPublicInvite && protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Read the accessToken from cookies
    const token = request.cookies.get("accessToken")?.value;

    // If no token exists, redirect to /connect
    if (!token) {
      const connectUrl = new URL("/connect", request.url);
      
      // We can optionally add the current URL as a search param to redirect back after login
      // connectUrl.searchParams.set("callbackUrl", pathname);
      
      return NextResponse.redirect(connectUrl);
    }
  }

  // Allow the request to proceed if authenticated or not a protected route
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - .*\\.(?:svg|png|jpg|jpeg|gif|webp)$ (image files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
