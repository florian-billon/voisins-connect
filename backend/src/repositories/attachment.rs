use crate::error::Result;
use crate::models::attachment::{Attachment, AttachmentCreate};
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Clone)]
pub struct AttachmentRepository {
    pool: PgPool,
}

impl AttachmentRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    pub async fn create(&self, data: AttachmentCreate) -> Result<Attachment> {
        let attachment = sqlx::query_as::<_, Attachment>(
            "INSERT INTO attachments (sender_id, filename, file_path, content_type, file_size) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *",
        )
        .bind(data.sender_id)
        .bind(data.filename)
        .bind(data.file_path)
        .bind(data.content_type)
        .bind(data.file_size)
        .fetch_one(&self.pool)
        .await?;

        Ok(attachment)
    }

    pub async fn get_by_id(&self, id: Uuid) -> Result<Attachment> {
        let attachment = sqlx::query_as::<_, Attachment>("SELECT * FROM attachments WHERE id = $1")
            .bind(id)
            .fetch_one(&self.pool)
            .await?;

        Ok(attachment)
    }
}
