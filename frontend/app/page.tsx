"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRouteGuard } from "@/lib/auth/guards";
import { useChat } from "@/components/providers/ChatProvider";
import ProfileCard from "@/components/profile/ProfileCard";
import PublicProfileCard from "@/components/profile/PublicProfileCard";
import InviteModal from "@/components/modals/InviteModal";
import { User } from "@/lib/api-client";
import { useTranslation } from "@/lib/i18n";

import ServerSidebar from "@/components/layout/ServerSidebar";
import ChannelSidebar from "@/components/layout/ChannelSidebar";
import ChatCenter from "@/components/layout/ChatCenter";
import MemberSidebar from "@/components/layout/MemberSidebar";
import CreateServerModal from "@/components/modals/CreateServerModal";
import CreateChannelModal from "@/components/modals/CreateChannelModal";
import DeleteServerModal from "@/components/modals/DeleteServerModal";
import LeaveServerModal from "@/components/modals/LeaveServerModal";
import DeleteChannelModal from "@/components/modals/DeleteChannelModal";
import DeleteMessageModal from "@/components/modals/DeleteMessageModal";
import RenameModal from "@/components/modals/RenameModal";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const { ready: guardReady } = useRouteGuard("protected");
  
  const {
    user, friends, refreshFriends,
    servers, selectedServer, selectServer, createServer, creatingServer,
    leaveServer, deleteServer, transferOwnership,
    serversLoading, serversError,
    channels, selectedChannel, selectChannel, createChannel, creatingChannel, deleteChannel,
    channelsLoading, channelsError,
    messages, sendMessage, updateMessage, deleteMessage, toggleReaction,
    messagesLoading, messagesError, typingUsers, typingStart, typingStop,
    members, kickMember, banMember,
    showProfile, setShowProfile,
    selectedPublicUserId, setSelectedPublicUserId,
    showCreateServer, setShowCreateServer,
    showCreateChannel, setShowCreateChannel,
    showDeleteConfirm, setShowDeleteConfirm,
    showLeaveConfirm, setShowLeaveConfirm,
    showDeleteMessageConfirm, setShowDeleteMessageConfirm,
    showDeleteChannelConfirm, setShowDeleteChannelConfirm,
    showInviteModal, setShowInviteModal,
    showGifPicker, setShowGifPicker,
    showRenameServer, setShowRenameServer,
    showRenameChannel, setShowRenameChannel,
    updateServer, updateChannel,
  } = useChat();

  const [newServerName, setNewServerName] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [channelSearchState, setChannelSearchState] = useState<{ serverId: string | null; value: string }>({ serverId: null, value: "" });
  const [messageInput, setMessageInput] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [channelToDelete, setChannelToDelete] = useState<{ id: string; name: string } | null>(null);
  const [channelToRename, setChannelToRename] = useState<{ id: string; name: string } | null>(null);
  const [newOwnerIdForLeave, setNewOwnerIdForLeave] = useState("");
  const [leaveModalError, setLeaveModalError] = useState<string | null>(null);
  
  const typingStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const TYPING_STOP_DELAY_MS = 2000;

  const viewerId = user?.id;
  const isServerOwner = selectedServer?.owner_id === viewerId;
  const transferCandidates = members.filter((m) => m.user_id !== viewerId);
  const viewerRole = members.find((m) => m.user_id === viewerId)?.role;
  const canManageChannels = viewerRole === "Owner" || viewerRole === "Admin";
  const channelSearch = selectedServer?.id && channelSearchState.serverId === selectedServer.id ? channelSearchState.value : "";
  const visibleChannels = channelSearch.trim()
    ? channels.filter((c) => c.name.toLowerCase().includes(channelSearch.trim().toLowerCase()))
    : channels;

  const scheduleTypingStop = useCallback(() => {
    if (typingStopTimeoutRef.current) clearTimeout(typingStopTimeoutRef.current);
    if (!selectedChannel?.id) return;
    typingStopTimeoutRef.current = setTimeout(() => {
      typingStop(selectedChannel.id);
      typingStopTimeoutRef.current = null;
    }, TYPING_STOP_DELAY_MS);
  }, [selectedChannel?.id, typingStop]);

  const handleInputFocus = useCallback(() => {
    if (selectedChannel?.id) typingStart(selectedChannel.id);
  }, [selectedChannel?.id, typingStart]);

  const handleInputBlur = useCallback(() => {
    if (typingStopTimeoutRef.current) { clearTimeout(typingStopTimeoutRef.current); typingStopTimeoutRef.current = null; }
    if (selectedChannel?.id) typingStop(selectedChannel.id);
  }, [selectedChannel?.id, typingStop]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    scheduleTypingStop();
  }, [scheduleTypingStop]);

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim()) return;
    const server = await createServer(newServerName.trim());
    if (server) { setNewServerName(""); setShowCreateServer(false); }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    const channel = await createChannel(newChannelName.trim());
    if (channel) {
      setNewChannelName("");
      setShowCreateChannel(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    if (selectedChannel?.id) typingStop(selectedChannel.id);
    await sendMessage(messageInput.trim());
    setMessageInput("");
  };

  const handleStartEdit = (message: any) => { setEditingMessageId(message.id); setEditContent(message.content); };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMessageId || !editContent.trim()) return;
    await updateMessage(editingMessageId, editContent.trim());
    setEditingMessageId(null);
    setEditContent("");
  };

  const handleDeleteMessage = (id: string) => { setMessageToDelete(id); setShowDeleteMessageConfirm(true); };

  const handleDeleteChannel = (id: string, name: string) => { setChannelToDelete({ id, name }); setShowDeleteChannelConfirm(true); };

  const openUserProfile = useCallback((userId: string) => {
    if (viewerId && userId === viewerId) { setShowProfile(true); return; }
    setSelectedPublicUserId(userId);
  }, [viewerId, setShowProfile, setSelectedPublicUserId]);

  const confirmDeleteChannel = async () => {
    if (!channelToDelete) return;
    await deleteChannel(channelToDelete.id);
    setShowDeleteChannelConfirm(false);
    setChannelToDelete(null);
  };

  const confirmDeleteMessage = async () => {
    if (messageToDelete) await deleteMessage(messageToDelete);
    setShowDeleteMessageConfirm(false);
    setMessageToDelete(null);
  };

  const handleShowLeave = () => {
    setLeaveModalError(null);
    setNewOwnerIdForLeave(isServerOwner ? (transferCandidates[0]?.user_id || "") : "");
    setShowLeaveConfirm(true);
  };

  const handleConfirmLeave = async () => {
    if (!selectedServer) return;
    if (isServerOwner) {
      if (transferCandidates.length === 0) { setLeaveModalError(t("server.confirmLeave.noCandidates")); return; }
      if (!newOwnerIdForLeave) { setLeaveModalError(t("server.confirmLeave.transferRequired")); return; }
      const transferred = await transferOwnership(selectedServer.id, newOwnerIdForLeave);
      if (!transferred) { setLeaveModalError(serversError || t("error.default")); return; }
    }
    const left = await leaveServer(selectedServer.id);
    if (!left) { setLeaveModalError(serversError || t("error.default")); return; }
    setShowLeaveConfirm(false);
    setLeaveModalError(null);
  };

  if (!guardReady || serversLoading) {
    return (
      <main className="flex w-full h-screen gap-2 p-2 items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-[#4fdfff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#4fdfff] font-mono text-sm tracking-widest animate-pulse">{t("chat.initializing")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex w-full h-screen">
      <ServerSidebar
        servers={servers}
        selectedServer={selectedServer}
        friends={friends}
        user={user}
        onSelectServer={selectServer}
        onShowProfile={() => setShowProfile(true)}
        onNavigateDMs={() => router.push("/messages")}
        onOpenFriendDM={(username) => router.push(`/messages?username=${encodeURIComponent(username)}`)}
      />

      <ChannelSidebar
        selectedServer={selectedServer}
        channels={channels}
        visibleChannels={visibleChannels}
        selectedChannel={selectedChannel}
        channelSearch={channelSearch}
        channelsLoading={channelsLoading}
        channelsError={channelsError}
        canManageChannels={canManageChannels}
        isServerOwner={isServerOwner}
        transferCandidates={transferCandidates}
        onSelectChannel={selectChannel}
        onChannelSearch={(serverId, value) => setChannelSearchState({ serverId, value })}
        onCreateChannel={() => setShowCreateChannel(true)}
        onCreateServer={() => setShowCreateServer(true)}
        onDeleteChannel={handleDeleteChannel}
        onEditChannel={(c) => { setChannelToRename(c); setShowRenameChannel(true); }}
        onEditServer={() => setShowRenameServer(true)}
        onDeleteServer={() => setShowDeleteConfirm(true)}
        onShowLeave={handleShowLeave}
      />

      <ChatCenter
        selectedServer={selectedServer}
        selectedChannel={selectedChannel}
        messages={messages}
        messagesLoading={messagesLoading}
        messagesError={messagesError}
        messageInput={messageInput}
        showGifPicker={showGifPicker}
        editingMessageId={editingMessageId}
        editContent={editContent}
        typingUsers={typingUsers}
        user={user}
        viewerId={viewerId}
        onCreateServer={() => setShowCreateServer(true)}
        onCreateChannel={() => setShowCreateChannel(true)}
        onSendMessage={handleSendMessage}
        onMessageInputChange={handleInputChange}
        onMessageInputFocus={handleInputFocus}
        onMessageInputBlur={handleInputBlur}
        onToggleGifPicker={() => setShowGifPicker((v) => !v)}
        onSendGif={async (url) => { await sendMessage(url); setShowGifPicker(false); }}
        onStartEdit={handleStartEdit}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={() => setEditingMessageId(null)}
        onEditContentChange={setEditContent}
        onDeleteMessage={handleDeleteMessage}
        onOpenUserProfile={openUserProfile}
        onToggleReaction={toggleReaction}
      />

      {selectedServer && (
        <MemberSidebar
          selectedServer={selectedServer}
          selectedChannel={selectedChannel}
          members={members}
          user={user}
          typingUsers={typingUsers}
          viewerId={viewerId}
          onInvite={() => setShowInviteModal(true)}
          onKick={kickMember}
          onBan={banMember}
          onOpenProfile={openUserProfile}
        />
      )}

      <CreateServerModal
        show={showCreateServer}
        serverName={newServerName}
        error={serversError}
        creating={creatingServer}
        onClose={() => setShowCreateServer(false)}
        onChange={setNewServerName}
        onSubmit={handleCreateServer}
      />

      <CreateChannelModal
        show={showCreateChannel}
        channelName={newChannelName}
        serverName={selectedServer?.name || ""}
        submitting={creatingChannel}
        onClose={() => setShowCreateChannel(false)}
        onChange={setNewChannelName}
        onSubmit={handleCreateChannel}
      />

      <DeleteServerModal
        show={showDeleteConfirm && !!selectedServer}
        serverName={selectedServer?.name || ""}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          if (!isServerOwner || !selectedServer) return;
          setShowDeleteConfirm(false);
          await deleteServer(selectedServer.id);
        }}
      />

      <LeaveServerModal
        show={showLeaveConfirm && !!selectedServer}
        serverName={selectedServer?.name || ""}
        isOwner={isServerOwner}
        transferCandidates={transferCandidates}
        newOwnerId={newOwnerIdForLeave}
        error={leaveModalError}
        onClose={() => { setShowLeaveConfirm(false); setLeaveModalError(null); }}
        onChangeNewOwner={(id) => { setNewOwnerIdForLeave(id); setLeaveModalError(null); }}
        onConfirm={handleConfirmLeave}
      />

      <DeleteChannelModal
        show={showDeleteChannelConfirm && !!channelToDelete}
        channelName={channelToDelete?.name || ""}
        onClose={() => { setShowDeleteChannelConfirm(false); setChannelToDelete(null); }}
        onConfirm={confirmDeleteChannel}
      />

      <DeleteMessageModal
        show={showDeleteMessageConfirm}
        onClose={() => setShowDeleteMessageConfirm(false)}
        onConfirm={confirmDeleteMessage}
      />

      {selectedServer && (
        <RenameModal
          show={showRenameServer}
          title={t("server.renameTitle")}
          initialValue={selectedServer.name}
          onClose={() => setShowRenameServer(false)}
          onConfirm={async (newName) => { await updateServer(selectedServer.id, newName); }}
        />
      )}

      {channelToRename && (
        <RenameModal
          show={showRenameChannel}
          title={t("channel.renameTitle")}
          initialValue={channelToRename.name}
          onClose={() => { setShowRenameChannel(false); setChannelToRename(null); }}
          onConfirm={async (newName) => { await updateChannel(channelToRename.id, newName); }}
        />
      )}

      {showProfile && user && (
        <ProfileCard user={user as User} onClose={() => setShowProfile(false)} />
      )}

      {selectedPublicUserId && (
        <PublicProfileCard
          userId={selectedPublicUserId}
          onClose={() => setSelectedPublicUserId(null)}
          onFriendAdded={refreshFriends}
        />
      )}

      {showInviteModal && selectedServer && (
        <InviteModal
          serverId={selectedServer.id}
          serverName={selectedServer.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </main>
  );
}
