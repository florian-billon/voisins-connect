use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::ctx::Ctx;
use crate::error::Result;
use crate::models::{
    CreateMessagePayload, MessageReactionPayload, MessageWithUser, UpdateMessagePayload,
};
use crate::services;
use crate::web::ws::protocol::ServerEvent;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct ListMessagesQuery {
    pub limit: Option<i64>,
    pub before: Option<Uuid>,
}

pub async fn create_message(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(channel_id): Path<Uuid>,
    Json(payload): Json<CreateMessagePayload>,
) -> Result<Json<MessageWithUser>> {
    let message = services::create_message(
        &state.server_repo,
        &state.channel_repo,
        &state.user_repo,
        &state.message_repo,
        channel_id,
        ctx.user_id(),
        payload,
    )
    .await?;
    Ok(Json(message })
}

pub async fn list_messages(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(channel_id): Path<Uuid>,
    Query(query): Query<ListMessagesQuery>,
) -> Result<Json<Vec<MessageWithUser>>> {
    let limit = query.limit.unwrap_or(50).min(100);
    let messages = services::list_messages(
        &state.server_repo,
        &state.channel_repo,
        &state.user_repo,
        &state.message_repo,
        channel_id,
        ctx.user_id(),
        limit,
        query.before,
    )
    .await?;
    Ok(Json(messages })
}

pub async fn update_message(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateMessagePayload>,
) -> Result<Json<MessageWithUser>> {
    let message = services::update_message(
        &state.server_repo,
        &state.message_repo,
        id,
        ctx.user_id(),
        payload,
    )
    .await?;

    if let Some(edited_at) = message.edited_at {
        let event = ServerEvent::MessageUpdate {
            id: message.id,
            channel_id: message.channel_id,
            content: message.content.clone(),
            edited_at,
        };

        state
            .ws_hub
            .broadcast_to_channel_with_metrics(message.channel_id, &event, Some(&state.ws_metrics })
            .await;
    }

    Ok(Json(message })
}

pub async fn delete_message(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(id): Path<Uuid>,
) -> Result<StatusCode> {
    let channel_id =
        services::delete_message(&state.server_repo, &state.message_repo, id, ctx.user_id( })
            .await?;

    let event = ServerEvent::MessageDelete { id, channel_id };
    state
        .ws_hub
        .broadcast_to_channel_with_metrics(channel_id, &event, Some(&state.ws_metrics })
        .await;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn add_reaction(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(id): Path<Uuid>,
    Json(payload): Json<MessageReactionPayload>,
) -> Result<Json<MessageWithUser>> {
    let message = services::messages::add_reaction(
        &state.server_repo,
        &state.message_repo,
        id,
        ctx.user_id(),
        payload,
    )
    .await?;

    let event = ServerEvent::MessageReactionUpdate {
        id: message.id,
        channel_id: message.channel_id,
        reactions: message.reactions.clone(),
    };
    state
        .ws_hub
        .broadcast_to_channel_with_metrics(message.channel_id, &event, Some(&state.ws_metrics })
        .await;

    Ok(Json(message })
}

pub async fn remove_reaction(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(id): Path<Uuid>,
    Json(payload): Json<MessageReactionPayload>,
) -> Result<Json<MessageWithUser>> {
    let message = services::messages::remove_reaction(
        &state.server_repo,
        &state.message_repo,
        id,
        ctx.user_id(),
        payload,
    )
    .await?;

    let event = ServerEvent::MessageReactionUpdate {
        id: message.id,
        channel_id: message.channel_id,
        reactions: message.reactions.clone(),
    };
    state
        .ws_hub
        .broadcast_to_channel_with_metrics(message.channel_id, &event, Some(&state.ws_metrics })
        .await;

    Ok(Json(message })
}


