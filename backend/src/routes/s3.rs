use axum::routing::post;
use axum::Router;

use crate::{handlers::s3, AppState};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/profile", post(s3::upload_profile_image })
        .route("/attachment", post(s3::upload_attachment })
}


