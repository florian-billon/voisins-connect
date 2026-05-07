use sqlx::PgPool;
use uuid::Uuid;

use crate::models::ProfileUpload;

#[derive(Clone)]
pub struct ProfileRepository {
    pool: PgPool,
}

impl ProfileRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_upload(
        &self,
        user_id: Uuid,
        file_path: &str,
        content_type: Option<&str>,
        file_size: Option<i64>,
    ) -> sqlx::Result<ProfileUpload> {
        sqlx::query_as::<_, ProfileUpload>(
            "INSERT INTO profile_uploads (user_id, file_path, content_type, file_size) 
             VALUES ($1, $2, $3, $4)
             RETURNING id, user_id, file_path, content_type, file_size, is_current, created_at"
        )
        .bind(user_id)
        .bind(file_path)
        .bind(content_type)
        .bind(file_size)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn get_user_uploads(&self, user_id: Uuid) -> sqlx::Result<Vec<ProfileUpload>> {
        sqlx::query_as::<_, ProfileUpload>(
            "SELECT id, user_id, file_path, content_type, file_size, is_current, created_at 
             FROM profile_uploads WHERE user_id = $1 ORDER BY created_at DESC"
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn get_current_avatar(&self, user_id: Uuid) -> sqlx::Result<Option<ProfileUpload>> {
        sqlx::query_as::<_, ProfileUpload>(
            "SELECT id, user_id, file_path, content_type, file_size, is_current, created_at 
             FROM profile_uploads WHERE user_id = $1 AND is_current = true LIMIT 1"
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn set_current_avatar(&self, user_id: Uuid, upload_id: Uuid) -> sqlx::Result<Option<ProfileUpload>> {
        // First, unset all current avatars for this user
        sqlx::query("UPDATE profile_uploads SET is_current = false WHERE user_id = $1")
            .bind(user_id)
            .execute(&self.pool)
            .await?;

        // Then set the new one
        sqlx::query_as::<_, ProfileUpload>(
            "UPDATE profile_uploads SET is_current = true WHERE id = $1 AND user_id = $2
             RETURNING id, user_id, file_path, content_type, file_size, is_current, created_at"
        )
        .bind(upload_id)
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn delete_upload(&self, user_id: Uuid, upload_id: Uuid) -> sqlx::Result<()> {
        sqlx::query("DELETE FROM profile_uploads WHERE id = $1 AND user_id = $2")
            .bind(upload_id)
            .bind(user_id)
            .execute(&self.pool)
            .await?;
        Ok(( })
    }

    pub async fn get_upload_by_id(&self, upload_id: Uuid) -> sqlx::Result<Option<ProfileUpload>> {
        sqlx::query_as::<_, ProfileUpload>(
            "SELECT id, user_id, file_path, content_type, file_size, is_current, created_at 
             FROM profile_uploads WHERE id = $1"
        )
        .bind(upload_id)
        .fetch_optional(&self.pool)
        .await
    }
}


