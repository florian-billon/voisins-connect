"use client";
import { useTranslation } from "@/lib/i18n";
import Button from "@/components/ui/Button";

type Props = {
  show: boolean;
  channelName: string;
  serverName: string;
  submitting?: boolean;
  onClose: () => void;
  onChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function CreateChannelModal({
  show,
  channelName,
  serverName,
  submitting = false,
  onClose,
  onChange,
  onSubmit,
}: Props) {
  const { t } = useTranslation();
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[rgba(20,20,20,0.98)] border-2 border-[#4fdfff] rounded-xl p-6 w-full max-w-md shadow-[0_0_40px_rgba(79,223,255,0.3)]">
        <h2 className="text-xl font-bold text-center text-white mb-1">{t("channel.createTitle")}</h2>
        <p className="text-center text-white/50 text-sm mb-6">
          {t("channel.createDescription", { serverName })}
        </p>
        <form onSubmit={onSubmit}>
          <label className="block text-[10px] font-bold text-[#4fdfff] tracking-widest uppercase mb-2">
            {t("channel.nameLabel")}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">#</span>
            <input
              type="text"
              value={channelName}
              onChange={(e) => onChange(e.target.value)}
              placeholder="general"
              autoFocus
              className="w-full pl-8 pr-4 py-3 bg-black/50 border-2 border-[#4fdfff]/50 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#4fdfff] focus:shadow-[0_0_10px_rgba(79,223,255,0.3)] mb-6 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-white/60 hover:text-white hover:underline transition-colors">
              {t("common.cancel")}
            </button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={submitting}
              disabled={!channelName.trim() || submitting}
              className="flex-1 uppercase"
            >
              {t("common.create")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
