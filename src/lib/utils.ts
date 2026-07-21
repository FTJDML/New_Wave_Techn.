import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}

let idCounter = 0;
export function createId(prefix: string): string {
  idCounter += 1;
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now()}_${idCounter}_${rand}`;
}
