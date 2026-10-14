"use client";

import { switchLocale } from "@/app/actions/locale";
import type { Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

export function LanguageToggle({ locale }: { locale: Locale }) {
  return (
    <div className="inline-flex rounded-full border border-white/20 bg-white/10 p-1 text-xs font-semibold backdrop-blur">
      <button
        type="button"
        onClick={() => switchLocale("vi")}
        className={cn(
          "rounded-full px-2.5 py-1.5 transition",
          locale === "vi"
            ? "bg-white text-tasco-ink"
            : "text-white/80 hover:text-white",
        )}
        aria-pressed={locale === "vi"}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => switchLocale("en")}
        className={cn(
          "rounded-full px-2.5 py-1.5 transition",
          locale === "en"
            ? "bg-white text-tasco-ink"
            : "text-white/80 hover:text-white",
        )}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
