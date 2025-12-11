import type { User } from "@shared/schema";

const AUTH_STORAGE_KEY = "cara_auth_user";

export function saveAuthUser(user: User | null): void {
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function getStoredAuthUser(): User | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  return null;
}

export function clearStoredAuthUser(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
