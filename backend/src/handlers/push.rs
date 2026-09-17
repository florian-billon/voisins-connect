use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::ctx::Ctx;
use crate::error::Result;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct PushSubscription {
    pub endpoint: String,
    pub keys: PushKeys,
}

#[derive(Debug, Deserialize)]
pub struct PushKeys {
    pub p256dh: String,
    pub auth: String,
}

#[derive(Debug, Serialize)]
pub struct SubscribeResponse {
    pub success: bool,
    pub message: String,
}

pub async fn subscribe_push(
    State(state): State<AppState>,
    ctx: Ctx,
    Json(subscription): Json<PushSubscription>,
) -> Result<Json<SubscribeResponse>> {
    // Dans une implémentation complète, nous stockerions l'abonnement dans la base de données
    // Pour l'instant, nous allons simplement le logger
    tracing::info!(
        "User {} subscribed to push notifications: {}",
        ctx.user_id(),
        subscription.endpoint
    );

    // TODO: Stocker l'abonnement dans MongoDB ou PostgreSQL
    // Exemple:
    // state.push_subscription_repo.create(ctx.user_id(), subscription).await?;

    Ok(Json(SubscribeResponse {
        success: true,
        message: "Successfully subscribed to push notifications".to_string(),
    }))
}

pub async fn unsubscribe_push(
    State(_state): State<AppState>,
    ctx: Ctx,
    Json(subscription): Json<PushSubscription>,
) -> Result<Json<SubscribeResponse>> {
    tracing::info!(
        "User {} unsubscribed from push notifications: {}",
        ctx.user_id(),
        subscription.endpoint
    );

    // TODO: Supprimer l'abonnement de la base de données

    Ok(Json(SubscribeResponse {
        success: true,
        message: "Successfully unsubscribed from push notifications".to_string(),
    }))
}
