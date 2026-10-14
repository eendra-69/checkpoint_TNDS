"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { appendAudit } from "@/lib/audit";
import { getDemoCustomerId, DEMO_CUSTOMER_KEYS } from "@/lib/data/seed";
import { updateSession } from "@/lib/session";
import type { Claim, ClaimStatus } from "@/lib/types";

const MAX_PHOTOS = 3;
const MAX_PHOTO_CHARS = 180_000;

function triageStub(note: string): string {
  const lower = note.toLowerCase();
  if (lower.includes("kính") || lower.includes("glass")) {
    return "AI triage (demo): possible glass/window damage — photo clarity OK.";
  }
  if (lower.includes("cản") || lower.includes("bumper")) {
    return "AI triage (demo): bumper impact suspected — recommend underbody check.";
  }
  return "AI triage (demo): exterior damage noted — queued for human adjuster review.";
}

async function resolveCustomerId(authCustomerKey?: string) {
  const auth = await requirePermission("chat:use");
  if (auth.persona === "customer") {
    return getDemoCustomerId(auth.customerId || "minh");
  }
  // Previously this cast an arbitrary string to "minh" and then did
  // DEMO_CUSTOMERS[key].customer.id, which threw a 500 on any unknown key.
  // Narrow it properly instead of lying to the type system.
  const key = DEMO_CUSTOMER_KEYS.find((k) => k === authCustomerKey) ?? "minh";
  return getDemoCustomerId(key);
}

export async function createClaim(input: {
  note: string;
  photos: string[];
}) {
  const auth = await requirePermission("chat:use");
  const customerId = await resolveCustomerId(auth.customerId);
  const photos = input.photos
    .filter(Boolean)
    .slice(0, MAX_PHOTOS)
    .map((p) => (p.length > MAX_PHOTO_CHARS ? p.slice(0, MAX_PHOTO_CHARS) : p));

  const now = new Date().toISOString();
  const claim: Claim = {
    id: `CLM-${nanoid(8).toUpperCase()}`,
    customerId,
    status: "submitted",
    photos,
    note: input.note.trim() || "Khai báo bồi thường TNDS (demo)",
    triageNote: triageStub(input.note),
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        at: now,
        status: "submitted",
        note: "Hồ sơ đã gửi từ Virtual Office",
      },
    ],
  };

  const reviewAt = new Date(Date.now() + 1).toISOString();
  claim.status = "under_review";
  claim.updatedAt = reviewAt;
  claim.timeline.push({
    at: reviewAt,
    status: "under_review",
    note: "AI queued for review",
  });

  await updateSession(auth.sessionId, async (session) => {
    session.claims.unshift(claim);
    await appendAudit(session.id, {
      persona: auth.persona,
      customerId,
      action: "claim.submitted",
      detail: `Claim ${claim.id} submitted with ${photos.length} photo(s)`,
    });
  });

  revalidatePath("/office");
  revalidatePath("/compliance");
  return claim.id;
}

export async function advanceClaim(
  claimId: string,
  status: ClaimStatus,
  note?: string,
) {
  const auth = await requirePermission("chat:use");
  const now = new Date().toISOString();

  await updateSession(auth.sessionId, async (session) => {
    const claim = session.claims.find((c) => c.id === claimId);
    if (!claim) return;
    if (auth.persona === "customer") {
      const ownId = getDemoCustomerId(auth.customerId || "minh");
      if (claim.customerId !== ownId) return;
    }
    claim.status = status;
    claim.updatedAt = now;
    claim.timeline.push({
      at: now,
      status,
      note: note || `Status → ${status}`,
    });
    await appendAudit(session.id, {
      persona: auth.persona,
      customerId: claim.customerId,
      action: "claim.status",
      detail: `${claim.id} → ${status}`,
    });
  });

  revalidatePath("/office");
  revalidatePath("/compliance");
}

export async function resolveClaimDemo(claimId: string) {
  await advanceClaim(
    claimId,
    "resolved",
    "Demo resolve: hồ sơ đã được ghi nhận (synthetic)",
  );
}
