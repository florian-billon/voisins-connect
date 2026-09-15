"use client";

import { clearToken } from "./client";

/**
 * Redirige vers la page de login en supprimant le token
 */
export async function handleAuthError() {
  await clearToken();
  // Ne pas rediriger automatiquement - laisser le guard gérer la redirection
  // pour éviter les conflits entre useAuth et useRouteGuard
}

/**
 * Vérifie si un message d'erreur correspond à une erreur d'authentification
 */
export function isAuthError(errorMessage: string): boolean {
  return (
    errorMessage.includes("error.authRequired") ||
    errorMessage.includes("Authentication") ||
    errorMessage.includes("Invalid token") ||
    errorMessage.includes("Missing authorization")
  );
}

/**
 * Extrait le message d'erreur d'une exception
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
