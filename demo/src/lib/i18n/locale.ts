import { cookies } from "next/headers";

export type Locale = "vi" | "en";

export const LOCALE_COOKIE = "tasco-locale";

export function parseLocale(value?: string | null): Locale {
  return value === "en" ? "en" : "vi";
}

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  return parseLocale(jar.get(LOCALE_COOKIE)?.value);
}

export async function setLocaleCookie(locale: Locale) {
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
