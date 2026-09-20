use axum::{extract::DefaultBodyLimit, routing::post, Router};

use crate::handlers::upload;
use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new().route(
        "/upload",
        post(upload::upload_file).layer(DefaultBodyLimit::max(10 * 1024 * 1024)),
    )
}
