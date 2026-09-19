use axum::{
    extract::{Multipart, State},
    Json,
};
use serde::Serialize;
use uuid::Uuid;

use crate::ctx::Ctx;
use crate::error::Error;
use crate::error::Result;
use crate::models::AttachmentCreate;
use crate::AppState;

#[derive(Serialize)]
pub struct UploadResponse {
    pub url: String,
    pub filename: String,
}

pub async fn upload_file(
    State(state): State<AppState>,
    ctx: Ctx,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>> {
    tracing::info!("[UPLOAD] Starting file upload for user {}", ctx.user_id());

    if let Some(field) = multipart
        .next_field()
        .await
        .map_err(|err| Error::BadRequest {
            message: format!("Invalid multipart payload: {err}"),
        })?
    {
        let original_name = field.file_name().unwrap_or("fichier").to_string();
        let content_type = field.content_type().map(|s| s.to_string());

        tracing::info!("[UPLOAD] Received file: {}, content_type: {:?}", original_name, content_type);

        let data = field.bytes().await.map_err(|err| Error::BadRequest {
            message: format!("File too large or invalid upload body: {err}"),
        })?;

        let file_size = data.len() as i64;
        tracing::info!("[UPLOAD] File size: {} bytes", file_size);

        // Déterminer le content type pour S3
        let s3_content_type = determine_content_type(&original_name);

        // Générer la clé S3
        let s3_key = crate::services::s3::S3Service::generate_attachment_key(ctx.user_id(), &original_name);

        // Upload vers S3
        tracing::info!("[UPLOAD] Uploading to S3 with key: {}", s3_key);
        let byte_stream = aws_sdk_s3::primitives::ByteStream::from(data);
        let _s3_url = state
            .s3_service
            .upload_file(&s3_key, byte_stream, s3_content_type)
            .await?;

        tracing::info!("[UPLOAD] S3 upload completed, generating presigned URL");

        // Générer une URL signée valide pendant 24 heures
        let presigned_url = state
            .s3_service
            .get_presigned_url(&s3_key, 86400) // 24 heures
            .await?;

        tracing::info!("[UPLOAD] Presigned URL generated: {}", presigned_url);

        // Stockage des métadonnées en base de données (PostgreSQL)
        tracing::info!("[UPLOAD] Storing metadata in database");
        let _attachment = state
            .attachment_repo
            .create(AttachmentCreate {
                sender_id: ctx.user_id(),
                filename: original_name.clone(),
                file_path: s3_key.clone(),
                content_type,
                file_size: Some(file_size),
            })
            .await?;

        tracing::info!("[UPLOAD] Upload completed successfully for file: {}", s3_key);

        Ok(Json(UploadResponse {
            url: presigned_url,
            filename: original_name,
        }))
    } else {
        Err(Error::BadRequest {
            message: "Aucun fichier reçu".to_string(),
        })
    }
}

fn determine_content_type(filename: &str) -> &'static str {
    let extension = filename.split('.').last().unwrap_or("bin");
    match extension.to_lowercase().as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "pdf" => "application/pdf",
        "mp3" => "audio/mpeg",
        "mp4" => "video/mp4",
        "txt" => "text/plain",
        "zip" => "application/zip",
        _ => "application/octet-stream",
    }
}
