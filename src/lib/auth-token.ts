import { SignJWT, jwtVerify } from "jose";
import type { DemoCustomerId, PersonaId } from "./types";

export const COOKIE_NAME = "tasco_auth";

export type AuthCookie = {
  persona: PersonaId;
  customerId?: DemoCustomerId;
  sessionId: string;
};

function secretKey() {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.SETTINGS_SECRET ||
    "tasco-demo-dev-secret-change-me";
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