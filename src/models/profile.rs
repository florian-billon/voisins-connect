use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Profile upload model (Premium feature)
#[derive(Debug, Clone, Serialize, FromRow)]
pub struct ProfileUpload {
    pub id: Uuid,
    pub user_id: Uuid,
    pub file_path: String,
    pub content_type: Option<String>,
    pub file_size: Option<i64>,
    pub is_current: bool,
    pub created_at: DateTime<Utc>,
}

/// Response for profile upload
#[derive(Debug, Clone, Serialize)]
pub struct ProfileUploadResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub file_path: String,
    pub content_type: Option<String>,
    pub file_size: Option<i64>,
    pub is_current: bool,
    pub created_at: DateTime<Utc>,
}

impl From<ProfileUpload> for ProfileUploadResponse {
    fn from(upload: ProfileUpload) -> Self {
        Self {
            id: upload.id,
            user_id: upload.user_id,
            file_path: upload.file_path,
            content_type: upload.content_type,
            file_size: upload.file_size,
            is_current: upload.is_current,
            created_at: upload.created_at,
        }
    }
}

/// Request to set current profile avatar
#[derive(Debug, Deserialize)]
pub struct SetCurrentAvatarPayload {
    pub profile_upload_id: Uuid,
}
