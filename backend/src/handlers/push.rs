use axum::{
    extract::State,
    Json,
};
use serde::{Deserialize, Serialize};

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
    State(_state): State<AppState>,
    ctx: Ctx,
    Json(subscription): Json<PushSubscription>,
) -> Result<Json<SubscribeResponse>> {
    // Stocker l'abonnement dans la base de données pour utilisation future
    // Pour l'instant, nous le loggons seulement
    tracing::info!(
        "User {} subscribed to push notifications - endpoint: {}, p256dh: {}",
        ctx.user_id(),
        subscription.endpoint,
        subscription.keys.p256dh
    );

    // TODO: Créer une table PostgreSQL pour stocker les abonnements push
    // avec les colonnes: user_id, endpoint, p256dh, auth, created_at
    
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
        "User {} unsubscribed from push notifications - endpoint: {}",
        ctx.user_id(),
        subscription.endpoint
    );

    // TODO: Supprimer l'abonnement de la base de données

    Ok(Json(SubscribeResponse {
        success: true,
        message: "Successfully unsubscribed from push notifications".to_string(),
    }))
}
