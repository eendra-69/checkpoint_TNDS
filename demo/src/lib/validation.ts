import { z } from "zod";
import {
  DISPLAY_NAME_MAX,
  DISPLAY_NAME_MIN,
  DISPLAY_NAME_PATTERN,
} from "@/lib/display-name";

/**
 * Shared request validation.
 *
 * These live outside `app/actions/*` because a `"use server"` module may only
 * export async functions — exporting a schema or a const array from one is a
 * build error.
 */

export const PERSONA_IDS = [
  "customer",
  "telesales",
  "campaign_manager",
  "compliance",
  "executive",
  "admin",
] as const;

export const DEMO_CUSTOMER_IDS = ["minh", "lan", "tuan"] as const;

export const FACINGS = ["down", "left", "right", "up"] as const;

export const SCENE_IDS = ["office", "workshop", "lounge"] as const;

/** Zod form of the rule in `display-name.ts` (kept zod-free for client bundles). */
export const displayNameSchema = z
  .string()
  .trim()
  .min(DISPLAY_NAME_MIN, "Name must be at least 2 characters")
  .max(DISPLAY_NAME_MAX, "Name must be 24 characters or fewer")
  .regex(
    DISPLAY_NAME_PATTERN,
    "Use letters, numbers, spaces, apostrophes, dots, dashes or underscores",
  );

/**
 * Only same-origin absolute paths, so a `next` redirect target can't send
 * anyone off-site: "//host" and "/\host" are protocol-relative to a browser.
 */
export function isSafeNextPath(value: string): boolean {
  return /^\/(?![/\\])/.test(value);
}

export const SignInSchema = z.object({
  persona: z.enum(PERSONA_IDS),
  customerKey: z.enum(DEMO_CUSTOMER_IDS).optional(),
  next: z
    .string()
    .optional()
    .refine((v) => !v || isSafeNextPath(v), "Invalid redirect target"),
  displayName: displayNameSchema.optional(),
});

export type SignInInput = z.infer<typeof SignInSchema>;
