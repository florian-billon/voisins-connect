"use client";
import { useTranslation } from "@/lib/i18n";
import { Server, Channel, Message, User } from "@/lib/api-client";
import { getAvatar } from "@/lib/avatar";
import SmartImg from "@/components/ui/SmartImg";
import Button from "@/components/ui/Button";
import MessageReactions from "@/components/chat/MessageReactions";
import GifPicker from "@/components/chat/GifPicker";
import { useState, useRef, useEffect } from "react";
import { uploadFile } from "@/lib/api-client";
import { isTauriWindow } from "@/lib/runtime";

type Props = {
  selectedServer: Server | null;
  selectedChannel: Channel | null;
  messages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;
  messageInput: string;
  showGifPicker: boolean;
  editingMessageId: string | null;
  editContent: string;
  typingUsers: Map<string, string>;
  user: User | null;
  currentUser?: User | null;
  viewerId: string | undefined;
  isServerAdmin: boolean;
  onCreateServer: () => void;
  onCreateChannel: () => void;
  onSendMessage: (e: React.FormEvent) => void;
  onMessageInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onMessageInputFocus: () => void;
  onMessageInputBlur: () => void;
  onToggleGifPicker: () => void;
  onSendGif: (url: string) => Promise<void>;
  onStartEdit: (message: Message) => void;
  onSaveEdit: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  onEditContentChange: (val: string) => void;
  onDeleteMessage: (id: string) => void;
  onAdminDeleteMessage: (id: string) => void;
  onOpenUserProfile: (userId: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => Promise<boolean>;
  onToggleSidebars?: () => void;
  hideAllSidebars?: boolean;
};

export default function ChatCenter({
  selectedServer, selectedChannel, messages, messagesLoading, messagesError,
  messageInput, showGifPicker, editingMessageId, editContent, typingUsers,
  user, currentUser, viewerId, isServerAdmin,
  onCreateServer, onCreateChannel, onSendMessage, onMessageInputChange,
  onMessageInputFocus, onMessageInputBlur, onToggleGifPicker, onSendGif,
  onStartEdit, onSaveEdit, onCancelEdit, onEditContentChange,
  onDeleteMessage, onAdminDeleteMessage, onOpenUserProfile, onToggleReaction,
  onToggleSidebars, hideAllSidebars,
}: Props) {
  const { t, locale } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const userForAvatar = currentUser || user;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Toujours scroller vers le bas quand de nouveaux messages arrivent
    if (messages.length > 0) {
      // Petit délai pour s'assurer que le DOM est mis à jour
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    }
  }, [messages]);

  const handleFileUpload = async () => {
    if (!selectedChannel) return;

    if (isTauriWindow()) {
      try {
        // On utilise le dialogue natif de Tauri (Desktop)
        const { open } = await import("@tauri-apps/plugin-dialog");
        const { readFile } = await import("@tauri-apps/plugin-fs");

        const selected = await open({
          multiple: false,
          filters: [{
            name: 'Files',
            extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'md', 'txt']
          }]
        });

        if (!selected) return;

        setIsUploading(true);
        const filePath = selected as string;
        const fileData = await readFile(filePath);
        const fileName = filePath.split('/').pop() || 'file';
        const file = new File([fileData], fileName);

        const res = await uploadFile(file);
        await onSendMessage({ preventDefault: () => { } } as any);
        await onSendGif(res.url);
      } catch (err) {
        console.error("Tauri upload failed", err);
      } finally {
        setIsUploading(false);
      }
    } else {
      // On utilise l'input HTML classique (Web/Vercel)
      fileInputRef.current?.click();
    }
  };

  const handleWebFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChannel) return;

    try {
      setIsUploading(true);
      const res = await uploadFile(file);
      await onSendMessage({ preventDefault: () => { } } as any);
      await onSendGif(res.url);
      
      // Reset l'input pour pouvoir uploader le même fichier deux fois si besoin
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Web upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const renderEmpty = () => (
    <div className="h-full flex items-center justify-center">
      <div className="text-center group">
        <div className="w-32 h-32 rounded-full bg-[#5b8cff]/5 border-2 border-[#5b8cff]/20 flex items-center justify-center mb-8 mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-[#5b8cff]/5 blur-xl group-hover:blur-2xl transition-all" />
          <svg className="w-16 h-16 text-[#5b8cff] relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h7v7H3z" /><path d="M14 3h7v7h-7z" /><path d="M14 14h7v7h-7z" /><path d="M3 14h7v7H3z" />
          </svg>
        </div>
        <div className="flex flex-col items-center">
          {!selectedServer ? (
            <>
              <h2 className="text-3xl font-bold text-white mb-2">{t("chat.selectServer")}</h2>
              <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">{t("chat.selectServerPrompt")}</p>
              <Button onClick={onCreateServer} variant="outline" className="mt-8 border-[#5b8cff] text-[#5b8cff] px-8 py-6 text-lg hover:bg-[#5b8cff]/10 transition-all font-bold mx-auto">
                {t("chat.createServerButton")}
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-white mb-2">{t("channel.createTitle")}</h2>
              <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">{t("channel.createDescription", { serverName: selectedServer.name })}</p>
              <Button onClick={onCreateChannel} variant="outline" className="mt-8 border-[#5b8cff] text-[#5b8cff] px-8 py-6 text-lg hover:bg-[#5b8cff]/10 transition-all font-bold mx-auto">
                {t("channel.createTitle")}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderMessages = () => {
    if (messagesLoading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#5b8cff] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[#5b8cff] text-sm">{t("chat.loadingMessages")}</p>
          </div>
        </div>
      );
    }
    if (messagesError) {
      return <div className="h-full flex items-center justify-center"><p className="text-[#ff3333]">{messagesError}</p></div>;
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-center px-4">
          <div className="w-32 h-32 rounded-full bg-[#5b8cff]/5 border-2 border-[#5b8cff]/20 flex items-center justify-center mb-8 mx-auto relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#5b8cff]/5 blur-xl group-hover:blur-2xl transition-all" />
            <svg className="w-16 h-16 text-[#5b8cff] relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
            </svg>
          </div>
          <h4 className="text-xl font-semibold text-white mb-2">{t("chat.welcomeChannel", { channelName: selectedChannel!.name })}</h4>
          <p className="text-white/50 text-sm">{t("chat.channelStart")}</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-3 px-4 py-2 rounded hover:bg-white/5 transition-colors group">
            <button type="button" onClick={() => onOpenUserProfile(msg.author_id)} className="flex-shrink-0" title={msg.username}>
              <SmartImg
                src={getAvatar(msg.author_id, userForAvatar, msg.avatar_url)}
                alt={msg.username}
                className="w-10 h-10 rounded-full object-cover border border-[#5b8cff]/30 group-hover:border-[#5b8cff]/50 transition-colors"
              />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <button type="button" onClick={() => onOpenUserProfile(msg.author_id)} className="font-semibold text-white hover:text-[#5b8cff] transition-colors cursor-pointer">
                  {msg.username}
                </button>
                <span className="text-xs text-white/40">
                  {new Date(msg.created_at).toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                  {msg.edited_at && <span className="ml-1 text-[10px] text-white/20 italic">{t("chat.edited")}</span>}
                </span>
              </div>
              {editingMessageId === msg.id ? (
                <form onSubmit={onSaveEdit} className="mt-1">
                  <input
                    type="text"
                    value={editContent}
                    onChange={(e) => onEditContentChange(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === "Escape" && onCancelEdit()}
                    placeholder={t("chat.editPlaceholder")}
                    aria-label={t("chat.editPlaceholder")}
                    className="w-full px-3 py-1.5 bg-black/50 border border-[#5b8cff]/50 rounded text-white text-sm outline-none focus:border-[#5b8cff]"
                  />
                  <div className="flex gap-2 mt-2">
                    <button type="submit" className="text-[10px] text-[#5b8cff] hover:underline font-bold uppercase">{t("chat.save")}</button>
                    <button type="button" onClick={onCancelEdit} className="text-[10px] text-white/40 hover:underline font-bold uppercase">{t("common.cancel")}</button>
                  </div>
                </form>
              ) : msg.content.includes("giphy.com") || msg.content.includes("/files/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <div className="mt-1 relative group/file">
                  {msg.content.match(/\.(jpg|jpeg|png|gif|webp)$/i) || msg.content.includes("giphy.com") ? (
                    <img src={msg.content.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL}${msg.content}` : msg.content} alt={t("chat.uploadTooltip")} className="max-w-xs max-h-64 rounded-lg border border-white/10 hover:border-[#5b8cff]/50 transition-colors cursor-pointer" loading="lazy" />
                  ) : (
                    <a href={msg.content.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL}${msg.content}` : msg.content} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors w-fit">
                      <div className="w-10 h-10 bg-[#5b8cff]/10 rounded flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#5b8cff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="text-sm text-white/80 font-mono truncate max-w-[200px]">{msg.content.split("/").pop()}</span>
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-white/90 leading-relaxed break-all whitespace-pre-wrap">{msg.content}</p>
              )}
              {!editingMessageId && (
                <MessageReactions
                  messageId={msg.id}
                  reactions={msg.reactions ?? []}
                  viewerId={viewerId}
                  onToggleReaction={onToggleReaction}
                  addReactionLabel={t("chat.addReaction")}
                />
              )}
            </div>
            {!editingMessageId && (
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-all ml-auto self-start">
                {msg.author_id === user?.id && (
                  <button type="button" onClick={() => onStartEdit(msg)} className="p-1.5 text-white/40 hover:text-[#5b8cff] transition-colors" title={t("chat.edit")}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                {isServerAdmin && msg.author_id !== user?.id && (
                  <button type="button" onClick={() => onAdminDeleteMessage(msg.id)} className="p-1.5 text-white/40 hover:text-[#ff6b6b] transition-colors" title={t("members.adminDeleteMessage")}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </button>
                )}
                <button type="button" onClick={() => onDeleteMessage(msg.id)} className="p-1.5 text-white/40 hover:text-[#ff6b6b] transition-colors" title={t("chat.delete")}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[rgba(26,42,58,0.98)]">
      {/* Bouton pour cacher toutes les sidebars */}
      <div className="px-2 md:px-4 py-2 border-b border-[#5b8cff]/20 bg-[rgba(0,0,0,0.2)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedChannel && (
            <span className="text-sm text-white/60">
              {selectedChannel.name}
            </span>
          )}
        </div>
        {onToggleSidebars && (
          <button
            type="button"
            onClick={onToggleSidebars}
            className="p-2 text-white/40 hover:text-white transition-colors"
            title={hideAllSidebars ? "Afficher les sidebars" : "Cacher les sidebars"}
          >
            {hideAllSidebars ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 0A9 9 0 0112 21m0 0a9 9 0 0112-21m0 0a9 9 0 00-12 21m0 0a9 9 0 0112-21M12 3v6m0 0v6m0-6h6m-6 0h6" />
              </svg>
            )}
          </button>
        )}
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2 md:p-4">
        {!selectedChannel ? renderEmpty() : renderMessages()}
      </div>

      {selectedChannel && (
        <footer className="px-2 md:px-4 py-2 md:py-3 border-t border-[#5b8cff]/20 bg-[rgba(0,0,0,0.2)]">
          {typingUsers.size > 0 && (() => {
            const entries = Array.from(typingUsers.entries()).filter(([id]) => id !== user?.id);
            if (entries.length === 0) return null;
            const names = entries.map(([, name]) => name).join(", ");
            return (
              <div className="flex items-center gap-2 px-2 pb-1 text-sm text-white/60">
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-[#5b8cff] rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-[#5b8cff] rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-[#5b8cff] rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
                <span>{t(entries.length === 1 ? "chat.typing" : "chat.typingPlural", { names })}</span>
              </div>
            );
          })()}
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleWebFileChange}
              className="hidden"
              accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.md,.txt"
            />
            {showGifPicker && (
              <GifPicker
                onSelect={async (gifUrl) => { await onSendGif(gifUrl); }}
                onClose={() => onToggleGifPicker()}
                searchPlaceholder={t("chat.gifSearch")}
              />
            )}
            <form onSubmit={onSendMessage} className="flex items-center gap-1 md:gap-2">
              <button
                type="button"
                onClick={handleFileUpload}
                disabled={isUploading}
                className="p-1.5 md:px-2 md:py-2 text-white/40 hover:text-[#5b8cff] transition-colors flex-shrink-0 disabled:opacity-50"
                title={t("chat.uploadTooltip")}
              >
                {isUploading ? (
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-[#5b8cff] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={onToggleGifPicker}
                className="px-1.5 py-1.5 md:px-2 md:py-2 text-[10px] md:text-xs font-bold text-[#5b8cff] border border-[#5b8cff]/40 rounded-lg hover:bg-[#5b8cff]/10 transition-colors flex-shrink-0"
                title={t("chat.gifTooltip")}
              >
                GIF
              </button>
              <div className="relative flex-1">
                <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" />
                    <line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
                  </svg>
                </div>
                <textarea
                  value={messageInput}
                  onChange={onMessageInputChange}
                  onFocus={onMessageInputFocus}
                  onBlur={onMessageInputBlur}
                  placeholder={`Message #${selectedChannel.name}`}
                  className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 bg-[rgba(20,20,20,0.8)] border border-[#5b8cff]/30 rounded-lg text-white placeholder:text-white/40 outline-none focus:border-[#5b8cff] focus:bg-[rgba(20,20,20,0.95)] focus:shadow-[0_0_8px_rgba(79,223,255,0.3)] transition-all text-sm md:text-base"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      // Utiliser le formulaire parent pour soumettre
                      (e.target as HTMLTextAreaElement).form?.requestSubmit();
                    }
                    // Shift+Enter permet le saut de ligne natif du textarea
                  }}
                />
              </div>
            </form>
          </div>
        </footer>
      )}
    </div>
  );
}
