"use client";

export function InteractPrompt({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-28 z-10 flex justify-center px-4 sm:bottom-10">
      <div className="jrpg-window office-prompt px-4 py-2 font-pixel text-sm text-white sm:text-base">
        {text}
      </div>
    </div>
  );
}
