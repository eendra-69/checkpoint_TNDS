"use client";

import { useEffect } from "react";
import { useOnboarding } from "./onboarding-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OnboardingTour() {
  const { open, steps, stepIndex, ui, next, back, skip, kind } = useOnboarding();
  const step = steps[stepIndex];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, back, skip]);

  if (!open || !step) return null;

  const isLast = stepIndex >= steps.length - 1;
  const jrpg = kind === "customer";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-tasco-deep/55 p-4 backdrop-blur-[3px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboard-title"
    >
      <div
        className={cn(
          "pointer-events-auto w-full max-w-lg overflow-hidden shadow-2xl",
          jrpg
            ? "jrpg-window"
            : "rounded-3xl border border-white/10 bg-gradient-to-b from-tasco-navy to-tasco-deep text-white",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/15 px-5 py-3">
          <div className={cn("text-xs uppercase tracking-widest text-tasco-sky", jrpg && "font-pixel")}>
            {ui.progress(stepIndex + 1, steps.length)}
          </div>
          <button
            type="button"
            onClick={skip}
            className="text-xs font-semibold text-white/70 hover:text-white"
          >
            {ui.skip}
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="mb-3 flex gap-1.5">
            {steps.map((s, i) => (
              <span
                key={s.id}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i <= stepIndex ? "bg-tasco-sky" : "bg-white/15",
                )}
              />
            ))}
          </div>
          <h2
            id="onboard-title"
            className={cn(
              "text-xl font-semibold tracking-tight text-white",
              jrpg ? "font-pixel text-tasco-sky" : "font-display",
            )}
          >
            {step.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/85">{step.body}</p>
          {step.hint && (
            <p className="mt-3 rounded-xl border border-tasco-sky/30 bg-tasco-sky/10 px-3 py-2 text-xs font-medium text-tasco-sky">
              {step.hint}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/15 px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            className="text-white/80 hover:bg-white/10 hover:text-white"
            onClick={back}
            disabled={stepIndex === 0}
          >
            {ui.back}
          </Button>
          <Button
            type="button"
            className="bg-white text-tasco-deep hover:bg-tasco-pale"
            onClick={next}
          >
            {isLast ? ui.done : ui.next}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingTourButton({ className }: { className?: string }) {
  const { start, ui, open } = useOnboarding();
  return (
    <button
      type="button"
      onClick={() => start(true)}
      disabled={open}
      className={cn(
        "rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/20 disabled:opacity-50",
        className,
      )}
    >
      {ui.tour}
    </button>
  );
}
