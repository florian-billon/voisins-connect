use chrono::Utc;
use uuid::Uuid;

use crate::error::{Error, Result};
use crate::models::{
    ChannelMessage, CreateMessagePayload, MessageReactionPayload, MessageReactionPublic,
    MessageWithUser, UpdateMessagePayload, MemberRole,
};
use crate::repositories::{
    ChannelRepository, MessageRepository, ModerationRepository, ServerRepository, UserRepository,
};
use crate::services::{channels, moderation, servers};

fn validate_reaction_emoji(emoji: &str) -> Result<()> {
    let trimmed = emoji.trim();
    if trimmed.is_empty() {
        return Err(Error::InternalError {
            message: "Reaction emoji cannot be empty".to_string(),
        });
    }

    if trimmed.chars().count() > 16 {
        return Err(Error::InternalError {
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

pub async fn create_message(
    server_repo: &ServerRepository,
    channel_repo: &ChannelRepository,
    user_repo: &UserRepository,
    message_repo: &MessageRepository,
    moderation_repo: &ModerationRepository,
    channel_id: Uuid,
    user_id: Uuid,
    payload: CreateMessagePayload,
) -> Result<MessageWithUser> {
    let channel = channels::get_channel(server_repo, channel_repo, channel_id, user_id).await?;

    servers::get_member(server_repo, channel.server_id, user_id)
        .await?
        .ok_or(Error::MessageForbidden)?;

    let username = user_repo
        .get_username(user_id)
        .await?
        .ok_or(Error::UserNotFound)?;

    let user = user_repo
        .find_by_id(user_id)
        .await?
        .ok_or(Error::UserNotFound)?;

    let message_id = Uuid::new_v4();
    let now = Utc::now();
    let content = payload.content.clone();

    let moderation_result = moderation::check_message(moderation_repo, &content).await?;
    if !moderation_result.is_clean {
        moderation::log_moderated_message(
            moderation_repo,
            user_id,
            Some(channel.server_id),
            Some(channel_id),
            moderation_result.rule_type.as_deref().unwrap_or("unknown"),
            moderation_result.severity.unwrap_or(0),
            moderation_result.action.as_deref().unwrap_or("flag"),
            Some(content.clone()),
        )
        .await?;

        match moderation_result.action.as_deref() {
            Some("hide") | Some("remove") => {
                return Err(Error::BadRequest {
                    message: "Message blocked by moderation".to_string(),
                });
            }
            _ => {}
        }
    }

    let message = ChannelMessage {
        id: None,
        message_id,
        server_id: channel.server_id,
        channel_id,
        author_id: user_id,
        content: content.clone(),
        created_at: now,
        edited_at: None,
        deleted_at: None,
        deleted_by: None,
        reactions: vec![],
    };

    message_repo
        .create(&message)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB insert failed: {}", e),
        })?;

    Ok(MessageWithUser {
        id: message_id,
        server_id: channel.server_id,
        channel_id,
        author_id: user_id,
        username,
        avatar_url: user.avatar_url,
        content,
        created_at: now,
        edited_at: None,
        reactions: vec![],
    })
}

#[allow(clippy::too_many_arguments)]
pub async fn list_messages(
    server_repo: &ServerRepository,
    channel_repo: &ChannelRepository,
    user_repo: &UserRepository,
    message_repo: &MessageRepository,
    channel_id: Uuid,
    user_id: Uuid,
    limit: i64,
    before: Option<Uuid>,
) -> Result<Vec<MessageWithUser>> {
    let channel = channels::get_channel(server_repo, channel_repo, channel_id, user_id).await?;

    servers::get_member(server_repo, channel.server_id, user_id)
        .await?
        .ok_or(Error::MessageForbidden)?;

    let messages = message_repo
        .list_by_channel(channel_id, limit, before)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB query failed: {}", e),
        })?;

    if messages.is_empty() {
        return Ok(vec![]);
    }

    let author_ids: Vec<Uuid> = messages.iter().map(|m| m.author_id).collect();
    let user_data = user_repo.get_usernames_and_avatars_batch(&author_ids).await?;

    let mut result: Vec<MessageWithUser> = messages
        .into_iter()
        .map(|m| {
            let (username, avatar_url) = user_data
                .get(&m.author_id)
                .cloned()
                .unwrap_or_else(|| ("Unknown".to_string(), None));
            MessageWithUser {
                id: m.message_id,
                server_id: m.server_id,
                channel_id: m.channel_id,
                author_id: m.author_id,
                username,
                avatar_url,
                content: m.content,
                created_at: m.created_at,
                edited_at: m.edited_at,
                reactions: to_public_reactions(m.reactions),
            }
        })
        .collect();

    result.reverse();
    Ok(result)
}

pub async fn delete_message(
    server_repo: &ServerRepository,
    message_repo: &MessageRepository,
    message_id: Uuid,
    user_id: Uuid,
) -> Result<Uuid> {
    let message = message_repo
        .find_by_id(message_id)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB query failed: {}", e),
        })?
        .ok_or(Error::MessageNotFound)?;

    let member = servers::get_member(server_repo, message.server_id, user_id)
        .await?
        .ok_or(Error::MessageForbidden)?;

    // Allow deletion if user is the author OR is an owner/admin
    let is_owner = member.role == MemberRole::Owner;
    let is_admin = member.role == MemberRole::Admin;
    
    if message.author_id != user_id && !is_owner && !is_admin {
        return Err(Error::MessageForbidden);
    }

    if message.deleted_at.is_some() {
        return Err(Error::MessageNotFound);
    }

    message_repo
        .soft_delete(message_id, user_id)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB update failed: {}", e),
        })?;

    Ok(message.channel_id)
}

