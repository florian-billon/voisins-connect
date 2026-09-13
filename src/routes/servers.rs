use crate::handlers::{servers, voice};
use crate::AppState;
use axum::{
    routing::{delete, get, post, put},
    Router,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", post(servers::create_server).get(servers::list_servers))
        // ON CHANGE /:id PAR /{id}
        .route(
            "/{id}",
            get(servers::get_server)
                .put(servers::update_server)
                .delete(servers::delete_server),
        )
        // ON CHANGE AUSSI TOUTES LES SUIVANTES
        .route("/{id}/join", post(servers::join_server))
        .route("/{id}/leave", delete(servers::leave_server))
        .route("/{id}/members", get(servers::list_members))
        .route(
            "/{id}/members/{userId}",
            put(servers::update_member_role).delete(servers::kick_member),
        )
        .route(
            "/{id}/members/{userId}/ban",
            post(servers::ban_member).delete(servers::unban_member),
        )
        .route(
            "/{id}/members/{userId}/mute",
            post(servers::mute_member).delete(servers::unmute_member),
        )
        .route("/{id}/bans", get(servers::list_bans))
        .route("/{id}/transfer", put(servers::transfer_ownership))
        // Voice Channels (premium feature)
        .route("/{id}/voice-channels", post(voice::create_voice_channel))
        .route("/{id}/voice-channels", get(voice::list_server_voice_channels))
        .route(
            "/{id}/voice-channels/{channel_id}",
            put(voice::update_voice_channel),
        )
        .route(
            "/{id}/voice-channels/{channel_id}",
            delete(voice::delete_voice_channel),
        )
}
