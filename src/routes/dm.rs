use crate::handlers;
use crate::AppState;
use axum::{
    routing::{get, put},
    Router,
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/conversations",
            get(handlers::dm::list_conversations).post(handlers::dm::create_conversation),
        )
        .route(
            "/conversations/{dm_id}/messages",
            get(handlers::dm::list_messages).post(handlers::dm::create_message),
        )
        .route(
            "/conversations/messages/{id}",
            put(handlers::dm::update_message).delete(handlers::dm::delete_message),
        )
        .route(
            "/conversations/messages/{id}/reactions",
            axum::routing::post(handlers::dm::add_reaction).delete(handlers::dm::remove_reaction),
        )
}
