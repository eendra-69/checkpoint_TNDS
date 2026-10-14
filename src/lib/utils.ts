import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

const VN_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

/** YYYY-MM-DD in Vietnam time. `iso.slice(0, 10)` is UTC and shows the previous day before 07:00 ICT. */
export function formatDate(iso: string): string {
  return VN_DATE.format(new Date(iso));
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return "••••••";
  return `${phone.slice(0, 3)}••••${phone.slice(-3)}`;
}

export function maskId(id: string): string {
  if (id.length < 4) return "••••";
  return `••••••••${id.slice(-4)}`;
}

export function daysUntil(isoDate: string, from = new Date()): number {
  const target = new Date(isoDate);
  const ms = target.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}