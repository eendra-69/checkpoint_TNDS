"use client";

import { switchLocale } from "@/app/actions/locale";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

export function LanguageToggle({
  locale,
  tone = "dark",
}: {
  locale: Locale;
  tone?: "dark" | "light";
}) {
  // The shell shows these controls over a dark hero in one place and over the
  // light content area in the other. White-on-white would vanish, so the
  // active segment and the resting text both flip with the tone.
  const segment = (active: boolean) =>
    cn(
      "rounded-full px-2.5 py-1.5 transition",
      active
        ? tone === "dark"
          ? "bg-white text-tasco-ink"
          : "bg-tasco-ink text-white"
        : tone === "dark"
          ? "text-white/80 hover:text-white"
          : "text-muted-foreground hover:text-tasco-ink",
    );

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full text-xs font-semibold">
      <button
        type="button"
        onClick={() => switchLocale("vi")}
        className={segment(locale === "vi")}
        aria-pressed={locale === "vi"}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => switchLocale("en")}
        className={segment(locale === "en")}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
