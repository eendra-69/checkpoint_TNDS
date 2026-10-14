import { SignJWT, jwtVerify } from "jose";
import type { DemoCustomerId, PersonaId } from "./types";

export const COOKIE_NAME = "tasco_auth";

export type AuthCookie = {
  persona: PersonaId;
  customerId?: DemoCustomerId;
  sessionId: string;
  /** Custom name the user chose; shown on their avatar across all 3D scenes. */
  displayName?: string;
  /**
   * Mirror of the session's permission overrides, so `proxy.ts` can apply the
   * same effective permissions at the edge as `requirePermission` does.
   *
   * Without this the proxy falls back to DEFAULT_PERMISSIONS only, so
   * *revoking* a permission still worked (the page check is stricter) while
   * *granting* one appeared broken — the admin enables `workshop:use` and the
   * browser is still bounced to /forbidden. Re-issued whenever overrides change.
   */
  permOverrides?: Partial<Record<PersonaId, string[]>>;
};

/**
 * Signing key for the auth cookie.
 *
 * There is deliberately NO hardcoded production fallback. A committed default
 * secret means anyone can forge an `admin` cookie with curl. In production we
 * fail closed at module load so a misconfigured deploy is loud, not silent.
 */
function secretKey() {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.SETTINGS_SECRET ||
    (process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error(
            "AUTH_SECRET is required in production. Set it in the Vercel env " +
              "(a 32+ byte random string). Never commit a default signing key.",
          );
        })()
      : "tasco-demo-dev-secret-change-me");
  return new TextEncoder().encode(secret);
}

export async function signAuth(payload: AuthCookie): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifyAuth(token: string): Promise<AuthCookie | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload as unknown as AuthCookie;
  } catch {
    return null;
  }
}