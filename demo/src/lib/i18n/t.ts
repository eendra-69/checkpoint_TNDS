import type { Dictionary } from "./dictionaries";

type DeepStringKeys<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? P extends ""
      ? K
      : `${P}.${K}`
    : T[K] extends Record<string, unknown>
      ? DeepStringKeys<T[K], P extends "" ? K : `${P}.${K}`>
      : never;
}[keyof T & string];

export type MessageKey = DeepStringKeys<Dictionary>;

export function t(
  dict: Dictionary,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return key;
    }
  }
  if (typeof cur !== "string") {
    if (Array.isArray(cur)) return String(cur[0] ?? key);
    return key;
  }
  if (!vars) return cur;
  return cur.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : `{${name}}`,
  );
}
