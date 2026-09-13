"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import SmartImg from "@/components/ui/SmartImg";
import { addFriend, removeFriend, getPublicUserProfile, PublicUserProfile } from "@/lib/api-client";
import { normalizeAvatarUrl } from "@/lib/avatar";
import { getStatusColor, getStatusKey } from "@/lib/presence";
import { useTranslation } from "@/lib/i18n";

interface PublicProfileCardProps {
  userId: string;
  onClose: () => void;
  onFriendAdded?: () => Promise<void> | void;
  onFriendRemoved?: () => Promise<void> | void;
}

export default function PublicProfileCard({
  userId,
  onClose,
  onFriendAdded,
  onFriendRemoved,
}: PublicProfileCardProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState(false);
  const [removingFriend, setRemovingFriend] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicUserProfile(userId);
        if (!cancelled) {
          setProfile(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("error.default"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [t, userId]);

  const handleAddFriend = async () => {
    if (!profile || profile.is_self || profile.is_friend) {
      return;
    }

    try {
      setAddingFriend(true);
      setError(null);
      await addFriend(profile.id);
      setProfile({ ...profile, is_friend: true });
      await onFriendAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.default"));
    } finally {
      setAddingFriend(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!profile || profile.is_self || !profile.is_friend) {
      return;
    }

    try {
      setRemovingFriend(true);
      setError(null);
      await removeFriend(profile.id);
      setProfile({ ...profile, is_friend: false });
      await onFriendRemoved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.default"));
    } finally {
      setRemovingFriend(false);
    }
  };

  const openDm = () => {
    if (!profile || profile.is_self) {
      return;
    }

    router.push(`/messages?username=${encodeURIComponent(profile.username)}`);
    onClose();
  };

  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-[420px] bg-[rgba(5,10,15,0.98)] border border-[#4fdfff]/30 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        <div className="relative bg-gradient-to-br from-[#4fdfff]/10 to-[#ff3333]/5 p-6 pb-16">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            aria-label={t("common.close")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex justify-center">
            <div className="relative">
              {profile ? (
                <>
                  <div className="w-24 h-24 rounded-full bg-[rgba(5,10,15,0.98)] p-1 border-2 border-[#4fdfff]/50">
                    <SmartImg
                      src={normalizeAvatarUrl(profile.avatar_url) || ""}
                      alt={profile.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-[3px] border-[rgba(5,10,15,0.98)] ${getStatusColor(profile.status)}`} />
                </>
              ) : (
                <div className="w-24 h-24 rounded-full bg-[rgba(5,10,15,0.98)] p-1 border-2 border-[#4fdfff]/50" />
              )}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 -mt-8">
          <div className="bg-[rgba(0,0,0,0.4)] rounded-lg p-4 mb-4 border border-[#4fdfff]/20 text-center">
            {loading ? (
              <p className="text-white/50 text-sm">{t("common.loading")}</p>
            ) : profile ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-1">{profile.username}</h2>
                <p className="text-sm text-white/50">{t(getStatusKey(profile.status))}</p>
              </>
            ) : (
              <p className="text-red-400 text-sm">{error || t("error.default")}</p>
            )}
          </div>

          {profile && (
            <div className="bg-[rgba(0,0,0,0.4)] rounded-lg p-4 mb-4 border border-[#4fdfff]/20 space-y-4">
              <div>
                <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
                  {t("profile.statusLabel")}
                </h4>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(profile.status)}`} />
                  <span className="text-sm text-white">{t(getStatusKey(profile.status))}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
                  {t("friends.memberSince")}
                </h4>
                <p className="text-sm text-white">{memberSince}</p>
              </div>
            </div>
          )}

          {error && profile && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 mb-4">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {profile && (
            <div className="flex gap-2">
              <Button variant="outline" size="md" onClick={onClose} className="flex-1">
                {t("common.close")}
              </Button>
              {!profile.is_self && (
                <>
                  {profile.is_friend ? (
                    <>
                      <Button
                        variant="outline"
                        size="md"
                        onClick={handleRemoveFriend}
                        isLoading={removingFriend}
                        className="flex-1"
                      >
                        {t("friends.remove")}
                      </Button>
                      <Button variant="primary" size="md" onClick={openDm} className="flex-1">
                        {t("friends.openDm")}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleAddFriend}
                      isLoading={addingFriend}
                      className="flex-1"
                    >
                      {t("friends.add")}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
