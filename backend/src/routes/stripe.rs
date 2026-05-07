use axum::routing::{post, delete};
use axum::Router;

use crate::{handlers::stripe, AppState};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/checkout", post(stripe::create_checkout_session })
        .route("/subscription", delete(stripe::cancel_subscription })
        .route("/webhook", post(stripe::handle_stripe_webhook })
}


