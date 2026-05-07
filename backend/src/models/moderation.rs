use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Moderation rule type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum RuleType {
    Insult,
    Harassment,
    Spam,
}

impl RuleType {
    pub fn as_str(&self) -> &str {
        match self {
            RuleType::Insult => "insult",
            RuleType::Harassment => "harassment",
            RuleType::Spam => "spam",
        }
    }
}

/// Action to take on moderated content
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ModerationAction {
    Flag,   // Mark for review
    Hide,   // Hide from view
    Remove, // Delete the message
}

impl ModerationAction {
    pub fn as_str(&self) -> &str {
        match self {
            ModerationAction::Flag => "flag",
            ModerationAction::Hide => "hide",
            ModerationAction::Remove => "remove",
        }
    }
}

/// Moderation rule
#[derive(Debug, Clone, Serialize, FromRow)]
pub struct ModerationRule {
    pub id: i32,
    pub rule_type: String,
    pub keywords: Vec<String>,
    pub action: String,
    pub severity: i32,
    pub enabled: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Moderated message record
#[derive(Debug, Clone, Serialize, FromRow)]
pub struct ModeratedMessage {
    pub id: Uuid,
    pub message_id: Option<Uuid>,
    pub user_id: Uuid,
    pub channel_id: Option<Uuid>,
    pub dm_id: Option<Uuid>,
    pub rule_type: String,
    pub severity: i32,
    pub action_taken: String,
    pub original_content: Option<String>,
    pub is_visible: bool,
    pub reviewed_by: Option<Uuid>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

/// Request to create moderation rule
#[derive(Debug, Deserialize)]
pub struct CreateModerationRulePayload {
    pub rule_type: String,
    pub keywords: Vec<String>,
    pub action: String,
    pub severity: Option<i32>,
}

/// Response for moderation
#[derive(Debug, Serialize)]
pub struct ModerationCheckResult {
    pub is_clean: bool,
    pub rule_type: Option<String>,
    pub severity: Option<i32>,
    pub action: Option<String>,
}

