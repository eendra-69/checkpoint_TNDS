"use client";

import { useEffect, useRef } from "react";

export type ControlState = {
  x: number;
  y: number;
  interact: boolean;
  interactPressed: boolean;
};

const state: ControlState = {
  x: 0,
  y: 0,
  interact: false,
  interactPressed: false,
};

const keys = new Set<string>();

function recompute() {
  let x = 0;
  let y = 0;
  if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) x -= 1;
  if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) x += 1;
  if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) y -= 1;
  if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) y += 1;
  // touch stick overrides if set
  if (touch.x !== 0 || touch.y !== 0) {
    x = touch.x;
    y = touch.y;
  }
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  state.x = x;
  state.y = y;
}

const touch = { x: 0, y: 0 };

export function setTouchAxis(x: number, y: number) {
  touch.x = Math.max(-1, Math.min(1, x));
  touch.y = Math.max(-1, Math.min(1, y));
  recompute();
}

export function pressInteract() {
  if (!state.interact) state.interactPressed = true;
  state.interact = true;
}

export function releaseInteract() {
  state.interact = false;
}

export function consumeInteractPress() {
  if (state.interactPressed) {
    state.interactPressed = false;
    return true;
  }
  return false;
}

export function getControls() {
  return state;
}

export function useKeyboardControls(enabled = true) {
  const ready = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    ready.current = true;
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      keys.add(e.key);
      if (
        e.key === "e" ||
        e.key === "E" ||
        e.key === " " ||
        e.key === "Enter"
      ) {
        e.preventDefault();
        pressInteract();
      }
      recompute();
    };
    const up = (e: KeyboardEvent) => {
      keys.delete(e.key);
      if (
        e.key === "e" ||
        e.key === "E" ||
        e.key === " " ||
        e.key === "Enter"
      ) {
        releaseInteract();
      }
      recompute();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      keys.clear();
      recompute();
    };
  }, [enabled]);
}
