"use client";
import { useTranslation } from "@/lib/i18n";
import { Server, Channel } from "@/lib/api-client";

type Props = {
  selectedServer: Server | null;
  selectedChannel: Channel | null;
  onMenuToggle: () => void;
  onChannelsToggle: () => void;
  onMembersToggle: () => void;
  onCloseAll: () => void;
  showChannelsButton: boolean;
  showMembersButton: boolean;
};

export default function MobileHeader({
  selectedServer,
  selectedChannel,
  onMenuToggle,
  onChannelsToggle,
  onMembersToggle,
  onCloseAll,
  showChannelsButton,
  showMembersButton,
}: Props) {
  const { t } = useTranslation();

  return (
    <header className="md:hidden h-14 bg-[rgba(30,50,70,0.95)] border-b border-[#5b8cff]/20 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCloseAll}
          className="p-2 text-white/60 hover:text-white transition-colors"
          aria-label="Fermer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-2 text-white/60 hover:text-white transition-colors"
          aria-label="Serveurs"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex-1 mx-4">
        <h1 className="text-white font-semibold truncate">
          {selectedChannel ? `#${selectedChannel.name}` : selectedServer?.name || t("common.appName")}
        </h1>
      </div>

      {showMembersButton && (
        <button
          type="button"
          onClick={onMembersToggle}
          className="p-2 text-white/60 hover:text-white transition-colors"
          aria-label={t("members.title")}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
      )}
    </header>
  );
}