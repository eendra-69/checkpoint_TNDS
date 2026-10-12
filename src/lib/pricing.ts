import type { Vehicle } from "./types";

/**
 * Regulated TNDS (compulsory motor liability) annual premiums for cars.
 * Based on Decree 67/2023 schedules (illustrative for demo — verify before pilot).
 * No discounts or promotional pricing.
 */
export const TNDS_CAR_PREMIUMS_VND: Record<Vehicle["vehicleType"], number> = {
  car_under_6: 437_000,
  car_6_to_11: 794_000,
  car_over_11: 1_827_000,
};

export const VEHICLE_TYPE_LABELS: Record<Vehicle["vehicleType"], string> = {
  car_under_6: "Passenger car under 6 seats",
  car_6_to_11: "Passenger car 6–11 seats",
  car_over_11: "Passenger car over 11 seats",
};

export const VEHICLE_TYPE_LABELS_VI: Record<Vehicle["vehicleType"], string> = {
  car_under_6: "Xe dưới 6 chỗ",
  car_6_to_11: "Xe từ 6–11 chỗ",
  car_over_11: "Xe trên 11 chỗ",
};

export function getRegulatedPremium(vehicleType: Vehicle["vehicleType"]): number {
  return TNDS_CAR_PREMIUMS_VND[vehicleType];
}

export const COVERAGE_EXPLAIN = {
  en: {
    covered:
      "TNDS covers third-party bodily injury and property damage when you are at fault, up to the regulated limits.",
    notCovered:
      "It does not cover damage to your own vehicle, your injuries, or theft. Those need voluntary cover (vật chất xe / tai nạn người ngồi).",
  },
  vi: {
    covered:
      "Bảo hiểm TNDS bồi thường thiệt hại về người và tài sản của bên thứ ba khi bạn có lỗi, theo hạn mức quy định.",
    notCovered:
      "Không bao gồm thiệt hại xe của bạn, thương tích của bạn, hoặc mất cắp. Các rủi ro đó cần bảo hiểm tự nguyện.",
  },
};