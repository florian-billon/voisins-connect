"use client";
import { useTranslation } from "@/lib/i18n";

type Props = {
  show: boolean;
  username: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function AdminMuteModal({
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
      <div className="relative bg-[rgba(30,50,70,0.95)] backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-2 border-[#ff9f5b] p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#ff9f5b]/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#ff9f5b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-lg">Bloquer les messages de {username}</h3>
        </div>
        
        <p className="text-white/80 text-sm mb-6">
          {t("members.adminMuteConfirm", { username })}
        </p>
        
        <div className="bg-[rgba(255,159,91,0.1)] border border-[#ff9f5b]/30 rounded-lg p-3 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[#ff9f5b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[#ff9f5b] text-sm font-medium">Durée : 1 heure</p>
          </div>
          <p className="text-white/60 text-xs mt-2">
            L'utilisateur pourra toujours lire les messages mais ne pourra pas en envoyer pendant 1 heure.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[rgba(91,140,255,0.2)] text-[#5b8cff] rounded-lg hover:bg-[rgba(91,140,255,0.3)] transition-colors font-medium"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-[#ff9f5b] text-white rounded-lg hover:bg-[#ff8f4b] transition-colors font-medium"
          >
            Bloquer
          </button>
        </div>
      </div>
    </div>
  );
}