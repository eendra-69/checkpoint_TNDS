import type { ModerationSettings } from "./types";

/**
 * Badword moderation for the virtual lounge's shared chat.
 *
 * Vietnamese is written with stacked diacritics, so "đm" typed with full
 * marks and "dm" typed on an unaccented keyboard are the same word to a user.
 * We therefore normalise both the haystack and the needle to a
 * diacritic-free, lowercased form before matching.
 */

function stripDiacritics(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

function normalize(input: string) {
  return stripDiacritics(input.toLowerCase()).replace(/\s+/g, " ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Short entries (<= 3 chars) must match on token boundaries, otherwise "vl"
 * would censor "vlog" and "clm" would censor every Vietnamese sentence that
 * happens to contain those letters. Longer entries match as substrings so
 * obfuscations like "f.u.c.k" are still caught.
 */
function shouldMatchSubstring(term: string) {
  return term.length > 3;
}

export type ModerationResult = {
  /** Text with every match replaced by the mask character. */
  masked: string;
  /** Normalized terms that matched, for the audit log / UI warning. */
  matched: string[];
  clean: boolean;
};

/**
 * Build a pattern for one term that tolerates separators *between* characters,
 * so "fuck", "f.u.c.k", "f u c k" and "f-u-c-k" all match. Matching happens on
 * the normalized haystack, so this also absorbs diacritics.
 *
 * The separator goes strictly between characters — a trailing `sep*` would
 * greedily eat the following space and corrupt the word-boundary check that
 * short terms rely on.
 */
function loosePattern(term: string) {
  const sep = String.raw`[\s\p{P}\p{S}]*`;
  return new RegExp([...term].map((ch) => escapeRegExp(ch)).join(sep), "giu");
}

function isWordChar(ch: string | undefined) {
  return ch !== undefined && /[\p{L}\p{N}]/u.test(ch);
}

export function moderate(
  input: string,
  settings: ModerationSettings,
): ModerationResult {
  const terms = (settings.badwords ?? [])
    .map((w) => w.trim())
    .filter(Boolean);

  if (!settings.enabled || terms.length === 0) {
    return { masked: input, matched: [], clean: true };
  }

  const maskChar = settings.maskChar || "*";
  const matched = new Set<string>();
  // normalize() is length-preserving (NFD mark stripping and the đ→d mapping
  // are both 1:1), so offsets found in `hay` index directly into `input`.
  // Masking against the original keeps Vietnamese diacritics in the visible
  // parts of the message.
  const hay = normalize(input);
  const ranges: [number, number][] = [];

  for (const raw of terms) {
    const term = normalize(raw);
    if (!term) continue;

    const short = !shouldMatchSubstring(term);
    const re = loosePattern(term);

    for (const m of hay.matchAll(re)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (!m[0]) continue;

      // Short terms only count as whole words, otherwise "vl" would censor
      // "vlog" and "clm" would hit unrelated Vietnamese sentences.
      if (short && (isWordChar(hay[start - 1]) || isWordChar(hay[end]))) {
        continue;
      }
      matched.add(raw.toLowerCase());
      ranges.push([start, end]);
    }
  }

  if (ranges.length === 0) {
    return { masked: input, matched: [], clean: true };
  }

  // Merge overlaps so overlapping terms don't double-mask.
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) {
      last[1] = Math.max(last[1], range[1]);
    } else {
      merged.push([...range] as [number, number]);
    }
  }

  let masked = "";
  let cursor = 0;
  for (const [start, end] of merged) {
    masked += input.slice(cursor, start);
    masked += maskChar.repeat(end - start);
    cursor = end;
  }
  masked += input.slice(cursor);

  return {
    masked,
    matched: [...matched],
    clean: false,
  };
}

export const DEFAULT_MODERATION: ModerationSettings = {
  enabled: true,
  badwords: [],
  maskChar: "*",
  logToAudit: true,
};
