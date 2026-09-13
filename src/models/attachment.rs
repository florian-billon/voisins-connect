use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Attachment {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub filename: String,
    pub file_path: String,
    pub content_type: Option<String>,
    pub file_size: Option<i64>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct AttachmentCreate {
    pub sender_id: Uuid,
    pub filename: String,
    pub file_path: String,
    pub content_type: Option<String>,
    pub file_size: Option<i64>,
}