pub async fn update_message(
    server_repo: &ServerRepository,
    message_repo: &MessageRepository,
    user_repo: &UserRepository,
    moderation_repo: &ModerationRepository,
    message_id: Uuid,
    user_id: Uuid,
    payload: UpdateMessagePayload,
) -> Result<MessageWithUser> {
    let message = message_repo
        .find_by_id(message_id)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB query failed: {}", e),
        })?
        .ok_or(Error::MessageNotFound)?;

    let member = servers::get_member(server_repo, message.server_id, user_id)
        .await?
        .ok_or(Error::MessageForbidden)?;

    // Allow update if user is the author OR is an owner/admin
    let is_owner = member.role == MemberRole::Owner;
    let is_admin = member.role == MemberRole::Admin;
    
    if message.author_id != user_id && !is_owner && !is_admin {
        return Err(Error::MessageForbidden);
    }

    if message.deleted_at.is_some() {
        return Err(Error::MessageNotFound);
    }

    let moderation_result = moderation::check_message(moderation_repo, &payload.content).await?;
    if !moderation_result.is_clean {
        moderation::log_moderated_message(
            moderation_repo,
            user_id,
            Some(message.server_id),
            Some(message.channel_id),
            moderation_result.rule_type.as_deref().unwrap_or("unknown"),
            moderation_result.severity.unwrap_or(0),
            moderation_result.action.as_deref().unwrap_or("flag"),
            Some(payload.content.clone()),
        )
        .await?;

        match moderation_result.action.as_deref() {
            Some("hide") | Some("remove") => {
                return Err(Error::BadRequest {
                    message: "Message blocked by moderation".to_string(),
                });
            }
            _ => {}
        }
    }

    message_repo
        .update_content(message_id, &payload.content)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB update failed: {}", e),
        })?;

    let user = user_repo
        .find_by_id(message.author_id)
        .await?
        .ok_or(Error::UserNotFound)?;

    Ok(MessageWithUser {
        id: message.message_id,
        server_id: message.server_id,
        channel_id: message.channel_id,
        author_id: message.author_id,
        username: user.username,
        avatar_url: user.avatar_url,
        content: payload.content,
        created_at: message.created_at,
        edited_at: Some(Utc::now()),
        reactions: to_public_reactions(message.reactions),
    })
}

pub async fn add_reaction(
    server_repo: &ServerRepository,
    message_repo: &MessageRepository,
    user_repo: &UserRepository,
    message_id: Uuid,
    user_id: Uuid,
    payload: MessageReactionPayload,
) -> Result<MessageWithUser> {
    validate_reaction_emoji(&payload.emoji)?;

    let message = message_repo
        .find_by_id(message_id)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB query failed: {}", e),
        })?
        .ok_or(Error::MessageNotFound)?;

    servers::get_member(server_repo, message.server_id, user_id)
        .await?
        .ok_or(Error::MessageForbidden)?;

    if message.deleted_at.is_some() {
        return Err(Error::MessageNotFound);
    }

    message_repo
        .add_reaction(message_id, user_id, payload.emoji.trim())
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB update failed: {}", e),
        })?;

    let updated = message_repo
        .find_by_id(message_id)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB query failed: {}", e),
        })?
        .ok_or(Error::MessageNotFound)?;

    let user = user_repo
        .find_by_id(updated.author_id)
        .await?
        .ok_or(Error::UserNotFound)?;

    Ok(MessageWithUser {
        id: updated.message_id,
        server_id: updated.server_id,
        channel_id: updated.channel_id,
        author_id: updated.author_id,
        username: user.username,
        avatar_url: user.avatar_url,
        content: updated.content,
        created_at: updated.created_at,
        edited_at: updated.edited_at,
        reactions: to_public_reactions(updated.reactions),
    })
}

pub async fn remove_reaction(
    server_repo: &ServerRepository,
    message_repo: &MessageRepository,
    user_repo: &UserRepository,
    message_id: Uuid,
    user_id: Uuid,
    payload: MessageReactionPayload,
) -> Result<MessageWithUser> {
    validate_reaction_emoji(&payload.emoji)?;

    let message = message_repo
        .find_by_id(message_id)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB query failed: {}", e),
        })?
        .ok_or(Error::MessageNotFound)?;

    servers::get_member(server_repo, message.server_id, user_id)
        .await?
        .ok_or(Error::MessageForbidden)?;

    if message.deleted_at.is_some() {
        return Err(Error::MessageNotFound);
    }

    message_repo
        .remove_reaction(message_id, user_id, payload.emoji.trim())
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB update failed: {}", e),
        })?;

    let updated = message_repo
        .find_by_id(message_id)
        .await
        .map_err(|e| Error::DatabaseError {
            message: format!("MongoDB query failed: {}", e),
        })?
        .ok_or(Error::MessageNotFound)?;

    let user = user_repo
        .find_by_id(updated.author_id)
        .await?
        .ok_or(Error::UserNotFound)?;

    Ok(MessageWithUser {
        id: updated.message_id,
        server_id: updated.server_id,
        channel_id: updated.channel_id,
        author_id: updated.author_id,
        username: user.username,
        avatar_url: user.avatar_url,
        content: updated.content,
        created_at: updated.created_at,
        edited_at: updated.edited_at,
        reactions: to_public_reactions(updated.reactions),
    })
}
