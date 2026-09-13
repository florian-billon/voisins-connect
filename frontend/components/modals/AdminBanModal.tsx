"use client";
import { useTranslation } from "@/lib/i18n";

type Props = {
  show: boolean;
  username: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AdminBanModal({
  show,
  username,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation();

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[rgba(30,50,70,0.95)] backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-2 border-[#ff6b6b] p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#ff6b6b]/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#ff6b6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-lg">Bannir {username}</h3>
        </div>
        
        <p className="text-white/80 text-sm mb-6">
          {t("members.adminBanConfirm", { username })}
        </p>
        
        <p className="text-white/60 text-xs mb-6">
          L'utilisateur ne pourra plus rejoindre ce groupe.
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
            Bannir
          </button>
        </div>
      </div>
    </div>
  );
}