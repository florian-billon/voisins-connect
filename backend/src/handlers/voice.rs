use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;

use crate::{
    ctx::Ctx,
    error::Result,
    models::{
        InitiateVoiceCallPayload, UpdateVoiceCallPayload, VoiceCallResponse,
        CreateVoiceChannelPayload, UpdateVoiceChannelPayload, VoiceChannelResponse,
    },
    services,
    AppState,
};

// ============= Voice Calls Handlers =============

pub async fn initiate_voice_call(
    State(state): State<AppState>,
    ctx: Ctx,
    Json(payload): Json<InitiateVoiceCallPayload>,
) -> Result<(StatusCode, Json<VoiceCallResponse>)> {
    let call = services::voice::initiate_call(
        &state.voice_repo,
        ctx.user_id(),
        payload.recipient_id,
        payload.voice_channel_id,
    )
    .await?;

    Ok((StatusCode::CREATED, Json(call.into( }) })
}

pub async fn get_voice_call(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(call_id): Path<Uuid>,
) -> Result<Json<VoiceCallResponse>> {
    let call = services::voice::get_call(&state.voice_repo, call_id)
        .await?
        .ok_or_else(|| crate::error::Error::NotFound { message: "Voice call not found".to_string()  })?;

    // Verify user is part of the call
    if call.initiator_id != ctx.user_id() && call.recipient_id != ctx.user_id() {
        return Err(crate::error::Error::Unauthorized);
    }

    Ok(Json(call.into( } })
}

pub async fn accept_voice_call(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(call_id): Path<Uuid>,
) -> Result<Json<VoiceCallResponse>> {
    let call = services::voice::get_call(&state.voice_repo, call_id)
        .await?
        .ok_or_else(|| crate::error::Error::NotFound { message: "Voice call not found".to_string()  })?;

    // Verify user is the recipient
    if call.recipient_id != ctx.user_id() {
        return Err(crate::error::Error::Unauthorized);
    }

    let updated_call = services::voice::accept_call(&state.voice_repo, call_id)
        .await?
        .ok_or_else(|| crate::error::Error::NotFound { message: "Voice call not found".to_string()  })?;

    Ok(Json(updated_call.into( } })
}

pub async fn reject_voice_call(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(call_id): Path<Uuid>,
) -> Result<Json<VoiceCallResponse>> {
    let call = services::voice::get_call(&state.voice_repo, call_id)
        .await?
        .ok_or_else(|| crate::error::Error::NotFound { message: "Voice call not found".to_string()  })?;

    // Verify user is the recipient
    if call.recipient_id != ctx.user_id() {
        return Err(crate::error::Error::Unauthorized);
    }

    let updated_call = services::voice::reject_call(&state.voice_repo, call_id)
        .await?
        .ok_or_else(|| crate::error::Error::NotFound { message: "Voice call not found".to_string()  })?;

    Ok(Json(updated_call.into( } })
}

pub async fn end_voice_call(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(call_id): Path<Uuid>,
) -> Result<Json<VoiceCallResponse>> {
    let call = services::voice::get_call(&state.voice_repo, call_id)
        .await?
        .ok_or_else(|| crate::error::Error::NotFound { message: "Voice call not found".to_string()  })?;

    // Verify user is part of the call
    if call.initiator_id != ctx.user_id() && call.recipient_id != ctx.user_id() {
        return Err(crate::error::Error::Unauthorized);
    }

    let ended_call = services::voice::end_call(&state.voice_repo, call_id)
        .await?
        .ok_or_else(|| crate::error::Error::NotFound { message: "Voice call not found".to_string()  })?;

    Ok(Json(ended_call.into( } })
}

pub async fn get_user_voice_calls(
    State(state): State<AppState>,
    ctx: Ctx,
) -> Result<Json<Vec<VoiceCallResponse>>> {
    let calls = services::voice::get_user_recent_calls(&state.voice_repo, ctx.user_id(), 50)
        .await?;

    Ok(Json(calls.into_iter().map(|c| c.into( }).collect( } })
}

// ============= Voice Channels Handlers (Premium) =============

pub async fn create_voice_channel(
    State(state): State<AppState>,
    ctx: Ctx,
    Path(server_id): Path<Uuid>,
    Json(payload): Json<CreateVoiceChannelPayload>,
) -> Result<(StatusCode, Json<VoiceChannelResponse>)> {
    // Verify user is server owner/admin
    let _server = state
        .server_repo
        .find_by_id(server_id)
        .await
        .map_err(|e| crate::error::Error::Database { message: e.to_string() })?
        .ok_or_else(|| crate::error::Error::NotFound { message: "Server not found".to_string() })?;

    let channel = services::voice::create_voice_channel(
        &state.voice_repo,
        server_id,
        &payload.name,
        payload.position.unwrap_or(0),
        payload.max_users,
        payload.is_premium_only.unwrap_or(false),
    )
    .await?;

    Ok((StatusCode::CREATED, Json(channel.into( }) })
}

pub async fn list_server_voice_channels(
    State(state): State<AppState>,
    _ctx: Ctx,
    Path(server_id): Path<Uuid>,
) -> Result<Json<Vec<VoiceChannelResponse>>> {
    let channels = services::voice::list_server_voice_channels(&state.voice_repo, server_id)
        .await?;

    Ok(Json(channels.into_iter().map(|c| c.into( }).collect( } })
}

pub async fn update_voice_channel(
    State(state): State<AppState>,
    ctx: Ctx,
    Path((server_id, channel_id }): Path<(Uuid, Uuid)>,
    Json(payload): Json<UpdateVoiceChannelPayload>,
) -> Result<Json<VoiceChannelResponse>> {
    // Verify ownership
    let _server = state
        .server_repo
        .find_by_id(server_id)
        .await
        .map_err(|e| crate::error::Error::Database { message: e.to_string() })?
        .ok_or_else(|| crate::error::Error::NotFound { message: "Server not found".to_string() })?;

    let updated_channel = services::voice::update_voice_channel(
        &state.voice_repo,
        channel_id,
        payload.name.as_deref(),
        payload.position,
        payload.max_users,
    )
    .await?
    .ok_or_else(|| crate::error::Error::NotFound { message: "Voice channel not found".to_string() })?;

    Ok(Json(updated_channel.into( } })
}

pub async fn delete_voice_channel(
    State(state): State<AppState>,
    ctx: Ctx,
    Path((server_id, channel_id }): Path<(Uuid, Uuid)>,
) -> Result<StatusCode> {
    // Verify ownership
    let _server = state
        .server_repo
        .find_by_id(server_id)
        .await
        .map_err(|e| crate::error::Error::Database { message: e.to_string() })?
        .ok_or_else(|| crate::error::Error::NotFound { message: "Server not found".to_string() })?;

    services::voice::delete_voice_channel(&state.voice_repo, channel_id).await?;

    Ok(StatusCode::NO_CONTENT)
}




