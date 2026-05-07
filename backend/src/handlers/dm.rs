use crate::ctx::Ctx;
use crate::models::{
    CreateDMMessagePayload, CreateDMPayload, DMWithRecipient, DirectMessageItem,
    DirectMessageItemResponse, MessageReactionPayload, MessageReactionPublic, UpdateMessagePayload,
};
use crate::{AppState, Error, Result};
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::web::ws::protocol::ServerEvent;

fn validate_reaction_emoji(emoji: &str) -> Result<()> {
    let trimmed = emoji.trim();
    if trimmed.is_empty() {
        return Err(Error::BadRequest {
            message: "Reaction emoji cannot be empty".to_string(),
        });
    }

    if trimmed.chars().count() > 16 {
        return Err(Error::BadRequest {
            message: "Reaction emoji is too long".to_string(),
        });
    }

    Ok(())
}

fn to_public_reactions(
    reactions: Vec<crate::models::MessageReaction>,
) -> Vec<MessageReactionPublic> {
    reactions
        .into_iter()
        .map(MessageReactionPublic::from)
        .collect()
}

fn to_response(message: DirectMessageItem, username: String) -> DirectMessageItemResponse {
    DirectMessageItemResponse {
        id: message.message_id,
        dm_id: message.dm_id,
        author_id: message.author_id,
        username,
        content: message.content,
        created_at: message.created_at,
        edited_at: message.edited_at,
        reactions: to_public_reactions(message.reactions),
    }
}

async fn broadcast_to_dm_participants(
    state: &AppState,
    dm_id: Uuid,
    event: &ServerEvent,
) -> Result<()> {
    let Some((user1_id, user2_id)) = state.dm_repo.get_participants(dm_id).await? else {
        return Ok(());
    };

    state.ws_hub.send_to_user(user1_id, event).await;
    if user2_id != user1_id {
        state.ws_hub.send_to_user(user2_id, event).await;
    }

    Ok(())
}

#[derive(Deserialize)]
pub struct ListDMMessagesQuery {
    pub limit: Option<i64>,
}

pub async fn create_conversation(
    State(state): State<AppState>,
    ctx: Ctx,
    Json(payload): Json<CreateDMPayload>,
) -> Result<Json<DMWithRecipient>> {
    let target_username = payload.target_username.trim();
    if target_username.is_empty() {
        return Err(Error::BadRequest {
            message: "Target username cannot be empty".to_string(),
        });
    }

    let target_user = state
        .user_repo
        .get_by_username(target_username)
        .await?
        .ok_or(Error::UserNotFound)?;

    if target_user.id == ctx.user_id() {
        return Err(Error::BadRequest {
            message: "Cannot create a private conversation with yourself".to_string(),
        });
    }

    let conversation_id = state
        .dm_repo
        .create_or_get_dm(ctx.user_id(), target_user.id)
        .await?;

    let conversation = state
        .dm_repo
        .get_dm_details(conversation_id, ctx.user_id())
        .await?
        .ok_or(Error::MessageForbidden)?;

    Ok(Json(conversation))
}

pub async fn list_conversations(
    State(state): State<AppState>,
    ctx: Ctx,
) -> Result<Json<Vec<DMWithRecipient>>> {
    let conversations = state.dm_repo.list_user_dms(ctx.user_id()).await?;
    Ok(Json(conversations))
}

pub async fn list_messages(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(dm_id): Path<Uuid>,
    Query(query): Query<ListDMMessagesQuery>,
) -> Result<Json<Vec<DirectMessageItemResponse>>> {
    if !state.dm_repo.user_has_access(dm_id, ctx.user_id()).await? {
        return Err(Error::MessageForbidden);
    }

    let limit = query.limit.unwrap_or(50).clamp(1, 100);
    let messages = state
        .dm_message_repo
        .list_by_dm(dm_id, limit)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB query failed: {}", e),
        })?;

    if messages.is_empty() {
        return Ok(Json(vec![] });
    }

    let author_ids: Vec<Uuid> = messages.iter().map(|message| message.author_id).collect();
    let usernames = state.user_repo.get_usernames_batch(&author_ids).await?;

    let response = messages
        .into_iter()
        .map(|message| {
            let username = usernames
                .get(&message.author_id)
                .cloned()
                .unwrap_or_else(|| "Unknown".to_string( });
            to_response(message, username)
        })
        .collect();

    Ok(Json(response))
}

pub async fn create_message(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(dm_id): Path<Uuid>,
    Json(payload): Json<CreateDMMessagePayload>,
) -> Result<Json<DirectMessageItemResponse>> {
    let content = payload.content.trim();
    if content.is_empty() {
        return Err(Error::BadRequest {
            message: "Message content cannot be empty".to_string(),
        });
    }

    if !state.dm_repo.user_has_access(dm_id, ctx.user_id( }).await? {
        return Err(Error::MessageForbidden);
    }

    let message = DirectMessageItem {
        id: None,
        message_id: Uuid::new_v4(),
        dm_id,
        author_id: ctx.user_id(),
        content: content.to_string(),
        created_at: chrono::Utc::now(),
        edited_at: None,
        deleted_at: None,
        reactions: vec![],
    };

    state
        .dm_message_repo
        .create(&message)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB insert failed: {}", e),
        })?;

    let username = state
        .user_repo
        .get_username(ctx.user_id( })
        .await?
        .ok_or(Error::UserNotFound)?;

    let response = to_response(message, username.clone( });

    let event = ServerEvent::DirectMessageCreate {
        id: response.id,
        dm_id: response.dm_id,
        author_id: response.author_id,
        username,
        content: response.content.clone(),
        created_at: response.created_at,
        edited_at: response.edited_at,
        reactions: response.reactions.clone(),
    };

    broadcast_to_dm_participants(&state, dm_id, &event).await?;

    Ok(Json(response })
}

