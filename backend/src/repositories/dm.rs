use crate::error::Result;
use crate::models::dm::DMWithRecipient;
use sqlx::{PgPool, Row};
use uuid::Uuid;

#[derive(Clone)]
pub struct DmRepository {
    pool: PgPool,
}

impl DmRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_or_get_dm(&self, u1: Uuid, u2: Uuid) -> Result<Uuid> {
        let (first, second) = if u1 < u2 { (u1, u2) } else { (u2, u1) };

        let row = sqlx::query(
            r#"
            WITH inserted AS (
                INSERT INTO direct_messages (user1_id, user2_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
                RETURNING id
            )
            SELECT id FROM inserted
            UNION ALL
            SELECT id FROM direct_messages
            WHERE user1_id = $1 AND user2_id = $2
            LIMIT 1
            "#,
        )
        .bind(first)
        .bind(second)
        .fetch_one(&self.pool)
        .await?;

        let id: Uuid = row.get("id");
        Ok(id)
    }

    pub async fn user_has_access(&self, dm_id: Uuid, user_id: Uuid) -> Result<bool> {
        let has_access = sqlx::query_scalar::<_, bool>(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM direct_messages
                WHERE id = $1 AND (user1_id = $2 OR user2_id = $2 })
            "#,
        )
        .bind(dm_id)
        .bind(user_id)
        .fetch_one(&self.pool)
        .await?;

        Ok(has_access)
    }

    pub async fn list_user_dms(&self, user_id: Uuid) -> Result<Vec<DMWithRecipient>> {
        let conversations = sqlx::query_as::<_, DMWithRecipient>(
            r#"
            SELECT
                dm.id,
                recipient.id AS recipient_id,
                recipient.username,
                recipient.avatar_url,
                recipient.status::TEXT AS status,
                dm.created_at
            FROM direct_messages dm
            JOIN users recipient
              ON recipient.id = CASE
                WHEN dm.user1_id = $1 THEN dm.user2_id
                ELSE dm.user1_id
              END
            WHERE dm.user1_id = $1 OR dm.user2_id = $1
            ORDER BY dm.created_at DESC
            "#,
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(conversations)
    }

    pub async fn get_dm_details(
        &self,
        dm_id: Uuid,
        user_id: Uuid,
    ) -> Result<Option<DMWithRecipient>> {
        let conversation = sqlx::query_as::<_, DMWithRecipient>(
            r#"
            SELECT
                dm.id,
                recipient.id AS recipient_id,
                recipient.username,
                recipient.avatar_url,
                recipient.status::TEXT AS status,
                dm.created_at
            FROM direct_messages dm
            JOIN users recipient
              ON recipient.id = CASE
                WHEN dm.user1_id = $2 THEN dm.user2_id
                ELSE dm.user1_id
              END
            WHERE dm.id = $1 AND (dm.user1_id = $2 OR dm.user2_id = $2)
            "#,
        )
        .bind(dm_id)
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(conversation)
    }

    pub async fn get_participants(&self, dm_id: Uuid) -> Result<Option<(Uuid, Uuid)>> {
        let row = sqlx::query(
            r#"
            SELECT user1_id, user2_id
            FROM direct_messages
            WHERE id = $1
            "#,
        )
        .bind(dm_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|row| (row.get("user1_id"), row.get("user2_id" }) })
    }
}


