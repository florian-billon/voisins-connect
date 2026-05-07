use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{ModeratedMessage, ModerationRule};

#[derive(Clone)]
pub struct ModerationRepository {
    pool: PgPool,
}

impl ModerationRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    // ============= Moderation Rules =============
    pub async fn get_all_rules(&self) -> sqlx::Result<Vec<ModerationRule>> {
        sqlx::query_as::<_, ModerationRule>(
            "SELECT id, rule_type, keywords, action, severity, enabled, created_at, updated_at 
             FROM moderation_rules WHERE enabled = true"
        )
        .fetch_all(&self.pool)
        .await
    }

    pub async fn get_rules_by_type(&self, rule_type: &str) -> sqlx::Result<Vec<ModerationRule>> {
        sqlx::query_as::<_, ModerationRule>(
            "SELECT id, rule_type, keywords, action, severity, enabled, created_at, updated_at 
             FROM moderation_rules WHERE rule_type = $1 AND enabled = true"
        )
        .bind(rule_type)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn create_rule(
        &self,
        rule_type: &str,
        keywords: Vec<String>,
        action: &str,
        severity: i32,
    ) -> sqlx::Result<ModerationRule> {
        sqlx::query_as::<_, ModerationRule>(
            "INSERT INTO moderation_rules (rule_type, keywords, action, severity) 
             VALUES ($1, $2, $3, $4)
             RETURNING id, rule_type, keywords, action, severity, enabled, created_at, updated_at"
        )
        .bind(rule_type)
        .bind(keywords)
        .bind(action)
        .bind(severity)
        .fetch_one(&self.pool)
        .await
    }

    // ============= Moderated Messages =============
    pub async fn log_moderation(
        &self,
        user_id: Uuid,
        channel_id: Option<Uuid>,
        dm_id: Option<Uuid>,
        rule_type: &str,
        severity: i32,
        action: &str,
        original_content: Option<String>,
    ) -> sqlx::Result<ModeratedMessage> {
        sqlx::query_as::<_, ModeratedMessage>(
            "INSERT INTO moderated_messages 
             (user_id, channel_id, dm_id, rule_type, severity, action_taken, original_content) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, message_id, user_id, channel_id, dm_id, rule_type, severity, action_taken, original_content, is_visible, reviewed_by, reviewed_at, created_at"
        )
        .bind(user_id)
        .bind(channel_id)
        .bind(dm_id)
        .bind(rule_type)
        .bind(severity)
        .bind(action)
        .bind(original_content)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn get_user_moderation_logs(
        &self,
        user_id: Uuid,
        limit: i64,
    ) -> sqlx::Result<Vec<ModeratedMessage>> {
        sqlx::query_as::<_, ModeratedMessage>(
            "SELECT id, message_id, user_id, channel_id, dm_id, rule_type, severity, action_taken, 
                    original_content, is_visible, reviewed_by, reviewed_at, created_at
             FROM moderated_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2"
        )
        .bind(user_id)
        .bind(limit)
        .fetch_all(&self.pool)
        .await
    }

    pub async fn update_visibility(
        &self,
        moderated_id: Uuid,
        is_visible: bool,
        reviewed_by: Uuid,
    ) -> sqlx::Result<Option<ModeratedMessage>> {
        sqlx::query_as::<_, ModeratedMessage>(
            "UPDATE moderated_messages SET is_visible = $1, reviewed_by = $2, reviewed_at = NOW() 
             WHERE id = $3
             RETURNING id, message_id, user_id, channel_id, dm_id, rule_type, severity, action_taken, 
                      original_content, is_visible, reviewed_by, reviewed_at, created_at"
        )
        .bind(is_visible)
        .bind(reviewed_by)
        .bind(moderated_id)
        .fetch_optional(&self.pool)
        .await
    }
}

