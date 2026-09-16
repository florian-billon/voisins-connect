"use client";

import { useState, useEffect } from "react";
import { getMe, User } from "@/lib/api-client";
import { handleAuthError, isAuthError, getErrorMessage } from "@/lib/auth/utils";
import { hasStoredToken, subscribeToTokenChanges } from "@/lib/token-storage";
import { useTranslation } from "@/lib/i18n";

export function useAuth() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!hasStoredToken()) {
        if (!cancelled) {
          setUser(null);
          setError(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const userData = await getMe();
        if (!cancelled) {
          setUser(userData);
          setError(null);
        }
      } catch (err) {
        console.error("Erreur auth:", err);
        const errorMessage = getErrorMessage(err, t("error.hooks.authInvalidSession"));
        if (!cancelled) {
          setUser(null);
          setError(errorMessage);
        }
        if (isAuthError(errorMessage)) {
          await handleAuthError();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    const unsubscribe = subscribeToTokenChanges(() => {
      void loadUser();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [t]);

  return { user, loading, error };
}
