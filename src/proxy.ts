import { NextResponse } from "next/server";
import { auth } from "@/auth";

const DEFAULT_ADMIN_CALLBACK = "/admin/dashboard";
const CALLBACK_VALIDATION_ORIGIN = "https://markasti.invalid";

function getSafeAdminCallbackUrl(pathname: string, search: string) {
  const requestedPath =
    pathname === "/admin" || pathname === "/admin/"
      ? DEFAULT_ADMIN_CALLBACK
      : `${pathname}${search}`;

  // Only preserve a local admin path. Reject protocol-relative URLs, backslashes,
  // and any URL that the URL parser would resolve to another origin.
  if (
    !requestedPath.startsWith("/admin/") ||
    requestedPath.startsWith("//") ||
    requestedPath.includes("\\")
  ) {
    return DEFAULT_ADMIN_CALLBACK;
  }

  try {
    const parsed = new URL(requestedPath, CALLBACK_VALIDATION_ORIGIN);
    if (
      parsed.origin !== CALLBACK_VALIDATION_ORIGIN ||
      (parsed.pathname !== "/admin" &&
        !parsed.pathname.startsWith("/admin/"))
    ) {
      return DEFAULT_ADMIN_CALLBACK;
    }

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return DEFAULT_ADMIN_CALLBACK;
  }
}

// Next.js 16 automatically discovers this file as its Proxy entry point.
// Keep this on the Node.js Proxy runtime: auth.ts imports Prisma and bcrypt.
export const proxy = auth((req) => {
  const pathname = req.nextUrl.pathname;
  const search = req.nextUrl.search;

  if (pathname !== "/admin" && !pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set(
      "callbackUrl",
      getSafeAdminCallbackUrl("/admin", ""),
    );
    return NextResponse.redirect(loginUrl);
  }

  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set(
      "callbackUrl",
      getSafeAdminCallbackUrl(pathname, search),
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
