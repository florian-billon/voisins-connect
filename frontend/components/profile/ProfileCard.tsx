"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { uploadFile, User, UpdateProfilePayload, updateMe } from "@/lib/api-client";
import { logout } from "@/lib/auth/client";
import { normalizeAvatarUrl } from "@/lib/avatar";
import { UserStatus, getStatusColor, getStatusKey, normalizeStatus } from "@/lib/presence";
import { useTranslation } from "@/lib/i18n";
import { reemitStoredToken } from "@/lib/token-storage";
import { isTauriWindow } from "@/lib/runtime";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SmartImg from "@/components/ui/SmartImg";

const AVATARS = Array.from({ length: 100 }, (_, i) =>
  `/avatars/avatar_${String(i + 1).padStart(3, '0')}.png`
);

const STATUS_VALUES: UserStatus[] = ["online", "offline", "dnd", "invisible"];

interface ProfileCardProps {
  user: User;
  onClose: () => void;
  onUpdate?: (user: User) => void;
}

export default function ProfileCard({ user, onClose, onUpdate }: ProfileCardProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [editData, setEditData] = useState({
    username: user.username,
    apartment_number: user.apartment_number || "",
    avatar_url: normalizeAvatarUrl(user.avatar_url) || "",
    status: normalizeStatus(user.status),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  // Handler pour l'importation d'image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valider le type de fichier
    if (!file.type.startsWith('image/')) {
      setError(t("profile.invalidFileType"));
      return;
    }

    // Valider la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t("profile.fileTooLarge"));
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const response = await uploadFile(file);
      
      console.log("Web upload response:", response);
      
      // Mettre à jour l'URL de l'avatar avec le préfixe de l'API
      const fullAvatarUrl = response.url.startsWith('http') 
        ? response.url 
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${response.url}`;
      
      console.log("Web full avatar URL:", fullAvatarUrl);
      
      setEditData(prev => ({
        ...prev,
        avatar_url: fullAvatarUrl
      }));

    } catch (err) {
      console.error("Error uploading image:", err);
      setError(t("profile.uploadError"));
    } finally {
      setIsUploading(false);
      // Réinitialiser l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handler pour Tauri (desktop)
  const handleTauriImageUpload = async () => {
    try {
      setIsUploading(true);
      setError(null);

      const { open } = await import("@tauri-apps/plugin-dialog");
      const { readFile } = await import("@tauri-apps/plugin-fs");

      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp']
        }]
      });

      if (!selected) return;

      const filePath = selected as string;
      const fileData = await readFile(filePath);
      const fileName = filePath.split('/').pop() || 'avatar.png';
      const file = new File([fileData], fileName, { type: 'image/png' });

      const response = await uploadFile(file);
      
      console.log("Tauri upload response:", response);
      
      // Mettre à jour l'URL de l'avatar avec le préfixe de l'API
      const fullAvatarUrl = response.url.startsWith('http') 
        ? response.url 
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${response.url}`;
      
      console.log("Tauri full avatar URL:", fullAvatarUrl);
      
      setEditData(prev => ({
        ...prev,
        avatar_url: fullAvatarUrl
      }));

    } catch (err) {
      console.error("Error uploading image via Tauri:", err);
      setError(t("profile.uploadError"));
    } finally {
      setIsUploading(false);
    }
  };

  
  const currentStatus = normalizeStatus(user.status);
  const displayStatus = isEditing ? editData.status : currentStatus;
  const displayAvatarUrl = isEditing
    ? editData.avatar_url || normalizeAvatarUrl(user.avatar_url) || ""
    : normalizeAvatarUrl(user.avatar_url) || "";
  const memberSince = new Date(user.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: UpdateProfilePayload = {};
      const normalizedUsername = editData.username.trim();

      console.log("Current user avatar:", user.avatar_url);
      console.log("Edit data avatar:", editData.avatar_url);
      console.log("Normalized user avatar:", normalizeAvatarUrl(user.avatar_url));

      if (normalizedUsername !== user.username) payload.username = normalizedUsername;
      if (editData.apartment_number !== (user.apartment_number || "")) payload.apartment_number = editData.apartment_number;
      if (editData.avatar_url && editData.avatar_url !== normalizeAvatarUrl(user.avatar_url)) {
        payload.avatar_url = editData.avatar_url;
        console.log("Avatar payload to save:", payload.avatar_url);
      }
      if (editData.status !== currentStatus) payload.status = editData.status;

      console.log("Final payload:", payload);

      if (Object.keys(payload).length > 0) {
        const updatedUser = await updateMe(payload);
        console.log("Updated user response:", updatedUser);
        onUpdate?.(updatedUser);
        reemitStoredToken();
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err instanceof Error ? err.message : t("error.default"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[420px] bg-[rgba(5,10,15,0.98)] border border-[#5b8cff]/30 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-[fadeIn_0.2s_ease]">

        <div className="relative bg-gradient-to-br from-[#5b8cff]/10 to-[#ff6b6b]/5 p-6 pb-16">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            aria-label={t("common.close")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-[rgba(5,10,15,0.98)] p-1 border-2 border-[#5b8cff]/50">
                {displayAvatarUrl ? (
                  <SmartImg
                    src={displayAvatarUrl}
                    alt={user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-[#5b8cff] to-[#ff6b6b] flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-[3px] border-[rgba(5,10,15,0.98)] ${getStatusColor(displayStatus)}`} />
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 -mt-8">
          <div className="bg-[rgba(0,0,0,0.4)] rounded-lg p-4 mb-4 border border-[#5b8cff]/20">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  id="edit-username"
                  type="text"
                  label={t("profile.usernameLabel")}
                  maxLength={32}
                  value={editData.username}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                />

                <Input
                  id="edit-apartment"
                  type="text"
                  label={t("profile.apartmentLabel")}
                  placeholder={t("profile.apartmentPlaceholder")}
                  value={editData.apartment_number}
                  onChange={(e) => setEditData({ ...editData, apartment_number: e.target.value })}
                />

                <div>
                  <label className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-2">
                    {t("profile.avatarLabel")}
                  </label>
                  
                  {/* Bouton pour choisir un avatar */}
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="w-full px-3 py-2 bg-[rgba(20,20,20,0.8)] border border-[#5b8cff]/30 rounded-lg text-white text-sm focus:outline-none focus:border-[#5b8cff] focus:shadow-[0_0_8px_rgba(91,140,255,0.3)] flex items-center gap-2 hover:bg-[rgba(20,20,20,0.95)] transition-all mb-2"
                  >
                    {editData.avatar_url && (
                      <SmartImg src={editData.avatar_url} alt="Avatar" className="w-6 h-6 rounded" />
                    )}
                    <span>{showAvatarPicker ? t("common.close") : t("profile.chooseAvatar")}</span>
                  </button>

                  {/* Bouton pour importer une image personnalisée */}
                  <div className="flex gap-2">
                    {isTauriWindow() ? (
                      <button
                        type="button"
                        onClick={handleTauriImageUpload}
                        disabled={isUploading}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#5b8cff]/20 to-[#7aa5ff]/20 border border-[#5b8cff]/30 text-[#5b8cff] hover:from-[#5b8cff]/30 hover:to-[#7aa5ff]/30 hover:border-[#5b8cff]/50 disabled:opacity-50"
                        title={t("profile.importImage")}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>{isUploading ? t("common.loading") : t("profile.importImage")}</span>
                      </button>
                    ) : (
                      <>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#5b8cff]/20 to-[#7aa5ff]/20 border border-[#5b8cff]/30 text-[#5b8cff] hover:from-[#5b8cff]/30 hover:to-[#7aa5ff]/30 hover:border-[#5b8cff]/50 disabled:opacity-50"
                          title={t("profile.importImage")}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span>{isUploading ? t("common.loading") : t("profile.importImage")}</span>
                        </button>
                      </>
                    )}
                  </div>

                  {showAvatarPicker && (
                    <div className="mt-2 max-h-[240px] overflow-y-auto bg-[rgba(0,0,0,0.6)] border border-[#5b8cff]/20 rounded-lg p-3 grid grid-cols-8 gap-2">
                      {AVATARS.map((avatarUrl, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setEditData({ ...editData, avatar_url: avatarUrl });
                            setShowAvatarPicker(false);
                          }}
                          className={`w-10 h-10 rounded-lg hover:ring-2 hover:ring-[#5b8cff] transition-all ${editData.avatar_url === avatarUrl ? "ring-2 ring-[#5b8cff]" : ""}`}
                        >
                          <SmartImg
                            src={avatarUrl}
                            alt={t("profile.avatarAlt", { index: index + 1 })}
                            className="w-full h-full rounded-lg object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="edit-status" className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-2">
                    {t("profile.statusLabel")}
                  </label>
                  <select
                    id="edit-status"
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value as UserStatus })}
                    className="w-full px-3 py-2 bg-[rgba(20,20,20,0.8)] border border-[#5b8cff]/30 rounded-lg text-white text-sm focus:outline-none focus:border-[#5b8cff] focus:shadow-[0_0_8px_rgba(91,140,255,0.3)] transition-all"
                  >
                    {STATUS_VALUES.map((value) => (
                      <option key={value} value={value}>{t(getStatusKey(value))}</option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2">
                    <p className="text-red-400 text-xs">{error}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-1">{user.username}</h2>
                <p className="text-sm text-white/50">@{user.username.toLowerCase().replace(/\s+/g, "")}</p>
              </div>
            )}
          </div>

          <div className="bg-[rgba(0,0,0,0.4)] rounded-lg p-4 mb-4 border border-[#4fdfff]/20 space-y-4">
            <div>
              <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
                {t("profile.statusLabel")}
              </h4>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(currentStatus)}`} />
                <span className="text-sm text-white">{t(getStatusKey(currentStatus))}</span>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
                {t("profile.memberSince")}
              </h4>
              <p className="text-sm text-white">{memberSince}</p>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
                {t("profile.emailLabel")}
              </h4>
              <p className="text-sm text-white/80 break-all">{user.email}</p>
            </div>

            {user.apartment_number && (
              <div>
                <h4 className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">
                  {t("profile.apartmentLabel")}
                </h4>
                <p className="text-sm text-white">{user.apartment_number}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {isEditing ? (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setIsEditing(false);
                    setShowAvatarPicker(false);
                    setEditData({
                      username: user.username,
                      apartment_number: user.apartment_number || "",
                      avatar_url: normalizeAvatarUrl(user.avatar_url) || "",
                      status: currentStatus,
                    });
                    setError(null);
                  }}
                  className="flex-1"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSave}
                  isLoading={saving}
                  className="flex-1"
                >
                  {t("common.save")}
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsEditing(true)}
                  fullWidth
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  {t("profile.editProfile")}
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={handleLogout}
                  fullWidth
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {t("auth.logout")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
