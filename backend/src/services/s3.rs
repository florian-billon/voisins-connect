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
        let config = aws_config::load_from_env().await;
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
        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(key)
            .body(body)
            .content_type(content_type)
            .send()
            .await
            .map_err(|e| crate::error::Error::Database { message: e.to_string() })?;

        Ok(format!("https://{}.s3.amazonaws.com/{}", self.bucket, key })
    }

    /// Delete a file from S3
    pub async fn delete_file(&self, key: &str) -> Result<()> {
        self.client
            .delete_object()
            .bucket(&self.bucket)
            .key(key)
            .send()
            .await
            .map_err(|e| crate::error::Error::Database { message: e.to_string() })?;

        Ok(( })
    }

    /// Generate a presigned URL for downloading
    pub async fn get_presigned_url(&self, key: &str, expires_in: u64) -> Result<String> {
        let presigner = aws_sdk_s3::presigning::PresigningConfig::expires_in(
            std::time::Duration::from_secs(expires_in),
        )
        .map_err(|e| crate::error::Error::Database { message: e.to_string() })?;

        let presigned = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(key)
            .presigned(presigner)
            .await
            .map_err(|e| crate::error::Error::Database { message: e.to_string() })?;

        Ok(presigned.uri().to_string( })
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





