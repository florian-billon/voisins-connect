use web_push::{
    ContentEncoding, Isolation, Payload, PushBuilder, SubscriptionInfo, VapidSignatureBuilder,
};

use crate::error::{Error, Result};

pub struct PushService {
    vapid_private_key: String,
    vapid_public_key: String,
    vapid_subject: String,
}

impl PushService {
    pub fn new(vapid_private_key: String, vapid_public_key: String, vapid_subject: String) -> Self {
        Self {
            vapid_private_key,
            vapid_public_key,
            vapid_subject,
        }
    }

    pub async fn send_notification(
        &self,
        endpoint: &str,
        p256dh: &str,
        auth: &str,
        title: &str,
        body: &str,
    ) -> Result<()> {
        let subscription_info = SubscriptionInfo::new(endpoint, p256dh, auth);

        let signature_builder = VapidSignatureBuilder::new(
            &self.vapid_private_key,
            &subscription_info,
            &self.vapid_subject,
            &self.vapid_public_key,
        )
        .map_err(|e| Error::InternalError {
            message: format!("Failed to create VAPID signature: {}", e),
        })?;

        let signature = signature_builder
            .build()
            .map_err(|e| Error::InternalError {
                message: format!("Failed to build VAPID signature: {}", e),
            })?;

        let payload = Payload::new(
            serde_json::json!({
                "title": title,
                "body": body,
                "icon": "/icon-192.png",
                "badge": "/icon-192.png"
            })
            .to_string(),
        );

        let mut push_builder = PushBuilder::new(&subscription_info);
        push_builder.set_vapid_signature(signature);
        push_builder.set_payload(ContentEncoding::AesGcm, payload);

        push_builder
            .send()
            .map_err(|e| Error::InternalError {
                message: format!("Failed to send push notification: {}", e),
            })?;

        Ok(())
    }
}
