"use client";

import { isBrowser } from "./runtime";

const TOKEN_STORAGE_KEY = "hello-world.auth.token";

let memoryToken: string | null = null;
let hydrated = false;
const listeners = new Set<(token: string | null) => void>();

function emit(token: string | null) {
  for (const listener of listeners) {
    listener(token);
  }
}

function readTokenFromPersistence(): string | null {
  if (!isBrowser()) return null;

  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function hydrateFromPersistence() {
  if (hydrated) return;

  memoryToken = readTokenFromPersistence();
  hydrated = true;
}

export function getStoredToken(): string | null {
  hydrateFromPersistence();
  return memoryToken;
}

export function hasStoredToken(): boolean {
  return Boolean(getStoredToken());
}

export function setStoredToken(token: string) {
  const normalizedToken = token.trim();

  memoryToken = normalizedToken || null;
  hydrated = true;

  if (isBrowser()) {
    try {
      if (memoryToken) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, memoryToken);
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // Ignore persistence failures and keep in-memory token only.
    }
  }

  emit(memoryToken);
}

export function clearStoredToken() {
  memoryToken = null;
  hydrated = true;

  if (isBrowser()) {
    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
  }

  emit(null);
}

export function syncStoredTokenFromPersistence() {
  const persistedToken = readTokenFromPersistence();
  memoryToken = persistedToken;
  hydrated = true;
  emit(memoryToken);
}

export function reemitStoredToken() {
  hydrateFromPersistence();
  emit(memoryToken);
}

export function subscribeToTokenChanges(listener: (token: string | null) => void) {
  listeners.add(listener);

  if (isBrowser()) {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== TOKEN_STORAGE_KEY) return;
      syncStoredTokenFromPersistence();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", handleStorage);
    };
  }

  return () => {
    listeners.delete(listener);
  };
}
