import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  COOKIE_NAME,
  signAuth,
  verifyAuth,
  type AuthCookie,
} from "./auth-token";
import { hasPermission, type Permission } from "./rbac";
import { getSession } from "./session";

export type { AuthCookie };
export { COOKIE_NAME, signAuth, verifyAuth };

export async function getAuth(): Promise<AuthCookie | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAuth(token);
}

export async function setAuthCookie(payload: AuthCookie) {
  const jar = await cookies();
  const token = await signAuth(payload);
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function requireAuth(): Promise<AuthCookie> {
  const auth = await getAuth();
  if (!auth) redirect("/login");
  return auth;
}

export async function requirePermission(
  permission: Permission,
): Promise<AuthCookie> {
  const auth = await requireAuth();
  const session = await getSession(auth.sessionId);
  const overrides = session?.settings.permissionOverrides;
  if (!hasPermission(auth.persona, permission, overrides)) {
    redirect(`/forbidden?need=${encodeURIComponent(permission)}`);
  }
  return auth;
}