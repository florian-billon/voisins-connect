use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Subscription status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, sqlx::Type, PartialEq, Eq)]
#[sqlx(type_name = "subscription_status")]
#[serde(rename_all = "lowercase")]
pub enum SubscriptionStatus {
    #[sqlx(rename = "active")]
    Active,
    #[sqlx(rename = "inactive")]
    Inactive,
    #[sqlx(rename = "cancelled")]
    Cancelled,
}

/// User subscription model
#[derive(Debug, Clone, Serialize, FromRow)]
pub struct UserSubscription {
    pub id: Uuid,
    pub user_id: Uuid,
    pub status: SubscriptionStatus,
    pub plan_name: String,
    pub started_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub stripe_subscription_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Response for subscription
#[derive(Debug, Clone, Serialize)]
pub struct UserSubscriptionResponse {
    pub id: Uuid,
    pub user_id: Uuid,
    pub status: SubscriptionStatus,
    pub plan_name: String,
    pub started_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

impl From<UserSubscription> for UserSubscriptionResponse {
    fn from(subscription: UserSubscription) -> Self {
        Self {
            id: subscription.id,
            user_id: subscription.user_id,
            status: subscription.status,
            plan_name: subscription.plan_name,
            started_at: subscription.started_at,
            expires_at: subscription.expires_at,
            created_at: subscription.created_at,
        }
    }
}

/// Payload to create/update subscription
#[derive(Debug, Deserialize)]
pub struct CreateSubscriptionPayload {
    pub status: Option<SubscriptionStatus>,
    pub expires_at: Option<DateTime<Utc>>,
}
