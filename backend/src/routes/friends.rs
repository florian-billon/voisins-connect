use crate::handlers;
use crate::AppState;
use axum::{routing::get, Router};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/friends", get(handlers::friends::list_friends })
        .route(
            "/friends/{friend_id}",
            axum::routing::post(handlers::friends::add_friend),
        )
}


