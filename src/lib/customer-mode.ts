import { cookies } from "next/headers";
import type { CustomerUiMode } from "./types";

export const UI_MODE_COOKIE = "tasco-ui-mode";

export async function getCustomerUiMode(): Promise<CustomerUiMode> {
  const jar = await cookies();
  const value = jar.get(UI_MODE_COOKIE)?.value;
  return value === "classic" ? "classic" : "office";
}

export async function setCustomerUiMode(mode: CustomerUiMode) {
  const jar = await cookies();
  jar.set(UI_MODE_COOKIE, mode, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
