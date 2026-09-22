"use client";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { Server, User, Friend } from "@/lib/api-client";
import { normalizeAvatarUrl } from "@/lib/avatar";
import { getStatusColor } from "@/lib/presence";
import SmartImg from "@/components/ui/SmartImg";
import { logout } from "@/lib/auth/client";

type Props = {
  servers: Server[];
  selectedServer: Server | null;
  friends: Friend[];
  user: User | null;
  onSelectServer: (server: Server | null) => void;
  onShowProfile: () => void;
  onNavigateDMs: () => void;
  onOpenFriendDM: (username: string) => void;
  onToggleSidebar?: () => void;
  reduced?: boolean;
};

export default function ServerSidebar({ servers, selectedServer, friends, user, onSelectServer, onShowProfile, onNavigateDMs, onOpenFriendDM, onToggleSidebar, reduced = false }: Props) {
  const { t } = useTranslation();

  return (
    <aside className={`flex ${reduced ? 'w-[48px] md:w-[36px] sm:w-[18px]' : 'w-[72px] md:w-[56px] sm:w-[28px]'} bg-[rgba(26,42,58,0.95)] border-r border-[#5b8cff]/20 flex-col items-center py-3 gap-2 transition-all duration-300 flex-shrink-0`}>
      <div 
        className="cursor-pointer"
        onClick={onToggleSidebar}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectServer(null);
          }}
          className="w-12 h-12 flex items-center justify-center mb-2 cursor-pointer group bg-transparent border-0 shadow-none p-0"
          title={t("common.appName")}
        >
          <Image src="/logo.png" alt={t("common.appName")} width={48} height={48} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <div className="w-8 h-[2px] bg-[#5b8cff]/20 rounded-full" />

      <div className="flex-1 w-full overflow-y-auto flex flex-col items-center gap-2 py-2">
        {friends.map((friend) => (
          <button
            key={`friend-${friend.id}`}
            type="button"
            onClick={() => onOpenFriendDM(friend.username)}
            className="w-12 h-12 rounded-[24px] bg-[rgba(123,198,123,0.2)] text-[#5b8cff] flex items-center justify-center hover:bg-[#5b8cff]/20 hover:rounded-xl transition-all relative group overflow-hidden"
            title={`${t("friends.openDm")} ${friend.username}`}
          >
            {friend.avatar_url ? (
              <SmartImg src={normalizeAvatarUrl(friend.avatar_url) || ""} alt={friend.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold">{friend.username.charAt(0).toUpperCase()}</span>
            )}
            <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border border-[rgba(5,10,15,0.95)] ${getStatusColor(friend.status)}`} />
          </button>
        ))}

        {friends.length > 0 && <div className="w-8 h-[2px] bg-[#5b8cff]/20 rounded-full my-1" />}

        {servers.map((server) => (
          <button
            key={server.id}
            type="button"
            onClick={() => onSelectServer(server)}
            className={`w-12 h-12 rounded-[24px] flex items-center justify-center text-lg font-bold transition-all duration-200 relative group ${
              selectedServer?.id === server.id
                ? "bg-[#5b8cff] text-white rounded-xl shadow-[0_0_12px_rgba(91,140,255,0.4)]"
                : "bg-[rgba(91,140,255,0.2)] text-[#5b8cff] hover:bg-[#5b8cff]/30 hover:rounded-xl"
            }`}
            title={server.name}
          >
            {server.name.charAt(0).toUpperCase()}
          </button>
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2 pb-2">
        <button
          type="button"
          onClick={onNavigateDMs}
          className="w-12 h-12 rounded-[24px] bg-[rgba(91,140,255,0.2)] text-[#5b8cff] flex items-center justify-center hover:bg-[#5b8cff]/15 hover:border hover:border-[#5b8cff]/30 transition-all group"
          title={t("dm.title")}
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onShowProfile}
          className="w-12 h-12 rounded-[24px] relative group border border-[#5b8cff]/30 hover:border-[#5b8cff] transition-all"
          title={t("profile.title")}
        >
          <div className="w-full h-full rounded-[24px] overflow-hidden">
            {user?.avatar_url ? (
              <SmartImg src={normalizeAvatarUrl(user.avatar_url) || ""} alt={t("profile.avatarLabel")} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#5b8cff]/10 flex items-center justify-center">
                <span className="text-[#5b8cff] font-bold">{user?.username?.charAt(0).toUpperCase() || "?"}</span>
              </div>
            )}
          </div>
          <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-[rgba(5,10,15,0.95)] rounded-full z-10 ${getStatusColor(user?.status)}`} />
        </button>

        <button
          type="button"
          onClick={async () => {
            await logout();
            window.location.href = "/login";
          }}
          className="w-12 h-12 rounded-[24px] bg-[rgba(255,107,107,0.2)] flex items-center justify-center text-[#ff6b6b] hover:bg-[#ff6b6b]/20 hover:rounded-xl transition-all"
          title={t("auth.logout")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
