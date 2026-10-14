"use client";

import { useState, useTransition } from "react";
import {
  advanceClaim,
  createClaim,
  resolveClaimDemo,
} from "@/app/actions/claims";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Claim } from "@/lib/types";
import type { Locale } from "@/lib/i18n/locale";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.length > 160_000 ? result.slice(0, 160_000) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ClaimsPanel({
  claims,
  onClose,
  locale = "vi",
}: {
  claims: Claim[];
  onClose: () => void;
  locale?: Locale;
}) {
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const en = locale === "en";

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const next = [...photos];
    for (const file of Array.from(files).slice(0, 3 - next.length)) {
      if (!file.type.startsWith("image/")) continue;
      next.push(await fileToDataUrl(file));
    }
    setPhotos(next.slice(0, 3));
  }

  function submit() {
    setError(null);
    if (photos.length < 1) {
      setError(en ? "Upload at least 1 vehicle photo." : "Upload ít nhất 1 ảnh xe.");
      return;
    }
    startTransition(async () => {
      await createClaim({ note, photos });
      setNote("");
      setPhotos([]);
    });
  }

  return (
    <div className="jrpg-window pointer-events-auto max-h-[75vh] w-full max-w-xl overflow-y-auto">
      <div className="flex items-center justify-between border-b border-white/15 px-4 py-3">
        <div>
          <div className="font-pixel text-sm tracking-wide text-tasco-lime">
            {en ? "Claims Desk" : "Bàn bồi thường"}
          </div>
          <div className="text-[11px] text-white/70">
            {en ? "Upload photos · demo claim" : "Upload ảnh xe · hồ sơ demo"}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-sm text-white/80 hover:bg-white/10"
        >
          Esc
        </button>
      </div>

      <div className="space-y-4 p-4 text-white">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
            {en ? "Vehicle photos (1–3)" : "Ảnh xe (1–3)"}
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="mt-2 block w-full text-sm"
            onChange={(e) => onFiles(e.target.files)}
          />
          {photos.length > 0 && (
            <div className="mt-3 flex gap-2">
              {photos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`Claim photo ${i + 1}`}
                  className="h-20 w-20 rounded-lg border object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-white/60">
            {en ? "Description" : "Mô tả"}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder={
              en
                ? "e.g. Light front-bumper scrape…"
                : "Vd: Va chạm nhẹ phần cản trước…"
            }
            className="mt-2 w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-tasco-lime"
          />
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <Button type="button" onClick={submit} disabled={pending}>
          {pending
            ? en
              ? "Submitting…"
              : "Đang gửi…"
            : en
              ? "Submit claim"
              : "Gửi hồ sơ bồi thường"}
        </Button>

        <div className="border-t border-white/15 pt-4">
          <h3 className="font-pixel font-semibold text-tasco-lime">
            {en ? "Your claims" : "Hồ sơ của bạn"}
          </h3>
          {claims.length === 0 ? (
            <p className="mt-2 text-sm text-white/60">
              {en ? "No claims yet." : "Chưa có claim nào."}
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {claims.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-white/20 bg-black/25 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold">
                      {c.id}
                    </span>
                    <Badge tone="sky">{c.status}</Badge>
                  </div>
                  <p className="mt-1 text-white/70">{c.note}</p>
                  {c.triageNote && (
                    <p className="mt-1 text-xs text-tasco-lime">{c.triageNote}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {c.status === "under_review" && (
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() =>
                          startTransition(() =>
                            advanceClaim(
                              c.id,
                              "need_info",
                              en ? "Need more photos" : "Cần thêm ảnh",
                            ),
                          )
                        }
                      >
                        Need info
                      </Button>
                    )}
                    {c.status !== "resolved" && (
                      <Button
                        size="sm"
                        variant="success"
                        type="button"
                        onClick={() =>
                          startTransition(() => resolveClaimDemo(c.id))
                        }
                      >
                        Resolve (demo)
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
