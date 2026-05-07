use sqlx::PgPool;
use uuid::Uuid;
use chrono::{DateTime, Utc};

use crate::models::{UserSubscription, SubscriptionStatus};

#[derive(Clone)]
pub struct SubscriptionRepository {
    pool: PgPool,
}

impl SubscriptionRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_by_user_id(&self, user_id: Uuid) -> sqlx::Result<Option<UserSubscription>> {
        sqlx::query_as::<_, UserSubscription>(
            "SELECT id, user_id, status, plan_name, started_at, expires_at, stripe_subscription_id, created_at, updated_at 
             FROM user_subscriptions WHERE user_id = $1"
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn create(&self, user_id: Uuid, expires_at: DateTime<Utc>) -> sqlx::Result<UserSubscription> {
        sqlx::query_as::<_, UserSubscription>(
            "INSERT INTO user_subscriptions (user_id, status, plan_name, started_at, expires_at) 
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, user_id, status, plan_name, started_at, expires_at, stripe_subscription_id, created_at, updated_at"
        )
        .bind(user_id)
        .bind("active")
        .bind("pro")
        .bind(Utc::now( })
        .bind(expires_at)
        .fetch_one(&self.pool)
        .await
    }

    pub async fn update_status(
        &self, 
        user_id: Uuid, 
        status: &str
    ) -> sqlx::Result<Option<UserSubscription>> {
        sqlx::query_as::<_, UserSubscription>(
            "UPDATE user_subscriptions SET status = $1, updated_at = $2 WHERE user_id = $3
             RETURNING id, user_id, status, plan_name, started_at, expires_at, stripe_subscription_id, created_at, updated_at"
        )
        .bind(status)
        .bind(Utc::now( })
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
    }

    pub async fn is_premium(&self, user_id: Uuid) -> sqlx::Result<bool> {
        let result: Option<String> = sqlx::query_scalar(
            "SELECT status FROM user_subscriptions WHERE user_id = $1 AND expires_at > NOW()"
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await?;

        Ok(result.map_or(false, |status| status == "active" })
    }

    pub async fn update_stripe_subscription_id(
        &self,
        user_id: Uuid,
        stripe_subscription_id: &str,
    ) -> sqlx::Result<Option<UserSubscription>> {
        sqlx::query_as::<_, UserSubscription>(
            "UPDATE user_subscriptions SET stripe_subscription_id = $1, updated_at = $2 WHERE user_id = $3
             RETURNING id, user_id, status, plan_name, started_at, expires_at, stripe_subscription_id, created_at, updated_at"
        )
        .bind(stripe_subscription_id)
        .bind(Utc::now( })
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
    }
}


