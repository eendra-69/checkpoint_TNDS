import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifyAuth } from "./lib/auth-token";
import { resolvePermissions, permissionForPath } from "./lib/rbac";

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
    // Use the same override-aware resolution as `requirePermission`. The proxy
    // cannot read the session store cheaply, so the overrides ride along on the
    // auth cookie (see `togglePermission` / `savePermissionMatrix`, which
    // re-issue it). Falling back to defaults here made granting a permission
    // look like it did nothing.
    const perms = resolvePermissions(auth.persona, auth.permOverrides);
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