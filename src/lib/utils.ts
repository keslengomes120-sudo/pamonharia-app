import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatQty(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(
    typeof date === "string" ? new Date(date) : date
  );
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(typeof date === "string" ? new Date(date) : date);
}

export function calcCmvPct(cost: number, revenue: number): number {
  if (!revenue) return 0;
  return (cost / revenue) * 100;
}

export function cmvStatus(pct: number, target: number) {
  if (pct <= target * 0.9) return "great";
  if (pct <= target) return "ok";
  if (pct <= target * 1.1) return "warning";
  return "danger";
}

export function cmvColor(pct: number, target: number): string {
  const s = cmvStatus(pct, target);
  return {
    great: "text-emerald-600",
    ok: "text-green-600",
    warning: "text-amber-500",
    danger: "text-red-600",
  }[s];
}

export function startOfDay(d?: Date): Date {
  const date = d ? new Date(d) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function startOfMonth(d?: Date): Date {
  const date = d ? new Date(d) : new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}
