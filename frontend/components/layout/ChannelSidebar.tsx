"use client";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Server, Channel, ServerMember, User } from "@/lib/api-client";
import VoiceChannelList from "@/components/voice/VoiceChannelList";
import { useVoice } from "@/contexts/VoiceContext";

type Props = {
  selectedServer: Server | null;
  channels: Channel[];
  visibleChannels: Channel[];
  selectedChannel: Channel | null;
  channelSearch: string;
  channelsLoading: boolean;
  channelsError: string | null;
  canManageChannels: boolean;
  isServerOwner: boolean;
  transferCandidates: ServerMember[];
  user: User | null;
  onSelectChannel: (channel: Channel) => void;
  onChannelSearch: (serverId: string, value: string) => void;
  onCreateChannel: () => void;
  onCreateServer: () => void;
  onDeleteChannel: (id: string, name: string) => void;
  onEditChannel: (channel: Channel) => void;
  onEditServer: () => void;
  onDeleteServer: () => void;
  onShowLeave: () => void;
  onToggleSidebar?: () => void;
  reduced?: boolean;
};

export default function ChannelSidebar({
  selectedServer, channels, visibleChannels, selectedChannel, channelSearch,
  channelsLoading, channelsError, canManageChannels, isServerOwner, user, onSelectChannel,
  onChannelSearch, onCreateChannel, onCreateServer, onDeleteChannel, onEditChannel, onEditServer, onDeleteServer, onShowLeave,
  onToggleSidebar,
  reduced = false,
}: Props) {
  const { t } = useTranslation();
  const { currentUserVoiceChannel, setCurrentUserVoiceChannel } = useVoice();

  const handleJoinVoiceChannel = (channel: any) => {
    setCurrentUserVoiceChannel(channel);
    // Logic to join voice channel would go here
  };

  const handleLeaveVoiceChannel = () => {
    setCurrentUserVoiceChannel(null);
    // Logic to leave voice channel would go here
  };

  return (
    <aside className={`flex ${reduced ? 'w-0 opacity-0 overflow-hidden border-0' : 'w-80 md:w-56 sm:w-28 opacity-100'} bg-[rgba(30,50,70,0.95)] border-r border-[#5b8cff]/20 flex flex-col min-h-0 transition-all duration-300 flex-shrink-0 h-full`}>
      {selectedServer ? (
        <>
          <div 
            className="h-12 px-4 flex items-center justify-between border-b border-[#5b8cff]/30 shadow-lg bg-[rgba(26,42,58,0.3)] cursor-pointer"
            onClick={onToggleSidebar}
          >
            <div className="flex items-center gap-2 flex-1">
              <h2 className="font-bold text-white truncate uppercase tracking-widest text-[11px]">{selectedServer.name}</h2>
            </div>
            <div className="flex items-center gap-1">
              {isServerOwner ? (
                <>
                  <button
                    type="button"
                    onClick={onEditServer}
                    className="p-1.5 text-white/40 hover:text-[#5b8cff] transition-colors"
                    title={t("server.edit")}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={onDeleteServer}
                    className="p-1.5 text-white/40 hover:text-[#ff6b6b] transition-colors"
                    title={t("server.delete")}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onShowLeave}
                  className="p-1.5 text-white/40 hover:text-[#ff6b6b] transition-colors"
                  title={t("server.leave")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
              <div className="w-[1px] h-4 bg-[#5b8cff]/20 mx-1" />
              <button
                type="button"
                onClick={onCreateChannel}
                className="text-[#5b8cff] hover:text-white transition-colors text-xl font-bold leading-none"
                title={t("channel.createTooltip")}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 min-h-0">
            {reduced ? (
              // Version réduite : liste compacte verticale des channels
              <div className="space-y-1">
                {visibleChannels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => onSelectChannel(channel)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${
                      selectedChannel?.id === channel.id
                        ? "bg-[#5b8cff]/20 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-[2px] bg-[#5b8cff] flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2" />
                      </svg>
                    </div>
                    <p className="text-xs font-medium truncate">{channel.name}</p>
                  </button>
                ))}
              </div>
            ) : (
              // Version complète : avec recherche et boutons d'édition
              <>
                <div className="px-2 mb-3">
                  <input
                    type="text"
                    value={channelSearch}
                    onChange={(e) => onChannelSearch(selectedServer?.id || "", e.target.value)}
                    placeholder={t("channel.searchPlaceholder")}
                    className="w-full bg-black/40 border border-[#5b8cff]/20 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#5b8cff]/50"
                  />
                </div>

                {channelsLoading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-[#5b8cff] border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : channelsError ? (
                  <div className="text-center py-4">
                    <p className="text-[#ff6b6b] text-sm">{channelsError}</p>
                  </div>
                ) : visibleChannels.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-[#5b8cff]/10 border-2 border-[#5b8cff]/30 flex items-center justify-center mb-4 overflow-hidden">
                      <svg className="w-8 h-8 text-[#5b8cff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.003 9.003 0 00-9-8c0-1.255.226-2.457.636-3.457l2.464 1.464c.277.166.58.346.89.346 1.555 0 2.503-.345 3.437-.87 1.823-1.024 3.331-1.024 1.47 0 2.842.43 3.925 1.024.405.435.23.776.236 1.292.236 1.176 0 2.212-.336 3.028-.999 1.511-.543 2.401-1.662 2.401-2.828 0-1.896-.672-3.549-1.902-4.457-1.53L13.9 6.416c-.495-.426-.925-.986-.925-1.646 0-.663.43-1.22.925-1.925 1.646 0 1.22.43 1.925.925L16.6 19.1c1.193.31 2.232.767 2.232 1.92 0 1.263-.63 2.232-1.91 2.232-3.54 0-1.655-.467-3.19-1.511-4.457-1.53L13.9 6.416c-.495-.426-.925-.986-.925-1.646 0-.663.43-1.22.925-1.925 1.646 0 1.22.43 1.925.925z" />
                      </svg>
                    </div>
                    <p className="text-white/40 text-sm mb-4">{t("channel.noResults")}</p>
                    {canManageChannels && (
                      <button
                        onClick={onCreateChannel}
                        className="bg-[#5b8cff] text-black hover:bg-[#5b8cff]/90 px-4 py-2 rounded text-sm font-medium transition-colors"
                      >
                        {t("channel.createTitle")}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-[2px]">
                    {visibleChannels.map((channel) => (
                      <div
                        key={channel.id}
                        className={`group flex items-center gap-3 px-2 py-2 rounded transition-colors ${
                          selectedChannel?.id === channel.id
                            ? "bg-[#5b8cff]/15 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <button
                          onClick={() => onSelectChannel(channel)}
                          className="flex-1 flex items-center gap-3 text-left"
                        >
                          <div className="w-6 h-6 rounded-[2px] bg-[#5b8cff] flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{channel.name}</p>
                          </div>
                        </button>

                        {canManageChannels && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onEditChannel(channel); }}
                              className="text-white/20 hover:text-[#5b8cff] transition-colors"
                              title={t("channel.editTooltip")}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828L8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); onDeleteChannel(channel.id, channel.name); }}
                              className="text-white/20 hover:text-[#ff6b6b] transition-colors"
                              title={t("channel.deleteTooltip")}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Voice Channels Section */}
          <div className="flex-shrink-0">
            <VoiceChannelList
              selectedServer={selectedServer}
              user={user}
              onJoinVoiceChannel={handleJoinVoiceChannel}
              onLeaveVoiceChannel={handleLeaveVoiceChannel}
              currentUserVoiceChannel={currentUserVoiceChannel}
            />
          </div>
        </>
      ) : (
        <>
          <div className="h-12 px-4 flex items-center justify-between border-b border-[#5b8cff]/30 shadow-lg bg-[rgba(26,42,58,0.3)]">
            <h2 className="font-bold text-white truncate flex-1 uppercase tracking-widest text-[10px]">channels</h2>
            <button
              onClick={onCreateServer}
              className="text-[#5b8cff] hover:text-white transition-colors text-xl font-bold"
              title={t("server.createTooltip")}
            >
              +
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 min-h-0">
            <div className="px-2 mb-3">
              <input
                type="text"
                value=""
                placeholder={t("channel.searchPlaceholder")}
                disabled
                readOnly
                className="w-full bg-black/40 border border-[#5b8cff]/20 rounded px-2 py-1.5 text-xs text-white outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            {/* Voice Channels Section */}
            <div className="flex-shrink-0">
              <VoiceChannelList
                selectedServer={selectedServer}
                user={user}
                onJoinVoiceChannel={handleJoinVoiceChannel}
                onLeaveVoiceChannel={handleLeaveVoiceChannel}
                currentUserVoiceChannel={currentUserVoiceChannel}
              />
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
