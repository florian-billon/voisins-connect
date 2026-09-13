use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    ctx::Ctx,
    error::Result,
    services,
    AppState,
};

#[derive(Debug, Deserialize)]
pub struct CreatePayPalOrderRequest {
    pub amount: f64,
    pub currency: String,
    pub description: String,
}

#[derive(Debug, Serialize)]
pub struct PayPalOrderResponse {
    pub order_id: String,
    pub approval_url: String,
}

#[derive(Debug, Serialize)]
pub struct PayPalCaptureResponse {
    pub status: String,
    pub transaction_id: String,
}

// Create PayPal order for subscription - Premium disabled
pub async fn create_paypal_order(
    State(_state): State<AppState>,
    _ctx: Ctx,
    _Json(_payload): Json<CreatePayPalOrderRequest>,
) -> Result<(StatusCode, Json<PayPalOrderResponse>)> {
    // Premium features disabled
    Err(axum::http::StatusCode::SERVICE_UNAVAILABLE.into())
}

// Capture PayPal payment after approval - Premium disabled
pub async fn capture_paypal_payment(
    State(_state): State<AppState>,
    _ctx: Ctx,
    _Path(_order_id): Path<String>,
) -> Result<(StatusCode, Json<PayPalCaptureResponse>)> {
    // Premium features disabled
    Err(axum::http::StatusCode::SERVICE_UNAVAILABLE.into())
}

// Handle PayPal webhook notifications - Premium disabled
pub async fn paypal_webhook(
    State(_state): State<AppState>,
    _Json(_payload): Json<serde_json::Value>,
) -> Result<StatusCode> {
    // Premium features disabled
    Ok(StatusCode::SERVICE_UNAVAILABLE)
}
