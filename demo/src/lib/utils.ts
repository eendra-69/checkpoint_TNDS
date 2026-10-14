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