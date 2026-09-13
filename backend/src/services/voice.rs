use uuid::Uuid;

use crate::error::Result;
use crate::models::{VoiceCall, VoiceChannel};
use crate::repositories::VoiceRepository;

// ============= Voice Calls =============

pub async fn initiate_call(
    repo: &VoiceRepository,
    initiator_id: Uuid,
    recipient_id: Uuid,
    voice_channel_id: Option<Uuid>,
) -> Result<VoiceCall> {
    repo.create_call(initiator_id, recipient_id, voice_channel_id)
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })
}

pub async fn accept_call(repo: &VoiceRepository, call_id: Uuid) -> Result<Option<VoiceCall>> {
    repo.start_call(call_id)
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })
}

pub async fn reject_call(repo: &VoiceRepository, call_id: Uuid) -> Result<Option<VoiceCall>> {
    repo.update_call_status(call_id, "rejected")
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })
}

pub async fn end_call(repo: &VoiceRepository, call_id: Uuid) -> Result<Option<VoiceCall>> {
    repo.end_call(call_id)
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })
}

pub async fn get_call(repo: &VoiceRepository, call_id: Uuid) -> Result<Option<VoiceCall>> {
    repo.find_call_by_id(call_id)
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })
}

pub async fn get_user_recent_calls(
    repo: &VoiceRepository,
    user_id: Uuid,
    limit: i64,
) -> Result<Vec<VoiceCall>> {
    repo.get_user_recent_calls(user_id, limit)
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })
}

// ============= Voice Channels (Premium) =============

pub async fn create_voice_channel(
    repo: &VoiceRepository,
    server_id: Uuid,
    name: &str,
    position: i32,
    max_users: Option<i32>,
    is_premium_only: bool,
) -> Result<VoiceChannel> {
    repo.create_voice_channel(server_id, name, position, max_users, is_premium_only)
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })
}

pub async fn get_voice_channel(
    repo: &VoiceRepository,
    channel_id: Uuid,
) -> Result<Option<VoiceChannel>> {
    repo.find_voice_channel_by_id(channel_id)
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })
}

pub async fn list_server_voice_channels(
    repo: &VoiceRepository,
    server_id: Uuid,
) -> Result<Vec<VoiceChannel>> {
    repo.list_server_voice_channels(server_id)
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })
}

pub async fn update_voice_channel(
    repo: &VoiceRepository,
    channel_id: Uuid,
    name: Option<&str>,
    position: Option<i32>,
    max_users: Option<i32>,
) -> Result<Option<VoiceChannel>> {
    repo.update_voice_channel(channel_id, name, position, max_users)
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })
}

pub async fn delete_voice_channel(repo: &VoiceRepository, channel_id: Uuid) -> Result<()> {
    repo.delete_voice_channel(channel_id)
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })
}
