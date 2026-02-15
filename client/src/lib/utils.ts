import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type UserLike = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

export function getUserInitials(user?: UserLike | null, fallback = "U") {
  const parts: string[] = [];

  const first = (user?.firstName || "").trim();
  const last = (user?.lastName || "").trim();

  if (first) parts.push(...first.split(/\s+/).filter(Boolean));
  if (last) parts.push(...last.split(/\s+/).filter(Boolean));

  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }

  if (parts.length === 1) {
    const word = parts[0];
    const a = word[0] || "";
    const b = word[1] || "";
    return `${a}${b}`.toUpperCase() || fallback;
  }

  const email = (user?.email || "").trim();
  if (email) return (email[0] || fallback).toUpperCase();

  return fallback;
}
