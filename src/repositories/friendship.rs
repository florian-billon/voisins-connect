use sqlx::PgPool;
use uuid::Uuid;

use crate::models::FriendSummary;

#[derive(Clone)]
pub struct FriendshipRepository {
    pool: PgPool,
}

impl FriendshipRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, user_id: Uuid, friend_id: Uuid) -> sqlx::Result<bool> {
        let (first, second) = if user_id < friend_id {
            (user_id, friend_id)
        } else {
            (friend_id, user_id)
        };

        let result = sqlx::query(
            r#"
            INSERT INTO friendships (user1_id, user2_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            "#,
        )
        .bind(first)
        .bind(second)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn list_friends(&self, user_id: Uuid) -> sqlx::Result<Vec<FriendSummary>> {
        sqlx::query_as::<_, FriendSummary>(
            r#"
            SELECT
                friend.id,
                friend.username,
                friend.avatar_url,
                friend.status,
                friend.created_at
            FROM friendships f
            JOIN users friend
              ON friend.id = CASE
                WHEN f.user1_id = $1 THEN f.user2_id
                ELSE f.user1_id
              END
            WHERE f.user1_id = $1 OR f.user2_id = $1
            ORDER BY lower(friend.username) ASC
            "#,
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn delete(&self, user_id: Uuid, friend_id: Uuid) -> sqlx::Result<bool> {
        let (first, second) = if user_id < friend_id {
            (user_id, friend_id)
        } else {
            (friend_id, user_id)
        };

        let result = sqlx::query(
            r#"
            DELETE FROM friendships
            WHERE user1_id = $1 AND user2_id = $2
            "#,
        )
        .bind(first)
        .bind(second)
        .execute(&self.pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }
}
