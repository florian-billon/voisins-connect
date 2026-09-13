"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, useFriends } from "@/hooks";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useRouteGuard } from "@/lib/auth/guards";
import { normalizeAvatarUrl, getAvatar } from "@/lib/avatar";
import { getStatusColor, getStatusKey } from "@/lib/presence";
import { useTranslation } from "@/lib/i18n";
import MessageReactions from "@/components/chat/MessageReactions";
import GifPicker from "@/components/chat/GifPicker";
import ProfileCard from "@/components/profile/ProfileCard";
import PublicProfileCard from "@/components/profile/PublicProfileCard";
import SmartImg from "@/components/ui/SmartImg";
import { logout } from "@/lib/auth/client";
import Button from "@/components/ui/Button";
import {
  addDirectMessageReaction,
  createDirectConversation,
  deleteDirectMessage,
  DirectConversation,
  DirectMessage,
  listDirectConversations,
  listDirectMessages,
  MessageReaction,
  removeDirectMessageReaction,
  searchUsers,
  sendDirectMessage,
  updateDirectMessage,
  User,
  UserSearchResult,
  uploadFile,
} from "@/lib/api-client";
import { isTauriWindow } from "@/lib/runtime";
import VoiceCallManager from "@/components/voice/VoiceCallManager";
import VoiceCall from "@/components/voice/VoiceCall";
// import PremiumSettings from "@/components/premium/PremiumSettings";
// import PremiumFloatingButton from "@/components/premium/PremiumFloatingButton";

const SCROLL_BOTTOM_THRESHOLD_PX = 80;

function sortDirectMessagesChronologically(items: DirectMessage[]): DirectMessage[] {
  return [...items].sort((left, right) => {
    const leftTimestamp = new Date(left.created_at).getTime();
    const rightTimestamp = new Date(right.created_at).getTime();

    if (leftTimestamp !== rightTimestamp) {
      return leftTimestamp - rightTimestamp;
    }

    return left.id.localeCompare(right.id);
  });
}

function isGifMessage(content: string): boolean {
  return content.includes("giphy.com");
}

