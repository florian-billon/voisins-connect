use uuid::Uuid;

use crate::models::ProfileUpload;
use crate::repositories::ProfileRepository;
use crate::error::Result;

pub async fn create_profile_upload(
    repo: &ProfileRepository,
    user_id: Uuid,
    file_path: &str,
    content_type: Option<&str>,
    file_size: Option<i64>,
) -> Result<ProfileUpload> {
    repo.create_upload(user_id, file_path, content_type, file_size)
        .await
        .map_err(|e| crate::error::Error::Database { message: e.to_string() })
}

pub async fn get_user_profile_uploads(
    repo: &ProfileRepository,
    user_id: Uuid,
) -> Result<Vec<ProfileUpload>> {
    repo.get_user_uploads(user_id)
        .await
        .map_err(|e| crate::error::Error::Database { message: e.to_string() })
}

pub async fn get_current_avatar(
    repo: &ProfileRepository,
    user_id: Uuid,
) -> Result<Option<ProfileUpload>> {
    repo.get_current_avatar(user_id)
        .await
        .map_err(|e| crate::error::Error::Database { message: e.to_string() })
}

pub async fn set_current_avatar(
    repo: &ProfileRepository,
    user_id: Uuid,
    upload_id: Uuid,
) -> Result<Option<ProfileUpload>> {
    repo.set_current_avatar(user_id, upload_id)
        .await
        .map_err(|e| crate::error::Error::Database { message: e.to_string() })
}

pub async fn delete_profile_upload(
    repo: &ProfileRepository,
    user_id: Uuid,
    upload_id: Uuid,
) -> Result<()> {
    repo.delete_upload(user_id, upload_id)
        .await
        .map_err(|e| crate::error::Error::Database { message: e.to_string() })
}

pub async fn get_upload_by_id(
    repo: &ProfileRepository,
    upload_id: Uuid,
) -> Result<Option<ProfileUpload>> {
    repo.get_upload_by_id(upload_id)
        .await
        .map_err(|e| crate::error::Error::Database { message: e.to_string() })
}




