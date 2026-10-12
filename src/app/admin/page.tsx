import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { getOrCreateSession } from "@/lib/session";
import {
  DEFAULT_PERMISSIONS,
  PERMISSIONS,
  PERSONAS,
  type Permission,
} from "@/lib/rbac";
import { PROVIDERS, localProvidersDisabled } from "@/lib/llm/providers";
import { saveLlmSettings, togglePermission } from "@/app/actions/admin";
import type { PersonaId } from "@/lib/types";
import { usingMemoryStore } from "@/lib/session";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function AdminPage() {
  const auth = await requirePermission("settings:manage");
  const session = await getOrCreateSession(auth.sessionId);
  const localDisabled = localProvidersDisabled();
  const settings = session.settings;
  const dict = getDictionary(await getLocale());

  return (
    <AppShell
      title={dict.admin.title}
      subtitle={dict.admin.subtitle}
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone={usingMemoryStore() ? "warn" : "green"}>
          Store: {usingMemoryStore() ? "in-memory" : "Upstash Redis"}
        </Badge>
        <Link href="/admin/workflow">
          <Badge tone="sky">Open workflow visualizer →</Badge>
        </Link>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-tasco-deep">AI providers</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cloud works on the live demo. Local / on-prem options are visible
          {localDisabled ? " but disabled on Vercel" : " and available on this host"}.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {PROVIDERS.map((p) => {
            const disabled = p.kind === "local" && localDisabled;
            return (
              <form
                key={p.id}
                action={async (fd) => {
                  "use server";
                  await saveLlmSettings({
                    defaultProvider: p.id,
                    defaultModel: String(fd.get("model") || p.suggestedModels[0]),
                    providerKey: String(fd.get("key") || "") || undefined,
                    providerBaseUrl: String(fd.get("baseUrl") || "") || undefined,
                    elevenLabsApiKey: String(fd.get("eleven") || "") || undefined,
                  });
                }}
                className={`rounded-2xl border p-4 ${disabled ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{p.label}</div>
                  <Badge tone={p.kind === "cloud" ? "sky" : "muted"}>{p.kind}</Badge>
                  {settings.defaultProvider === p.id && (
                    <Badge tone="green">active</Badge>
                  )}
                </div>
                {disabled && (
                  <p className="mt-1 text-xs text-amber-800">
                    Available in self-hosted / on-prem deployment
                  </p>
                )}
                {p.needsKey && (
                  <input
                    name="key"
                    type="password"
                    placeholder={
                      settings.providerKeys[p.id]
                        ? `••••${settings.providerKeys[p.id]!.slice(-4)}`
                        : "API key"
                    }
                    disabled={disabled}
                    className="mt-3 h-9 w-full rounded-lg border px-2 text-sm"
                  />
                )}
                {p.needsBaseUrl && (
                  <input
                    name="baseUrl"
                    defaultValue={
                      settings.providerBaseUrls[p.id] || p.defaultBaseUrl || ""
                    }
                    disabled={disabled}
                    className="mt-2 h-9 w-full rounded-lg border px-2 text-sm"
                  />
                )}
                <input
                  name="model"
                  defaultValue={
                    settings.defaultProvider === p.id
                      ? settings.defaultModel
                      : p.suggestedModels[0]
                  }
                  disabled={disabled}
                  className="mt-2 h-9 w-full rounded-lg border px-2 text-sm"
                />
                <Button type="submit" size="sm" className="mt-3" disabled={disabled}>
                  Use this provider
                </Button>
              </form>
            );
          })}
        </div>

        <form
          className="mt-4 rounded-2xl border border-dashed p-4"
          action={async (fd) => {
            "use server";
            await saveLlmSettings({
              defaultProvider: settings.defaultProvider,
              defaultModel: settings.defaultModel,
              elevenLabsApiKey: String(fd.get("eleven") || "") || undefined,
              elevenLabsVoiceId: String(fd.get("voiceId") || "") || undefined,
            });
          }}
        >
          <h3 className="font-semibold text-tasco-deep">ElevenLabs (optional)</h3>
          <p className="text-xs text-muted-foreground">
            Falls back to free Web Speech when empty.
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input
              name="eleven"
              type="password"
              placeholder={
                settings.elevenLabsApiKey
                  ? `••••${settings.elevenLabsApiKey.slice(-4)}`
                  : "ELEVENLABS_API_KEY"
              }
              className="h-9 rounded-lg border px-2 text-sm"
            />
            <input
              name="voiceId"
              defaultValue={settings.elevenLabsVoiceId || ""}
              placeholder="Voice ID"
              className="h-9 rounded-lg border px-2 text-sm"
            />
          </div>
          <Button type="submit" size="sm" className="mt-3" variant="secondary">
            Save voice settings
          </Button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-tasco-deep">
          Permission matrix
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Edits apply only to this demo session. Reset demo restores defaults.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b">
                <th className="p-2">Permission</th>
                {(Object.keys(PERSONAS) as PersonaId[]).map((pid) => (
                  <th key={pid} className="p-2 font-medium">
                    {PERSONAS[pid].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((perm) => (
                <tr key={perm} className="border-b border-border/60">
                  <td className="p-2 font-mono">{perm}</td>
                  {(Object.keys(PERSONAS) as PersonaId[]).map((pid) => {
                    const list =
                      (session.settings.permissionOverrides?.[pid] as
                        | Permission[]
                        | undefined) || DEFAULT_PERMISSIONS[pid];
                    const checked = list.includes(perm);
                    return (
                      <td key={pid} className="p-2 text-center">
                        <form
                          action={async () => {
                            "use server";
                            await togglePermission({
                              persona: pid,
                              permission: perm,
                              enabled: !checked,
                            });
                          }}
                        >
                          <button
                            type="submit"
                            className={`h-5 w-5 rounded ${checked ? "bg-vetc-green text-white" : "bg-muted"}`}
                            aria-label={`${pid} ${perm}`}
                          >
                            {checked ? "✓" : ""}
                          </button>
                        </form>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}