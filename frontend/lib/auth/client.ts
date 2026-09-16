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
  try {
    console.log("🟡 Login API call to:", `${API_URL}/auth/login`);
    console.log("🟡 Request body:", JSON.stringify({ email, password }));
    console.log("🟡 Using XMLHttpRequest instead of fetch to debug...");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/auth/login`, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    return new Promise<{ error: string | null }>((resolve) => {
      xhr.onload = function() {
        console.log("🟡 XHR completed, status:", xhr.status);
        console.log("🟡 XHR response:", xhr.responseText);

        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.token) {
              setStoredToken(data.token);
              console.log("🟡 Token stored successfully");
              resolve({ error: null });
            } else {
              resolve({ error: "Erreur de connexion. Le serveur API n'a pas renvoyé de token." });
            }
          } catch (e) {
            console.error("🟡 JSON parse error:", e);
            resolve({ error: "Erreur de connexion. Réponse invalide." });
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({ error: data?.error || "Identifiants invalides" });
          } catch {
            resolve({ error: "Identifiants invalides" });
          }
        }
      };

      xhr.onerror = function() {
        console.error("🟡 XHR error:", xhr);
        resolve({ error: "Erreur de connexion. Vérifiez que le backend est joignable." });
      };

      xhr.ontimeout = function() {
        console.error("🟡 XHR timeout");
        resolve({ error: "Erreur de connexion. Timeout." });
      };

      xhr.timeout = 10000; // 10 secondes timeout
      xhr.send(JSON.stringify({ email, password }));
    });
  } catch (err) {
    console.error("🟡 Login error:", err);
    return { error: "Erreur de connexion. Vérifiez que le backend est joignable." };
  }
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
