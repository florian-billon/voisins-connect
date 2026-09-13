"use server";

import { cookies } from "next/headers";
import { API_URL } from "./config";

async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value || null;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorMessage = `HTTP ${res.status}`;
      let errorDetails: string | undefined;
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
        errorDetails = errorData.details;
        
        // Log pour debug (dev seulement)
        if (process.env.NODE_ENV === 'development') {
          console.error('[API Error]', {
            endpoint,
            status: res.status,
            error: errorMessage,
            details: errorDetails,
            fullResponse: errorData
          });
        }
      } catch {
        errorMessage = errorText || errorMessage;
      }

      if (res.status === 401) {
        errorMessage = "Authentication required. Please login.";
      }

      // Construire le message d'erreur avec détails si disponibles
      const fullErrorMessage = errorDetails 
        ? `${errorMessage}: ${errorDetails}`
        : errorMessage;

      throw new Error(fullErrorMessage);
    }

    if (res.status === 204) return {} as T;
    return await res.json();
  } catch (err) {
    if (err instanceof Error && err.message.includes("fetch failed")) {
      throw new Error("Unable to connect to server. Please check if the backend is running.");
    }
    throw err;
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
}

export interface ServerMember {
  server_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  username: string;
  avatar_url?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  status: string;
  created_at: string;
}

export interface VoiceChannel {
  id: string;
  server_id: string;
  name: string;
  position: number;
  max_users?: number;
  is_premium_only: boolean;
  created_at: string;
}

export interface VoiceCall {
  id: string;
  initiator_id: string;
  recipient_id: string;
  voice_channel_id?: string;
  status: "pending" | "active" | "ended" | "rejected";
  started_at: string;
  ended_at?: string;
}

export interface DirectConversation {
  id: string;
  recipient_id: string;
  username: string;
  avatar_url?: string;
  status: string;
  created_at: string;
}

export async function getMe(): Promise<User> {
  return fetchApi<User>("/me");
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
