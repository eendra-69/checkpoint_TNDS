import type { PersonaId } from "./types";

export const PERMISSIONS = [
  "demo:launch",
  "ops:view",
  "campaign:run",
  "agent:view",
  "agent:act",
  "pii:reveal",
  "outcome:log",
  "renewal:send_link",
  "compliance:view",
  "metrics:view",
  "settings:manage",
  "workflow:view",
  "chat:use",
  "voice:use",
  "assistant:use",
  "customer:own_only",
  "workshop:use",
  "lounge:use",
  "social:chat",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERSONAS: Record<
  PersonaId,
  {
    id: PersonaId;
    label: string;
    description: string;
    homePath: string;
  }
> = {
  customer: {
    id: "customer",
    label: "Customer",
    description: "Driver renewing TNDS via Zalo / VETC / voice",
    homePath: "/office",
  },
  telesales: {
    id: "telesales",
    label: "Telesales agent",
    description: "Handles AI handovers, callbacks, renewal links",
    homePath: "/agent",
  },
  campaign_manager: {
    id: "campaign_manager",
    label: "Campaign manager",
    description: "Lead scoring, campaigns, funnel metrics",
    homePath: "/ops",
  },
  compliance: {
    id: "compliance",
    label: "Compliance officer",
    description: "Consent ledger and audit log (read-only)",
    homePath: "/compliance",
  },
  executive: {
    id: "executive",
    label: "Business executive",
    description: "Funnel, uplift and cost metrics only",
    homePath: "/metrics",
  },
  admin: {
    id: "admin",
    label: "Admin",
    description: "Full access, settings, workflow visualizer",
    homePath: "/admin",
  },
};

export const DEFAULT_PERMISSIONS: Record<PersonaId, Permission[]> = {
  customer: [
    "demo:launch",
    "chat:use",
    "voice:use",
    "customer:own_only",
    "workshop:use",
    "lounge:use",
    "social:chat",
  ],
  telesales: [
    "demo:launch",
    "agent:view",
    "agent:act",
    "pii:reveal",
    "outcome:log",
    "renewal:send_link",
    "assistant:use",
    "workshop:use",
    "lounge:use",
    "social:chat",
  ],
  campaign_manager: [
    "demo:launch",
    "ops:view",
    "campaign:run",
    "metrics:view",
    "assistant:use",
    "lounge:use",
    "social:chat",
  ],
  compliance: [
    "demo:launch",
    "compliance:view",
    "assistant:use",
    "lounge:use",
    "social:chat",
  ],
  executive: [
    "demo:launch",
    "metrics:view",
    "assistant:use",
    "lounge:use",
    "social:chat",
  ],
  admin: [...PERMISSIONS],
};

export const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  { prefix: "/ops", permission: "ops:view" },
  { prefix: "/agent", permission: "agent:view" },
  { prefix: "/compliance", permission: "compliance:view" },
  { prefix: "/metrics", permission: "metrics:view" },
  { prefix: "/admin/workflow", permission: "workflow:view" },
  { prefix: "/admin", permission: "settings:manage" },
  { prefix: "/chat", permission: "chat:use" },
  { prefix: "/call", permission: "voice:use" },
  { prefix: "/vetc", permission: "chat:use" },
  { prefix: "/office", permission: "chat:use" },
  { prefix: "/workshop", permission: "workshop:use" },
  { prefix: "/lounge", permission: "lounge:use" },
  // API routes must be listed too — `permissionForPath` returning null means
  // "authenticated only", which is exactly the gap that let compliance and
  // executive personas drive the full chat toolset via /api/chat.
  { prefix: "/api/chat", permission: "chat:use" },
  { prefix: "/api/workshop", permission: "workshop:use" },
  { prefix: "/api/lounge", permission: "social:chat" },
  { prefix: "/api/presence", permission: "lounge:use" },
  { prefix: "/api/assistant", permission: "assistant:use" },
];

export function resolvePermissions(
  persona: PersonaId,
  overrides?: Partial<Record<PersonaId, string[]>>,
): Permission[] {
  const fromOverride = overrides?.[persona];
  if (fromOverride) {
    return fromOverride.filter((p): p is Permission =>
      (PERMISSIONS as readonly string[]).includes(p),
    );
  }
  return DEFAULT_PERMISSIONS[persona];
}

export function hasPermission(
  persona: PersonaId,
  permission: Permission,
  overrides?: Partial<Record<PersonaId, string[]>>,
): boolean {
  return resolvePermissions(persona, overrides).includes(permission);
}

/** Floating pitch assistant: staff only. Admin keeps it even if overrides drop `assistant:use`. */
export function canUseAssistant(
  persona: PersonaId,
  overrides?: Partial<Record<PersonaId, string[]>>,
): boolean {
  if (persona === "customer") return false;
  return persona === "admin" || hasPermission(persona, "assistant:use", overrides);
}

export function permissionForPath(pathname: string): Permission | null {
  const sorted = [...ROUTE_PERMISSIONS].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );
  for (const route of sorted) {
    if (pathname === route.prefix || pathname.startsWith(`${route.prefix}/`)) {
      return route.permission;
    }
  }
  return null;
}

export type MaskLevel = "full" | "partial" | "none" | "aggregate";

export function maskLevelForField(
  persona: PersonaId,
  field: "fullName" | "phone" | "nationalId" | "email",
): MaskLevel {
  if (persona === "admin" || persona === "telesales") {
    return field === "fullName" ? "full" : "partial";
  }
  if (persona === "customer") return "full";
  if (persona === "compliance") {
    return field === "fullName" ? "partial" : "partial";
  }
  if (persona === "campaign_manager") {
    return field === "fullName" ? "partial" : "none";
  }
  if (persona === "executive") return "aggregate";
  return "none";
}