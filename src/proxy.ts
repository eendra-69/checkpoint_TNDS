import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifyAuth } from "./lib/auth-token";
import { DEFAULT_PERMISSIONS, permissionForPath } from "./lib/rbac";

const PUBLIC_PATHS = ["/", "/login", "/forbidden", "/verify"];

function isPublic(pathname: string) {
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    return true;
  }
  if (pathname.startsWith("/api/auth")) return true;
  // The route itself answers guests with the start guide only and checks auth for anything else.
  if (pathname === "/api/assistant") return true;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return true;
  }
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const auth = token ? await verifyAuth(token) : null;

  if (!auth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const needed = permissionForPath(pathname);
  if (needed) {
    const perms = DEFAULT_PERMISSIONS[auth.persona];
    if (!perms.includes(needed)) {
      const url = request.nextUrl.clone();
      url.pathname = "/forbidden";
      url.searchParams.set("need", needed);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};