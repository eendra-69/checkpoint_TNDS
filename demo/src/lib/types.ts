export type PersonaId =
  | "customer"
  | "telesales"
  | "campaign_manager"
  | "compliance"
  | "executive"
  | "admin";

export type DemoCustomerId = "minh" | "lan" | "tuan";

/** The three explorable 3D spaces. Presence is scoped per scene. */
export type WorldSceneId = "office" | "workshop" | "lounge";

/** Shared with the sprite renderer; re-exported from the office world map. */
export type Facing = "down" | "left" | "right" | "up";

/** A person currently present in a world scene (multiplayer-style presence). */
export type PresenceUser = {
  id: string;
  name: string;
  persona: PersonaId;
  scene: WorldSceneId;
  x: number;
  z: number;
  facing: Facing;
  at: number;
};

/** A message in the shared virtual lounge chat. */
export type LoungeMessage = {
  id: string;
  userId: string;
  name: string;
  persona: PersonaId;
  text: string;
  at: string;
  moderated: boolean;
  matched?: string[];
};

export type ModerationSettings = {
  enabled: boolean;
  badwords: string[];
  maskChar: string;
  logToAudit: boolean;
};

export type Checkout = {
  id: string;
  customerId: string;
  vehicleId: string;
  amountVnd: number;
  status: "created" | "paid" | "consumed";
  createdAt: string;
  paidAt?: string;
  consumedAt?: string;
};

export type CaseState =
  | "scored"
  | "reminded"
  | "engaged"
  | "confirmed"
  | "paid"
  | "issued"
  | "no_response"
  | "voice_call"
  | "handed_over"
  | "link_sent"
  | "opted_out"
  | "expired";

export type Channel = "zalo" | "vetc" | "voice" | "telesales" | "office";

/** Channels a customer can chat from (sent by the client to `/api/chat`). */
export const CHAT_CHANNELS = ["zalo", "vetc", "voice", "office"] as const satisfies readonly Channel[];

export type ConsentFlags = {
  messaging: boolean;
  calls: boolean;
  dataUse: boolean;
};

export type Customer = {
  id: string;
  demoKey?: DemoCustomerId;
  fullName: string;
  fullNameVi: string;
  phone: string;
  nationalId: string;
  email?: string;
  preferredLanguage: "vi" | "en";
  zaloOptIn: boolean;
  consent: ConsentFlags;
};

export type Vehicle = {
  id: string;
  customerId: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  vehicleType: "car_under_6" | "car_6_to_11" | "car_over_11";
  incomplete: boolean;
};

export type Policy = {
  id: string;
  customerId: string;
  vehicleId: string;
  product: "TNDS";
  insurer: string;
  premiumVnd: number;
  startsAt: string;
  expiresAt: string;
  certificateId?: string;
  previousRenewed: boolean;
};

export type VetcActivity = {
  customerId: string;
  tollTripsLast90Days: number;
  lastTollAt: string;
  appActive: boolean;
};

/** Score reason as a code + number; rendered per locale by `describeReason`. */
export type ScoreReason =
  | { code: "expires_urgent" | "expires_ideal" | "expires_early" | "expired"; days: number }
  | { code: "vetc_active" | "vetc_moderate"; trips: number }
  | {
      code:
        | "previously_renewed"
        | "zalo_consent"
        | "call_consent_only"
        | "profile_complete"
        | "profile_incomplete";
    };

export type NextActionCode = "zalo_confirm" | "zalo_reminder" | "voice_outreach" | "vetc_banner";
export type SendWindow = "morning" | "evening" | "voice_morning" | "next_app_open";

export type LeadScore = {
  customerId: string;
  score: number;
  /** Older sessions (e.g. still in Redis) may hold English strings. */
  reasons: (ScoreReason | string)[];
  nextBestAction: {
    channel: Channel;
    /** Codes rendered per locale; `label` / `sendAtHint` are the English originals. */
    action?: NextActionCode;
    window?: SendWindow;
    sendAtHint: string;
    label: string;
  };
  propensity: "high" | "medium" | "low";
};

