"use client";

import { LanguageToggle } from "@/components/language-toggle";
import { ShellTourButton } from "@/components/onboarding/shell-tour-button";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locale";

export type ControlsTone = "dark" | "light";

/**
 * The frame that holds language and tour.
 *
 * These are preferences rather than navigation, so they read as one control
 * unit instead of two loose pills floating in the corner. The `tone` prop
 * exists because the same pair sits over the dark marketing hero in one shell
 * and over the light content area in the other — a white pill on a white
 * background is invisible, and the frame is what carries the separation.
 */
export function ShellControls({
  locale,
  tone = "light",
  className,
}: {
  locale: Locale;
  tone?: ControlsTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full p-1 backdrop-blur",
        tone === "dark"
          ? "border border-white/15 bg-white/10"
          : "border border-border bg-card shadow-sm",
        className,
      )}
    >
      <LanguageToggle locale={locale} tone={tone} />
      <span
        aria-hidden
        className={cn(
          "mx-0.5 h-5 w-px shrink-0",
          tone === "dark" ? "bg-white/20" : "bg-border",
        )}
      />
      <ShellTourButton tone={tone} />
    </div>
  );
}
