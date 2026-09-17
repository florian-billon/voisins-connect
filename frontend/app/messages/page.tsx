"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { listDirectConversations, createDirectConversation, listDirectMessages, sendDirectMessage, DirectConversation, DirectMessage, listFriends, Friend } from "@/lib/api-client";
import { useTranslation } from "@/lib/i18n";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SmartImg from "@/components/ui/SmartImg";

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const usernameParam = searchParams.get("username");

  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<DirectConversation | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const loadConversations = async () => {
    if (!user) return;
    setLoadingConversations(true);
    try {
      const convs = await listDirectConversations();
      setConversations(convs);
      
      // Si un username est passé en paramètre, trouver ou créer la conversation
      if (usernameParam) {
        const existingConv = convs.find(c => 
          c.username === usernameParam
        );
        
        if (existingConv) {
          setSelectedConversation(existingConv);
          loadMessages(existingConv.id);
        } else {
          // Créer une nouvelle conversation
          const newConv = await createDirectConversation(usernameParam);
          setSelectedConversation(newConv);
          loadMessages(newConv.id);
        }
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const msgs = await listDirectMessages(conversationId);
      setMessages(msgs);
    } catch (err) {
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conv: DirectConversation) => {
    setSelectedConversation(conv);
    loadMessages(conv.id);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !user) return;
    try {
      await sendDirectMessage(selectedConversation.id, messageInput);
      setMessageInput("");
      // Recharger les messages
      await loadMessages(selectedConversation.id);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user]);

  if (!user) {
    return (
      <main className="flex w-full min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">Vous devez être connecté pour accéder aux messages</p>
          <Button onClick={() => router.push("/login")}>{t("auth.login.submit")}</Button>
        </div>
      </main>
    );
  }

  const getConversationName = (conv: DirectConversation) => {
    return conv.username || "Conversation";
  };

  const getConversationAvatar = (conv: DirectConversation) => {
    return conv.avatar_url;
  };

  return (
    <main className="flex w-full min-h-screen">
      {/* Liste des conversations */}
      <div className="w-64 bg-[#1a1a1a] border-r border-[#5b8cff]/20 p-4 hidden md:block">
        <h2 className="text-white font-bold mb-4">{t("dm.title")}</h2>
        {loadingConversations ? (
          <p className="text-white/40 text-sm">Chargement...</p>
        ) : conversations.length === 0 ? (
          <p className="text-white/40 text-sm">Aucune conversation pour le moment</p>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                  selectedConversation?.id === conv.id
                    ? "bg-[#5b8cff]/20 border border-[#5b8cff]/30"
                    : "bg-[#2a2a2a] hover:bg-[#3a3a3a]"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#5b8cff]/20 flex items-center justify-center">
                  {getConversationAvatar(conv) ? (
                    <SmartImg src={getConversationAvatar(conv)!} alt={getConversationName(conv)} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-[#5b8cff] font-bold">{getConversationName(conv).charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="text-white">{getConversationName(conv)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="bg-[#1a1a1a] border-b border-[#5b8cff]/20 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#5b8cff]/20 flex items-center justify-center">
                {getConversationAvatar(selectedConversation) ? (
                  <SmartImg src={getConversationAvatar(selectedConversation)!} alt={getConversationName(selectedConversation)} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-[#5b8cff] font-bold">{getConversationName(selectedConversation).charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="text-white font-bold">{getConversationName(selectedConversation)}</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>
                ← Retour
              </Button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {loading ? (
                <p className="text-white/40 text-center">Chargement...</p>
              ) : messages.length === 0 ? (
                <p className="text-white/40 text-center">Aucun message. Commencez la conversation !</p>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.sender_id === user?.id
                          ? "ml-auto bg-[#5b8cff]/20 border border-[#5b8cff]/30"
                          : "mr-auto bg-[#2a2a2a]"
                      }`}
                    >
                      <p className="text-white text-sm">{msg.content}</p>
                      <p className="text-white/40 text-xs mt-1">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#1a1a1a] border-t border-[#5b8cff]/20 p-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Écrivez votre message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage}>Envoyer</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-white text-xl font-bold mb-4">{t("dm.title")}</h2>
              <p className="text-white/60 mb-4">Sélectionnez une conversation pour commencer</p>
              <Button onClick={() => router.push("/")}>Retour à l'accueil</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
