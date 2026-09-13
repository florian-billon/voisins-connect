use axum::{
    extract::{Json, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{ctx::Ctx, error::Result, services, AppState};

#[derive(Debug, Deserialize)]
pub struct CreateCheckoutSessionPayload {
    pub success_url: String,
    pub cancel_url: String,
}

#[derive(Debug, Serialize)]
pub struct CheckoutSessionResponse {
    pub checkout_url: String,
}

#[derive(Debug, Deserialize)]
pub struct StripeWebhookPayload {
    #[serde(rename = "type")]
    pub event_type: String,
    pub data: serde_json::Value,
}

/// Create a checkout session for premium subscription
pub async fn create_checkout_session(
    State(state): State<AppState>,
    ctx: Ctx,
    Json(payload): Json<CreateCheckoutSessionPayload>,
) -> Result<Json<CheckoutSessionResponse>> {
    // Get user email
    let user = state
        .user_repo
        .find_by_id(ctx.user_id())
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })?
        .ok_or_else(|| crate::error::Error::NotFound {
            message: "User not found".to_string(),
        })?;

    let checkout_url = state
        .stripe_service
        .create_checkout_session(
            ctx.user_id(),
            &user.email,
            &payload.success_url,
            &payload.cancel_url,
        )
        .await?;

    Ok(Json(CheckoutSessionResponse { checkout_url }))
}

/// Handle Stripe webhook for successful payment
pub async fn handle_stripe_webhook(
    State(state): State<AppState>,
    Json(payload): Json<StripeWebhookPayload>,
) -> Result<StatusCode> {
    if payload.event_type != "checkout.session.completed" {
        return Ok(StatusCode::OK);
    }

    // Extract session ID from webhook data
    if let Some(session_id) = payload
        .data
        .get("object")
        .and_then(|o| o.get("id"))
        .and_then(|id| id.as_str())
    {
        // Get session details from Stripe
        let (email, subscription_id) = state
            .stripe_service
            .handle_checkout_session_completed(session_id)
            .await?;

        // Find user by email
        if let Ok(Some(user)) = state.user_repo.get_by_email(&email).await {
            // Activate premium subscription
            services::subscription::activate_premium(&state.subscription_repo, user.id).await?;

            // Store Stripe subscription ID
            state
                .subscription_repo
                .update_stripe_subscription_id(user.id, &subscription_id)
                .await
                .map_err(|e| crate::error::Error::Database {
                    message: e.to_string(),
                })?;
        }
    }

    Ok(StatusCode::OK)
}

/// Get current user subscription
pub async fn get_subscription(State(state): State<AppState>, ctx: Ctx) -> Result<Json<Option<crate::models::UserSubscriptionResponse>>> {
    let subscription = services::subscription::get_user_subscription(&state.subscription_repo, ctx.user_id())
        .await?;

    let response = subscription.map(|sub| sub.into());
    Ok(Json(response))
}

/// Cancel subscription
pub async fn cancel_subscription(State(state): State<AppState>, ctx: Ctx) -> Result<StatusCode> {
    let subscription =
        services::subscription::get_user_subscription(&state.subscription_repo, ctx.user_id())
            .await?
            .ok_or_else(|| crate::error::Error::NotFound {
                message: "Subscription not found".to_string(),
            })?;

    if let Some(stripe_id) = &subscription.stripe_subscription_id {
        state.stripe_service.cancel_subscription(stripe_id).await?;
    }

    services::subscription::cancel_subscription(&state.subscription_repo, ctx.user_id()).await?;

    Ok(StatusCode::NO_CONTENT)
}
