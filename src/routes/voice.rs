use axum::routing::{delete, get, post, put};
use axum::Router;
use uuid::Uuid;

use crate::{handlers::voice, AppState};

pub fn routes() -> Router<AppState> {
    Router::new()
        // Voice Calls (free feature)
        .route("/calls", post(voice::initiate_voice_call))
        .route("/calls", get(voice::get_user_voice_calls))
        .route("/calls/{call_id}", get(voice::get_voice_call))
        .route("/calls/{call_id}/accept", post(voice::accept_voice_call))
        .route("/calls/{call_id}/reject", post(voice::reject_voice_call))
        .route("/calls/{call_id}/end", post(voice::end_voice_call))
}
