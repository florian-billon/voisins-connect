"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { banMember as apiBanMember, listMembers, kickMember as apiKickMember, muteMember as apiMuteMember, ServerMember } from "@/lib/api-client";
import { handleAuthError, isAuthError, getErrorMessage } from "@/lib/auth/utils";
import { useWebSocket } from "./useWebSocket";
import { ServerEvent } from "@/lib/gateway";
import { useTranslation } from "@/lib/i18n";

export function useMembers(serverId: string | null) {
  const { t } = useTranslation();
  const [members, setMembers] = useState<ServerMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // État pour stocker les statuts des utilisateurs (user_id -> status)
  const [userStatuses, setUserStatuses] = useState<Map<string, string>>(new Map());
  const { onEvent } = useWebSocket();

  const toUiError = useCallback((err: unknown, fallbackKey: string): string => {
    const message = getErrorMessage(err, t(fallbackKey));
    if (message.startsWith("error.")) {
      return t(message);
    }
    return message;
  }, [t]);

  const loadMembers = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await listMembers(id);
      setMembers(data);
    } catch (err) {
      const errorMessage = toUiError(err, "error.hooks.members.load");
      if (isAuthError(errorMessage)) {
        handleAuthError();
        return;
      }
      setError(errorMessage);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [toUiError]);

  useEffect(() => {
    if (serverId) {
      loadMembers(serverId);
    } else {
      setMembers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  // Écouter les événements PRESENCE_UPDATE pour mettre à jour les statuts en temps réel
  useEffect(() => {
    const unsubscribe = onEvent((event: ServerEvent) => {
      if (event.op === "PRESENCE_UPDATE") {
        const { user_id, status } = event.d;
        setUserStatuses((prev) => {
          const next = new Map(prev);
          next.set(user_id, status);
          return next;
        });
      }
    });

    return unsubscribe;
  }, [onEvent]);

  const kickMember = useCallback(async (userId: string): Promise<boolean> => {
    if (!serverId) return false;
    // Optimistic UI : on retire le membre immédiatement
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    try {
      await apiKickMember(serverId, userId);
      return true;
    } catch (err) {
      // Rollback en cas d'erreur
      loadMembers(serverId);
      const errorMessage = toUiError(err, "error.hooks.members.kick");
      if (isAuthError(errorMessage)) handleAuthError();
      return false;
    }
  }, [serverId, loadMembers, toUiError]);

  const banMember = useCallback(async (userId: string): Promise<boolean> => {
    if (!serverId) return false;
    // Optimistic UI : on retire le membre immédiatement (ban implique kick)
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    try {
      await apiBanMember(serverId, userId, {});
      return true;
    } catch (err) {
      loadMembers(serverId);
      const errorMessage = toUiError(err, "error.hooks.members.ban");
      if (isAuthError(errorMessage)) handleAuthError();
      return false;
    }
  }, [serverId, loadMembers, toUiError]);

  const muteMember = useCallback(async (userId: string): Promise<boolean> => {
    if (!serverId) return false;
    try {
      await apiMuteMember(serverId, userId);
      return true;
    } catch (err) {
      const errorMessage = toUiError(err, "error.hooks.members.mute");
      if (isAuthError(errorMessage)) handleAuthError();
      return false;
    }
  }, [serverId, toUiError]);

  const refresh = useCallback(() => {
    if (serverId) {
      loadMembers(serverId);
    }
  }, [serverId, loadMembers]);

  // Fonction helper pour obtenir le statut d'un utilisateur
  const getUserStatus = useCallback((userId: string): string => {
    return userStatuses.get(userId) || "offline";
  }, [userStatuses]);

  const membersWithLiveStatus = useMemo(() => {
    return members.map((member) => ({
      ...member,
      status: userStatuses.get(member.user_id) || member.status,
    }));
  }, [members, userStatuses]);

  return {
    members: membersWithLiveStatus,
    loading,
    error,
    refresh,
    getUserStatus,
    kickMember,
    banMember,
    muteMember,
  };
}