pub async fn update_message(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateMessagePayload>,
) -> Result<Json<DirectMessageItemResponse>> {
    let content = payload.content.trim();
    if content.is_empty() {
        return Err(Error::BadRequest {
            message: "Message content cannot be empty".to_string(),
        });
    }

    let message = state
        .dm_message_repo
        .find_by_id(id)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB query failed: {}", e),
        })?
        .ok_or(Error::MessageNotFound)?;

    if !state
        .dm_repo
        .user_has_access(message.dm_id, ctx.user_id( })
        .await?
    {
        return Err(Error::MessageForbidden);
    }

    if message.author_id != ctx.user_id() {
        return Err(Error::MessageForbidden);
    }

    if message.deleted_at.is_some() {
        return Err(Error::MessageNotFound);
    }

    state
        .dm_message_repo
        .update_content(id, content)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB update failed: {}", e),
        })?;

    let username = state
        .user_repo
        .get_username(message.author_id)
        .await?
        .ok_or(Error::UserNotFound)?;

    let edited_at = Some(chrono::Utc::now( });
    let response = DirectMessageItemResponse {
        id: message.message_id,
        dm_id: message.dm_id,
        author_id: message.author_id,
        username,
        content: content.to_string(),
        created_at: message.created_at,
        edited_at,
        reactions: to_public_reactions(message.reactions),
    };

    if let Some(edited_at) = response.edited_at {
        let event = ServerEvent::DirectMessageUpdate {
            id: response.id,
            dm_id: response.dm_id,
            content: response.content.clone(),
            edited_at,
        };

        broadcast_to_dm_participants(&state, response.dm_id, &event).await?;
    }

    Ok(Json(response })
}

pub async fn delete_message(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(id): Path<Uuid>,
) -> Result<StatusCode> {
    let message = state
        .dm_message_repo
        .find_by_id(id)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB query failed: {}", e),
        })?
        .ok_or(Error::MessageNotFound)?;

    if !state
        .dm_repo
        .user_has_access(message.dm_id, ctx.user_id( })
        .await?
    {
        return Err(Error::MessageForbidden);
    }

    if message.author_id != ctx.user_id() {
        return Err(Error::MessageForbidden);
    }

    if message.deleted_at.is_some() {
        return Err(Error::MessageNotFound);
    }

    state
        .dm_message_repo
        .soft_delete(id)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB update failed: {}", e),
        })?;

    let event = ServerEvent::DirectMessageDelete {
        id,
        dm_id: message.dm_id,
    };

    broadcast_to_dm_participants(&state, message.dm_id, &event).await?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn add_reaction(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(id): Path<Uuid>,
    Json(payload): Json<MessageReactionPayload>,
) -> Result<Json<DirectMessageItemResponse>> {
    validate_reaction_emoji(&payload.emoji)?;

    let message = state
        .dm_message_repo
        .find_by_id(id)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB query failed: {}", e),
        })?
        .ok_or(Error::MessageNotFound)?;

    if !state
        .dm_repo
        .user_has_access(message.dm_id, ctx.user_id( })
        .await?
    {
        return Err(Error::MessageForbidden);
    }

    if message.deleted_at.is_some() {
        return Err(Error::MessageNotFound);
    }

    state
        .dm_message_repo
        .add_reaction(id, ctx.user_id(), payload.emoji.trim( })
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB update failed: {}", e),
        })?;

    let updated = state
        .dm_message_repo
        .find_by_id(id)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB query failed: {}", e),
        })?
        .ok_or(Error::MessageNotFound)?;

    let username = state
        .user_repo
        .get_username(updated.author_id)
        .await?
        .ok_or(Error::UserNotFound)?;

    let response = to_response(updated, username);
    let event = ServerEvent::DirectMessageReactionUpdate {
        id: response.id,
        dm_id: response.dm_id,
        reactions: response.reactions.clone(),
    };

    broadcast_to_dm_participants(&state, response.dm_id, &event).await?;

    Ok(Json(response })
}

pub async fn remove_reaction(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(id): Path<Uuid>,
    Json(payload): Json<MessageReactionPayload>,
) -> Result<Json<DirectMessageItemResponse>> {
    validate_reaction_emoji(&payload.emoji)?;

    let message = state
        .dm_message_repo
        .find_by_id(id)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB query failed: {}", e),
        })?
        .ok_or(Error::MessageNotFound)?;

    if !state
        .dm_repo
        .user_has_access(message.dm_id, ctx.user_id( })
        .await?
    {
        return Err(Error::MessageForbidden);
    }

    if message.deleted_at.is_some() {
        return Err(Error::MessageNotFound);
    }

    state
        .dm_message_repo
        .remove_reaction(id, ctx.user_id(), payload.emoji.trim( })
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB update failed: {}", e),
        })?;

    let updated = state
        .dm_message_repo
        .find_by_id(id)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB query failed: {}", e),
        })?
        .ok_or(Error::MessageNotFound)?;

    let username = state
        .user_repo
        .get_username(updated.author_id)
        .await?
        .ok_or(Error::UserNotFound)?;

    let response = to_response(updated, username);
    let event = ServerEvent::DirectMessageReactionUpdate {
        id: response.id,
        dm_id: response.dm_id,
        reactions: response.reactions.clone(),
    };

    broadcast_to_dm_participants(&state, response.dm_id, &event).await?;

    Ok(Json(response))
}


