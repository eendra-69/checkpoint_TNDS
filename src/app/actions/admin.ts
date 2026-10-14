"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { appendAudit } from "@/lib/audit";
import { getOrCreateSession, saveSession } from "@/lib/session";
import { DEFAULT_PERMISSIONS, type Permission } from "@/lib/rbac";
import type { AiFeature, LlmProviderId, PersonaId } from "@/lib/types";
import { isLocalProvider, localProvidersDisabled } from "@/lib/llm/providers";

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
    session.settings.providerKeys[input.defaultProvider] = input.providerKey;
  }
  if (input.providerBaseUrl) {
    session.settings.providerBaseUrls[input.defaultProvider] = input.providerBaseUrl;
  }
  if (input.elevenLabsApiKey) {
    session.settings.elevenLabsApiKey = input.elevenLabsApiKey;
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

  appendAudit(session, {
    persona: auth.persona,
    action: "settings.llm",
    detail: `Provider ${input.defaultProvider} / ${input.defaultModel}`,
    params: { provider: input.defaultProvider, model: input.defaultModel },
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
  appendAudit(session, {
    persona: auth.persona,
    action: "settings.permissions",
    detail: "Updated permission matrix for this demo session",
  });
  await saveSession(session);
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
  appendAudit(session, {
    persona: auth.persona,
    action: "settings.permission_toggle",
    detail: `${input.persona} ${input.permission} = ${input.enabled}`,
    params: { persona: input.persona, permission: input.permission, enabled: String(input.enabled) },
  });
  await saveSession(session);
  revalidatePath("/admin");
}