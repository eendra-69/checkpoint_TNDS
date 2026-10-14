import { tool } from "ai";
import { z } from "zod";
import { nanoid } from "nanoid";
import { COVERAGE_EXPLAIN, getRegulatedPremium } from "../pricing";
import { appendAudit } from "../audit";
import { canTransition } from "../workflow/renewal";
import type { DemoSession, PersonaId } from "../types";
import { formatVnd } from "../utils";

export function createRenewalTools(input: {
  session: DemoSession;
  customerId: string;
  persona: PersonaId;
  save: () => Promise<void>;
}) {
  const { session, customerId, persona, save } = input;

  return {
    lookupPolicy: tool({
      description: "Look up the customer's TNDS policy by licence plate",
      inputSchema: z.object({
        plate: z.string().describe("Vehicle licence plate"),
      }),
      execute: async ({ plate }) => {
        const vehicle = session.vehicles.find(
          (v) =>
            v.customerId === customerId &&
            v.plate.replace(/\s/g, "").toLowerCase() ===
              plate.replace(/\s/g, "").toLowerCase(),
        );
        if (!vehicle) {
          return { found: false, message: "No vehicle matched that plate for this customer." };
        }
        const policy = session.policies.find((p) => p.vehicleId === vehicle.id);
        await appendAudit(session.id, {
          persona,
          customerId,
          action: "tool.lookupPolicy",
          detail: `Plate ${vehicle.plate}`,
        });
        await save();
        return {
          found: true,
          plate: vehicle.plate,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          incomplete: vehicle.incomplete,
          expiresAt: policy?.expiresAt,
          premiumVnd: policy?.premiumVnd,
          insurer: policy?.insurer,
        };
      },
    }),

    confirmVehicle: tool({
      description: "Mark vehicle details as confirmed by the customer",
      inputSchema: z.object({
        plate: z.string(),
        make: z.string().optional(),
        model: z.string().optional(),
      }),
      execute: async ({ plate, make, model }) => {
        const vehicle = session.vehicles.find((v) => v.customerId === customerId);
        if (!vehicle) return { ok: false, error: "Vehicle not found" };

        // The plate is the policy's identity anchor. Previously this assigned
        // model output straight onto the vehicle with no validation, so a
        // hallucinated plate silently detached the policy from its vehicle.
        const normalized = plate.replace(/\s/g, "").toUpperCase();
        if (!/^[A-Z0-9-]{4,12}$/.test(normalized)) {
          return {
            ok: false,
            error: `Plate "${plate}" is not a valid Vietnamese licence plate.`,
          };
        }

        if (make) vehicle.make = make;
        if (model) vehicle.model = model;
        vehicle.plate = normalized;
        vehicle.incomplete = false;
        const from = session.caseStates[customerId];
        if (from && canTransition(from, "confirmed")) {
          session.caseStates[customerId] = "confirmed";
          session.funnel.confirmed += 1;
        } else if (from === "engaged" || from === "reminded" || from === "link_sent") {
          session.caseStates[customerId] = "confirmed";
          session.funnel.confirmed += 1;
        }
        await appendAudit(session.id, {
          persona,
          customerId,
          action: "tool.confirmVehicle",
          detail: `Confirmed ${vehicle.plate}`,
        });
        await save();
        return { ok: true, plate: vehicle.plate, incomplete: false };
      },
    }),

    explainCoverage: tool({
      description: "Explain what TNDS covers and does not cover",
      inputSchema: z.object({
        language: z.enum(["vi", "en"]).default("vi"),
      }),
      execute: async ({ language }) => COVERAGE_EXPLAIN[language],
    }),

    getRegulatedPremiumTool: tool({
      description: "Get the regulated TNDS premium for the customer's vehicle type",
      inputSchema: z.object({}),
      execute: async () => {
        const vehicle = session.vehicles.find((v) => v.customerId === customerId);
        if (!vehicle) return { error: "Vehicle not found" };
        const premium = getRegulatedPremium(vehicle.vehicleType);
        return {
          vehicleType: vehicle.vehicleType,
          premiumVnd: premium,
          premiumFormatted: formatVnd(premium),
          note: "Regulated premium — no discounts available",
        };
      },
    }),

    createCheckout: tool({
      description: "Create a mock VietQR / MoMo checkout for the regulated premium",
      inputSchema: z.object({}),
      execute: async () => {
        const vehicle = session.vehicles.find((v) => v.customerId === customerId);
        if (!vehicle) return { ok: false, error: "Vehicle not found" };
        const policy = session.policies.find((p) => p.customerId === customerId);
        if (!policy) return { ok: false, error: "Policy not found" };

        const premium = getRegulatedPremium(vehicle.vehicleType);
        const checkoutId = `chk_${nanoid(8)}`;
        const now = new Date().toISOString();
        session.checkouts.push({
          id: checkoutId,
          customerId,
          vehicleId: vehicle.id,
          amountVnd: premium,
          status: "created",
          createdAt: now,
        });

        await appendAudit(session.id, {
          persona,
          customerId,
          action: "tool.createCheckout",
          detail: `Checkout ${checkoutId} for ${formatVnd(premium)}`,
        });
        await save();
        return {
          checkoutId,
          amountVnd: premium,
          amountFormatted: formatVnd(premium),
          methods: ["VietQR", "MoMo"],
          plate: vehicle.plate,
          expiresAt: policy.expiresAt,
          assumption: "Payment gateway (pilot)",
        };
      },
    }),

    confirmPayment: tool({
      description:
        "Simulate the customer completing payment for a checkout (VietQR / MoMo). Must be called before issueCertificate.",
      inputSchema: z.object({
        checkoutId: z.string(),
        method: z.enum(["VietQR", "MoMo"]).default("VietQR"),
      }),
      execute: async ({ checkoutId, method }) => {
        const checkout = session.checkouts.find((c) => c.id === checkoutId);
        if (!checkout) return { ok: false, error: "Unknown checkout" };
        if (checkout.customerId !== customerId) {
          return { ok: false, error: "Checkout belongs to a different customer" };
        }
        if (checkout.status === "consumed") {
          return { ok: false, error: "Checkout already consumed" };
        }
        if (checkout.status === "paid") {
          return { ok: true, alreadyPaid: true, checkoutId };
        }

        checkout.status = "paid";
        checkout.paidAt = new Date().toISOString();
        session.caseStates[customerId] = "paid";

        await appendAudit(session.id, {
          persona,
          customerId,
          action: "tool.confirmPayment",
          detail: `${formatVnd(checkout.amountVnd)} via ${method} for ${checkoutId}`,
        });
        await save();
        return {
          ok: true,
          checkoutId,
          amountFormatted: formatVnd(checkout.amountVnd),
          method,
          next: "Call issueCertificate with this checkoutId.",
        };
      },
    }),

    issueCertificate: tool({
      description:
        "Issue digital TNDS certificate. Requires a checkoutId that was created and paid.",
      inputSchema: z.object({
        checkoutId: z.string(),
      }),
      execute: async ({ checkoutId }) => {
        const vehicle = session.vehicles.find((v) => v.customerId === customerId);
        if (!vehicle) return { ok: false, error: "Vehicle not found" };
        const policy = session.policies.find((p) => p.customerId === customerId);
        if (!policy) return { ok: false, error: "Policy not found" };

        // Previously this accepted any string as `checkoutId` and issued a
        // certificate unconditionally, so the model could mint unlimited
        // certificates and double-count funnel.paid / funnel.issued. Real
        // checkout state is now the gate.
        const checkout = session.checkouts.find((c) => c.id === checkoutId);
        if (!checkout) {
          return {
            ok: false,
            error:
              "Unknown checkout. Call createCheckout first and pass the checkoutId it returns.",
          };
        }
        if (checkout.customerId !== customerId) {
          return { ok: false, error: "Checkout belongs to a different customer" };
        }
        if (checkout.status === "consumed") {
          return {
            ok: false,
            error: `Checkout ${checkoutId} has already been used to issue a certificate.`,
          };
        }
        if (checkout.status !== "paid") {
          return {
            ok: false,
            error: `Checkout ${checkoutId} is not paid yet (status: ${checkout.status}).`,
          };
        }

        if (vehicle.incomplete) {
          return { ok: false, error: "Vehicle details incomplete — confirm first" };
        }

        checkout.status = "consumed";
        checkout.consumedAt = new Date().toISOString();

        const certId = `CERT-${nanoid(10).toUpperCase()}`;
        const issuedAt = new Date().toISOString();
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        session.certificates.push({
          id: certId,
          policyId: policy.id,
          customerId,
          vehicleId: vehicle.id,
          issuedAt,
          premiumVnd: getRegulatedPremium(vehicle.vehicleType),
          insurer: policy.insurer,
          plate: vehicle.plate,
          expiresAt: expiresAt.toISOString(),
        });
        policy.certificateId = certId;
        policy.expiresAt = expiresAt.toISOString();
        policy.startsAt = issuedAt;
        session.caseStates[customerId] = "issued";
        session.funnel.paid += 1;
        session.funnel.issued += 1;

        await appendAudit(session.id, {
          persona,
          customerId,
          action: "tool.issueCertificate",
          detail: `Issued ${certId} after ${checkoutId}`,
        });
        await save();
        return {
          ok: true,
          certificateId: certId,
          verifyPath: `/verify/${certId}`,
          plate: vehicle.plate,
          assumption: "Insurer issuance API (pilot)",
        };
      },
    }),

    escalateToHuman: tool({
      description: "Hand the conversation to a human telesales agent",
      inputSchema: z.object({
        summary: z.string(),
        reason: z.string(),
        channel: z.enum(["zalo", "vetc", "voice", "telesales"]).default("zalo"),
      }),
      execute: async ({ summary, reason, channel }) => {
        const id = `ho_${nanoid(8)}`;
        session.handovers.unshift({
          id,
          customerId,
          fromChannel: channel,
          summary,
          reason,
          status: "queued",
          createdAt: new Date().toISOString(),
        });
        session.caseStates[customerId] = "handed_over";
        session.funnel.handedOver += 1;
        await appendAudit(session.id, {
          persona,
          customerId,
          action: "tool.escalateToHuman",
          detail: reason,
        });
        await save();
        return { ok: true, handoverId: id };
      },
    }),
  };
}