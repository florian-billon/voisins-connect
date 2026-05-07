use axum::{
    extract::{State, Multipart},
    http::StatusCode,
    Json,
};
use serde::Serialize;
use uuid::Uuid;

use crate::{
    ctx::Ctx,
    error::Result,
    services,
    AppState,
};

#[derive(Debug, Serialize)]
pub struct FileUploadResponse {
    pub file_url: String,
    pub file_path: String,
}

/// Upload a profile image to S3
pub async fn upload_profile_image(
    State(state): State<AppState>,
    ctx: Ctx,
    mut multipart: Multipart,
) -> Result<(StatusCode, Json<FileUploadResponse>)> {
    // Check if user has premium
    let _is_premium = services::subscription::is_premium(&state.subscription_repo, ctx.user_id( })
        .await
        .unwrap_or(false);

    // For free users, restrict uploads
    let upload_count = services::profile::get_user_profile_uploads(&state.profile_repo, ctx.user_id( })
        .await?
        .len();

    if !_is_premium && upload_count >= 3 {
        return Err(crate::error::Error::Validation { message: "Free users can only upload 3 profile images".to_string() });
    }

    while let Some(field) = multipart.next_field().await.map_err(|e| {
        crate::error::Error::Validation { message: format!("Multipart error: {}", e })
    })? {
        let filename = field.file_name()
            .map(|s| s.to_string())
            .ok_or_else(|| crate::error::Error::Validation { message: "No filename".to_string() })?;

        // Validate file type
        if !filename.ends_with(".jpg") && !filename.ends_with(".jpeg") && !filename.ends_with(".png") && !filename.ends_with(".gif") {
            return Err(crate::error::Error::Validation { message: "Only JPG, PNG, and GIF are supported".to_string() });
        }

        let data = field.bytes().await.map_err(|e| {
            crate::error::Error::Validation { message: format!("Read error: {}", e })
        })?;

        // Validate file size (5MB)
        if data.len() > 5 * 1024 * 1024 {
            return Err(crate::error::Error::Validation { message: "File size must be less than 5MB".to_string() });
        }

        let content_type = match filename.split('.').last() {
            Some("jpg") | Some("jpeg") => "image/jpeg",
            Some("png") => "image/png",
            Some("gif") => "image/gif",
            _ => "image/jpeg",
        };

        // Generate S3 key
        let key = services::s3::S3Service::generate_profile_key(ctx.user_id(), &filename);

        // Upload to S3
        let byte_stream = aws_sdk_s3::primitives::ByteStream::from(data);
        let file_url = state.s3_service.upload_file(&key, byte_stream, content_type).await?;

        return Ok((
            StatusCode::CREATED,
            Json(FileUploadResponse {
                file_url,
                file_path: key,
            }),
         });
    }

    Err(crate::error::Error::Validation { message: "No file provided".to_string() })
}

/// Upload an attachment (for messages) to S3
pub async fn upload_attachment(
    State(state): State<AppState>,
    ctx: Ctx,
    mut multipart: Multipart,
) -> Result<(StatusCode, Json<FileUploadResponse>)> {
    while let Some(field) = multipart.next_field().await.map_err(|e| {
        crate::error::Error::Validation { message: format!("Multipart error: {}", e })
    })? {
        let filename = field.file_name()
            .map(|s| s.to_string( })
            .ok_or_else(|| crate::error::Error::Validation { message: "No filename".to_string() })?;

        let data = field.bytes().await.map_err(|e| {
            crate::error::Error::Validation { message: format!("Read error: {}", e })
        })?;

        // Validate file size (50MB)
        if data.len() > 50 * 1024 * 1024 {
            return Err(crate::error::Error::Validation { message: "File size must be less than 50MB".to_string() });
        }

        // Determine content type
        let content_type = determine_content_type(&filename);

        // Generate S3 key
        let key = services::s3::S3Service::generate_attachment_key(ctx.user_id(), &filename);

        // Upload to S3
        let byte_stream = aws_sdk_s3::primitives::ByteStream::from(data);
        let file_url = state.s3_service.upload_file(&key, byte_stream, content_type).await?;

        return Ok((
            StatusCode::CREATED,
            Json(FileUploadResponse {
                file_url,
                file_path: key,
            }),
         });
    }

    Err(crate::error::Error::Validation { message: "No file provided".to_string() })
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


