use axum::routing::{delete, post};
use axum::Router;

use crate::{handlers::stripe, AppState};

// Premium features disabled - tout gratuit
pub fn routes() -> Router<AppState> {
    Router::new()
        /*.route("/checkout", post(stripe::create_checkout_session))
        .route("/subscription", get(stripe::get_subscription))
        .route("/subscription", delete(stripe::cancel_subscription))
        .route("/webhook", post(stripe::handle_stripe_webhook))*/
}
