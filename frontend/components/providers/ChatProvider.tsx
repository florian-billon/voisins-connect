"use client";

import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useServers, useChannels, useMessages, useMembers, useAuth, useFriends } from "@/hooks";
import { User, Message, Server, Channel, Friend, ServerMember } from "@/lib/api-client";
import { useTranslation } from "@/lib/i18n";

interface ChatContextType {
  // Auth & Friends
  user: User | null;
  friends: Friend[];
  refreshFriends: () => Promise<void>;

  // Servers
  servers: Server[];
  selectedServer: Server | null;
  selectServer: (server: Server | null) => void;
  createServer: (name: string) => Promise<any>;
  creatingServer: boolean;
  updateServer: (serverId: string, name: string) => Promise<any>;
  leaveServer: (serverId: string) => Promise<boolean>;
  deleteServer: (serverId: string) => Promise<boolean>;
  transferOwnership: (serverId: string, newOwnerId: string) => Promise<any>;
  serversLoading: boolean;
  serversError: string | null;

  // Channels
  channels: Channel[];
  selectedChannel: Channel | null;
  selectChannel: (channel: Channel | null) => void;
  createChannel: (name: string) => Promise<any>;
  creatingChannel: boolean;
  updateChannel: (id: string, name: string) => Promise<any>;
  deleteChannel: (id: string) => Promise<boolean>;
  channelsLoading: boolean;
  channelsError: string | null;

  // Messages
  messages: Message[];
  sendMessage: (content: string) => Promise<boolean>;
  updateMessage: (id: string, content: string) => Promise<boolean>;
  deleteMessage: (id: string) => Promise<boolean>;
  toggleReaction: (messageId: string, emoji: string) => Promise<boolean>;
  messagesLoading: boolean;
  messagesError: string | null;
  typingUsers: Map<string, string>;
  typingStart: (channelId: string) => void;
  typingStop: (channelId: string) => void;

  // Members
  members: ServerMember[];
  kickMember: (userId: string) => Promise<boolean>;
  banMember: (userId: string) => Promise<boolean>;

  // UI State
  showProfile: boolean;
  setShowProfile: (show: boolean) => void;
  selectedPublicUserId: string | null;
  setSelectedPublicUserId: (userId: string | null) => void;
  
  showCreateServer: boolean;
  setShowCreateServer: (show: boolean) => void;
  showCreateChannel: boolean;
  setShowCreateChannel: (show: boolean) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  showLeaveConfirm: boolean;
  setShowLeaveConfirm: (show: boolean) => void;
  showDeleteMessageConfirm: boolean;
  setShowDeleteMessageConfirm: (show: boolean) => void;
  showDeleteChannelConfirm: boolean;
  setShowDeleteChannelConfirm: (show: boolean) => void;
  showInviteModal: boolean;
  setShowInviteModal: (show: boolean) => void;
  showGifPicker: boolean;
  setShowGifPicker: (show: boolean | ((prev: boolean) => boolean)) => void;
  showRenameServer: boolean;
  setShowRenameServer: (show: boolean) => void;
  showRenameChannel: boolean;
  setShowRenameChannel: (show: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { friends, refreshFriends } = useFriends(user?.id);
  const { t } = useTranslation();

  const {
    servers, selectedServer, selectServer, createServer, creatingServer,
    updateServer, leaveServer, deleteServer, transferOwnership,
    loading: serversLoading, error: serversError,
  } = useServers(user?.id);

  const {
    channels, selectedChannel, selectChannel, createChannel, creatingChannel, updateChannel, deleteChannel,
    loading: channelsLoading, error: channelsError,
  } = useChannels(selectedServer?.id ?? null);

  const {
    messages, sendMessage, updateMessage, deleteMessage, toggleReaction,
    loading: messagesLoading, error: messagesError, typingUsers, typingStart, typingStop,
  } = useMessages(selectedChannel?.id ?? null, user?.id ?? null);

  const { members, kickMember, banMember } = useMembers(selectedServer?.id ?? null);

  // UI States
  const [showProfile, setShowProfile] = useState(false);
  const [selectedPublicUserId, setSelectedPublicUserId] = useState<string | null>(null);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteMessageConfirm, setShowDeleteMessageConfirm] = useState(false);
  const [showDeleteChannelConfirm, setShowDeleteChannelConfirm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showRenameServer, setShowRenameServer] = useState(false);
  const [showRenameChannel, setShowRenameChannel] = useState(false);

  const value = {
    user,
    friends,
    refreshFriends,
    servers,
    selectedServer,
    selectServer,
    createServer,
    creatingServer,
    updateServer,
    leaveServer,
    deleteServer,
    transferOwnership,
    serversLoading,
    serversError,
    channels,
    selectedChannel,
    selectChannel,
    createChannel,
    creatingChannel,
    updateChannel,
    deleteChannel,
    channelsLoading,
    channelsError,
    messages,
    sendMessage,
    updateMessage,
    deleteMessage,
    toggleReaction,
    messagesLoading,
    messagesError,
    typingUsers,
    typingStart,
    typingStop,
    members,
    kickMember,
    banMember,
    showProfile,
    setShowProfile,
    selectedPublicUserId,
    setSelectedPublicUserId,
    showCreateServer,
    setShowCreateServer,
    showCreateChannel,
    setShowCreateChannel,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showLeaveConfirm,
    setShowLeaveConfirm,
    showDeleteMessageConfirm,
    setShowDeleteMessageConfirm,
    showDeleteChannelConfirm,
    setShowDeleteChannelConfirm,
    showInviteModal,
    setShowInviteModal,
    showGifPicker,
    setShowGifPicker,
    showRenameServer,
    setShowRenameServer,
    showRenameChannel,
    setShowRenameChannel,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
