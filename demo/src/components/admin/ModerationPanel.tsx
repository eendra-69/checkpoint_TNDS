"use client";

import { useState, useTransition } from "react";
import { moderate } from "@/lib/moderation";
import type { ModerationSettings } from "@/lib/types";
import { saveModerationSettings } from "@/app/actions/admin";
import { format } from "@/lib/i18n/t";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const SAMPLE = "Xin chào, tôi cần hỏi về bảo hiểm đ*m cho xe của mình";

export function ModerationPanel({
  initial,
  labels: t,
}: {
  initial: ModerationSettings;
  labels: Dictionary["moderation"];
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [badwordsText, setBadwordsText] = useState(initial.badwords.join("\n"));
  const [maskChar, setMaskChar] = useState(initial.maskChar || "*");
  const [logToAudit, setLogToAudit] = useState(initial.logToAudit);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<{ tone: "ok" | "err"; text: string } | null>(
    null,
  );

  const preview = moderate(SAMPLE, {
    enabled,
    badwords: badwordsText.split(/[\n,]/).map((w) => w.trim()).filter(Boolean),
    maskChar: maskChar || "*",
    logToAudit,
  });

  const termCount = badwordsText.split(/[\n,]/).map((w) => w.trim()).filter(Boolean).length;

  function save() {
    setStatus(null);
    startTransition(async () => {
      try {
        const res = await saveModerationSettings({
          enabled,
          badwordsText,
          maskChar: maskChar || "*",
          logToAudit,
        });
        setStatus({
          tone: "ok",
          text:
            format(t.saved, { n: res.count }) +
            (res.added.length ? ` · +${res.added.join(", ")}` : "") +
            (res.removed.length ? ` · −${res.removed.join(", ")}` : ""),
        });
      } catch (e) {
        setStatus({
          tone: "err",
          text: e instanceof Error ? e.message : t.failed,
        });
      }
    });
  }

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <header className="mb-3">
        <h2 className="font-display text-lg font-semibold text-tasco-ink">
          {t.title}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{t.body}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label
            htmlFor="badwords"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {format(t.list, { n: termCount })}
          </label>
          <textarea
            id="badwords"
            value={badwordsText}
            onChange={(e) => setBadwordsText(e.target.value)}
            rows={8}
            spellCheck={false}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs text-tasco-ink focus:border-tasco-lime focus:outline-none focus:ring-2 focus:ring-tasco-lime/30"
          />
        </div>

        <div className="space-y-3 sm:w-40">
          <label className="flex items-center gap-2 text-sm text-tasco-ink">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 accent-tasco-lime"
            />
            {t.enabled}
          </label>
          <label className="flex items-center gap-2 text-sm text-tasco-ink">
            <input
              type="checkbox"
              checked={logToAudit}
              onChange={(e) => setLogToAudit(e.target.checked)}
              className="h-4 w-4 accent-tasco-lime"
            />
            {t.logToAudit}
          </label>
          <div>
            <label
              htmlFor="maskChar"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {t.maskChar}
            </label>
            <input
              id="maskChar"
              value={maskChar}
              onChange={(e) => setMaskChar(e.target.value.slice(0, 3) || "*")}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-tasco-ink focus:border-tasco-lime focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="w-full rounded-xl bg-tasco-leaf px-3 py-2 text-sm font-semibold text-white transition hover:bg-tasco-lime disabled:opacity-50"
          >
            {pending ? t.saving : t.save}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-dashed bg-tasco-mist/40 p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.preview}
        </div>
        <div className="mt-2 rounded-lg bg-white px-3 py-2 text-sm text-tasco-ink">
          {preview.masked}
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          {preview.clean
            ? t.noMatch
            : format(t.matched, { terms: preview.matched.join(", ") })}
          {enabled ? "" : t.off}
        </p>
      </div>

      {status && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-xs ${
            status.tone === "ok"
              ? "bg-success/10 text-tasco-ink"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {status.text}
        </p>
      )}
    </section>
  );
}
