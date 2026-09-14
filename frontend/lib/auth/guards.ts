"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { hasStoredToken, subscribeToTokenChanges } from "../token-storage";

type GuardMode = "protected" | "guest";

export function useRouteGuard(mode: GuardMode) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const isRedirecting = useRef(false);

  useEffect(() => {
    const syncGuard = () => {
      if (isRedirecting.current) return;

      const authenticated = hasStoredToken();

      if (mode === "protected" && !authenticated) {
        isRedirecting.current = true;
        router.replace("/login");
        return;
      }

      if (mode === "guest" && authenticated) {
        isRedirecting.current = true;
        router.replace("/");
        return;
      }

      setReady(true);
    };

    syncGuard();
    return subscribeToTokenChanges(() => {
      isRedirecting.current = false;
      syncGuard();
    });
  }, [mode, router]);

  return { ready };
}
