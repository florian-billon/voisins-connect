use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::{
    ctx::Ctx,
    error::Result,
    models::{ProfileUploadResponse, SetCurrentAvatarPayload},
    services,
    AppState,
};

pub async fn create_profile_upload(
    State(state): State<AppState>,
    ctx: Ctx,
    Json(payload): Json<serde_json::Value>,
) -> Result<(StatusCode, Json<ProfileUploadResponse>)> {
    // Verify user has premium
    let _is_premium = services::subscription::is_premium(&state.subscription_repo, ctx.user_id( })
        .await?;

    let file_path = payload
        .get("file_path")
        .and_then(|v| v.as_str( })
        .ok_or_else(|| crate::error::Error::Validation { message: "file_path is required".to_string() })?;

    let content_type = payload.get("content_type").and_then(|v| v.as_str( });
    let file_size = payload
        .get("file_size")
        .and_then(|v| v.as_i64( });

    let upload = services::profile::create_profile_upload(
        &state.profile_repo,
        ctx.user_id(),
        file_path,
        content_type,
        file_size,
    )
    .await?;

    Ok((StatusCode::CREATED, Json(upload.into( }) })
}

pub async fn get_user_profile_uploads(
    State(state): State<AppState>,
    ctx: Ctx,
) -> Result<Json<Vec<ProfileUploadResponse>>> {
    let uploads = services::profile::get_user_profile_uploads(&state.profile_repo, ctx.user_id( })
        .await?;

    Ok(Json(uploads.into_iter().map(|u| u.into( }).collect( } })
}

pub async fn set_current_avatar(
    State(state): State<AppState>,
    ctx: Ctx,
    Json(payload): Json<SetCurrentAvatarPayload>,
) -> Result<Json<ProfileUploadResponse>> {
    // Verify the upload belongs to the user
    let upload = services::profile::get_upload_by_id(&state.profile_repo, payload.profile_upload_id)
        .await?
        .ok_or_else(|| crate::error::Error::NotFound { message: "Profile upload not found".to_string()  })?;

    if upload.user_id != ctx.user_id() {
        return Err(crate::error::Error::Unauthorized);
    }

    let updated_upload = services::profile::set_current_avatar(
        &state.profile_repo,
        ctx.user_id(),
        payload.profile_upload_id,
    )
    .await?
    .ok_or_else(|| crate::error::Error::NotFound { message: "Profile upload not found".to_string()  })?;

    Ok(Json(updated_upload.into( } })
}

pub async fn delete_profile_upload(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(upload_id): Path<Uuid>,
) -> Result<StatusCode> {
    // Verify the upload belongs to the user
    let upload = services::profile::get_upload_by_id(&state.profile_repo, upload_id)
        .await?
        .ok_or_else(|| crate::error::Error::NotFound { message: "Profile upload not found".to_string()  })?;

    if upload.user_id != ctx.user_id() {
        return Err(crate::error::Error::Unauthorized);
    }

    services::profile::delete_profile_upload(&state.profile_repo, ctx.user_id(), upload_id)
        .await?;

    Ok(StatusCode::NO_CONTENT)
}


