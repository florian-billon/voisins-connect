"use client";
import { useTranslation } from "@/lib/i18n";
import { Server, Channel, ServerMember, User } from "@/lib/api-client";
import { getAvatar } from "@/lib/avatar";
import { getStatusColor } from "@/lib/presence";
import SmartImg from "@/components/ui/SmartImg";

type Props = {
  selectedServer: Server;
  selectedChannel: Channel | null;
  members: ServerMember[];
  user: User | null;
  currentUser?: User | null;
  typingUsers: Map<string, string>;
  viewerId: string | undefined;
  isServerAdmin: boolean;
  onInvite: () => void;
  onKick: (userId: string) => void;
  onBan: (userId: string) => void;
  onMute: (userId: string) => void;
  onOpenProfile: (userId: string) => void;
  onToggleSidebar?: () => void;
  reduced?: boolean;
};

export default function MemberSidebar({
  selectedServer, selectedChannel, members, user, currentUser, typingUsers, viewerId, isServerAdmin,
  onInvite, onKick, onBan, onMute, onOpenProfile,
  onToggleSidebar,
  reduced = false,
}: Props) {
  const { t } = useTranslation();
  const userForAvatar = currentUser || user;
  const myRole = members.find((m) => m.user_id === user?.id)?.role;
  const canKick = myRole === "Owner" || myRole === "Admin";

  const TypingDots = () => (
    <div className="flex gap-0.5 flex-shrink-0" title={t("chat.isTyping")}>
      <span className="w-1 h-1 bg-[#5b8cff] rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-1 h-1 bg-[#5b8cff] rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-1 h-1 bg-[#5b8cff] rounded-full animate-bounce [animation-delay:300ms]" />
    </div>
  );

  return (
    <aside className={`hidden lg:flex ${reduced ? 'w-[160px]' : 'w-60'} bg-[rgba(30,50,70,0.95)] border-l border-[#5b8cff]/20 flex flex-col transition-all duration-300 flex-shrink-0`}>
      <div 
        className="h-12 px-4 flex items-center justify-between border-b border-[#5b8cff]/20 bg-[rgba(0,0,0,0.3)] cursor-pointer"
        onClick={onToggleSidebar}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider">
            {t("members.title", { count: members.length })}
          </h3>
        </div>
        <button type="button" onClick={onInvite} className="text-[#5b8cff] hover:text-white text-lg font-bold" title={t("members.inviteTooltip")}>
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {members.length === 0 ? (
          <p className="text-sm text-white/40 italic px-2">{t("members.noMembers")}</p>
        ) : reduced ? (
          // Version réduite : liste compacte verticale des membres
          <div className="space-y-1">
            {members.map((member) => {
              const isTyping = selectedChannel?.id && typingUsers.has(member.user_id);
              return (
                <button
                  key={member.user_id}
                  onClick={() => onOpenProfile(member.user_id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${
                    member.role === "Owner"
                      ? "text-[#ff6b6b]"
                      : "text-white/70"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <SmartImg src={getAvatar(member.user_id, userForAvatar)} alt={member.username} className="w-6 h-6 rounded-full object-cover border border-[#5b8cff]/30" />
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 border-2 border-[rgba(5,10,15,0.95)] rounded-full ${getStatusColor(member.status)}`} />
                  </div>
                  <p className="text-xs font-medium truncate">{member.username}</p>
                  {isTyping && <TypingDots />}
                </button>
              );
            })}
          </div>
        ) : (
          // Version complète : avec sections et boutons d'action
          <>
            {members.filter((m) => m.role === "Owner").length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-[#ff6b6b] font-bold mb-2 px-2 tracking-wider uppercase">{t("members.owner")}</p>
                {members.filter((m) => m.role === "Owner").map((member) => {
                  const isTyping = selectedChannel?.id && typingUsers.has(member.user_id);
                  return (
                    <div
                      key={member.user_id}
                      onClick={() => onOpenProfile(member.user_id)}
                      className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="relative">
                        <SmartImg src={getAvatar(member.user_id, userForAvatar)} alt={t("members.owner")} className="w-8 h-8 rounded-full object-cover border border-[#ff6b6b]/50" />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[rgba(5,10,15,0.95)] rounded-full ${getStatusColor(member.status)}`} />
                      </div>
                      <span className="text-sm text-white/90 truncate flex-1">{member.username}</span>
                      {isTyping && <TypingDots />}
                    </div>
                  );
                })}
              </div>
            )}

            {members.filter((m) => m.role !== "Owner").length > 0 && (
              <div>
                <p className="text-[10px] text-white/50 font-bold mb-2 px-2 tracking-wider uppercase">{t("members.members")}</p>
                {members.filter((m) => m.role !== "Owner").map((member) => {
                  const isMe = member.user_id === user?.id;
                  const kickable = canKick && !isMe && !(myRole === "Admin" && member.role === "Admin");
                  const isTyping = selectedChannel?.id && typingUsers.has(member.user_id);
                  return (
                    <div
                      key={member.user_id}
                      onClick={() => onOpenProfile(member.user_id)}
                      className="group flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="relative flex-shrink-0">
                        <SmartImg src={getAvatar(member.user_id, userForAvatar)} alt={t("members.members")} className="w-8 h-8 rounded-full object-cover border border-[#5b8cff]/30" />
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[rgba(5,10,15,0.95)] rounded-full ${getStatusColor(member.status)}`} />
                      </div>
                      <span className="text-sm text-white/70 truncate flex-1">{member.username}</span>
                      {isTyping && <TypingDots />}
                      {kickable && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onMute(member.user_id); }}
                            className="text-white/30 hover:text-[#ff9f5b] transition-colors"
                            title={t("members.mute", { username: member.username })}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onKick(member.user_id); }}
                            className="text-white/30 hover:text-[#ff6b6b] transition-colors"
                            title={t("members.kick", { username: member.username })}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6m3-3l3 3-3 3" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onBan(member.user_id); }}
                            className="text-white/30 hover:text-[#ff6b6b] transition-colors"
                            title={t("members.ban", { username: member.username })}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M6.343 6.343l11.314 11.314" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
