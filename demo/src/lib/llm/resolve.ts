import { gateway } from "@ai-sdk/gateway";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { AiFeature, DemoSession, LlmProviderId } from "../types";
import { isLocalProvider, localProvidersDisabled } from "./providers";
import { decryptSecret } from "../crypto";

function envKey(provider: LlmProviderId): string | undefined {
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "google":
      return process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    case "gateway":
      return process.env.AI_GATEWAY_API_KEY;
    default:
      return undefined;
  }
}

export async function getModel(session: DemoSession, feature: AiFeature) {
  const override = session.settings.featureOverrides[feature];
  const provider =
    override?.provider || session.settings.defaultProvider || "gateway";
  const modelId =
    override?.model ||
    session.settings.defaultModel ||
    process.env.AI_MODEL ||
    "google/gemini-2.5-flash";

  if (isLocalProvider(provider) && localProvidersDisabled()) {
    throw new Error(
      "Local providers are disabled on Vercel. Use a cloud provider or run self-hosted.",
    );
  }

  // Session keys are stored encrypted at rest; decrypt before handing to the
  // SDK. A null result means "rotated secret or corrupt value" — fall through
  // to the environment key rather than failing the request.
  const sessionKey = await decryptSecret(
    session.settings.providerKeys[provider],
  );
  const apiKey = sessionKey || envKey(provider);
  const baseURL =
    session.settings.providerBaseUrls[provider] ||
    (provider === "ollama"
      ? "http://localhost:11434/v1"
      : provider === "lmstudio"
        ? "http://localhost:1234/v1"
        : undefined);

  switch (provider) {
    case "gateway":
      return gateway(modelId);
    case "openai":
      return createOpenAI({ apiKey })(modelId);
    case "anthropic":
      return createAnthropic({ apiKey })(modelId);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(modelId);
    case "ollama":
    case "lmstudio":
    case "openai_compatible":
      return createOpenAICompatible({
        name: provider,
        baseURL: baseURL!,
        apiKey: apiKey || "local",
      })(modelId);
    default:
      return gateway(modelId);
  }
}