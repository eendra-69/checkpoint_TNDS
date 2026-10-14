"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Dictionary-supplied room names, shared with `WorldTopBar` and the pages. */
export type WorldLabels = { office: string; workshop: string; lounge: string };

/**
 * Switches between the three 3D worlds.
 *
 * The customer sidebar lists only Home, the office and its two processes, so
 * this is the only route between Office / Workshop / Lounge. That means it has
 * to exist in all three rooms, not just the office — otherwise a customer who
 * walks into the workshop has no way back.
 *
 * Labels arrive as props from the dictionary so VI and EN stay in step with the
 * sidebar entries rather than drifting into a second copy of the same strings.
 *
 * No positioning of its own: `WorldTopBar` lays this out beside the hint pill
 * and presence counter, because the three used to be absolutely positioned and
 * the switcher overlapped the full-bleed hint between 640px and 900px.
 */
export function WorldSwitcher({
  labels,
  className,
}: {
  labels: WorldLabels;
  className?: string;
}) {
  const pathname = usePathname();
  const worlds = [
    { href: "/office", label: labels.office },
    { href: "/workshop", label: labels.workshop },
    { href: "/lounge", label: labels.lounge },
  ];

  return (
    <div className={cn("jrpg-window pointer-events-auto flex items-center gap-1 p-1", className)}>
      {/* Wordmark, so every room carries the brand even where the in-world wall
          sign is out of frame. Decorative rather than a nav control. */}
      <span className="px-1.5 font-pixel text-[11px] tracking-[0.12em] text-tasco-lime-bright">
        TASCO
      </span>
      <span aria-hidden className="h-4 w-px shrink-0 bg-white/15" />

      {worlds.map((world) => {
        const current = pathname === world.href;
        return (
          <Link
            key={world.href}
            href={world.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-md px-2.5 py-1 font-pixel text-[11px] transition",
              current
                ? "bg-tasco-lime-bright text-tasco-ink"
                : "text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            {world.label}
          </Link>
        );
      })}
    </div>
  );
}
