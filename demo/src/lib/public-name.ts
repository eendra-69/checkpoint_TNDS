import { PERSONAS } from "@/lib/rbac";
import { DEMO_CUSTOMER_NAMES } from "@/lib/data/seed";
import type { AuthCookie } from "@/lib/auth-token";

/**
 * The name other people see on your avatar and lounge messages. Everyone in a
 * room sees the same string whatever their UI language, so without a typed
 * display name it falls back to the story name (Anh Minh) or the role label —
 * never the raw persona id.
 */
export function publicName(
  auth: Pick<AuthCookie, "persona" | "customerId" | "displayName"> | null | undefined,
): string {
  if (!auth) return "Guest";
  const typed = auth.displayName?.trim();
  if (typed) return typed;
  if (auth.persona === "customer" && auth.customerId) {
    const story = DEMO_CUSTOMER_NAMES[auth.customerId as keyof typeof DEMO_CUSTOMER_NAMES];
    if (story) return story;
  }
  return PERSONAS[auth.persona]?.label ?? auth.persona;
}
