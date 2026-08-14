import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function id(prefix = ""): string {
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return prefix ? `${prefix}_${rand}` : rand;
}

export function inviteCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "PAW";
  for (let i = 0; i < 5; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function hoursFromNow(h: number): Date {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

export const POINTS_CAP = 10;
export const DETAIL_BONUS = 2;

/** Cap for action ratings / base scores. Attention to Detail is added after this. */
export function clampBasePoints(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(-POINTS_CAP, Math.min(POINTS_CAP, Math.round(n)));
}

/** Cap for a logged total. Detail bonus may push a positive score to +12. */
export function clampLoggedPoints(
  n: number,
  opts?: { detail?: boolean; kind?: string },
): number {
  const detail = Boolean(opts?.detail) && opts?.kind !== "negative";
  const max = POINTS_CAP + (detail ? DETAIL_BONUS : 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-POINTS_CAP, Math.min(max, Math.round(n)));
}

export function formatPoints(n: number): string {
  if (n > 0) return `+${n}`;
  return String(n);
}

export function downloadText(filename: string, content: string, mime = "text/csv") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
