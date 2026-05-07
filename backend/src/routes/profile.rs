use axum::routing::{delete, get, post, put};
use axum::Router;

use crate::{handlers::profile, AppState};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/profile/uploads",
            post(profile::create_profile_upload),
        )
        .route(
            "/profile/uploads",
            get(profile::get_user_profile_uploads),
        )
        .route(
            "/profile/uploads/set-current",
            put(profile::set_current_avatar),
        )
        .route(
            "/profile/uploads/:upload_id",
            delete(profile::delete_profile_upload),
        )
}

