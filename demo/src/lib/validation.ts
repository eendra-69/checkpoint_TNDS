import { z } from "zod";

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

/**
 * Display names render as nameplates above avatars in all three 3D scenes, so
 * keep them short, printable, and free of markup.
 */
export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(24, "Name must be 24 characters or fewer")
  .regex(
    /^[\p{L}\p{N} _.'-]+$/u,
    "Use letters, numbers, spaces, apostrophes, dots, dashes or underscores",
  );

export const SignInSchema = z.object({
  persona: z.enum(PERSONA_IDS),
  customerKey: z.enum(DEMO_CUSTOMER_IDS).optional(),
  next: z
    .string()
    .optional()
    // Only same-origin relative paths, so `next` can't be used as an open redirect.
    .refine(
      (v) => !v || (v.startsWith("/") && !v.startsWith("//")) || !/^[a-z]+:/i.test(v),
      "Invalid redirect target",
    ),
  displayName: displayNameSchema.optional(),
});

export type SignInInput = z.infer<typeof SignInSchema>;
