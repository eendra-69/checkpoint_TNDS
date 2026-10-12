"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export function JrpgDialog({
  name,
  portrait,
  intro,
  onDone,
  children,
}: {
  name: string;
  portrait?: string;
  intro: string;
  onDone?: () => void;
  children?: React.ReactNode;
}) {
  const [shown, setShown] = useState("");
  const [ready, setReady] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    setShown("");
    setReady(false);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(intro.slice(0, i));
      if (i >= intro.length) {
        window.clearInterval(id);
        setReady(true);
        doneRef.current?.();
      }
    }, 16);
    return () => window.clearInterval(id);
  }, [intro]);

  return (
    <div className="pointer-events-auto flex w-full max-w-2xl flex-col gap-3">
      <div className="jrpg-window flex gap-3 p-3 sm:p-4">
        {portrait && (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border-2 border-white/80 bg-tasco-navy sm:h-24 sm:w-24">
            <Image
              src={portrait}
              alt=""
              fill
              className="object-cover"
              style={{ imageRendering: "pixelated" }}
              sizes="96px"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="font-pixel text-sm tracking-wide text-tasco-sky sm:text-base">
            {name}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-white sm:text-base">
            {shown}
            {!ready && <span className="animate-pulse">▍</span>}
          </p>
        </div>
      </div>
      {ready && children}
    </div>
  );
}
