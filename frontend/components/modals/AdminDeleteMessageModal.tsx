"use client";
import { useTranslation } from "@/lib/i18n";

type Props = {
  show: boolean;
  messageContent: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AdminDeleteMessageModal({
  show,
  messageContent,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[rgba(30,50,70,0.95)] backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-2 border-[#5b8cff] p-6 max-w-md w-full">
        <h3 className="text-white font-bold text-lg mb-4">{t("members.adminDeleteConfirm")}</h3>
        
        <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-3 mb-4">
          <p className="text-white/70 text-sm line-clamp-3">
            {messageContent}
          </p>
        </div>
        
        <p className="text-white/60 text-sm mb-6">
          Cette action est irréversible.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[rgba(91,140,255,0.2)] text-[#5b8cff] rounded-lg hover:bg-[rgba(91,140,255,0.3)] transition-colors font-medium"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-[#ff6b6b] text-white rounded-lg hover:bg-[#ff5555] transition-colors font-medium"
          >
            {t("common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}