"use client";

import { API_URL } from "../config";
import { clearStoredToken, getStoredToken, setStoredToken } from "../token-storage";

async function safeJson<T>(res: Response): Promise<T | null> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function login(email: string, password: string) {
  console.log("🟡 login() function called with:", email);
  let res: Response;
  try {
    console.log("🟡 Login API call to:", `${API_URL}/auth/login`);
    console.log("🟡 Request body:", JSON.stringify({ email, password }));
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
    console.log("🟡 Login response status:", res.status);
  } catch (err) {
    console.error("🟡 Login fetch error:", err);
    return { error: "Erreur de connexion. Vérifiez que le backend est joignable." };
  }

  console.log("🟡 Before safeJson");
  const data = await safeJson<{ error?: string; token?: string; user?: unknown }>(res);
  console.log("🟡 Login response data:", data);
  if (!res.ok) {
    return { error: data?.error || "Identifiants invalides" };
  }
  if (!data?.token) {
    return { error: "Erreur de connexion. Le serveur API n'a pas renvoyé de token." };
  }

  setStoredToken(data.token);
  console.log("🟡 Token stored successfully");
  return { error: null };
}

export async function signup(username: string, apartment_number: string, email: string, password: string) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, apartment_number, email, password }),
      cache: "no-store",
    });
  } catch {
    return { error: "Erreur de connexion. Vérifiez que le backend est joignable." };
  }

  const data = await safeJson<{ error?: string; token?: string; user?: unknown }>(res);
  if (!res.ok) {
    return { error: data?.error || "Échec de l'inscription" };
  }
  if (!data?.token) {
    return { error: "Erreur de connexion. Le serveur API n'a pas renvoyé de token." };
  }

  setStoredToken(data.token);
  return { error: null };
}

export async function logout() {
  const token = getStoredToken();

  if (token) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }).catch(() => {});
  }

  clearStoredToken();
}

export async function clearToken() {
  clearStoredToken();
}

export async function getTokenForWs(): Promise<string | null> {
  return getStoredToken();
}
