import { maskId, maskPhone } from "./utils";
import { maskLevelForField } from "./rbac";
import type { Customer, PersonaId } from "./types";

export type MaskedCustomer = {
  id: string;
  fullName: string;
  fullNameVi: string;
  phone: string;
  nationalId: string;
  email?: string;
  preferredLanguage: Customer["preferredLanguage"];
  zaloOptIn: boolean;
  consent: Customer["consent"];
  demoKey?: Customer["demoKey"];
  _masked: {
    phone: boolean;
    nationalId: boolean;
    fullName: boolean;
  };
};

export function maskCustomer(
  customer: Customer,
  persona: PersonaId,
  revealedFields: string[] = [],
): MaskedCustomer {
  const phoneLevel = revealedFields.includes("phone")
    ? "full"
    : maskLevelForField(persona, "phone");
  const idLevel = revealedFields.includes("nationalId")
    ? "full"
    : maskLevelForField(persona, "nationalId");
  const nameLevel = maskLevelForField(persona, "fullName");

  return {
    id: customer.id,
    fullName:
      nameLevel === "full"
        ? customer.fullName
        : nameLevel === "partial"
          ? `${customer.fullName.split(" ")[0]} •••`
          : nameLevel === "aggregate"
            ? "Customer cohort"
            : "••••",
    fullNameVi:
      nameLevel === "full"
        ? customer.fullNameVi
        : nameLevel === "partial"
          ? `${customer.fullNameVi.split(" ").slice(-1)[0]} •••`
          : "••••",
    phone:
      phoneLevel === "full"
        ? customer.phone
        : phoneLevel === "partial"
          ? maskPhone(customer.phone)
          : "••••••••••",
    nationalId:
      idLevel === "full"
        ? customer.nationalId
        : idLevel === "partial"
          ? maskId(customer.nationalId)
          : "••••••••••••",
    email:
      persona === "admin" || persona === "telesales" || persona === "customer"
        ? customer.email
        : undefined,
    preferredLanguage: customer.preferredLanguage,
    zaloOptIn: customer.zaloOptIn,
    consent: customer.consent,
    demoKey: customer.demoKey,
    _masked: {
      phone: phoneLevel !== "full",
      nationalId: idLevel !== "full",
      fullName: nameLevel !== "full",
    },
  };
}