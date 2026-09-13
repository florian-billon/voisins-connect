use serde::{Deserialize, Serialize};
use crate::error::Result;
use crate::handlers::paypal::{PayPalOrderResponse, PayPalCaptureResponse};

#[derive(Debug, Serialize, Deserialize)]
pub struct PayPalOrder {
    pub id: String,
    pub status: String,
    pub links: Vec<PayPalLink>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PayPalLink {
    pub href: String,
    pub rel: String,
    pub method: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PayPalAmount {
    pub currency_code: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PayPalPurchaseUnit {
    pub reference_id: String,
    pub amount: PayPalAmount,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PayPalOrderRequest {
    pub intent: String,
    pub purchase_units: Vec<PayPalPurchaseUnit>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PayPalCaptureDetails {
    pub id: String,
    pub status: String,
    pub purchase_units: Vec<PayPalPurchaseUnit>,
}

#[derive(Clone)]
pub struct PayPalService {
    _client_id: String,
    _client_secret: String,
    _base_url: String,
}

impl PayPalService {
    pub fn new(client_id: String, client_secret: String, sandbox: bool) -> Self {
        let base_url = if sandbox {
            "https://api-m.sandbox.paypal.com"
        } else {
            "https://api-m.paypal.com"
        }.to_string();

        Self {
            _client_id: client_id,
            _client_secret: client_secret,
            _base_url: base_url,
        }
    }

    // Premium features disabled
    pub async fn get_access_token(&self) -> Result<String> {
        Err("Premium features are disabled".into())
    }

    pub async fn create_order(
        &self,
        _amount: f64,
        _currency: &str,
        _description: &str,
    ) -> Result<PayPalOrderResponse> {
        Err("Premium features are disabled".into())
    }

    pub async fn capture_order(&self, _order_id: &str) -> Result<PayPalCaptureResponse> {
        Err("Premium features are disabled".into())
    }

    pub async fn process_webhook(&self, _payload: serde_json::Value) -> Result<()> {
        Err("Premium features are disabled".into())
    }
}
