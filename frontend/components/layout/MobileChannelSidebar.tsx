"use client";
import { useTranslation } from "@/lib/i18n";
import { Server, Channel } from "@/lib/api-client";

type Props = {
  selectedServer: Server | null;
  channels: Channel[];
  visibleChannels: Channel[];
  selectedChannel: Channel | null;
  channelSearch: string;
  channelsLoading: boolean;
  channelsError: string | null;
  canManageChannels: boolean;
  onSelectChannel: (channel: Channel) => void;
  onChannelSearch: (serverId: string, value: string) => void;
  onCreateChannel: () => void;
  onClose: () => void;
  isOpen: boolean;
};

export default function MobileChannelSidebar({
  selectedServer,
  channels,
  visibleChannels,
  selectedChannel,
  channelSearch,
  channelsLoading,
  channelsError,
  canManageChannels,
  onSelectChannel,
  onChannelSearch,
  onCreateChannel,
  onClose,
  isOpen,
}: Props) {
  const { t } = useTranslation();

  if (!isOpen || !selectedServer) return null;

  return (
    <div className="fixed left-0 top-14 bottom-0 w-56 z-40 md:hidden bg-[rgba(30,50,70,0.98)] border-r border-[#5b8cff]/20 flex flex-col">
      <div className="flex-1 overflow-y-auto p-3">
        {channelsLoading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-[#5b8cff] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : channelsError ? (
          <div className="text-center py-8">
            <p className="text-[#ff3333] text-sm">{channelsError}</p>
          </div>
        ) : visibleChannels.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm mb-4">{t("channel.noResults")}</p>
            {canManageChannels && (
              <button
                onClick={onCreateChannel}
                className="bg-[#5b8cff] text-black hover:bg-[#5b8cff]/90 px-3 py-2 rounded text-sm font-medium transition-colors"
              >
                {t("channel.createTitle")}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {visibleChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded transition-colors ${
                  selectedChannel?.id === channel.id
                    ? "bg-[#5b8cff]/15 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="w-5 h-5 rounded-[2px] bg-[#5b8cff] flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2" />
                  </svg>
                </div>
                <span className="text-xs font-medium truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {canManageChannels && (
        <div className="p-3 border-t border-[#5b8cff]/20 bg-[rgba(0,0,0,0.3)]">
          <button
            onClick={onCreateChannel}
            className="w-full bg-[#5b8cff] text-black hover:bg-[#5b8cff]/90 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t("channel.createTitle")}
          </button>
        </div>
      )}
    </div>
  );
}