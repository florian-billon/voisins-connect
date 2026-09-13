use axum::{extract::State, Json};

use crate::ctx::Ctx;
use crate::models::{UpdateMePayload, UserResponse};
use crate::services::usernames::{is_username_unique_violation, validate_username};
use crate::Error;
use crate::{AppState, Result};

pub async fn me(State(state): State<AppState>, ctx: Ctx) -> Result<Json<UserResponse>> {
    let user = state
        .user_repo
        .find_by_id(ctx.user_id())
        .await?
        .ok_or(Error::UserNotFound)?;

    Ok(Json(user.into()))
}

pub async fn update_me(
    State(state): State<AppState>,
    ctx: Ctx,
    Json(mut payload): Json<UpdateMePayload>,
) -> Result<Json<UserResponse>> {
    if let Some(username) = payload.username.as_deref() {
        let normalized =
            validate_username(username).map_err(|message| Error::BadRequest { message })?;
        payload.username = Some(normalized);
    }

    let should_broadcast_presence = payload.status.is_some();

    let user = state
        .user_repo
        .update_profile(ctx.user_id(), payload)
        .await
        .map_err(|err| {
            if is_username_unique_violation(&err) {
                Error::UsernameAlreadyExists
            } else {
                Error::from(err)
            }
        })?
        .ok_or(Error::UserNotFound)?;

    if should_broadcast_presence {
        crate::services::realtime::handle_presence_update(&state, ctx.user_id(), user.status).await;
    }

    Ok(Json(user.into()))
}
