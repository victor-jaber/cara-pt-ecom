import type { Request } from "express";

export type AppLanguage = "pt" | "en" | "es" | "fr";

const supported: AppLanguage[] = ["pt", "en", "es", "fr"];

export function getRequestLanguage(req: Request): AppLanguage {
  const header = (req.header("x-app-language") || "").trim().toLowerCase();
  if (isSupported(header)) return header;

  const accept = (req.header("accept-language") || "").toLowerCase();
  const parsed = parseAcceptLanguage(accept);
  if (parsed) return parsed;

  return "pt";
}

function isSupported(value: string): value is AppLanguage {
  return (supported as string[]).includes(value);
}

function parseAcceptLanguage(value: string): AppLanguage | null {
  // Example: "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7"
  const tokens = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const base = token.split("-")[0];
    if (base && isSupported(base)) return base;
  }

  return null;
}