export type ConversationMessage = {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  customerId: string;
  channel: Channel;
  messages: ConversationMessage[];
  status: "open" | "closed" | "escalated";
};

export type Handover = {
  id: string;
  customerId: string;
  fromChannel: Channel;
  summary: string;
  reason: string;
  /** Set for demo-agent handovers so summary/reason render per locale; LLM handovers keep free text. */
  template?: { kind: "requested_human"; customerName: string; plate: string; expiresAt: string };
  status: "queued" | "in_progress" | "resolved";
  createdAt: string;
  assignedTo?: string;
  renewalLinkSent?: boolean;
};

export type Certificate = {
  id: string;
  policyId: string;
  customerId: string;
  vehicleId: string;
  issuedAt: string;
  premiumVnd: number;
  insurer: string;
  plate: string;
  expiresAt: string;
};

export type AuditEvent = {
  id: string;
  /** Monotonic per-session sequence, so a gap in the log is detectable. */
  seq: number;
  at: string;
  persona: PersonaId;
  customerId?: string;
  action: string;
  detail: string;
  /** Values for the localized detail template of `action` (see `describeAudit`). */
  params?: Record<string, string | number>;
  reason?: string;
};

export type CampaignRun = {
  id: string;
  runAt: string;
  targeted: number;
  excluded: number;
  exclusionReasons: Record<string, number>;
  customerIds: string[];
};

export type OutcomeCode =
  | "renewed"
  | "callback_requested"
  | "not_interested"
  | "wrong_number"
  | "no_answer"
  | "escalated"
  | "link_sent";

export type LlmProviderId =
  | "gateway"
  | "openai"
  | "anthropic"
  | "google"
  | "ollama"
  | "lmstudio"
  | "openai_compatible";

export type AiFeature = "chat" | "voice" | "assistant";

export type CustomerUiMode = "classic" | "office";

export type ClaimStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "need_info"
  | "resolved";

export type ClaimTimelineEntry = {
  at: string;
  status: ClaimStatus;
  note: string;
};

export type TriageCode = "glass" | "bumper" | "exterior";

export type Claim = {
  id: string;
  customerId: string;
  status: ClaimStatus;
  photos: string[];
  note: string;
  triageNote?: string;
  /** Code behind `triageNote`, rendered per locale. */
  triageCode?: TriageCode;
  createdAt: string;
  updatedAt: string;
  timeline: ClaimTimelineEntry[];
};

export type SessionSettings = {
  defaultProvider: LlmProviderId;
  defaultModel: string;
  featureOverrides: Partial<
    Record<AiFeature, { provider: LlmProviderId; model: string }>
  >;
  providerKeys: Partial<Record<LlmProviderId, string>>;
  providerBaseUrls: Partial<Record<LlmProviderId, string>>;
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  permissionOverrides?: Partial<Record<PersonaId, string[]>>;
  customerUiMode?: CustomerUiMode;
};

export type DemoSession = {
  id: string;
  createdAt: string;
  customers: Customer[];
  vehicles: Vehicle[];
  policies: Policy[];
  vetc: VetcActivity[];
  scores: LeadScore[];
  caseStates: Record<string, CaseState>;
  conversations: Conversation[];
  handovers: Handover[];
  certificates: Certificate[];
  claims: Claim[];
  checkouts: Checkout[];
  campaigns: CampaignRun[];
  outcomes: { customerId: string; code: OutcomeCode; at: string }[];
  revealedPii: Record<string, string[]>;
  settings: SessionSettings;
  funnel: {
    reminded: number;
    engaged: number;
    confirmed: number;
    paid: number;
    issued: number;
    handedOver: number;
  };
};

export type AuthContext = {
  persona: PersonaId;
  customerId?: DemoCustomerId;
  sessionId: string;
  displayName?: string;
};