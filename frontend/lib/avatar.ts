import { User } from "@/lib/api-client";

/**
 * Normalise le chemin d'avatar (ancien format → nouveau format)
 */
export function normalizeAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes("/space_invaders_avatars/space_invader_")) {
    return url
      .replace("/space_invaders_avatars/", "/avatars/")
      .replace("space_invader_", "avatar_");
  }
  return url;
}

/**
 * Génère une URL d'avatar déterministe basée sur un UUID
 */
export function getAvatarFromId(id: string): string {
  if (!id) return "/avatars/avatar_001.png";
  const hex = id.replace(/-/g, "").slice(0, 2);
  const num = parseInt(hex, 16);
  if (isNaN(num)) return "/avatars/avatar_001.png";
  const avatarNum = (num % 100) + 1;
  return `/avatars/avatar_${String(avatarNum).padStart(3, "0")}.png`;
}

/**
 * Retourne l'avatar approprié : utilise l'avatar fourni s'il existe, sinon l'avatar par défaut
 */
export function getAvatar(userId: string, currentUser: User | null, avatarUrl?: string | null): string {
  // Priorité : avatarUrl passé en paramètre (pour les autres utilisateurs)
  if (avatarUrl) {
    return normalizeAvatarUrl(avatarUrl) || getAvatarFromId(userId);
  }
  // Sinon : avatar de l'utilisateur connecté si c'est lui
  if (currentUser && userId === currentUser.id) {
    return normalizeAvatarUrl(currentUser.avatar_url) || getAvatarFromId(userId);
  }
  // Sinon : avatar par défaut
  return getAvatarFromId(userId);
}