function DirectMessagesPageContent() {
  const { t, locale } = useTranslation();
  const { ready: guardReady } = useRouteGuard("protected");
  const { user: currentUser } = useAuth();
  const { friends, refreshFriends } = useFriends();
  const { onEvent } = useWebSocket();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ÉTATS
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPublicUserId, setSelectedPublicUserId] = useState<string | null>(null);
  // const [showPremium, setShowPremium] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showDeleteMessageConfirm, setShowDeleteMessageConfirm] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingScrollBehaviorRef = useRef<ScrollBehavior | null>(null);
  const shouldStickToBottomRef = useRef(true);

  const selectedConversation = conversations.find((conv) => conv.id === selectedConversationId);
  const requestedUsername = searchParams.get("username");
  const selectedConversationAvatar =
    normalizeAvatarUrl(selectedConversation?.avatar_url) ||
    getAvatar(selectedConversation?.recipient_id || "", currentUser);

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  }, []);

  const updateStickToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldStickToBottomRef.current = distanceToBottom <= SCROLL_BOTTOM_THRESHOLD_PX;
  }, []);

  const resetNewConversationModal = () => {
    setShowNewChatModal(false);
    setSearchUsername("");
    setModalError(null);
    setSearchResults([]);
    setSearchLoading(false);
  };

  const selectConversation = useCallback((conversation: DirectConversation) => {
    setConversations((prev) => {
      const exists = prev.find((current) => current.id === conversation.id);
      return exists ? prev : [conversation, ...prev];
    });
    setSelectedConversationId(conversation.id);
  }, []);

  const openConversation = useCallback(
    async (targetUsername: string, shouldSelect = true) => {
      const conversation = await createDirectConversation(targetUsername.trim());
      if (shouldSelect) {
        selectConversation(conversation);
      }
      return conversation;
    },
    [selectConversation]
  );

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await listDirectConversations();
        setConversations(data);
        setError(null);
      } catch (error) {
        console.error("Erreur lors du chargement des conversations:", error);
        setError("Impossible de charger les conversations.");
      }
    };

    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    shouldStickToBottomRef.current = true;
    pendingScrollBehaviorRef.current = "auto";
  }, [selectedConversationId]);

  // Ouvrir automatiquement le modal Premium si le paramètre est présent - Disabled
  /* useEffect(() => {
    const showPremiumParam = searchParams.get("showPremium");
    if (showPremiumParam === "true") {
      setShowPremium(true);
      // Nettoyer l'URL pour éviter de réouvrir le modal au rechargement
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]); */

  // Gérer les succès de paiement
  useEffect(() => {
    const premiumSuccess = searchParams.get("premium");
    const paymentMethod = searchParams.get("method");
    
    if (premiumSuccess === "success") {
      // Afficher une notification de succès
      const message = paymentMethod === "paypal" 
        ? "Paiement PayPal réussi ! Bienvenue dans l'abonnement Premium 🎉"
        : "Paiement réussi ! Bienvenue dans l'abonnement Premium 🎉";
      
      alert(message);
      
      // Nettoyer l'URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      
      // Rafraîchir les données de l'utilisateur
      window.location.reload();
    } else if (premiumSuccess === "cancelled") {
      alert("Paiement annulé. Vous pouvez réessayer à tout moment.");
      
      // Nettoyer l'URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const fetchMessages = async () => {
      if (!selectedConversationId) {
        setMessages([]);
        return;
      }

      try {
        const data = await listDirectMessages(selectedConversationId);
        if (!cancelled) {
          setMessages(
            sortDirectMessagesChronologically(
              data.map((message) => ({ ...message, reactions: message.reactions ?? [] }))
            )
          );
          setError(null);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des messages privés:", error);
        if (!cancelled) {
          setError("Impossible de charger les messages privés.");
        }
      }
    };

    void fetchMessages();

    return () => {
      cancelled = true;
    };
  }, [selectedConversationId]);

  useEffect(() => {
    // Toujours scroller vers le bas quand de nouveaux messages arrivent
    if (messages.length > 0) {
      // Petit délai pour s'assurer que le DOM est mis à jour
      setTimeout(() => {
        scrollMessagesToBottom("smooth");
      }, 100);
    }
  }, [messages, scrollMessagesToBottom, selectedConversationId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    updateStickToBottom();
  }, [messages.length, selectedConversationId, updateStickToBottom]);

  useEffect(() => {
    if (!requestedUsername || !currentUser) {
      return;
    }

    let cancelled = false;

    const openConversationFromQuery = async () => {
      try {
        const newConv = await openConversation(requestedUsername, false);
        if (!cancelled) {
          selectConversation(newConv);
          router.replace("/messages");
        }
      } catch (queryError) {
        console.error("Erreur lors de l'ouverture auto de la conversation:", queryError);
        if (!cancelled) {
          setError("Impossible d'ouvrir la conversation privée.");
          router.replace("/messages");
        }
      }
    };

    openConversationFromQuery();

    return () => {
      cancelled = true;
    };
  }, [currentUser, openConversation, requestedUsername, router, selectConversation]);

  useEffect(() => {
    const unsubscribe = onEvent((event) => {
      switch (event.op) {
        case "DIRECT_MESSAGE_CREATE": {
          const message = { ...event.d, reactions: event.d.reactions ?? [] };
          const shouldAutoScroll = shouldStickToBottomRef.current || message.author_id === currentUser?.id;

          setMessages((prev) => {
            if (prev.some((current) => current.id === message.id)) {
              return prev;
            }

            if (selectedConversationId && message.dm_id === selectedConversationId) {
              if (shouldAutoScroll) {
                pendingScrollBehaviorRef.current = "smooth";
              }

              return sortDirectMessagesChronologically([...prev, message]);
            }

            return prev;
          });

          setConversations((prev) => {
            const existing = prev.find((conversation) => conversation.id === message.dm_id);
            if (!existing) {
              void listDirectConversations()
                .then((data) => {
                  setConversations(data);
                })
                .catch((conversationError) => {
                  console.error(
                    "Erreur lors du rafraichissement des conversations privees:",
                    conversationError
                  );
                });
              return prev;
            }

            return [existing, ...prev.filter((conversation) => conversation.id !== message.dm_id)];
          });
          break;
        }
        case "DIRECT_MESSAGE_REACTION_UPDATE": {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === event.d.id && message.dm_id === event.d.dm_id
                ? { ...message, reactions: event.d.reactions ?? [] }
                : message
            )
          );
          break;
        }
        case "DIRECT_MESSAGE_UPDATE": {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === event.d.id && message.dm_id === event.d.dm_id
                ? { ...message, content: event.d.content, edited_at: event.d.edited_at }
                : message
            )
          );
          break;
        }
        case "DIRECT_MESSAGE_DELETE": {
          setMessages((prev) =>
            prev.filter((message) => !(message.id === event.d.id && message.dm_id === event.d.dm_id))
          );

          if (editingMessageId === event.d.id) {
            setEditingMessageId(null);
            setEditContent("");
          }

          if (messageToDelete === event.d.id) {
            setShowDeleteMessageConfirm(false);
            setMessageToDelete(null);
          }

          break;
        }
      }
    });

    return unsubscribe;
  }, [currentUser?.id, editingMessageId, messageToDelete, onEvent, selectedConversationId]);

  useEffect(() => {
    if (!showNewChatModal) {
      return;
    }

    const normalizedQuery = searchUsername.trim();

    if (!normalizedQuery) {
      setSearchResults([]);
      setSearchLoading(false);
      setModalError(null);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const users = await searchUsers(normalizedQuery);
        if (!cancelled) {
          setSearchResults(users);
          setModalError(null);
        }
      } catch (searchError) {
        console.error("Erreur lors de la recherche d'utilisateurs:", searchError);
        if (!cancelled) {
          setSearchResults([]);
          setModalError("Impossible de rechercher des utilisateurs.");
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchUsername, showNewChatModal]);

  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUsername =
      searchResults.find((candidate) => candidate.username === searchUsername.trim())?.username ||
      searchResults[0]?.username ||
      searchUsername.trim();

    if (!targetUsername) return;

    try {
      await openConversation(targetUsername);
      resetNewConversationModal();
      setError(null);
    } catch (conversationError) {
      console.error("Erreur technique lors du lancement de la conversation:", conversationError);
      setModalError("Utilisateur introuvable ou conversation impossible.");
    }
  };

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversationId || !messageInput.trim()) return;

    try {
      const sentMessage = await sendDirectMessage(selectedConversationId, messageInput.trim());
      pendingScrollBehaviorRef.current = "smooth";
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMessage.id)) return prev;
        return sortDirectMessagesChronologically([
          ...prev,
          { ...sentMessage, reactions: sentMessage.reactions ?? [] },
        ]);
      });
      setMessageInput("");
      setError(null);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message privé:", error);
      setError("Impossible d'envoyer le message privé.");
    }
  };

  const handleSendGif = async (gifUrl: string) => {
    if (!selectedConversationId) return;

    try {
      const sentMessage = await sendDirectMessage(selectedConversationId, gifUrl);
      pendingScrollBehaviorRef.current = "smooth";
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMessage.id)) return prev;
        return sortDirectMessagesChronologically([
          ...prev,
          { ...sentMessage, reactions: sentMessage.reactions ?? [] },
        ]);
      });
      setError(null);
      setShowGifPicker(false);
    } catch (error) {
      console.error("Erreur lors de l'envoi du GIF privé:", error);
      setError("Impossible d'envoyer le GIF privé.");
    }
  };

  const handleStartEdit = (message: DirectMessage) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
    setError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMessageId || !editContent.trim()) return;

    const messageId = editingMessageId;
    const nextContent = editContent.trim();
    let previousMessages: DirectMessage[] = [];

    try {
      setError(null);

      setMessages((prev) => {
        previousMessages = [...prev];
        return prev.map((message) =>
          message.id === messageId
            ? { ...message, content: nextContent, edited_at: new Date().toISOString() }
            : message
        );
      });

      setEditingMessageId(null);
      setEditContent("");
      await updateDirectMessage(messageId, nextContent);
    } catch (editError) {
      if (previousMessages.length > 0) {
        setMessages(previousMessages);
      }
      console.error("Erreur lors de la modification du message privé:", editError);
      setError("Impossible de modifier le message privé.");
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessageToDelete(messageId);
    setShowDeleteMessageConfirm(true);
    setError(null);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    const targetMessageId = messageToDelete;
    let previousMessages: DirectMessage[] = [];

    try {
      setError(null);

      setMessages((prev) => {
        previousMessages = [...prev];
        return prev.filter((message) => message.id !== targetMessageId);
      });

      if (editingMessageId === targetMessageId) {
        setEditingMessageId(null);
        setEditContent("");
      }

      setShowDeleteMessageConfirm(false);
      setMessageToDelete(null);

      await deleteDirectMessage(targetMessageId);
    } catch (deleteError) {
      if (previousMessages.length > 0) {
        setMessages(previousMessages);
      }
      console.error("Erreur lors de la suppression du message privé:", deleteError);
      setError("Impossible de supprimer le message privé.");
    }
  };

  const handleFileUpload = async () => {
    if (!selectedConversationId) return;

    if (isTauriWindow()) {
      try {
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
        await handleSendGif(res.url);
      } catch (err) {
        console.error("Tauri DM upload failed", err);
      } finally {
        setIsUploading(false);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleWebFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversationId) return;

    try {
      setIsUploading(true);
      const res = await uploadFile(file);
      await handleSendGif(res.url);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Web DM upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleDirectReaction = async (messageId: string, emoji: string): Promise<boolean> => {
    if (!currentUser?.id || !emoji.trim()) return false;

    const normalizedEmoji = emoji.trim();
    const normalizedViewerId = currentUser.id.toLowerCase();
    const currentMessage = messages.find((message) => message.id === messageId);
    if (!currentMessage) return false;

    const currentReactions = currentMessage.reactions ?? [];
    const hasReaction = currentReactions.some(
      (reaction) => reaction.user_id.toLowerCase() === normalizedViewerId && reaction.emoji === normalizedEmoji
    );

    const previousMessages = messages;

    try {
      setError(null);

      setMessages((prev) =>
        prev.map((message) => {
          if (message.id !== messageId) return message;

          const reactions = message.reactions ?? [];

          if (hasReaction) {
            return {
              ...message,
              reactions: reactions.filter(
                (reaction) =>
                  !(reaction.user_id.toLowerCase() === normalizedViewerId && reaction.emoji === normalizedEmoji)
              ),
            };
          }

          const optimisticReaction: MessageReaction = {
            user_id: currentUser.id,
            emoji: normalizedEmoji,
            created_at: new Date().toISOString(),
          };

          return {
            ...message,
            reactions: [
              ...reactions.filter(
                (reaction) => reaction.user_id.toLowerCase() !== normalizedViewerId
              ),
              optimisticReaction,
            ],
          };
        })
      );

      if (hasReaction) {
        await removeDirectMessageReaction(messageId, normalizedEmoji);
      } else {
        await addDirectMessageReaction(messageId, normalizedEmoji);
      }

      return true;
    } catch (reactionError) {
      setMessages(previousMessages);
      console.error("Erreur lors de la reaction du message privé:", reactionError);
      setError("Impossible de mettre a jour la reaction.");
      return false;
    }
  };

  if (!guardReady) {
    return <main className="min-h-screen" />;
  }

  return (
    <main className="flex w-full h-screen overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden h-14 bg-[rgba(5,10,15,0.95)] border-b border-[#4fdfff]/20 flex items-center justify-between px-4">
        <button
          onClick={() => router.push("/")}
          className="p-2 text-white/60 hover:text-white transition-colors"
          aria-label="Retour"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div className="flex-1 mx-4">
          <h1 className="text-white font-semibold truncate">{t("dm.title")}</h1>
        </div>

        <button
          onClick={() => setShowNewChatModal(true)}
          className="p-2 text-[#4fdfff] hover:text-white transition-colors"
          aria-label={t("dm.newConversation")}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </header>

      {/* ========== FRIENDS SIDEBAR ========== */}
      <aside className="hidden md:flex w-[72px] bg-[rgba(0,0,0,0.95)] border-r border-[#4fdfff]/20 flex flex-col items-center py-3 gap-2">
        <button
          onClick={() => router.push("/")}
          className="w-12 h-12 flex items-center justify-center mb-2 cursor-pointer group bg-transparent border-0 shadow-none p-0"
          title={t("common.appName")}
        >
          <Image
            src="/logo.png"
            alt={t("auth.logoAlt")}
            width={32}
            height={32}
            className="group-hover:scale-110 transition-transform"
          />
        </button>
        <div className="w-8 h-[2px] bg-[#4fdfff]/20 rounded-full" />
        <div className="flex-1 w-full overflow-y-auto flex flex-col items-center gap-2 py-2">
          {friends.map((friend) => (
            <button
              key={`friend-${friend.id}`}
              onClick={() => router.push(`/messages?username=${encodeURIComponent(friend.username)}`)}
              className="w-12 h-12 rounded-[24px] bg-[rgba(15,40,30,0.8)] text-[#4fdfff] flex items-center justify-center hover:bg-[#4fdfff]/20 hover:rounded-xl transition-all relative overflow-hidden"
              title={`${t("friends.openDm")} ${friend.username}`}
            >
              {friend.avatar_url ? (
                <SmartImg
                  src={normalizeAvatarUrl(friend.avatar_url) || ""}
                  alt={friend.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold">{friend.username.charAt(0).toUpperCase()}</span>
              )}
              <span
                className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border border-[rgba(5,10,15,0.95)] ${getStatusColor(friend.status)}`}
              />
            </button>
          ))}
        </div>
 
        {/* Bottom Actions */}
        <div className="mt-auto flex flex-col items-center gap-2 pb-2">
          <button
            onClick={() => router.push("/")}
            className="w-12 h-12 rounded-[24px] bg-[rgba(20,30,40,0.8)] text-[#4fdfff] flex items-center justify-center hover:bg-[#4fdfff]/15 hover:border hover:border-[#4fdfff]/30 transition-all group"
            title={t("channel.backToChannels")}
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h7v7H3z" /><path d="M14 3h7v7h-7z" /><path d="M14 14h7v7h-7z" /><path d="M3 14h7v7H3z" />
            </svg>
          </button>

          {/* Profil utilisateur */}
          <button
            onClick={() => setShowProfile(true)}
            className="w-12 h-12 rounded-[24px] relative group border border-[#4fdfff]/30 hover:border-[#4fdfff] transition-all"
            title={t("profile.title")}
          >
            <div className="w-full h-full rounded-[24px] overflow-hidden">
              {currentUser?.avatar_url ? (
                <SmartImg
                  src={normalizeAvatarUrl(currentUser.avatar_url) || ''}
                  alt={t("profile.avatarLabel")}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#4fdfff]/10 flex items-center justify-center">
                  <span className="text-[#4fdfff] font-bold">
                    {currentUser?.username?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>
            <div 
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-[rgba(5,10,15,0.95)] rounded-full z-10 ${getStatusColor(currentUser?.status)}`} 
            />
          </button>

          <button
            onClick={() => logout()}
            className="w-12 h-12 rounded-[24px] bg-[rgba(40,10,10,0.8)] flex items-center justify-center text-[#ff3333] hover:bg-[#ff3333]/20 hover:rounded-xl transition-all"
            title={t("auth.logout")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
          {/* Premium button - Disabled since everything is free */}
          {/* <button
            onClick={() => setShowPremium(true)}
            className="w-12 h-12 rounded-[24px] bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 text-yellow-400 flex items-center justify-center hover:from-yellow-500/30 hover:to-yellow-600/30 hover:border-yellow-500/50 transition-all relative overflow-hidden"
            title={t("premium.title")}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15l-2-2L9.5 7.5m0 5L7 12m5 0l-2 2m0-5l-2.5-2.5M5 12h14" />
            </svg>
          </button> */}
        </div>
      </aside>

      {/* ========== DM SIDEBAR ========== */}
      <aside className="hidden md:flex w-60 bg-[rgba(5,10,15,0.95)] border-r border-[#4fdfff]/20 flex flex-col min-h-0">
        <div className="h-12 px-4 flex items-center justify-between border-b border-[#4fdfff]/30 shadow-lg bg-[rgba(0,0,0,0.3)]">
          <h2 className="font-bold text-white truncate flex-1 uppercase tracking-widest text-[10px]">{t("dm.title")}</h2>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="text-[#4fdfff] hover:text-white transition-colors text-xl font-bold"
            title={t("dm.newConversation")}
          >
            +
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          <div className="px-2 mb-3">
            <input
              type="text"
              placeholder={t("dm.searchPlaceholder")}
              className="w-full bg-black/40 border border-[#4fdfff]/20 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-[#4fdfff]/50"
            />
          </div>


          {conversations.length === 0 && (
            null
          )}

          <div className="space-y-[2px]">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  selectConversation(conv);
                  // On mobile, after selecting a conversation, we could close the sidebar
                  // For now, let's keep it simple since the conversation area is the main view
                }}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded transition-colors ${
                  selectedConversationId === conv.id
                    ? "bg-[#4fdfff]/15 text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <SmartImg
                    src={normalizeAvatarUrl(conv.avatar_url) || getAvatar(conv.recipient_id, currentUser)}
                    alt={conv.username}
                    className="w-8 h-8 rounded-full border border-[#4fdfff]/30 object-cover"
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[rgba(5,10,15,0.95)] rounded-full ${getStatusColor(conv.status)}`}
                  />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{conv.username}</p>
                  <p className="text-[10px] uppercase text-white/35">{t(getStatusKey(conv.status))}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

      </aside>

      {/* ========== CHAT CENTER ========== */}
      <div className="flex-1 min-w-0 flex flex-col bg-[rgba(10,15,20,0.98)]">
        {selectedConversationId ? (
           <div className="flex-1 min-h-0 flex flex-col">
              {/* En-tête de la conversation avec bouton d'appel */}
              <div className="px-2 md:px-4 py-2 md:py-3 border-b border-[#4fdfff]/20 bg-[rgba(0,0,0,0.2)] flex items-center justify-between">
                {/* Mobile conversation selector */}
                <div className="md:hidden flex-1 mr-2">
                  <select
                    value={selectedConversationId}
                    onChange={(e) => {
                      const conv = conversations.find(c => c.id === e.target.value);
                      if (conv) selectConversation(conv);
                    }}
                    className="w-full bg-[rgba(20,20,20,0.8)] border border-[#4fdfff]/30 rounded px-2 py-1 text-white text-sm outline-none focus:border-[#4fdfff]"
                  >
                    {conversations.map(conv => (
                      <option key={conv.id} value={conv.id}>{conv.username}</option>
                    ))}
                  </select>
                </div>
                
                {/* Desktop header */}
                <div className="hidden md:flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4fdfff]/10 border border-[#4fdfff]/30 flex items-center justify-center overflow-hidden">
                    <SmartImg
                      src={selectedConversationAvatar}
                      alt={selectedConversation?.username || t("dm.title")}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      @{selectedConversation?.username || t("dm.title")}
                    </h3>
                    <p className="text-white/60 text-sm">
                      {selectedConversation ? "En ligne" : "Hors ligne"}
                    </p>
                  </div>
                </div>
                
                {/* Voice call button - hidden on very small screens */}
                <div className="hidden sm:block">
                  <VoiceCall
                    currentUser={currentUser}
                    targetUser={selectedConversation ? {
                      id: selectedConversation.recipient_id,
                      username: selectedConversation.username,
                      email: selectedConversation.recipient_id + "@example.com", // Email fictif pour la compatibilité
                      avatar_url: selectedConversation.avatar_url,
                      status: selectedConversation.status, // Propriété status requise pour le type User
                      created_at: selectedConversation.created_at
                    } : null}
                    onCallStart={() => console.log("Call started")}
                    onCallEnd={() => console.log("Call ended")}
                  />
                </div>
              </div>
              
              <div
                ref={messagesContainerRef}
                onScroll={updateStickToBottom}
                className="flex-1 min-h-0 overflow-y-auto p-2 md:p-4"
              >
                {error && <p className="text-sm text-[#ff3333]">{error}</p>}
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="w-20 h-20 rounded-full bg-[#4fdfff]/10 border-2 border-[#4fdfff]/30 flex items-center justify-center mb-4 overflow-hidden">
                      <SmartImg
                        src={selectedConversationAvatar}
                        alt={selectedConversation?.username || t("dm.title")}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">
                      {selectedConversation ? `@${selectedConversation.username}` : t("dm.title")}
                    </h4>
                    <p className="text-white/50 text-sm">Aucun message pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-2">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className="flex items-start gap-3 px-4 py-2 rounded hover:bg-white/5 transition-colors group"
                      >
                      <button
                        type="button"
                        onClick={() => setSelectedPublicUserId(message.author_id)}
                        className="flex-shrink-0"
                      >
                        <SmartImg
                          src={getAvatar(message.author_id, currentUser)}
                          alt={message.username}
                          className="w-10 h-10 rounded-full object-cover border border-[#4fdfff]/30 group-hover:border-[#4fdfff]/50 transition-colors"
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <button
                            type="button"
                            onClick={() => setSelectedPublicUserId(message.author_id)}
                            className="font-semibold text-white hover:text-[#4fdfff] transition-colors cursor-pointer"
                          >
                            {message.username}
                          </button>
                          <span className="text-xs text-white/40">
                            {new Date(message.created_at).toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {message.edited_at && (
                              <span className="ml-1 text-[10px] text-white/20 italic">{t("chat.edited")}</span>
                            )}
                          </span>
                        </div>
                        {editingMessageId === message.id ? (
                          <form onSubmit={handleSaveEdit} className="mt-1">
                            <input
                              type="text"
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => e.key === "Escape" && setEditingMessageId(null)}
                              className="w-full px-3 py-1.5 bg-black/50 border border-[#4fdfff]/50 rounded text-white text-sm outline-none focus:border-[#4fdfff]"
                            />
                            <div className="flex gap-2 mt-2">
                              <button type="submit" className="text-[10px] text-[#4fdfff] hover:underline font-bold uppercase">{t("chat.save")}</button>
                              <button type="button" onClick={() => setEditingMessageId(null)} className="text-[10px] text-white/40 hover:underline font-bold uppercase">{t("common.cancel")}</button>
                            </div>
                          </form>
                        ) : isGifMessage(message.content) || message.content.includes("/files/") ? (
                          <div className="mt-1 relative group/file">
                            {message.content.match(/\.(jpg|jpeg|png|gif|webp)$/i) || isGifMessage(message.content) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={message.content.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL}${message.content}` : message.content}
                                alt={t("chat.uploadTooltip")}
                                className="max-w-xs max-h-64 rounded-lg border border-white/10 hover:border-[#4fdfff]/50 transition-colors cursor-pointer"
                                loading="lazy"
                              />
                            ) : (
                              <a
                                href={message.content.startsWith("/") ? `${process.env.NEXT_PUBLIC_API_URL}${message.content}` : message.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors w-fit"
                              >
                                <div className="w-10 h-10 bg-[#4fdfff]/10 rounded flex items-center justify-center">
                                  <svg className="w-6 h-6 text-[#4fdfff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <span className="text-sm text-white/80 font-mono truncate max-w-[200px]">
                                  {message.content.split("/").pop()}
                                </span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <p className="text-white/90 leading-relaxed break-all whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}

                        {!editingMessageId && (
                          <MessageReactions
                            messageId={message.id}
                            reactions={message.reactions ?? []}
                            viewerId={currentUser?.id}
                            onToggleReaction={toggleDirectReaction}
                            addReactionLabel={t("chat.addReaction")}
                          />
                        )}
                      </div>

                      {!editingMessageId && message.author_id === currentUser?.id && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-all ml-auto self-start">
                          <button
                            onClick={() => handleStartEdit(message)}
                            className="p-1.5 text-white/40 hover:text-[#4fdfff] transition-colors"
                            title={t("chat.edit")}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-1.5 text-white/40 hover:text-[#ff3333] transition-colors"
                            title={t("chat.delete")}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                )}
              </div>
              <footer className="px-2 md:px-4 py-2 md:py-3 border-t border-[#4fdfff]/20 bg-[rgba(0,0,0,0.2)]">
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
                        onSelect={handleSendGif}
                        onClose={() => setShowGifPicker(false)}
                        searchPlaceholder={t("chat.gifSearch")}
                      />
                    )}
                    <form onSubmit={handleSendDirectMessage} className="flex items-center gap-1 md:gap-2">
                       <button
                        type="button"
                        onClick={handleFileUpload}
                        disabled={isUploading}
                        className="p-1.5 md:px-2 md:py-2 text-white/40 hover:text-[#4fdfff] transition-colors flex-shrink-0 disabled:opacity-50"
                        title={t("chat.uploadTooltip")}
                      >
                        {isUploading ? (
                          <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-[#4fdfff] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowGifPicker(true)}
                        className="px-1.5 py-1.5 md:px-2 md:py-2 text-[10px] md:text-xs font-bold text-[#4fdfff] border border-[#4fdfff]/40 rounded-lg hover:bg-[#4fdfff]/10 transition-colors flex-shrink-0"
                        title={t("chat.gifTooltip")}
                      >
                        GIF
                      </button>
                      <div className="relative flex-1">
                        <input
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder={`Message @${selectedConversation?.username}`}
                          className="w-full pl-3 md:pl-4 pr-3 md:pr-12 py-2 md:py-2.5 bg-[rgba(20,20,20,0.8)] border border-[#4fdfff]/30 rounded-lg text-white placeholder:text-white/40 outline-none focus:border-[#4fdfff] focus:bg-[rgba(20,20,20,0.95)] transition-all text-sm md:text-base"
                        />
                      </div>
                    </form>
                  </div>
                </footer>
           </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="w-32 h-32 rounded-full bg-[#4fdfff]/5 border-2 border-[#4fdfff]/20 flex items-center justify-center mb-8 mx-auto relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#4fdfff]/5 blur-xl group-hover:blur-2xl transition-all" />
              <svg className="w-16 h-16 text-[#4fdfff] relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{t("dm.welcomeTitle")}</h2>
            <p className="text-white/40 max-w-sm">{t("dm.welcomeDescription")}</p>
            <Button onClick={() => setShowNewChatModal(true)} variant="outline" className="mt-8 border-[#4fdfff] text-[#4fdfff] px-8 py-6 text-lg hover:bg-[#4fdfff]/10 transition-all">
                {t("dm.startButton")}
            </Button>
          </div>
        )}
      </div>

      {/* ========== MODAL NOUVELLE CONVERSATION ========== */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={resetNewConversationModal} />
          <form onSubmit={handleStartConversation} className="relative bg-[rgba(20,20,20,0.98)] border-2 border-[#4fdfff] rounded-xl p-6 w-full max-w-md shadow-[0_0_40px_rgba(79,223,255,0.2)]">
            <h2 className="text-xl font-bold text-white mb-4">Nouvelle conversation</h2>
            <p className="text-white/60 text-sm mb-4">Recherche ton contact puis sélectionne un pseudo fiable pour démarrer la conversation.</p>
            
            <input
              autoFocus
              type="text"
              value={searchUsername}
              onChange={(e) => {
                setSearchUsername(e.target.value);
                setModalError(null);
              }}
              placeholder="Pseudo (ex: CyberGhost)"
              className="w-full bg-black/50 border border-[#4fdfff]/30 rounded-lg p-3 text-white outline-none focus:border-[#4fdfff]"
            />

            {modalError && (
              <p className="mt-3 text-sm text-[#ff3333]">{modalError}</p>
            )}

            <div className="mt-3 mb-6 rounded-lg border border-[#4fdfff]/20 bg-black/30 overflow-hidden">
              {searchLoading && (
                <p className="px-3 py-3 text-sm text-white/50">Recherche en cours...</p>
              )}

              {!searchLoading && searchUsername.trim() && searchResults.length === 0 && (
                <p className="px-3 py-3 text-sm text-white/40">Aucun utilisateur correspondant.</p>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map((user) => {
                    const isSelected = searchUsername.trim() === user.username;

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSearchUsername(user.username);
                          setModalError(null);
                        }}
                        className={`flex w-full items-center gap-3 px-3 py-3 text-left transition-colors ${
                          isSelected ? "bg-[#4fdfff]/15 text-white" : "text-white/75 hover:bg-white/5"
                        }`}
                      >
                        <SmartImg
                          src={getAvatar(user.id, null)}
                          alt={user.username}
                          className="h-10 w-10 rounded-full border border-[#4fdfff]/30"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{user.username}</p>
                          <p className="truncate text-[11px] uppercase text-white/35">
                            {t(getStatusKey(user.status))}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={resetNewConversationModal} className="flex-1">
                Annuler
              </Button>
              <Button type="submit" className="flex-1 bg-[#4fdfff] text-black" disabled={!searchUsername.trim() || searchLoading}>
                Lancer
              </Button>
            </div>
          </form>
        </div>
      )}

      {showDeleteMessageConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteMessageConfirm(false);
              setMessageToDelete(null);
            }}
          />
          <div className="relative bg-[rgba(20,20,20,0.98)] border-2 border-[#ff3333] rounded-xl p-6 w-full max-w-sm shadow-[0_0_40px_rgba(255,51,51,0.3)]">
            <h2 className="text-xl font-bold text-center text-white mb-2">{t("chat.confirmDeleteTitle")}</h2>
            <p className="text-center text-white/60 text-sm mb-6">
              {t("chat.confirmDeleteMessage")}
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => {
                  setShowDeleteMessageConfirm(false);
                  setMessageToDelete(null);
                }}
                className="flex-1"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={confirmDeleteMessage}
                className="flex-1"
              >
                {t("chat.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showProfile && currentUser && (
        <ProfileCard user={currentUser as User} onClose={() => setShowProfile(false)} />
      )}

      {selectedPublicUserId && (
        <PublicProfileCard
          userId={selectedPublicUserId}
          onClose={() => setSelectedPublicUserId(null)}
          onFriendAdded={refreshFriends}
          onFriendRemoved={refreshFriends}
        />
      )}

      {/* Premium Settings Modal - Disabled since everything is free */}
      {/* {showPremium && (
        <PremiumSettings
          user={currentUser}
          onClose={() => setShowPremium(false)}
        />
      )} */}

      {/* Voice Call Manager */}
      <VoiceCallManager
        user={currentUser}
        onIncomingCall={(call) => {
          console.log("Incoming call:", call);
          // Handle incoming call logic
        }}
        onCallEnded={(callId) => {
          console.log("Call ended:", callId);
          // Handle call ended logic
        }}
      />
      
      {/* Premium Floating Button - Disabled since everything is free */}
      {/* <PremiumFloatingButton /> */}
    </main>
  );
}

export default function DirectMessagesPage() {
  return (
    <Suspense fallback={<main className="flex w-full h-screen bg-[rgba(10,15,20,0.98)]" />}>
      <DirectMessagesPageContent />
    </Suspense>
  );
}
