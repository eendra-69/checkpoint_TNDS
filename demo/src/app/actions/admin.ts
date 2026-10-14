"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePermission, setAuthCookie } from "@/lib/auth";
import { appendAudit } from "@/lib/audit";
import { getOrCreateSession, saveSession } from "@/lib/session";
import { DEFAULT_PERMISSIONS, type Permission } from "@/lib/rbac";
import { encryptSecret } from "@/lib/crypto";
import { getModeration, saveModeration } from "@/lib/lounge";
import type { AiFeature, LlmProviderId, PersonaId } from "@/lib/types";
import type { AuthCookie } from "@/lib/auth-token";
import { isLocalProvider, localProvidersDisabled } from "@/lib/llm/providers";

/**
 * Re-issue the auth cookie carrying the current permission overrides, so the
 * edge proxy resolves the same effective permissions as `requirePermission`.
 * Without this, enabling a permission in /admin leaves the browser bouncing
 * off /forbidden.
 */
async function syncPermCookie(
  auth: AuthCookie,
  overrides: Partial<Record<PersonaId, string[]>> | undefined,
) {
  await setAuthCookie({
    persona: auth.persona,
    customerId: auth.customerId,
    sessionId: auth.sessionId,
    displayName: auth.displayName,
    permOverrides: overrides,
  });
}

/**
 * Lounge chat moderation. The badword list lives in the shared lounge store
 * (not on DemoSession) because the lounge is a public room — enforcement must
 * be identical for every session, otherwise a filtered word would slip through
 * for anyone whose session happened to carry a different list.
 */
const ModerationSchema = z.object({
  enabled: z.boolean(),
  badwordsText: z.string().max(4000),
  maskChar: z.string().min(1).max(3),
  logToAudit: z.boolean(),
});

export async function saveModerationSettings(raw: {
  enabled: boolean;
  badwordsText: string;
  maskChar: string;
  logToAudit: boolean;
}) {
  const input = ModerationSchema.parse(raw);
  const auth = await requirePermission("settings:manage");

  const badwords = input.badwordsText
    .split(/[\n,]/)
    .map((w) => w.trim())
    .filter(Boolean)
    .slice(0, 500);

  const previous = await getModeration();
  const next = await saveModeration({
    enabled: input.enabled,
    badwords,
    maskChar: input.maskChar,
    logToAudit: input.logToAudit,
  });

  const session = await getOrCreateSession(auth.sessionId);
  await appendAudit(session.id, {
    persona: auth.persona,
    action: "settings.moderation",
    detail: `Lounge moderation updated: ${next.badwords.length} term(s), enabled=${next.enabled}`,
  });
  await saveSession(session);

  revalidatePath("/admin");
  revalidatePath("/lounge");

  return {
    count: next.badwords.length,
    added: next.badwords.filter((w) => !previous.badwords.includes(w)),
    removed: previous.badwords.filter((w) => !next.badwords.includes(w)),
  };
}

export async function saveLlmSettings(input: {
  defaultProvider: LlmProviderId;
  defaultModel: string;
  providerKey?: string;
  providerBaseUrl?: string;
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  feature?: AiFeature;
  featureProvider?: LlmProviderId;
  featureModel?: string;
}) {
  const auth = await requirePermission("settings:manage");
  const session = await getOrCreateSession(auth.sessionId);

  if (isLocalProvider(input.defaultProvider) && localProvidersDisabled()) {
    throw new Error("Local providers disabled on Vercel");
  }

  session.settings.defaultProvider = input.defaultProvider;
  session.settings.defaultModel = input.defaultModel;

  if (input.providerKey) {
    // Provider keys land in Redis inside the session blob, so encrypt before
    // it gets there rather than shipping a plaintext secret at rest.
    session.settings.providerKeys[input.defaultProvider] = await encryptSecret(
      input.providerKey,
    );
  }
  if (input.providerBaseUrl) {
    session.settings.providerBaseUrls[input.defaultProvider] = input.providerBaseUrl;
  }
  if (input.elevenLabsApiKey) {
    session.settings.elevenLabsApiKey = await encryptSecret(input.elevenLabsApiKey);
  }
  if (input.elevenLabsVoiceId) {
    session.settings.elevenLabsVoiceId = input.elevenLabsVoiceId;
  }
  if (input.feature && input.featureProvider && input.featureModel) {
    session.settings.featureOverrides[input.feature] = {
      provider: input.featureProvider,
      model: input.featureModel,
    };
  }

  await appendAudit(session.id, {
    persona: auth.persona,
    action: "settings.llm",
    detail: `Provider ${input.defaultProvider} / ${input.defaultModel}`,
  });
  await saveSession(session);
  revalidatePath("/admin");
}

export async function savePermissionMatrix(
  overrides: Partial<Record<PersonaId, Permission[]>>,
) {
  const auth = await requirePermission("settings:manage");
  const session = await getOrCreateSession(auth.sessionId);
  session.settings.permissionOverrides = overrides;
  await appendAudit(session.id, {
    persona: auth.persona,
    action: "settings.permissions",
    detail: "Updated permission matrix for this demo session",
  });
  await saveSession(session);
  await syncPermCookie(auth, session.settings.permissionOverrides);
  revalidatePath("/admin");
}

export async function togglePermission(input: {
  persona: PersonaId;
  permission: Permission;
  enabled: boolean;
}) {
  const auth = await requirePermission("settings:manage");
  const session = await getOrCreateSession(auth.sessionId);
  const current =
    session.settings.permissionOverrides?.[input.persona] ||
    [...DEFAULT_PERMISSIONS[input.persona]];
  const next = input.enabled
    ? Array.from(new Set([...current, input.permission]))
    : current.filter((p) => p !== input.permission);
  session.settings.permissionOverrides = {
    ...session.settings.permissionOverrides,
    [input.persona]: next,
  };
  await appendAudit(session.id, {
    persona: auth.persona,
    action: "settings.permission_toggle",
    detail: `${input.persona} ${input.permission} = ${input.enabled}`,
  });
  await saveSession(session);
  await syncPermCookie(auth, session.settings.permissionOverrides);
  revalidatePath("/admin");
}