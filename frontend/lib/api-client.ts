import { API_URL } from "./config";
import { fetchWithRetry } from "./fetchWithRetry";
import { getStoredToken } from "./token-storage";

const IDEMPOTENT_REQUEST_RETRIES = 7;
const IDEMPOTENT_REQUEST_INITIAL_DELAY_MS = 1000;
const IDEMPOTENT_REQUEST_MAX_DELAY_MS = 5000;

function isIdempotentRequest(method?: string): boolean {
  return !method || method.toUpperCase() === "GET";
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  authenticate = true
): Promise<T> {
  const token = authenticate ? getStoredToken() : null;

  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Skip default Content-Type if body is FormData to let the browser set the boundary correctly
  if (!(options.body instanceof FormData)) {
    (headers as any)["Content-Type"] = "application/json";
  }

  const requestInit: RequestInit = {
    ...options,
    headers,
    cache: "no-store",
  };

  try {
    const res = await fetchWithRetry(`${API_URL}${endpoint}`, requestInit, {
      retries: isIdempotentRequest(options.method) ? IDEMPOTENT_REQUEST_RETRIES : 0,
      initialDelayMs: IDEMPOTENT_REQUEST_INITIAL_DELAY_MS,
      maxDelayMs: IDEMPOTENT_REQUEST_MAX_DELAY_MS,
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = `HTTP ${res.status}`;
      let errorDetails: string | undefined;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
        errorDetails = errorData.details;

        if (process.env.NODE_ENV === "development") {
          console.error("[API Error]", {
            endpoint,
            status: res.status,
            error: errorMessage,
            details: errorDetails,
            fullResponse: errorData,
          });
        }
      } catch {
        errorMessage = errorText || errorMessage;
      }

      if (res.status === 401) {
        errorMessage = "error.authRequired";
      }

      const fullErrorMessage = errorDetails
        ? `${errorMessage}: ${errorDetails}`
        : errorMessage;

      throw new Error(fullErrorMessage);
    }

    if (res.status === 204) return {} as T;
    return await res.json();
  } catch (err) {
    if (err instanceof Error) {
      const message = err.message.toLowerCase();
      const isNetworkLikeError =
        err.name === "TypeError" ||
        message.includes("fetch failed") ||
        message.includes("network") ||
        message.includes("econnrefused") ||
        message.includes("connection refused") ||
        message.includes("timed out") ||
        message.includes("socket");

      if (isNetworkLikeError) {
        throw new Error("error.backendUnavailable");
      }

      throw err;
    }

    throw new Error("error.backendUnavailable");
  }
}

export interface Server {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  server_id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  server_id: string;
  channel_id: string;
  author_id: string;
  username: string;
  content: string;
  created_at: string;
  edited_at?: string;
  reactions: MessageReaction[];
}

