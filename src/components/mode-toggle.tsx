"use client";

import { switchCustomerMode } from "@/app/actions/mode";
import type { CustomerUiMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ModeToggle({
  mode,
  labels,
}: {
  mode: CustomerUiMode;
  labels?: { classic: string; office: string };
}) {
  const classic = labels?.classic ?? "Classic";
  const office = labels?.office ?? "Virtual Office";

  return (
    <div className="inline-flex rounded-full border border-white/20 bg-white/10 p-1 text-xs font-semibold backdrop-blur">
      <button
        type="button"
        onClick={() => switchCustomerMode("classic")}
        className={cn(
          "rounded-full px-3 py-1.5 transition",
          mode === "classic"
            ? "bg-white text-tasco-deep"
            : "text-white/80 hover:text-white",
        )}
      >
        {classic}
      </button>
      <button
        type="button"
        onClick={() => switchCustomerMode("office")}
        className={cn(
          "rounded-full px-3 py-1.5 transition",
          mode === "office"
            ? "bg-white text-tasco-deep"
            : "text-white/80 hover:text-white",
        )}
      >
        {office}
      </button>
    </div>
  );
}
