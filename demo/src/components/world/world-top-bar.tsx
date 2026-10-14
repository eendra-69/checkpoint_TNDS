"use client";

import type { ReactNode } from "react";
import { WorldSwitcher, type WorldLabels } from "./world-switcher";

/**
 * The one overlay row every world shares: world switcher left, movement hint
 * centred, presence counter right.
 *
 * These three used to be independently absolutely positioned, so the switcher
 * and the full-bleed hint pill fought over the top-left corner and overlapped
 * between roughly 640px and 900px of viewport width. Laying them out as a single
 * flex row makes an overlap impossible at any width: below `sm` the hint takes
 * `basis-full` and wraps onto its own line, above it the three sit side by side
 * with the hint flexing between the other two.
 *
 * The bar is `pointer-events-none`; the switcher opts back in for its links.
 */
export function WorldTopBar({
  labels,
  hint,
  online,
}: {
  labels: WorldLabels;
  hint: ReactNode;
  online: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center gap-2 p-3">
      <WorldSwitcher labels={labels} />

      <div className="order-3 flex basis-full justify-center sm:order-none sm:basis-auto sm:flex-1">
        <div className="jrpg-window px-4 py-2 font-pixel text-xs text-white/90 sm:text-sm">
          {hint}
        </div>
      </div>

      <span className="jrpg-window order-2 ml-auto whitespace-nowrap px-2.5 py-1 font-pixel text-[11px] text-white sm:order-none">
        {online}
      </span>
    </div>
  );
}