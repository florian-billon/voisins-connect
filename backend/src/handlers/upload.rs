use axum::{
    extract::{Multipart, State},
    Json,
};
use serde::Serialize;
use std::path::PathBuf;
use tokio::fs;
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
    let upload_dir = PathBuf::from("uploads");
    fs::create_dir_all(&upload_dir)
        .await
        .map_err(|err| Error::InternalError {
            message: format!("Failed to create upload directory: {err}"),
        })?;

    if let Some(field) = multipart
        .next_field()
        .await
        .map_err(|err| Error::BadRequest {
            message: format!("Invalid multipart payload: {err}"),
        })?
    {
        let original_name = field.file_name().unwrap_or("fichier").to_string();
        let content_type = field.content_type().map(|s| s.to_string());

        let extension = original_name
            .rsplit('.')
            .next()
            .filter(|ext| !ext.is_empty())
            .unwrap_or("bin");
        let unique_name = format!("{}.{}", Uuid::new_v4(), extension);

        let data = field.bytes().await.map_err(|err| Error::BadRequest {
            message: format!("File too large or invalid upload body: {err}"),
        })?;

        let file_size = data.len() as i64;

        let file_path = upload_dir.join(&unique_name);
        fs::write(&file_path, &data)
            .await
            .map_err(|err| Error::InternalError {
                message: format!("Failed to persist uploaded file: {err}"),
            })?;

        // Stockage des métadonnées en base de données (PostgreSQL)
        let _attachment = state
            .attachment_repo
            .create(AttachmentCreate {
                sender_id: ctx.user_id(),
                filename: original_name.clone(),
                file_path: unique_name.clone(),
                content_type,
                file_size: Some(file_size),
            })
            .await?;

        Ok(Json(UploadResponse {
            url: format!("/files/{}", unique_name),
            filename: original_name,
        }))
    } else {
        Err(Error::BadRequest {
            message: "Aucun fichier reçu".to_string(),
        })
    }
}
