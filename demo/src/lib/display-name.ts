/**
 * The display-name rule, with no dependencies, so client components can check a
 * name without pulling zod into every page's bundle. `displayNameSchema` in
 * `validation.ts` is built from the same constants, so client and server agree.
 *
 * Names render as nameplates above avatars in all three 3D scenes, so keep them
 * short, printable, and free of markup.
 */
export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 24;
export const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N} _.'-]+$/u;

export type DisplayNameError = "short" | "long" | "chars";

/** Why a (trimmed) display name would be rejected, or null when it is valid. */
export function displayNameError(value: string): DisplayNameError | null {
  const name = value.trim();
  if (name.length < DISPLAY_NAME_MIN) return "short";
  if (name.length > DISPLAY_NAME_MAX) return "long";
  if (!DISPLAY_NAME_PATTERN.test(name)) return "chars";
  return null;
}