export interface MessageReaction {
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface DirectConversation {
  id: string;
  recipient_id: string;
  username: string;
  avatar_url?: string;
  status: string;
  created_at: string;
}

export interface UploadResponse {
  url: string;
  filename: string;
}

export interface DirectMessage {
  id: string;
  dm_id: string;
  author_id: string;
  username: string;
  content: string;
  created_at: string;
  edited_at?: string;
  reactions: MessageReaction[];
}

export interface ServerMember {
  server_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  username: string;
  avatar_url?: string;
  status?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  status: string;
  created_at: string;
}

export interface UserSearchResult {
  id: string;
  username: string;
  avatar_url?: string;
  status: string;
}

export interface Friend {
  id: string;
  username: string;
  avatar_url?: string;
  status: string;
  created_at: string;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  status: string;
  created_at: string;
  is_self: boolean;
  is_friend: boolean;
}

export async function getMe(): Promise<User> {
  return fetchApi<User>("/me");
}

export async function getPublicUserProfile(userId: string): Promise<PublicUserProfile> {
  return fetchApi<PublicUserProfile>(`/users/${userId}/profile`);
}

export async function listFriends(): Promise<Friend[]> {
  return fetchApi<Friend[]>("/friends");
}

export async function addFriend(userId: string): Promise<void> {
  return fetchApi<void>(`/friends/${userId}`, {
    method: "POST",
  });
}

export async function listServers(): Promise<Server[]> {
  return fetchApi<Server[]>("/servers");
}

export async function createServer(name: string): Promise<Server> {
  return fetchApi<Server>("/servers", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getServer(id: string): Promise<Server> {
  return fetchApi<Server>(`/servers/${id}`);
}

export async function updateServer(id: string, name: string): Promise<Server> {
  return fetchApi<Server>(`/servers/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function deleteServer(id: string): Promise<void> {
  return fetchApi<void>(`/servers/${id}`, {
    method: "DELETE",
  });
}

export async function joinServer(id: string): Promise<ServerMember> {
  return fetchApi<ServerMember>(`/servers/${id}/join`, {
    method: "POST",
  });
}

export async function leaveServer(id: string): Promise<void> {
  return fetchApi<void>(`/servers/${id}/leave`, {
    method: "DELETE",
  });
}

export async function transferOwnership(
  id: string,
  newOwnerId: string
): Promise<Server> {
  return fetchApi<Server>(`/servers/${id}/transfer`, {
    method: "PUT",
    body: JSON.stringify({ new_owner_id: newOwnerId }),
  });
}

export async function listChannels(serverId: string): Promise<Channel[]> {
  return fetchApi<Channel[]>(`/servers/${serverId}/channels`);
}

export async function createChannel(serverId: string, name: string): Promise<Channel> {
  return fetchApi<Channel>(`/servers/${serverId}/channels`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getChannel(id: string): Promise<Channel> {
  return fetchApi<Channel>(`/channels/${id}`);
}

export async function updateChannel(id: string, name: string): Promise<Channel> {
  return fetchApi<Channel>(`/channels/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export async function deleteChannel(id: string): Promise<void> {
  return fetchApi<void>(`/channels/${id}`, {
    method: "DELETE",
  });
}

export async function listMembers(serverId: string): Promise<ServerMember[]> {
  return fetchApi<ServerMember[]>(`/servers/${serverId}/members`);
}

export async function kickMember(serverId: string, userId: string): Promise<void> {
  return fetchApi<void>(`/servers/${serverId}/members/${userId}`, {
    method: "DELETE",
  });
}

export interface BanMemberPayload {
  reason?: string | null;
  expires_at?: string | null;
}

export interface ServerBan {
  server_id: string;
  user_id: string;
  banned_by: string;
  reason?: string | null;
  expires_at?: string | null;
  banned_at: string;
}

export async function banMember(
  serverId: string,
  userId: string,
  payload: BanMemberPayload = {}
): Promise<ServerBan> {
  return fetchApi<ServerBan>(`/servers/${serverId}/members/${userId}/ban`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function unbanMember(serverId: string, userId: string): Promise<void> {
  return fetchApi<void>(`/servers/${serverId}/members/${userId}/ban`, {
    method: "DELETE",
  });
}

export async function listBans(serverId: string): Promise<ServerBan[]> {
  return fetchApi<ServerBan[]>(`/servers/${serverId}/bans`);
}

export async function listMessages(channelId: string, limit = 50): Promise<Message[]> {
  return fetchApi<Message[]>(`/channels/${channelId}/messages?limit=${limit}`);
}

export async function sendMessage(channelId: string, content: string): Promise<Message> {
  return fetchApi<Message>(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function updateMessage(id: string, content: string): Promise<Message> {
  return fetchApi<Message>(`/messages/${id}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export async function deleteMessage(id: string): Promise<void> {
  return fetchApi<void>(`/messages/${id}`, {
    method: "DELETE",
  });
}

export async function addMessageReaction(id: string, emoji: string): Promise<Message> {
  return fetchApi<Message>(`/messages/${id}/reactions`, {
    method: "POST",
    body: JSON.stringify({ emoji }),
  });
}

export async function removeMessageReaction(id: string, emoji: string): Promise<Message> {
  return fetchApi<Message>(`/messages/${id}/reactions`, {
    method: "DELETE",
    body: JSON.stringify({ emoji }),
  });
}

export async function listDirectConversations(): Promise<DirectConversation[]> {
  return fetchApi<DirectConversation[]>("/conversations");
}

export async function createDirectConversation(targetUsername: string): Promise<DirectConversation> {
  return fetchApi<DirectConversation>("/conversations", {
    method: "POST",
    body: JSON.stringify({ target_username: targetUsername }),
  });
}

export async function searchUsers(query: string, limit = 8): Promise<UserSearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
  });

  return fetchApi<UserSearchResult[]>(`/users/search?${params.toString()}`);
}

export async function listDirectMessages(conversationId: string, limit = 50): Promise<DirectMessage[]> {
  return fetchApi<DirectMessage[]>(`/conversations/${conversationId}/messages?limit=${limit}`);
}

export async function sendDirectMessage(conversationId: string, content: string): Promise<DirectMessage> {
  return fetchApi<DirectMessage>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function updateDirectMessage(id: string, content: string): Promise<DirectMessage> {
  return fetchApi<DirectMessage>(`/conversations/messages/${id}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export async function deleteDirectMessage(id: string): Promise<void> {
  return fetchApi<void>(`/conversations/messages/${id}`, {
    method: "DELETE",
  });
}

export async function addDirectMessageReaction(id: string, emoji: string): Promise<DirectMessage> {
  return fetchApi<DirectMessage>(`/conversations/messages/${id}/reactions`, {
    method: "POST",
    body: JSON.stringify({ emoji }),
  });
}

export async function removeDirectMessageReaction(id: string, emoji: string): Promise<DirectMessage> {
  return fetchApi<DirectMessage>(`/conversations/messages/${id}/reactions`, {
    method: "DELETE",
    body: JSON.stringify({ emoji }),
  });
}

export interface UpdateProfilePayload {
  username?: string;
  avatar_url?: string;
  status?: "online" | "offline" | "dnd" | "invisible";
}

export async function updateMe(payload: UpdateProfilePayload): Promise<User> {
  return fetchApi<User>("/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export interface CreateInvitePayload {
  max_uses?: number | null;
  expires_at?: string | null;
}

export interface InviteResponse {
  code: string;
  server_id: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  created_at: string;
}

export async function createInvite(serverId: string, payload: CreateInvitePayload): Promise<InviteResponse> {
  return fetchApi<InviteResponse>(`/servers/${serverId}/invites`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getInvite(code: string): Promise<InviteResponse> {
  return fetchApi<InviteResponse>(`/invites/${code}`);
}

export async function acceptInvite(code: string): Promise<void> {
  await fetchApi<void>(`/invites/${code}/accept`, { method: "POST" });
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return fetchApi<UploadResponse>("/upload", {
    method: "POST",
    body: formData,
  });
}
