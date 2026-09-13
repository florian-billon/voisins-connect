use axum::routing::{get, post};
use axum::Router;

use crate::{handlers::paypal, AppState};

// Premium features disabled - tout gratuit
pub fn routes() -> Router<AppState> {
    Router::new()
        /*.route("/order", post(paypal::create_paypal_order))
        .route("/order/{order_id}/capture", post(paypal::capture_paypal_payment))
        .route("/webhook", post(paypal::paypal_webhook))*/
}
