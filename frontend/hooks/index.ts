/**
 * Custom Hooks pour Hello World RTC
 * 
 * Ces hooks encapsulent la logique metier et la gestion d'etat
 * pour chaque domaine de l'application.
 * 
 * ## Architecture
 * 
 * ```
 * Page/Component
 *       │
 *       ▼
 *    Hooks (useServers, useChannels, etc.)
 *       │
 *       ▼
 *  Browser API Client (lib/api-client.ts)
 *       │
 *       ▼
 *   Backend API
 * ```
 * 
 * ## Usage
 * 
 * ```tsx
 * function MyComponent() {
 *   const { servers, selectedServer, selectServer } = useServers();
 *   const { channels, selectedChannel } = useChannels(selectedServer?.id);
 *   const { messages, sendMessage } = useMessages(selectedChannel?.id);
 *   const { members } = useMembers(selectedServer?.id);
 *   
 *   // ...
 * }
 * ```
 */

export { useServers } from "./useServers";
export { useChannels } from "./useChannels";
export { useMessages } from "./useMessages";
export { useMembers } from "./useMembers";
export { useAuth } from "./useAuth";
export { useFriends } from "./useFriends";
export { useWebSocket } from "./useWebSocket";
export { useVoiceCalls } from "./useVoiceCalls";
export { useProfileUploads } from "./useProfileUploads";
