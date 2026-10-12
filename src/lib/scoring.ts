import { daysUntil } from "./utils";
import type {
  Customer,
  LeadScore,
  Policy,
  VetcActivity,
  Vehicle,
} from "./types";

export function scoreLead(input: {
  customer: Customer;
  policy: Policy;
  vehicle: Vehicle;
  vetc?: VetcActivity;
}): LeadScore {
  const { customer, policy, vehicle, vetc } = input;
  const days = daysUntil(policy.expiresAt);
  const reasons: string[] = [];
  let score = 40;

  if (days <= 7) {
    score += 30;
    reasons.push(`Expires in ${days} day(s) — urgent window`);
  } else if (days <= 21) {
    score += 22;
    reasons.push(`Expires in ${days} days — ideal reminder window`);
  } else if (days <= 45) {
    score += 10;
    reasons.push(`Expires in ${days} days — early nurture`);
  } else if (days < 0) {
    score += 5;
    reasons.push(`Expired ${Math.abs(days)} day(s) ago`);
  }

  if (policy.previousRenewed) {
    score += 12;
    reasons.push("Previously renewed with us");
  }

  if (vetc && vetc.tollTripsLast90Days >= 20) {
    score += 15;
    reasons.push(`Active VETC user (${vetc.tollTripsLast90Days} trips / 90d)`);
  } else if (vetc && vetc.tollTripsLast90Days >= 5) {
    score += 8;
    reasons.push(`Moderate VETC activity (${vetc.tollTripsLast90Days} trips)`);
  }

  if (customer.zaloOptIn && customer.consent.messaging) {
    score += 10;
    reasons.push("Zalo messaging consent on file");
  } else if (customer.consent.calls) {
    score += 6;
    reasons.push("Call consent only — voice channel candidate");
  }

  if (!vehicle.incomplete && customer.phone && customer.nationalId) {
    score += 8;
    reasons.push("Complete customer / vehicle profile");
  } else {
    score -= 8;
    reasons.push("Incomplete data — needs confirmation before issuance");
  }

  score = Math.max(0, Math.min(100, score));

  const propensity: LeadScore["propensity"] =
    score >= 75 ? "high" : score >= 55 ? "medium" : "low";

  const nextBestAction = pickNextBestAction({
    customer,
    days,
    propensity,
    incomplete: vehicle.incomplete,
  });

  return {
    customerId: customer.id,
    score,
    reasons,
    nextBestAction,
    propensity,
  };
}

function pickNextBestAction(input: {
  customer: Customer;
  days: number;
  propensity: LeadScore["propensity"];
  incomplete: boolean;
}): LeadScore["nextBestAction"] {
  const { customer, days, propensity, incomplete } = input;
  const hour = days <= 7 ? "09:00–11:00 ICT" : "18:00–20:00 ICT";

  if (customer.zaloOptIn && customer.consent.messaging) {
    return {
      channel: "zalo",
      sendAtHint: hour,
      label: incomplete
        ? "Zalo: confirm vehicle details then renew"
        : "Zalo ZNS renewal reminder",
    };
  }

  if (customer.consent.calls && propensity !== "low") {
    return {
      channel: "voice",
      sendAtHint: "09:30–11:30 ICT",
      label: "Consent-based AI voice outreach",
    };
  }

  return {
    channel: "vetc",
    sendAtHint: "next app open",
    label: "VETC App renewal banner",
  };
}

export function scoreAll(input: {
  customers: Customer[];
  policies: Policy[];
  vehicles: Vehicle[];
  vetc: VetcActivity[];
}): LeadScore[] {
  const policyByCustomer = new Map(input.policies.map((p) => [p.customerId, p]));
  const vehicleById = new Map(input.vehicles.map((v) => [v.id, v]));
  const vetcByCustomer = new Map(input.vetc.map((v) => [v.customerId, v]));

  return input.customers
    .map((customer) => {
      const policy = policyByCustomer.get(customer.id);
      if (!policy) return null;
      const vehicle = vehicleById.get(policy.vehicleId);
      if (!vehicle) return null;
      return scoreLead({
        customer,
        policy,
        vehicle,
        vetc: vetcByCustomer.get(customer.id),
      });
    })
    .filter((s): s is LeadScore => s !== null)
    .sort((a, b) => b.score - a.score);
}