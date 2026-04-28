//! Gestion de la présence utilisateur (online/offline)

use std::collections::HashSet;
use uuid::Uuid;

use crate::models::UserStatus;
use crate::web::ws::protocol::ServerEvent;
use crate::AppState;

async fn broadcast_presence_to_shared_servers(state: &AppState, user_id: Uuid, status: UserStatus) {
    let event = ServerEvent::PresenceUpdate { user_id, status };

    let servers = match state.server_repo.list_by_user(user_id).await {
        Ok(servers) => servers,
        Err(err) => {
            tracing::warn!(
                "[Presence] Failed to list servers for user {}: {}. Falling back to self-only.",
                user_id,
                err
            );
            state.ws_hub.send_to_user(user_id, &event).await;
            return;
        }
    };

    let mut recipients: HashSet<Uuid> = HashSet::new();
    recipients.insert(user_id);

    for server in servers {
        match state.server_repo.list_members(server.id).await {
            Ok(members) => {
                for member in members {
                    recipients.insert(member.user_id);
                }
            }
            Err(err) => {
                tracing::warn!(
                    "[Presence] Failed to list members for server {}: {}",
                    server.id,
                    err
                );
            }
        }
    }

    for recipient_id in recipients {
        state.ws_hub.send_to_user(recipient_id, &event).await;
    }
}

/// Marque un utilisateur comme en ligne lors de la connexion WebSocket
pub async fn handle_user_online(state: &AppState, user_id: Uuid) {
    broadcast_presence_to_shared_servers(state, user_id, UserStatus::Online).await;
}

/// Marque un utilisateur comme hors ligne lors de la déconnexion WebSocket
pub async fn handle_user_offline(state: &AppState, user_id: Uuid) {
    broadcast_presence_to_shared_servers(state, user_id, UserStatus::Offline).await;
}

/// Traite une mise à jour de présence manuelle (dnd, invisible, etc.)
pub async fn handle_presence_update(state: &AppState, user_id: Uuid, status: UserStatus) {
    broadcast_presence_to_shared_servers(state, user_id, status).await;

    // Optionnel : sauvegarder en DB
    // state.user_repo.update_status(user_id, status).await?;
}
