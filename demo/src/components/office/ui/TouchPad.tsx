"use client";

import { useRef } from "react";
import {
  pressInteract,
  releaseInteract,
  setTouchAxis,
} from "../controls/useControls";

export function TouchPad() {
  const origin = useRef<{ x: number; y: number } | null>(null);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-4 sm:hidden">
      <div
        className="pointer-events-auto relative h-36 w-36 touch-none rounded-full border-2 border-white/30 bg-tasco-ink/55 backdrop-blur"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          origin.current = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
          const dx = (e.clientX - origin.current.x) / 50;
          const dy = (e.clientY - origin.current.y) / 50;
          setTouchAxis(dx, dy);
        }}
        onPointerMove={(e) => {
          if (!origin.current) return;
          const dx = (e.clientX - origin.current.x) / 50;
          const dy = (e.clientY - origin.current.y) / 50;
          setTouchAxis(dx, dy);
        }}
        onPointerUp={() => {
          origin.current = null;
          setTouchAxis(0, 0);
        }}
        onPointerCancel={() => {
          origin.current = null;
          setTouchAxis(0, 0);
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center font-pixel text-xs text-white/50">
          PAD
        </div>
      </div>

      <button
        type="button"
        className="pointer-events-auto flex h-16 w-16 touch-none items-center justify-center rounded-full border-2 border-amber-300/80 bg-amber-400/90 font-pixel text-xl font-bold text-tasco-ink shadow-lg active:scale-95"
        onPointerDown={(e) => {
          e.preventDefault();
          pressInteract();
        }}
        onPointerUp={() => releaseInteract()}
        onPointerCancel={() => releaseInteract()}
      >
        A
      </button>
    </div>
  );
}
