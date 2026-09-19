use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_s3::Client;
use uuid::Uuid;

use crate::error::Result;

#[derive(Clone)]
pub struct S3Service {
    client: Client,
    bucket: String,
}

impl S3Service {
    pub async fn new(bucket: String) -> Result<Self> {
        // Charger la configuration AWS depuis les variables d'environnement
        let mut config_loader = aws_config::defaults(aws_config::BehaviorVersion::latest());

        // Si un endpoint personnalisé est défini (pour Backblaze B2, etc.)
        if let Ok(endpoint_url) = std::env::var("AWS_ENDPOINT_URL") {
            tracing::info!("Using custom S3 endpoint: {}", endpoint_url);
            config_loader = config_loader.endpoint_url(endpoint_url);
        }

        let config = config_loader.load().await;
        let client = Client::new(&config);
        Ok(Self { client, bucket })
    }

    /// Upload a file to S3
    pub async fn upload_file(
        &self,
        key: &str,
        body: ByteStream,
        content_type: &str,
    ) -> Result<String> {
        tracing::info!("[S3] Uploading file to bucket: {}, key: {}", self.bucket, key);

        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .body(body)
            .content_type(content_type)
            .send()
            .await
            .map_err(|e| {
                tracing::error!("[S3] Failed to upload file: {:?}", e);
                crate::error::Error::Database {
                    message: e.to_string(),
                }
            })?;

        tracing::info!("[S3] File uploaded successfully");

        // Return the custom endpoint URL if configured, otherwise standard S3 URL
        let url = if let Ok(endpoint_url) = std::env::var("AWS_ENDPOINT_URL") {
            format!("{}/{}/{}", endpoint_url, self.bucket, key)
        } else {
            format!("https://{}.s3.amazonaws.com/{}", self.bucket, key)
        };

        tracing::info!("[S3] File URL: {}", url);
        Ok(url)
    }

    /// Delete a file from S3
    pub async fn delete_file(&self, key: &str) -> Result<()> {
        self.client
            .delete_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| crate::error::Error::Database {
                message: e.to_string(),
            })?;

        Ok(())
    }

    /// Generate a presigned URL for downloading
    pub async fn get_presigned_url(&self, key: &str, expires_in: u64) -> Result<String> {
        tracing::info!("[S3] Generating presigned URL for key: {}, expires_in: {}s", key, expires_in);

        let presigner = aws_sdk_s3::presigning::PresigningConfig::expires_in(
            std::time::Duration::from_secs(expires_in),
        )
        .map_err(|e| {
            tracing::error!("[S3] Failed to create presigning config: {:?}", e);
            crate::error::Error::Database {
                message: e.to_string(),
            }
        })?;

        let presigned = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .presigned(presigner)
            .await
            .map_err(|e| {
                tracing::error!("[S3] Failed to generate presigned URL: {:?}", e);
                crate::error::Error::Database {
                    message: e.to_string(),
                }
            })?;

        let url = presigned.uri().to_string();
        tracing::info!("[S3] Presigned URL generated successfully: {}", url);
        Ok(url)
    }

    /// Generate profile upload key
    pub fn generate_profile_key(user_id: Uuid, filename: &str) -> String {
        let extension = filename.split('.').last().unwrap_or("jpg");
        format!("profiles/{}/{}.{}", user_id, Uuid::new_v4(), extension)
    }

    /// Generate attachment key
    pub fn generate_attachment_key(user_id: Uuid, filename: &str) -> String {
        let extension = filename.split('.').last().unwrap_or("bin");
        format!("attachments/{}/{}.{}", user_id, Uuid::new_v4(), extension)
    }
}
