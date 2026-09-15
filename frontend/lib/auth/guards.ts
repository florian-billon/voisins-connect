"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasStoredToken, subscribeToTokenChanges } from "../token-storage";

type GuardMode = "protected" | "guest";

export function useRouteGuard(mode: GuardMode) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const syncGuard = () => {
      const authenticated = hasStoredToken();
      console.log(`Guard ${mode}: authenticated=${authenticated}, ready=${ready}`);

      if (mode === "protected" && !authenticated) {
        console.log("Guard: redirecting to /login");
        router.replace("/login");
        return;
      }

      if (mode === "guest" && authenticated) {
        console.log("Guard: redirecting to /");
        router.replace("/");
        return;
      }

      console.log("Guard: setting ready=true");
      setReady(true);
    };

    syncGuard();

    const unsubscribe = subscribeToTokenChanges(() => {
      syncGuard();
    });

    return unsubscribe;
  }, [mode, router, mounted]);

  return { ready };
}
