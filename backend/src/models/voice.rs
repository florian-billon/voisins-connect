use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Voice call status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum VoiceCallStatus {
    Pending,
    Active,
    Ended,
    Rejected,
}

impl VoiceCallStatus {
    pub fn as_str(&self) -> &str {
        match self {
            VoiceCallStatus::Pending => "pending",
            VoiceCallStatus::Active => "active",
            VoiceCallStatus::Ended => "ended",
            VoiceCallStatus::Rejected => "rejected",
        }
    }
}

/// Voice call model
#[derive(Debug, Clone, Serialize, FromRow)]
pub struct VoiceCall {
    pub id: Uuid,
    pub initiator_id: Uuid,
    pub recipient_id: Uuid,
    pub voice_channel_id: Option<Uuid>,
    pub status: String,
    pub started_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
    pub duration_seconds: Option<i32>,
    pub signal_data: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Response for voice call
#[derive(Debug, Clone, Serialize)]
pub struct VoiceCallResponse {
    pub id: Uuid,
    pub initiator_id: Uuid,
    pub recipient_id: Uuid,
    pub voice_channel_id: Option<Uuid>,
    pub status: String,
    pub started_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
    pub duration_seconds: Option<i32>,
    pub created_at: DateTime<Utc>,
}

impl From<VoiceCall> for VoiceCallResponse {
    fn from(call: VoiceCall) -> Self {
        Self {
            id: call.id,
            initiator_id: call.initiator_id,
            recipient_id: call.recipient_id,
            voice_channel_id: call.voice_channel_id,
            status: call.status,
            started_at: call.started_at,
            ended_at: call.ended_at,
            duration_seconds: call.duration_seconds,
            created_at: call.created_at,
        }
    }
}

/// Request to initiate a voice call
#[derive(Debug, Deserialize)]
pub struct InitiateVoiceCallPayload {
    pub recipient_id: Uuid,
    pub voice_channel_id: Option<Uuid>,
}

/// Request to update call status
#[derive(Debug, Deserialize)]
pub struct UpdateVoiceCallPayload {
    pub status: String,
    pub signal_data: Option<serde_json::Value>,
}

/// Voice channel model (Premium only)
#[derive(Debug, Clone, Serialize, FromRow)]
pub struct VoiceChannel {
    pub id: Uuid,
    pub server_id: Uuid,
    pub name: String,
    pub position: i32,
    pub max_users: Option<i32>,
    pub is_premium_only: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Response for voice channel
#[derive(Debug, Clone, Serialize)]
pub struct VoiceChannelResponse {
    pub id: Uuid,
    pub server_id: Uuid,
    pub name: String,
    pub position: i32,
    pub max_users: Option<i32>,
    pub is_premium_only: bool,
    pub created_at: DateTime<Utc>,
}

impl From<VoiceChannel> for VoiceChannelResponse {
    fn from(channel: VoiceChannel) -> Self {
        Self {
            id: channel.id,
            server_id: channel.server_id,
            name: channel.name,
            position: channel.position,
            max_users: channel.max_users,
            is_premium_only: channel.is_premium_only,
            created_at: channel.created_at,
        }
    }
}

/// Request to create voice channel
#[derive(Debug, Deserialize)]
pub struct CreateVoiceChannelPayload {
    pub name: String,
    pub position: Option<i32>,
    pub max_users: Option<i32>,
    pub is_premium_only: Option<bool>,
}

/// Request to update voice channel
#[derive(Debug, Deserialize)]
pub struct UpdateVoiceChannelPayload {
    pub name: Option<String>,
    pub position: Option<i32>,
    pub max_users: Option<i32>,
}
