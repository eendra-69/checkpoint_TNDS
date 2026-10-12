import type { LlmProviderId } from "../types";

export type ProviderMeta = {
  id: LlmProviderId;
  label: string;
  kind: "cloud" | "local";
  needsKey: boolean;
  needsBaseUrl: boolean;
  suggestedModels: string[];
  defaultBaseUrl?: string;
};

export const PROVIDERS: ProviderMeta[] = [
  {
    id: "gateway",
    label: "Vercel AI Gateway",
    kind: "cloud",
    needsKey: false,
    needsBaseUrl: false,
    suggestedModels: [
      "google/gemini-2.5-flash",
      "openai/gpt-4o-mini",
      "anthropic/claude-haiku-4.5",
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    kind: "cloud",
    needsKey: true,
    needsBaseUrl: false,
    suggestedModels: ["gpt-4o-mini", "gpt-4o"],
  },
  {
    id: "anthropic",
    label: "Anthropic",
    kind: "cloud",
    needsKey: true,
    needsBaseUrl: false,
    suggestedModels: ["claude-haiku-4-5", "claude-sonnet-4-5"],
  },
  {
    id: "google",
    label: "Google Gemini",
    kind: "cloud",
    needsKey: true,
    needsBaseUrl: false,
    suggestedModels: ["gemini-2.5-flash", "gemini-2.5-pro"],
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    kind: "local",
    needsKey: false,
    needsBaseUrl: true,
    defaultBaseUrl: "http://localhost:11434/v1",
    suggestedModels: ["llama3.2", "qwen2.5"],
  },
  {
    id: "lmstudio",
    label: "LM Studio (local)",
    kind: "local",
    needsKey: false,
    needsBaseUrl: true,
    defaultBaseUrl: "http://localhost:1234/v1",
    suggestedModels: ["local-model"],
  },
  {
    id: "openai_compatible",
    label: "OpenAI-compatible endpoint",
    kind: "local",
    needsKey: true,
    needsBaseUrl: true,
    suggestedModels: ["custom-model"],
  },
];

export function isLocalProvider(id: LlmProviderId) {
  return PROVIDERS.find((p) => p.id === id)?.kind === "local";
}

export function localProvidersDisabled() {
  return Boolean(process.env.VERCEL);
}