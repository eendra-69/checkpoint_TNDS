"use client";

import { CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export type WorkshopVehicle = {
  make: string;
  model: string;
  year: number;
  plate: string;
  vehicleType: string;
  expiresAt: string;
};

type Check = { label: string; state: "ok" | "warn" | "info" };

/**
 * Synthetic pre-TNDS inspection. Deliberately *not* a real safety assessment —
 * the copy says so on screen, because a demo that implied a genuine vehicle
 * inspection would be a liability.
 */
function checks(vehicle: WorkshopVehicle, locale: "vi" | "en"): Check[] {
  const olderThanTen = new Date().getFullYear() - vehicle.year > 10;
  if (locale === "en") {
    return [
      { label: "Brakes and pads", state: "ok" },
      { label: "Tyre tread and pressure", state: olderThanTen ? "warn" : "ok" },
      { label: "Lights and indicators", state: "ok" },
      { label: "Steering and suspension", state: "ok" },
      { label: "Fluid levels and battery", state: olderThanTen ? "warn" : "ok" },
      { label: "Vehicle age vs TNDS inspection cycle", state: olderThanTen ? "warn" : "ok" },
    ];
  }
  return [
    { label: "Phanh và má phanh", state: "ok" },
    { label: "Lốp — độ mòn và áp suất", state: olderThanTen ? "warn" : "ok" },
    { label: "Đèn và xi-nhan", state: "ok" },
    { label: "Hệ thống lái và treo", state: "ok" },
    { label: "Nước và ắc quy", state: olderThanTen ? "warn" : "ok" },
    { label: "Tuổi xe so với chu kỳ kiểm định TNDS", state: olderThanTen ? "warn" : "ok" },
  ];
}

export function InspectionPanel({
  vehicle,
  customerName,
  locale,
  onClose,
}: {
  vehicle: WorkshopVehicle;
  customerName: string;
  locale: "vi" | "en";
  onClose: () => void;
}) {
  const list = checks(vehicle, locale);
  const warnings = list.filter((c) => c.state === "warn").length;

  return (
    <div className="jrpg-window pointer-events-auto max-h-[70vh] w-full overflow-y-auto p-4 text-white">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="font-pixel text-sm">
            {locale === "en" ? "Inspection Pad" : "Khu kiểm tra"}
          </div>
          <div className="mt-1 font-display text-lg font-semibold">
            {vehicle.make} {vehicle.model}
          </div>
          <div className="text-xs text-white/70">
            {customerName} · {vehicle.plate} · {vehicle.year}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 font-pixel text-xs text-white/70 hover:bg-white/10 hover:text-white"
        >
          Esc
        </button>
      </div>

      <ul className="space-y-1.5">
        {list.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-sm">
            {c.state === "ok" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-tasco-lime-bright" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            )}
            <span className={c.state === "warn" ? "text-amber-100" : "text-white/85"}>
              {c.label}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs text-white/80">
        {locale === "en"
          ? warnings > 0
            ? `${warnings} item(s) flagged for follow-up. Safety-critical faults should be fixed before driving.`
            : "No issues flagged. Safety-critical faults should still be fixed before driving."
          : warnings > 0
            ? `Có ${warnings} hạng mục cần kiểm tra thêm. Lỗi liên quan an toàn nên sửa trước khi chạy.`
            : "Không phát hiện vấn đề. Lỗi liên quan an toàn vẫn nên sửa trước khi chạy."}
      </p>

      <p className="mt-2 flex items-start gap-1.5 text-[11px] text-white/55">
        <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
        {locale === "en"
          ? "Synthetic walk-around for demo purposes only — not a real safety inspection."
          : "Kiểm tra tổng quan dùng dữ liệu mô phỏng cho demo — không phải kiểm tra an toàn thực tế."}
      </p>

      <p className="mt-2 text-[11px] text-white/55">
        {locale === "en"
          ? `TNDS expires ${vehicle.expiresAt.slice(0, 10)} · Premium bracket: ${vehicle.vehicleType.replace(/_/g, " ")}`
          : `TNDS hết hạn ${vehicle.expiresAt.slice(0, 10)} · Nhóm phí: ${vehicle.vehicleType.replace(/_/g, " ")}`}
      </p>
    </div>
  );
}
