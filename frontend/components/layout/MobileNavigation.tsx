"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Server, Friend, User } from "@/lib/api-client";
import { normalizeAvatarUrl } from "@/lib/avatar";
import { getStatusColor } from "@/lib/presence";
import SmartImg from "@/components/ui/SmartImg";
import { logout } from "@/lib/auth/client";

type Props = {
  servers: Server[];
  friends: Friend[];
  user: User | null;
  selectedServer: Server | null;
  onSelectServer: (server: Server | null) => void;
  onShowProfile: () => void;
  onNavigateDMs: () => void;
  onOpenFriendDM: (username: string) => void;
  onClose: () => void;
  isOpen: boolean;
};

export default function MobileNavigation({
  servers,
  friends,
  user,
  selectedServer,
  onSelectServer,
  onShowProfile,
  onNavigateDMs,
  onOpenFriendDM,
  onClose,
  isOpen,
}: Props) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-80 bg-[rgba(30,50,70,0.98)] border-r border-[#5b8cff]/20 flex flex-col">
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#5b8cff]/30 bg-[rgba(0,0,0,0.3)]">
          <h2 className="font-bold text-white uppercase tracking-widest text-sm">{t("common.appName")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h3 className="text-xs font-bold text-[#5b8cff] uppercase tracking-wider mb-3">{t("friends.title")}</h3>
            <div className="space-y-2">
              {friends.map((friend) => (
                <button
                  key={`friend-${friend.id}`}
                  type="button"
                  onClick={() => {
                    onOpenFriendDM(friend.username);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="relative">
                    {friend.avatar_url ? (
                      <SmartImg src={normalizeAvatarUrl(friend.avatar_url) || ""} alt={friend.username} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#5b8cff]/20 flex items-center justify-center">
                        <span className="text-[#5b8cff] font-bold">{friend.username.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-[rgba(5,10,15,0.95)] ${getStatusColor(friend.status)}`} />
                  </div>
                  <span className="text-white/90">{friend.username}</span>
                </button>
              ))}
              {friends.length === 0 && (
                <p className="text-white/40 text-sm italic">{t("friends.noFriends")}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-[#5b8cff] uppercase tracking-wider mb-3">{t("server.title")}</h3>
            <div className="space-y-2">
              {servers.map((server) => (
                <button
                  key={server.id}
                  type="button"
                  onClick={() => {
                    onSelectServer(server);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    selectedServer?.id === server.id
                      ? "bg-[#5b8cff]/15 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#5b8cff]/20 flex items-center justify-center">
                    <span className="text-[#5b8cff] font-bold">{server.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-white/90">{server.name}</span>
                </button>
              ))}
              {servers.length === 0 && (
                <p className="text-white/40 text-sm italic">{t("server.noServers")}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[#5b8cff]/20 bg-[rgba(0,0,0,0.3)]">
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                onNavigateDMs();
                onClose();
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-white/80"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>{t("dm.title")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onShowProfile();
                onClose();
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-white/80"
            >
              <div className="relative">
                {user?.avatar_url ? (
                  <SmartImg src={normalizeAvatarUrl(user.avatar_url) || ""} alt={t("profile.avatarLabel")} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#5b8cff]/10 flex items-center justify-center">
                    <span className="text-[#5b8cff] font-bold">{user?.username?.charAt(0).toUpperCase() || "?"}</span>
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-[rgba(5,10,15,0.95)] rounded-full ${getStatusColor(user?.status)}`} />
              </div>
              <span>{t("profile.title")}</span>
            </button>

            <button
              type="button"
              onClick={() => logout()}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[#ff3333]/10 transition-colors text-[#ff3333]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{t("auth.logout")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}