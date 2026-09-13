"use client";

import { useCallback, useEffect, useState } from "react";
import { Friend, listFriends as apiListFriends, removeFriend as apiRemoveFriend } from "@/lib/api-client";
import { handleAuthError, isAuthError, getErrorMessage } from "@/lib/auth/utils";
import { hasStoredToken } from "@/lib/token-storage";
import { useTranslation } from "@/lib/i18n";

export function useFriends(userId: string | null = null) {
  const { t } = useTranslation();
  const [friends, setFriends] = useState<Friend[]>([]);

  const refreshFriends = useCallback(async () => {
    if (!hasStoredToken()) return;
    try {
      const data = await apiListFriends();
      setFriends(data);
    } catch (err) {
      const errorMessage = getErrorMessage(err, t("error.hooks.friends.load"));
      if (isAuthError(errorMessage)) {
        setFriends([]);
        handleAuthError();
      } else {
        setFriends([]);
        console.error("Erreur lors du chargement des amis:", err);
      }
    }
  }, [t]);

  const removeFriend = useCallback(async (friendId: string) => {
    try {
      await apiRemoveFriend(friendId);
      setFriends(friends.filter(f => f.id !== friendId));
    } catch (err) {
      const errorMessage = getErrorMessage(err, t("error.hooks.friends.remove"));
      console.error("Erreur lors de la suppression de l'ami:", err);
      throw err;
    }
  }, [friends, t]);

  useEffect(() => {
    refreshFriends();
  }, [refreshFriends, userId]);

  return {
    friends,
    refreshFriends,
    removeFriend,
  };
}
