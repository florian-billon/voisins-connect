use chrono::DateTime;
use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{VoiceCall, VoiceChannel};

#[derive(Clone)]
pub struct VoiceRepository {
    pool: PgPool,
}

impl VoiceRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // ============= Voice Calls =============
    pub async fn create_call(
        &self,
        initiator_id: Uuid,
        recipient_id: Uuid,
        voice_channel_id: Option<Uuid>,
    ) -> sqlx::Result<VoiceCall> {
        sqlx::query_as::<_, VoiceCall>(
            "INSERT INTO voice_calls (initiator_id, recipient_id, voice_channel_id, status) 
             VALUES ($1, $2, $3, $4)
             RETURNING id, initiator_id, recipient_id, voice_channel_id, status, started_at, 
                      ended_at, duration_seconds, signal_data, created_at, updated_at",
        )
        .bind(initiator_id)
        .bind(recipient_id)
        .bind(voice_channel_id)
        .bind("pending")
        .fetch_one(&self.pool)
        .await
    }

    pub async fn find_call_by_id(&self, call_id: Uuid) -> sqlx::Result<Option<VoiceCall>> {
        sqlx::query_as::<_, VoiceCall>(
            "SELECT id, initiator_id, recipient_id, voice_channel_id, status, started_at, 
                    ended_at, duration_seconds, signal_data, created_at, updated_at 
             FROM voice_calls WHERE id = $1",
        )
        .bind(call_id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn update_call_status(
        &self,
        call_id: Uuid,
        status: &str,
    ) -> sqlx::Result<Option<VoiceCall>> {
        sqlx::query_as::<_, VoiceCall>(
            "UPDATE voice_calls SET status = $1, updated_at = NOW() WHERE id = $2
             RETURNING id, initiator_id, recipient_id, voice_channel_id, status, started_at, 
                      ended_at, duration_seconds, signal_data, created_at, updated_at",
        )
        .bind(status)
        .bind(call_id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn start_call(&self, call_id: Uuid) -> sqlx::Result<Option<VoiceCall>> {
        sqlx::query_as::<_, VoiceCall>(
            "UPDATE voice_calls SET status = $1, started_at = NOW(), updated_at = NOW() WHERE id = $2
             RETURNING id, initiator_id, recipient_id, voice_channel_id, status, started_at, 
                      ended_at, duration_seconds, signal_data, created_at, updated_at"
        )
        .bind("active")
        .bind(call_id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn end_call(&self, call_id: Uuid) -> sqlx::Result<Option<VoiceCall>> {
        sqlx::query_as::<_, VoiceCall>(
            "UPDATE voice_calls SET status = $1, ended_at = NOW(), 
             duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::int,
             updated_at = NOW() WHERE id = $2
             RETURNING id, initiator_id, recipient_id, voice_channel_id, status, started_at, 
                      ended_at, duration_seconds, signal_data, created_at, updated_at",
        )
        .bind("ended")
        .bind(call_id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn get_user_recent_calls(
        &self,
        user_id: Uuid,
        limit: i64,
    ) -> sqlx::Result<Vec<VoiceCall>> {
        sqlx::query_as::<_, VoiceCall>(
            "SELECT id, initiator_id, recipient_id, voice_channel_id, status, started_at, 
                    ended_at, duration_seconds, signal_data, created_at, updated_at
             FROM voice_calls 
             WHERE (initiator_id = $1 OR recipient_id = $1) AND status IN ('ended', 'rejected')
             ORDER BY created_at DESC LIMIT $2",
        )
        .bind(user_id)
        .bind(limit)
        .fetch_all(&self.pool)
        .await
    }

    // ============= Voice Channels =============
    pub async fn create_voice_channel(
        &self,
        server_id: Uuid,
        name: &str,
        position: i32,
        max_users: Option<i32>,
        is_premium_only: bool,
    ) -> sqlx::Result<VoiceChannel> {
        sqlx::query_as::<_, VoiceChannel>(
            "INSERT INTO voice_channels (server_id, name, position, max_users, is_premium_only) 
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, server_id, name, position, max_users, is_premium_only, created_at, updated_at"
        )
        .bind(server_id)
        .bind(name)
        .bind(position)
        .bind(max_users)
        .bind(is_premium_only)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn find_voice_channel_by_id(
        &self,
        channel_id: Uuid,
    ) -> sqlx::Result<Option<VoiceChannel>> {
        sqlx::query_as::<_, VoiceChannel>(
            "SELECT id, server_id, name, position, max_users, is_premium_only, created_at, updated_at 
             FROM voice_channels WHERE id = $1"
        )
        .bind(channel_id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn list_server_voice_channels(
        &self,
        server_id: Uuid,
    ) -> sqlx::Result<Vec<VoiceChannel>> {
        sqlx::query_as::<_, VoiceChannel>(
            "SELECT id, server_id, name, position, max_users, is_premium_only, created_at, updated_at 
             FROM voice_channels WHERE server_id = $1 ORDER BY position ASC"
        )
        .bind(server_id)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn update_voice_channel(
        &self,
        channel_id: Uuid,
        name: Option<&str>,
        position: Option<i32>,
        max_users: Option<i32>,
    ) -> sqlx::Result<Option<VoiceChannel>> {
        let mut query = "UPDATE voice_channels SET updated_at = NOW()".to_string();
        let mut param_count = 1;

        if name.is_some() {
            query.push_str(&format!(", name = ${}", param_count));
            param_count += 1;
        }
        if position.is_some() {
            query.push_str(&format!(", position = ${}", param_count));
            param_count += 1;
        }
        if max_users.is_some() {
            query.push_str(&format!(", max_users = ${}", param_count));
            param_count += 1;
        }

        query.push_str(&format!(" WHERE id = ${} RETURNING id, server_id, name, position, max_users, is_premium_only, created_at, updated_at", param_count));

        let mut q = sqlx::query_as::<_, VoiceChannel>(&query);
        if let Some(n) = name {
            q = q.bind(n);
        }
        if let Some(p) = position {
            q = q.bind(p);
        }
        if let Some(m) = max_users {
            q = q.bind(m);
        }
        q = q.bind(channel_id);

        q.fetch_optional(&self.pool).await
    }

    pub async fn delete_voice_channel(&self, channel_id: Uuid) -> sqlx::Result<()> {
        sqlx::query("DELETE FROM voice_channels WHERE id = $1")
            .bind(channel_id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
