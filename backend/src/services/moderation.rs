use uuid::Uuid;

use crate::error::Result;
use crate::models::{ModeratedMessage, ModerationCheckResult};
use crate::repositories::ModerationRepository;

/// Initialize default moderation rules
pub async fn initialize_rules(repo: &ModerationRepository) -> Result<()> {
    // Check if rules already exist
    let rules = repo
        .get_all_rules()
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })?;

    if !rules.is_empty() {
        return Ok(());
    }

    // Create default rules for insults
    let insult_keywords = vec![
        "stupid".to_string(),
        "idiot".to_string(),
        "dumb".to_string(),
        "moron".to_string(),
        "imbécile".to_string(),
        "con".to_string(),
        "débile".to_string(),
    ];
    repo.create_rule("insult", insult_keywords, "flag", 2)
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })?;

    // Create default rules for harassment
    let harassment_keywords = vec![
        "kill yourself".to_string(),
        "go die".to_string(),
        "you deserve".to_string(),
    ];
    repo.create_rule("harassment", harassment_keywords, "hide", 4)
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })?;

    // Create default rules for spam
    let spam_keywords = vec!["http".to_string(), "https".to_string(), "spam".to_string()];
    repo.create_rule("spam", spam_keywords, "flag", 1)
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })?;

    Ok(())
}

/// Check if a message contains moderation violations
pub async fn check_message(
    repo: &ModerationRepository,
    content: &str,
) -> Result<ModerationCheckResult> {
    let rules = repo
        .get_all_rules()
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })?;

    let content_lower = content.to_lowercase();

    for rule in rules {
        for keyword in &rule.keywords {
            if content_lower.contains(&keyword.to_lowercase()) {
                return Ok(ModerationCheckResult {
                    is_clean: false,
                    rule_type: Some(rule.rule_type.clone()),
                    severity: Some(rule.severity),
                    action: Some(rule.action.clone()),
                });
            }
        }
    }

    Ok(ModerationCheckResult {
        is_clean: true,
        rule_type: None,
        severity: None,
        action: None,
    })
}

/// Log a moderated message
pub async fn log_moderated_message(
    repo: &ModerationRepository,
    user_id: Uuid,
    channel_id: Option<Uuid>,
    dm_id: Option<Uuid>,
    rule_type: &str,
    severity: i32,
    action: &str,
    original_content: Option<String>,
) -> Result<ModeratedMessage> {
    repo.log_moderation(
        user_id,
        channel_id,
        dm_id,
        rule_type,
        severity,
        action,
        original_content,
    )
    .await
    .map_err(|e| crate::error::Error::Database {
        message: e.to_string(),
    })
}

/// Get moderation logs for a user
pub async fn get_user_logs(
    repo: &ModerationRepository,
    user_id: Uuid,
    limit: i64,
) -> Result<Vec<ModeratedMessage>> {
    repo.get_user_moderation_logs(user_id, limit)
        .await
        .map_err(|e| crate::error::Error::Database {
            message: e.to_string(),
        })
}
