use reqwest::Client;
use serde_json::Value;
use uuid::Uuid;

use crate::error::Result;

#[derive(Clone)]
pub struct StripeService {
    _client: Client,
    _api_key: String,
    _price_id: String,
}

impl StripeService {
    pub fn new(api_key: String, price_id: String) -> Self {
        let client = Client::new();
        Self {
            _client: client,
            _api_key: api_key,
            _price_id: price_id,
        }
    }

    /// Create a Stripe checkout session for a subscription - Premium disabled
    pub async fn create_checkout_session(
        &self,
        _user_id: Uuid,
        _user_email: &str,
        _success_url: &str,
        _cancel_url: &str,
    ) -> Result<String> {
        // Premium features disabled
        Err("Premium features are disabled".into())
    }

    /// Verify a Stripe webhook signature - Premium disabled
    pub fn verify_webhook_signature(
        &self,
        _payload: &[u8],
        _signature: &str,
    ) -> Result<bool> {
        // Premium features disabled
        Ok(false)
    }
}
