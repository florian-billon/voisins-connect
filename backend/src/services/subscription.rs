use uuid::Uuid;
use chrono::{Duration, Utc};

use crate::models::{UserSubscription, SubscriptionStatus};
use crate::repositories::SubscriptionRepository;
use crate::error::Result;

pub async fn get_user_subscription(
    repo: &SubscriptionRepository,
    user_id: Uuid,
) -> Result<Option<UserSubscription>> {
    repo.find_by_user_id(user_id)
        .await
        .map_err(|e| crate::error::Error::Database { message: e.to_string() })
}

pub async fn activate_premium(
    repo: &SubscriptionRepository,
    user_id: Uuid,
) -> Result<UserSubscription> {
    // 30-day subscription
    let expires_at = Utc::now() + Duration::days(30);
    repo.create(user_id, expires_at)
        .await
        .map_err(|e| crate::error::Error::Database { message: e.to_string() })
}

pub async fn cancel_subscription(
    repo: &SubscriptionRepository,
    user_id: Uuid,
) -> Result<Option<UserSubscription>> {
    repo.update_status(user_id, "cancelled")
        .await
        .map_err(|e| crate::error::Error::Database { message: e.to_string() })
}

pub async fn is_premium(
    repo: &SubscriptionRepository,
    user_id: Uuid,
) -> Result<bool> {
    repo.is_premium(user_id)
        .await
        .map_err(|e| crate::error::Error::Database { message: e.to_string() })
}




