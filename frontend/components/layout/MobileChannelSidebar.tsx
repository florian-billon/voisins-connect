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
    <div className="fixed inset-0 z-45 md:hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-80 bg-[rgba(30,50,70,0.98)] border-r border-[#5b8cff]/20 flex flex-col">
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#5b8cff]/30 bg-[rgba(0,0,0,0.3)]">
          <h2 className="font-bold text-white truncate flex-1 uppercase tracking-widest text-sm">{selectedServer.name}</h2>
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
          <div className="mb-4">
            <input
              type="text"
              value={channelSearch}
              onChange={(e) => onChannelSearch(selectedServer?.id || "", e.target.value)}
              placeholder={t("channel.searchPlaceholder")}
              className="w-full bg-black/40 border border-[#5b8cff]/20 rounded px-3 py-2 text-sm text-white outline-none focus:border-[#5b8cff]/50"
            />
          </div>

          {channelsLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[#5b8cff] border-t-transparent rounded-full animate-spin mx-auto" />
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
                  onClick={() => {
                    onCreateChannel();
                    onClose();
                  }}
                  className="bg-[#5b8cff] text-black hover:bg-[#5b8cff]/90 px-4 py-2 rounded text-sm font-medium transition-colors"
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
                  onClick={() => {
                    onSelectChannel(channel);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    selectedChannel?.id === channel.id
                      ? "bg-[#5b8cff]/15 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="w-6 h-6 rounded-[2px] bg-[#5b8cff] flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2" />
                    </svg>
                  </div>
                  <span className="font-medium">{channel.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {canManageChannels && (
          <div className="p-4 border-t border-[#5b8cff]/20 bg-[rgba(0,0,0,0.3)]">
            <button
              onClick={() => {
                onCreateChannel();
                onClose();
              }}
              className="w-full bg-[#5b8cff] text-black hover:bg-[#5b8cff]/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("channel.createTitle")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}