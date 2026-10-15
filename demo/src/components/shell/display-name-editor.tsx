"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Pencil } from "lucide-react";
import { setDisplayName } from "@/app/actions/auth";
import { DISPLAY_NAME_MAX, displayNameError } from "@/lib/display-name";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Lets a signed-in user rename their avatar without signing out. */
export function DisplayNameEditor({
  persona,
  displayName,
  labels,
}: {
  persona: string;
  displayName?: string;
  labels: Dictionary["displayName"];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(displayName ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(displayName ?? "");
          setError(null);
          setEditing(true);
        }}
        className="flex w-full items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2 text-left text-xs text-white hover:bg-white/15"
      >
        <span className="min-w-0">
          <span className="block text-[10px] uppercase tracking-wider text-white/50">
            {labels.label}
          </span>
          <span className="block truncate font-semibold">
            {displayName || persona}
          </span>
        </span>
        <Pencil className="h-3.5 w-3.5 shrink-0 text-white/60" />
      </button>
    );
  }

  function save() {
    const invalid = displayNameError(value.trim());
    if (invalid) {
      setError(labels[invalid]);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = await setDisplayName({ displayName: value });
        if (result.error) {
          setError(labels[result.error]);
          return;
        }
        setEditing(false);
        // Re-render server components so presence picks up the new name.
        router.refresh();
      } catch {
        setError(labels.failed);
      }
    });
  }

  return (
    <div className="rounded-xl bg-white/10 p-2">
      <label className="text-[10px] uppercase tracking-wider text-white/50">
        {labels.label}
      </label>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, DISPLAY_NAME_MAX))}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        autoFocus
        placeholder={persona}
        className="mt-1 w-full rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-xs text-white placeholder:text-white/40 focus:border-tasco-lime-bright focus:outline-none"
      />
      {error && <p className="mt-1 text-[10px] text-red-300">{error}</p>}
      <div className="mt-1.5 flex gap-1.5">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="flex items-center gap-1 rounded-lg bg-tasco-lime-bright px-2 py-1 text-[11px] font-semibold text-tasco-ink disabled:opacity-50"
        >
          <Check className="h-3 w-3" />
          {labels.save}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg px-2 py-1 text-[11px] text-white/70 hover:bg-white/10"
        >
          {labels.cancel}
        </button>
      </div>
    </div>
  );
}
