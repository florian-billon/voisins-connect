"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { hasStoredToken, subscribeToTokenChanges } from "../token-storage";

type GuardMode = "protected" | "guest";

export function useRouteGuard(mode: GuardMode) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const syncGuard = () => {
      if (hasRedirected.current) {
        console.log(`Guard ${mode}: already redirected, skipping`);
        return;
      }

      const authenticated = hasStoredToken();
      console.log(`Guard ${mode}: authenticated=${authenticated}, ready=${ready}`);

      // Si mode est protected et qu'il y a un token, ne pas rediriger (même si le token est invalide côté serveur)
      if (mode === "protected" && !authenticated) {
        console.log("Guard: redirecting to /login");
        hasRedirected.current = true;
        router.replace("/login");
        return;
      }

      if (mode === "guest" && authenticated) {
        console.log("Guard: redirecting to /");
        hasRedirected.current = true;
        router.replace("/");
        return;
      }

      console.log("Guard: setting ready=true");
      setReady(true);
    };

    syncGuard();

    const unsubscribe = subscribeToTokenChanges(() => {
      hasRedirected.current = false;
      syncGuard();
    });

    return unsubscribe;
  }, [mode, router, mounted]);

  return { ready };
}
