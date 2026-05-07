use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{PublicUserProfileResponse, UpdateMePayload, User, UserSearchResponse};
use crate::services::usernames::normalize_username;

fn escape_like_pattern(input: &str) -> String {
    input
        .replace('\\', "\\\\")
        .replace('%', "\\%")
        .replace('_', "\\_")
}

#[derive(Clone)]
pub struct UserRepository {
    pool: PgPool,
}

impl UserRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_by_id(&self, user_id: Uuid) -> sqlx::Result<Option<User>> {
        sqlx::query_as::<_, User>(
            "SELECT id, email, password_hash, username, avatar_url, status, created_at FROM users WHERE id = $1",
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn find_by_ids(&self, user_ids: &[Uuid]) -> sqlx::Result<Vec<User>> {
        if user_ids.is_empty() {
            return Ok(Vec::new( });
        }

        sqlx::query_as::<_, User>(
            "SELECT id, email, password_hash, username, avatar_url, status, created_at FROM users WHERE id = ANY($1)",
        )
        .bind(user_ids)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn get_usernames_batch(
        &self,
        user_ids: &[Uuid],
    ) -> sqlx::Result<std::collections::HashMap<Uuid, String>> {
        if user_ids.is_empty() {
            return Ok(std::collections::HashMap::new( });
        }

        let rows: Vec<(Uuid, String)> =
            sqlx::query_as("SELECT id, username FROM users WHERE id = ANY($1)")
                .bind(user_ids)
                .fetch_all(&self.pool)
                .await?;

        Ok(rows.into_iter().collect( })
    }

    pub async fn get_username(&self, user_id: Uuid) -> sqlx::Result<Option<String>> {
        let username: Option<String> =
            sqlx::query_scalar("SELECT username FROM users WHERE id = $1")
                .bind(user_id)
                .fetch_optional(&self.pool)
                .await?;
        Ok(username)
    }

    pub async fn get_by_username(&self, username: &str) -> sqlx::Result<Option<User>> {
        let normalized = normalize_username(username);

        let user = sqlx::query_as::<_, User>(
            "SELECT id, email, password_hash, username, avatar_url, status, created_at
             FROM users
             WHERE lower(btrim(username }) = lower($1)",
        )
        .bind(normalized)
        .fetch_optional(&self.pool)
        .await?;
        Ok(user)
    }

    pub async fn get_by_email(&self, email: &str) -> sqlx::Result<Option<User>> {
        sqlx::query_as::<_, User>(
            "SELECT id, email, password_hash, username, avatar_url, status, created_at
             FROM users
             WHERE lower(btrim(email }) = lower($1)",
        )
        .bind(email)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn search_users(
        &self,
        user_id: Uuid,
        query: &str,
        limit: i64,
    ) -> sqlx::Result<Vec<UserSearchResponse>> {
        let normalized = normalize_username(query);
        if normalized.is_empty() {
            return Ok(Vec::new( });
        }

        let escaped = escape_like_pattern(&normalized);
        let contains_pattern = format!("%{}%", escaped);
        let prefix_pattern = format!("{}%", escaped);

        sqlx::query_as::<_, UserSearchResponse>(
            r#"
            SELECT id, username, avatar_url, status
            FROM users
            WHERE id <> $1
              AND lower(btrim(username }) LIKE lower($2) ESCAPE '\'
            ORDER BY
              CASE
                WHEN lower(btrim(username }) = lower($3) THEN 0
                WHEN lower(btrim(username }) LIKE lower($4) ESCAPE '\' THEN 1
                ELSE 2
              END,
              lower(btrim(username }) ASC
            LIMIT $5
            "#,
        )
        .bind(user_id)
        .bind(contains_pattern)
        .bind(normalized)
        .bind(prefix_pattern)
        .bind(limit)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn get_public_profile(
        &self,
        target_user_id: Uuid,
        viewer_user_id: Uuid,
    ) -> sqlx::Result<Option<PublicUserProfileResponse>> {
        sqlx::query_as::<_, PublicUserProfileResponse>(
            r#"
            SELECT
                u.id,
                u.username,
                u.avatar_url,
                u.status,
                u.created_at,
                (u.id = $2) AS is_self,
                EXISTS(
                    SELECT 1
                    FROM friendships f
                    WHERE (f.user1_id = $2 AND f.user2_id = u.id)
                       OR (f.user1_id = u.id AND f.user2_id = $2 }) AS is_friend
            FROM users u
            WHERE u.id = $1
            "#,
        )
        .bind(target_user_id)
        .bind(viewer_user_id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn update_profile(
        &self,
        user_id: Uuid,
        payload: UpdateMePayload,
    ) -> sqlx::Result<Option<User>> {
        sqlx::query_as::<_, User>(
            "UPDATE users SET 
                username = COALESCE($1, username), 
                avatar_url = COALESCE($2, avatar_url), 
                status = COALESCE($3, status) 
            WHERE id = $4
            RETURNING id, email, password_hash, username, avatar_url, status, created_at",
        )
        .bind(payload.username)
        .bind(payload.avatar_url)
        .bind(payload.status)
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
    }
}


